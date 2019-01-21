import os
import errno
import magic
import datetime
import shutil
import re

from django.conf import settings
from django.core.cache import caches
from django.core.exceptions import PermissionDenied

from main.extras.mixins import ModelSerializerMixin
from main.extras.signals import clear_authorizer

from apps.preferences.extras import get_preferences
from apps.iam.extras import Authorizer

from apps.files import file_types


class FileHandler(ModelSerializerMixin):

    root = 'repository'

    root_path = settings.REPOSITORY_PATH

    root_route = 'files/repository'

    mime_types = {
        'editable': [
            '^text\/',
             '\/xml$',
            '\/json$',
            '^inode\/x-empty$',
        ],
        'archive': [
            '\/zip$',
            '\/gzip$',
            '\/x-tar$',
            '\/x-gtar$'
        ]
    }

    file_template = None

    root_folder_template = None

    skeleton = None

    def __init__(self, path, user):

        path = self._strip_trailing_slash(path)

        self.user = user

        self.absolute_path = os.path.join(self.root_path, path)

        if os.path.isdir(self.absolute_path):

            self.type  = 'folder'

        elif os.path.isfile(self.absolute_path):

            self.type  = 'file'

        else:

            raise FileNotFoundError(errno.ENOENT, os.strerror(errno.ENOENT), path)

        self.path = path

        self.id = os.path.join(self.root, path)

        self.parent_path, self.name = os.path.split(path)

        self.absolute_parent_path = os.path.join(self.root_path, self.parent_path) if self.parent_path else self.root_path

    @staticmethod
    def _strip_trailing_slash(path):

        return re.sub(r'/$', '', path)

    @classmethod
    def _validate(cls, root, fs_obj_type, path, content):

        def validate_skeleton():

            matched = False

            for p in cls.get_root_class(root).skeleton:

                pattern_elements = list()

                pattern_elements.append(p['folder']) if p['folder'] else None

                if p['file'] and fs_obj_type == 'file':

                    pattern_elements.append('\/') if p['folder'] else None

                    pattern_elements.append(p['file'])

                if re.compile(''.join(['^', ''.join(pattern_elements), '$'])).match(path):

                    matched = True if fs_obj_type == 'folder' or p['file'] else False

                    break

            return True if matched else ''.join([fs_obj_type.capitalize(), ' name or type failed to match root folder criteria'])

        fs_obj_name_part, fs_obj_ext = os.path.splitext(path)

        errors = list()

        if cls.get_root_class(root).skeleton:

            validation = validate_skeleton()

            errors.append(validation) if validation is not True else None

        if fs_obj_type == 'file' and content:

            for key, value in file_types.items():

                if fs_obj_ext in value['ext'] and value.get('validator', False):

                    validation = value['validator'](content)

                    errors.append(validation) if validation is not True else None

                    break

        return True if len(errors) == 0 else errors

    @classmethod
    def _actions(cls, fs_object_type):

        def create_file(path):

            cls._actions('file')['copy'](cls.file_template, path) if cls.file_template else open(path, 'w').close()

        def create_folder(path):

            if cls.root_folder_template and os.path.dirname(path) == cls.root_path:

                cls._actions('folder')['copy'](cls.root_folder_template, path)

            else:

                os.makedirs(path)

        actions = {
            'file': {
                'create': create_file,
                'copy': shutil.copy,
                'delete': os.remove
            },
            'folder': {
                'create': create_folder,
                'copy': shutil.copytree,
                'delete': shutil.rmtree
            },
        }

        return actions[fs_object_type]

    @classmethod
    def get_root_class(cls, root):

        roots = {
            'repository': cls,
            'playbooks': PlaybookHandler,
            'roles': RoleHandler
        }

        return roots[root]

    @classmethod
    def list(cls, user):

        fs_obj_list = list()

        for root, dirs, files in os.walk(cls.root_path):

            for file_name in files:

                file_path = file_name if cls.root_path == root else os.path.join(root.replace(cls.root_path + '/', ''), file_name)

                fs_obj_list.append(cls(file_path, user))

        fs_obj_list.sort(key=lambda x: x.path)

        return fs_obj_list

    @classmethod
    def factory(cls, root, path, user):

        return cls.get_root_class(root)(path, user)

    @classmethod
    def create(cls, root, path, request):

        if cls.factory(root, os.path.split(path)[0], request.user).authorizer()['editable']:

            root_path = cls.get_root_class(root).root_path

            source_dict = request.JSON.get('source', None)

            file_data = request.FILES.get('file_data', None)

            fs_obj_type = request.JSON.get('data', {}).get('type', 'file')

            absolute_path = os.path.join(root_path, path)

            validation = cls._validate(root, fs_obj_type, path, None)

            if validation is True:

                if file_data:

                    with open(absolute_path, 'wb') as f:

                        for chunk in file_data:
                            f.write(chunk)

                elif source_dict:

                    source = cls.factory(source_dict['root'], source_dict['path'], request.user)

                    if source.authorizer()['readable']:

                        cls._actions(fs_obj_type)['copy'](source.absolute_path, absolute_path)

                    else:

                        raise PermissionDenied

                else:

                    cls._actions(fs_obj_type)['create'](absolute_path)

                clear_authorizer.send(cls)

                return cls.factory(root, path, request.user)

            else:

                raise FileHandlerException(validation)

        else:

            raise PermissionDenied

    def read(self, fields=None):

        if self.type == 'folder':

            response = {'data': self.serialize(fields), 'included': list()}

            for fs_obj_name in os.listdir(self.absolute_path):

                fs_obj = FileHandler.factory(self.root, os.path.join(self.path, fs_obj_name), self.user)

                response['included'].append(fs_obj.serialize(fields)) if fs_obj.authorizer()['readable'] else None

            return response

        else:

            if self.authorizer()['readable']:

                return {'data': self.serialize(fields)}

            else:

                raise PermissionDenied

    def update(self, attributes):

        if self.authorizer()['editable']:

            new_name = attributes.get('new_name')

            content = attributes.get('content')

            validation = self._validate(self.root, self.type, new_name, content)

            if validation is True:

                if new_name :

                    os.rename(self.absolute_path, os.path.join(self.absolute_parent_path, new_name))

                    self.__init__(os.path.join(self.parent_path, new_name), self.user)

                if content:

                    with open(self.absolute_path, 'w') as f:

                        f.write(content)

                clear_authorizer.send(self.__class__)

            else:

                raise FileHandlerException(validation)
        else:

            raise PermissionDenied

    def delete(self):

        if self.authorizer()['deletable']:

            self._actions(self.type)['delete'](self.absolute_path)

            clear_authorizer.send(self.__class__)

        else:

            raise PermissionDenied

    def serialize(self, fields=None):

        prefs = get_preferences()

        file_content = None

        attributes = {
            'name': self.name,
            'size': os.path.getsize(self.absolute_path) if self.type == 'file' else 0,
            'modified': datetime.datetime.fromtimestamp(os.path.getmtime(self.absolute_path)).strftime(prefs['date_format']),
            'mime_type': magic.from_file(self.absolute_path, mime='true') if self.type == 'file' else '',
            'root': self.root,
            'path': self.path,
        }

        links = {
            'self': '/'.join(filter(None, [self.root_route, self.path])),
            'parent': '/'.join(filter(None, [self.root_route, self.parent_path])) if self.path else None,
            'root': self.root_route,
        }

        content_is_readable = all([
            self.type == 'file',
            re.match('|'.join(self.mime_types['editable']), attributes.get('mime_type')),
            attributes['size'] <= prefs['max_edit_size'],
        ])

        content_is_requested = fields and 'content' in fields.get('attributes', [])

        if content_is_readable and (content_is_requested or prefs['validate_content_on_read']):

            with open(self.absolute_path, 'r') as f:

                file_content = f.read()

            if content_is_requested:

                attributes['content'] = file_content

        meta = self.authorizer()

        meta['valid'] = self._validate(self.root, self.type, self.path, file_content)

        return self._serializer(fields, attributes, links, meta)

    def authorizer(self):

        authorizer = caches['authorizer'].get_or_set(self.user.username, Authorizer(self.user))

        group_auth = self.user.has_perm('users.edit_' + 'files' if self.root == 'repository' else self.root)

        readable = any([authorizer.can_view_fs_obj(self.absolute_path, self.type), group_auth])

        editable = any([authorizer.can_edit_fs_obj(self.absolute_path, self.type), group_auth])

        deletable = editable

        return {'readable': readable, 'editable': editable, 'deletable': deletable}

    def get_paths(self):

        paths = [self.root_path]

        current_path = None

        for step_path in self.parent_path.split('/'):

            current_path = os.path.join(*filter(None, [current_path, step_path]))

            paths.append(os.path.join(self.root_path, current_path))

        return paths


