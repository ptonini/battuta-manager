import os
import errno
import magic
import datetime
import shutil
import re
import yaml

from django.conf import settings
from django.core.cache import caches
from django.core.exceptions import PermissionDenied

from main.extras.mixins import RESTfulModelMixin
from main.extras.signals import clear_authorizer

from apps.preferences.extras import get_prefs
from apps.projects.extras import ProjectAuthorizer

from apps.files import file_types, mime_types


class FileHandler(RESTfulModelMixin):

    root = 'repository'

    root_path = settings.REPOSITORY_PATH

    root_route = '/files/repository'

    inventory_variable = '{{ repository_path }}'

    file_template = None

    root_folder_template = None

    skeleton = None

    def __init__(self, path, user):

        path = path.strip('/')

        self.user = user

        self.absolute_path = os.path.join(self.root_path, path)

        if os.path.isdir(self.absolute_path):

            self.type = 'folder'

        elif os.path.isfile(self.absolute_path):

            self.type = 'file'

        else:

            raise FileNotFoundError(errno.ENOENT, os.strerror(errno.ENOENT), path)

        self.path = path

        self.id = os.path.join(self.root, path)

        self.parent_path, self.name = os.path.split(path)

        if self.parent_path:

            self.absolute_parent_path = os.path.join(self.root_path, self.parent_path)

        else:

            self.absolute_parent_path = self.root_path

    @staticmethod
    def sort_path_list(path_list):

        root_file_list = list()

        subfolder_file_list = list()

        for path in path_list:

            root_file_list.append(path) if '/' not in path else subfolder_file_list.append(path)

        root_file_list.sort()

        subfolder_file_list.sort(key=lambda f: os.path.basename(f))

        return root_file_list + subfolder_file_list

    @staticmethod
    def get_root_class(root):

        roots = {
            'repository': FileHandler,
            'playbooks': PlaybookHandler,
            'roles': RoleHandler
        }

        return roots[root]

    @staticmethod
    def search(term, file_type, user):

        def is_match(r, path):

            if term in path:

                fs_obj = FileHandler.factory(r, path, user)

                if fs_obj.perms()['readable']:

                    return bool(re.match('|'.join(mime_types[file_type]), fs_obj.mime_type)) if file_type else True

        def path_list_generator(iterator, parent_path, c_root):

            path_list = list()

            for name in iterator:

                path = os.path.join(parent_path, name)

                path_list.append(path) if is_match(c_root, path) else None

            return path_list

        result = []

        for handler_class in [FileHandler, RoleHandler]:

            handler_results = list()

            for root, folders, files in os.walk(handler_class.root_path):

                relative_root = root.replace(handler_class.root_path, '/' if root == handler_class.root_path else '')

                handler_results = handler_results + path_list_generator(files, relative_root, handler_class.root)

                if not file_type:

                    handler_results = handler_results + path_list_generator(folders, relative_root, handler_class.root)

            handler_results = list(map(lambda x: handler_class.inventory_variable + x, handler_results))

            result = result + handler_results

        result.sort()

        return result

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

                if re.compile(''.join(['^', ''.join(pattern_elements), '$']), flags=re.IGNORECASE).match(path):

                    matched = True if fs_obj_type == 'folder' or p['file'] else False

                    break

            if matched:

                return True

            else:

                return ''.join([fs_obj_type.capitalize(), ' name or type failed to match root folder criteria'])

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

        return True  # if len(errors) == 0 else errors

    @classmethod
    def _action(cls, fs_object_type, root):

        def create_file(path):

            file_template = cls.get_root_class(root).file_template

            cls._action('file', root)['copy'](file_template, path) if file_template else open(path, 'w').close()

        def create_folder(path):

            root_class = cls.get_root_class(root)

            root_folder_template = root_class.root_folder_template

            if root_folder_template and os.path.dirname(path) == root_class.root_path:

                cls._action('folder', root)['copy'](root_folder_template, path)

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
    def list(cls, user):

        path_list = list()

        for root, dirs, files in os.walk(cls.root_path):

            for f in files:

                path_list.append(f if cls.root_path == root else os.path.join(root.replace(cls.root_path + '/', ''), f))

        return [cls(p, user) for p in cls.sort_path_list(path_list)]

    @classmethod
    def factory(cls, root, path, user):

        return cls.get_root_class(root)(path, user)

    @classmethod
    def create(cls, root, path, request):

        if cls.factory(root, os.path.split(path)[0], request.user).perms()['editable']:

            root_path = cls.get_root_class(root).root_path

            fs_obj_type = request.JSON.get('data', {}).get('type', 'file')

            source_dict = request.JSON.get('source', None)

            file_data = request.FILES.get('file_data', None)

            absolute_path = os.path.join(root_path, path)

            validation = cls._validate(root, fs_obj_type, path, None)

            if validation is True:

                if file_data:

                    with open(absolute_path, 'wb') as f:

                        for chunk in file_data:

                            f.write(chunk)

                elif source_dict:

                    source = cls.factory(source_dict['root'], source_dict['path'], request.user)

                    if source.perms()['readable']:

                        cls._action(fs_obj_type, root)['copy'](source.absolute_path, absolute_path)

                    else:

                        raise PermissionDenied

                else:

                    cls._action(fs_obj_type, root)['create'](absolute_path)

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

                response['included'].append(fs_obj.serialize(fields)) if fs_obj.perms()['readable'] else None

            return response

        else:

            if self.perms()['readable']:

                return {'data': self.serialize(fields)}

            else:

                raise PermissionDenied

    def update(self, attributes):

        if self.perms()['editable']:

            new_name = attributes.get('new_name')

            content = attributes.get('content')

            validation = self._validate(self.root, self.type, new_name, content)

            if validation is True:

                if new_name:

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

        if self.perms()['deletable']:

            self._action(self.type, self.root)['delete'](self.absolute_path)

            clear_authorizer.send(self.__class__)

        else:

            raise PermissionDenied

    @property
    def mime_type(self):

        return magic.from_file(self.absolute_path, mime='true') if self.type == 'file' else ''

    @property
    def size(self):

        return os.path.getsize(self.absolute_path) if self.type == 'file' else 0

    @property
    def modified(self):

        return datetime.datetime.fromtimestamp(os.path.getmtime(self.absolute_path)).strftime(get_prefs('date_format'))

    @property
    def path_hierarchy(self):

        path_set = {self.root_path}

        current_path = None

        for step_path in self.parent_path.split('/'):

            current_path = os.path.join(*filter(None, [current_path, step_path]))

            path_set.add(os.path.join(self.root_path, current_path))

        return path_set

    def serialize(self, fields=None):

        # prefs = get_preferences()

        file_content = None

        attr = {
            'name': self.name,
            'size': self.size,
            'modified': self.modified,
            'mime_type': self.mime_type,
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
            re.match('|'.join(mime_types['editable']), self.mime_type),
            self.size <= get_prefs('max_edit_size'),
        ])

        content_is_requested = fields and 'content' in fields.get('attributes', [])

        if content_is_readable and (content_is_requested or get_prefs('validate_content_on_read')):

            with open(self.absolute_path, 'r') as f:

                file_content = f.read()

            if content_is_requested:

                attr['content'] = file_content

        meta = self.perms()

        meta['valid'] = self._validate(self.root, self.type, self.path, file_content)

        return self._serialize_data(fields, attributes=attr, links=links, meta=meta)

    def perms(self):

        authorizer = caches['authorizer'].get_or_set(self.user.username, lambda: ProjectAuthorizer(self.user))

        group_auth = self.user.has_perm('auth.edit_' + ('files' if self.root == 'repository' else self.root))

        readable = any([authorizer.can_view_fs_obj(self.absolute_path, self.type), group_auth])

        editable = any([authorizer.can_edit_fs_obj(self.absolute_path, self.type), group_auth])

        deletable = editable

        return {'readable': readable, 'editable': editable, 'deletable': deletable}


