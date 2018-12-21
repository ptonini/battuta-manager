import os
import errno
import magic
import datetime
import shutil

from django.conf import settings

from apps.preferences.extras import get_preferences


class FileHandler:

    root_path = settings.REPOSITORY_PATH

    root = 'repository'

    editable_mime_types = [
        'inode/x-empty',
        'application/xml',
        'application/json'
    ]

    def __init__(self, path):

        absolute_path = os.path.join(self.root_path, path)

        if os.path.isdir(absolute_path) or os.path.isfile(absolute_path):

            self.parent_path, self.id = os.path.split(path)

            self.type = 'file' if os.path.isfile(absolute_path) else 'folder'

            self.path = path

            self.absolute_path = absolute_path

            self.absolute_parent_path = os.path.join(self.root_path, self.parent_path) if self.parent_path else self.root_path

        else:

            raise  FileNotFoundError(errno.ENOENT, os.strerror(errno.ENOENT), path)

    @staticmethod
    def _create_file(path):

        open(path, 'a').close()

    @staticmethod
    def _create_folder(path):

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
    def _actions(cls, action):

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
    def build(cls, root, path):

        roots = {
            'repository': cls,
            'playbooks': PlaybookHandler,
            'roles': RoleHandler
        }

        return roots[root](path)

    @classmethod
    def create(cls, root, path, fs_obj_type, source):

        new_path = os.path.join(root, path)

        if source:

           cls._actions(fs_obj_type)['copy'](os.path.join(source.attributes.root, source.attributes.path), new_path)

        else:

            cls._actions(fs_obj_type)['create'](new_path)

        return cls.build(root, new_path)

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

            os.rename(self.absolute_path, os.path.join(self.absolute_parent_path, new_name))

            self.__init__(os.path.join(self.parent_path, new_name))

        if content:

            with open(self.absolute_path, 'w') as f:

                f.write(content)

    def delete(self):

        self._actions(self.type)['delete'](self.absolute_path)

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
                'parent': '/'.join(['/files', self.root, self.parent_path]) if self.path else None,
                'root': '/'.join(['/files', self.root])
            }
        }

        conditions = [
            content,
            self.type == 'file',
            mime_type in self.editable_mime_types or mime_type and mime_type.split('/')[0] == 'text',
            size < prefs['max_edit_size']
        ]

        if False not in conditions:

            with open(self.absolute_path, 'r') as f:

                fs_obj_dict['attributes']['content'] = f.read()

        return fs_obj_dict


class PlaybookHandler(FileHandler):

    root_path = settings.PLAYBOOK_PATH

    root = 'playbooks'


class RoleHandler(FileHandler):

    root_path = settings.ROLES_PATH

    root = 'roles'