class PlaybookHandler(FileHandler):

    root = 'playbooks'

    root_path = settings.PLAYBOOK_PATH

    root_route = 'files/playbooks'

    file_template = settings.PLAYBOOK_TEMPLATE

    skeleton = [
        {'folder': None, 'file': file_types['yaml']['re']},
        {'folder': '.*', 'file': file_types['yaml']['re']}
    ]


class RoleHandler(FileHandler):

    root = 'roles'

    root_path = settings.ROLES_PATH

    root_route = 'files/roles'

    root_folder_template = settings.ROLE_TEMPLATE

    skeleton = [
        {'folder': '[^\/]*', 'file': None},
        {'folder': '.*\/(defaults|handlers|meta|tasks|vars)', 'file': file_types['yaml']['re']},
        {'folder': '.*\/(files|templates)', 'file': file_types['any']['re']},
        {'folder': '.*\/(files|templates)\/.*', 'file': file_types['any']['re']},
    ]

    @classmethod
    def list(cls, user):

        fs_obj_list = [cls(f, user) for f in os.listdir(cls.root_path) if os.path.isdir(os.path.join(cls.root_path, f))]

        fs_obj_list.sort(key=lambda f: f.path)

        return fs_obj_list


class FileHandlerException(Exception):

    def __init__(self, errors):

        self.errors = errors