class PlaybookHandler(FileHandler):

    root = 'playbooks'

    root_path = settings.PLAYBOOK_PATH

    root_route = '/files/playbooks'

    file_template = settings.PLAYBOOK_TEMPLATE

    inventory_variable = None

    skeleton = [
        {'folder': None, 'file': file_types['yaml']['re']},
        {'folder': '.*', 'file': file_types['yaml']['re']}
    ]

    def parse(self):

        if self.type == 'file':

            with open(os.path.join(self.absolute_path), 'r') as f:

                return yaml.load(f.read())

        else:

            raise FileHandlerException(['Can only parse playbook files'])

    def serialize(self, fields=None):

        links = {'args': '/'.join(['/runner', str(self.id), 'args'])}

        data = self._serialize_data(fields, links=links, data=super(PlaybookHandler, self).serialize(fields))

        return data


class RoleHandler(FileHandler):

    root = 'roles'

    root_path = settings.ROLES_PATH

    root_route = '/files/roles'

    root_folder_template = settings.ROLE_TEMPLATE

    inventory_variable = '{{ roles_path }}'

    skeleton = [
        {'folder': '[^\/]*', 'file': None},
        {'folder': '.*\/(defaults|handlers|meta|tasks|vars)', 'file': file_types['yaml']['re']},
        {'folder': '.*\/(defaults|handlers|meta|tasks|vars)\/.*', 'file': file_types['yaml']['re']},
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
