import os
import errno
import magic
import datetime
import shutil
import json

from django.conf import settings

from apps.preferences.extras import get_preferences


class FileHandler:

    root_path = settings.REPOSITORY_PATH

    root = 'repository'

    mime_types = {
        'editable': [
            'inode/x-empty',
            'application/xml',
            'application/json'
        ],
        'archive': [
            'application/zip',
            'application/gzip',
            'application/x-tar',
            'application/x-gtar'
        ]
    }

    file_template = None

    root_folder_template = None

    allowed_mime_types = None

    allowed_extensions = None

    def __init__(self, path):

        absolute_path = os.path.join(self.root_path, path)

        if os.path.isdir(absolute_path) or os.path.isfile(absolute_path):

            self.parent_path, self.id = os.path.split(path)

            self.type = 'file' if os.path.isfile(absolute_path) else 'folder'

            self.path = path

            self.absolute_path = absolute_path

            self.absolute_parent_path = os.path.join(self.root_path, self.parent_path) if self.parent_path else self.root_path

        else:

            raise FileNotFoundError(errno.ENOENT, os.strerror(errno.ENOENT), path)

    @staticmethod
    def _create_file(cls, path):

        if cls.file_template:

            cls._copy_file(cls.file_template, path)

        else:

            open(path, 'w').close()

    @staticmethod
    def _create_folder(cls, path):

        if cls.root_folder_template and os.path.dirname(path) == cls.root_path:

            cls._copy_folder(cls.root_folder_template, path)

        else:

            os.makedirs(path)

    @staticmethod
    def _copy_file(source, path):

        shutil.copy(source, path)

    @staticmethod
    def _copy_folder(source, path):

        shutil.copytree(source, path)

    @staticmethod
    def _delete_file(path):

        os.remove(path)

    @staticmethod
    def _delete_folder(path):

        shutil.rmtree(path)

    @classmethod
    def _get_action(cls, action):

        actions = {
            'file': {
                'create': cls._create_file,
                'copy': cls._copy_file,
                'delete': cls._delete_file
            },
            'folder': {
                'create': cls._create_folder,
                'copy': cls._copy_folder,
                'delete': cls._delete_folder
            },
        }

        return actions[action]

    @classmethod
    def _get_root(cls, root):

        roots = {
            'repository': cls,
            'playbooks': PlaybookHandler,
            'roles': RoleHandler
        }

        return roots[root]

    @classmethod
    def validate_extension(cls, root, path):

        root_class = cls._get_root(root)

        fs_obj_name, fs_obj_ext = os.path.splitext(path)

        return True if not root_class.allowed_extensions or fs_obj_ext in root_class.allowed_extensions else False

    @classmethod
    def build(cls, root, path):

        return cls._get_root(root)(path)

    @classmethod
    def create(cls, root, path, request):

        root_path = cls._get_root(root).root_path

        source = request.JSON.get('data', {}).get('attributes', {}).get('source', False)

        file_data = request.FILES.get('file_data', False)

        fs_obj_type = request.JSON.get('data', {}).get('type', 'file')

        absolute_path = os.path.join(root_path, path)

        if fs_obj_type == 'folder' or cls.validate_extension(root, path):

            if file_data:

                with open(absolute_path, 'wb') as f:

                    for chunk in file_data:

                        f.write(chunk)

            elif source:

                source_path = os.path.join(root_path, json.loads(source)['path'])

                cls._get_action(fs_obj_type)['copy'](source_path, absolute_path)

            else:

                cls._get_action(fs_obj_type)['create'](cls._get_root(root), absolute_path)

            return cls.build(root, path)

        else:

            raise FileHandlerForbiddenExt

    def read(self):

        if self.type == 'folder':

            response = {
                'data': self.serialize(False),
                'included': []
            }

            for fs_obj_name in os.listdir(self.absolute_path):

                response['included'].append(FileHandler.build(self.root, os.path.join(self.path, fs_obj_name)).serialize(False))

            return response

        else:

            return {'data': self.serialize()}

    def update(self, attributes):

        new_name = attributes.get('new_name')

        content = attributes.get('content')

        if new_name :

            if self.validate_extension(self.root, new_name) or self.type == 'folder':

                os.rename(self.absolute_path, os.path.join(self.absolute_parent_path, new_name))

                self.__init__(os.path.join(self.parent_path, new_name))

            else:

                raise FileHandlerForbiddenExt

        if content:

            with open(self.absolute_path, 'w') as f:

                f.write(content)

    def delete(self):

        self._get_action(self.type)['delete'](self.absolute_path)

    def search(self):

        file_list = list()

        for root, dirs, files in os.walk(self.root_path):

            for file_name in files:

                file_list.append([root, file_name])

        return file_list

    def serialize(self, content=True):

        prefs = get_preferences()

        mime_type = magic.from_file(self.absolute_path, mime='true') if self.type == 'file' else None

        size = os.path.getsize(self.absolute_path) if self.type == 'file' else 0

        fs_obj_dict = {
            'id': self.id,
            'type': self.type,
            'attributes': {
                'size': size,
                'modified': datetime.datetime.fromtimestamp(os.path.getmtime(self.absolute_path)).strftime(prefs['date_format']),
                'mime_type': mime_type,
                'path': self.path,
                'root': self.root
            },
            'links': {
                'self': '/'.join(filter(None, ['/files', self.root, self.path])),
                'parent': '/'.join(filter(None, ['/files', self.root, self.parent_path])) if self.path else None,
                'root': '/'.join(['/files', self.root])
            }
        }

        conditions = [
            content,
            self.type == 'file',
            mime_type in self.mime_types['editable'] or mime_type and mime_type.split('/')[0] == 'text',
            size < prefs['max_edit_size']
        ]

        if False not in conditions:

            with open(self.absolute_path, 'r') as f:

                fs_obj_dict['attributes']['content'] = f.read()

        return fs_obj_dict


class PlaybookHandler(FileHandler):

    root_path = settings.PLAYBOOK_PATH

    root = 'playbooks'

    file_template = settings.PLAYBOOK_TEMPLATE

    allowed_extensions = ['.yaml', '.yml']


class RoleHandler(FileHandler):

    root_path = settings.ROLES_PATH

    root_folder_template = settings.ROLE_TEMPLATE

    root = 'roles'


class FileHandlerForbiddenExt(Exception):

    pass