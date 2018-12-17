import os
import errno
import magic
import datetime

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

    @classmethod
    def build(cls, root, path):

        roots = {
            'repository': cls,
            'playbooks': PlaybookHandler,
            'roles': RoleHandler
        }

        return roots[root](path)

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

        if new_name :

            os.rename(self.absolute_path, os.path.join(self.absolute_parent_path, new_name))

            self.__init__(os.path.join(self.parent_path, new_name))

    def search(self):

        file_list = list()

        for root, dirs, files in os.walk(self.root_path):

            for file_name in files:

                file_list.append([root, file_name])

        return file_list

    def serialize(self, content=True):

        prefs = get_preferences()

        mime_type = magic.from_file(self.absolute_path, mime='true') if self.type == 'file' else None

        size = os.path.getsize(self.absolute_path) if self.type == 'file' else None

        fs_obj_dict = {
            'id': self.id,
            'type': self.type,
            'attributes': {
                'size': size,
                'modified': datetime.datetime.fromtimestamp(os.path.getmtime(self.absolute_path)).strftime(prefs['date_format']),
                'mime_type': mime_type,
                'path': self.path
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
            size and size < prefs['max_edit_size']
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