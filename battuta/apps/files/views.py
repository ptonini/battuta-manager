# encoding: utf-8

import json
import os
import shutil
import magic
import ntpath
import tempfile
import datetime
import yaml
import sys

from django.shortcuts import render
from django.views.generic import View
from django.http import HttpResponse, StreamingHttpResponse, Http404
from django.conf import settings
from pytz import timezone, utc

from apps.preferences.extras import get_preferences

reload(sys)
sys.setdefaultencoding('utf8')


class PageView(View):

    @staticmethod
    def get(request):

        return render(request, 'files/files.html', {'user': request.user})


class FilesView(View):

    @staticmethod
    def _validate_yaml(full_path):

        with open(full_path, 'r') as yaml_file:

            try:

                yaml.load(yaml_file.read())

                return True, None

            except yaml.YAMLError as e:

                return False, type(e).__name__ + ': ' + e.__str__()

    file_roots = {
        'files': {
            'path': settings.FILES_PATH,
            'prefix': '{{ files_path }}',
            'exclude': list(),
            'types': list(),
            'user': False,
            'validator': None,
            'permission': 'users.edit_files'
        },
        'playbooks': {
            'path': settings.PLAYBOOK_PATH,
            'prefix': None,
            'exclude': list(),
            'types': ['yml', 'yaml'],
            'user': False,
            'validator': _validate_yaml.__func__,
            'permission': 'users.edit_playbooks'
        },
        'roles': {
            'path': settings.ROLES_PATH,
            'prefix': '{{ roles_path }}',
            'exclude': ['tasks', 'handlers', 'vars', 'defaults', 'meta'],
            'types': list(),
            'user': False,
            'validator': None,
            'permission': 'users.edit_roles'
        },
        'users': {
            'path': settings.USERDATA_PATH,
            'prefix': '{{ userdata_path }}',
            'exclude': list(),
            'types': list(),
            'user': True,
            'validator': None,
            'permission': 'users.edit_files'
        }
    }

    archive_types = [
        'application/zip',
        'application/gzip',
        'application/x-tar',
        'application/x-gtar'
    ]

    def _set_root(self, root, owner, user):

        root_dict = self.file_roots[root]

        if root == 'users':

            root_dict['authorized'] = True if user.username == owner else user.has_perm('users.edit_user_files')

            root_dict['path'] = os.path.join(settings.USERDATA_PATH, owner)

        else:

            root_dict['authorized'] = user.has_perm(root_dict['permission'])

        if root_dict['path'] and not os.path.exists(root_dict['path']):

            os.makedirs(root_dict['path'])

        return root_dict

    def get(self, request, action):

        prefs = get_preferences()

        if action == 'search':

            data = list()

            for key in self.file_roots:

                source = self.file_roots[key]

                if source['prefix']:

                    for root, dirs, files in os.walk(source['path']):

                        for file_name in files:

                            full_path = os.path.join(root, file_name)

                            relative_path = root.replace(source['path'], source['prefix'])

                            is_hidden = any(s.startswith('.') for s in full_path.split('/'))

                            excluded = root.split('/')[-1] in source['exclude']

                            is_not_archive = magic.from_file(full_path, mime='true') not in self.archive_types

                            if request.GET['term'] in full_path:

                                if is_hidden and not prefs['show_hidden_files']:

                                    continue

                                if excluded or request.GET['type'] == 'archive' and is_not_archive:

                                    continue

                                if source['user'] and relative_path.split('/')[1] != request.user.username:

                                    continue

                                data.append({'value': os.path.join(relative_path, file_name)})

        else:

            root = self._set_root(request.GET['root'], request.GET.get('owner'), request.user)

            if not root['path']:

                raise Http404('Invalid root')

            if action == 'list':

                tz = timezone(request.user.userdata.timezone)

                data = list()

                directory = os.path.join(root['path'], request.GET['folder'])

                folder = request.GET['folder']

                for base_name in os.listdir(directory):

                    full_path = os.path.join(directory, base_name)

                    is_valid = True

                    error = None

                    if os.path.isfile(full_path):

                        file_type = magic.from_file(full_path, mime='true')

                        if root['validator']:

                            is_valid, error = root['validator'](full_path)

                    else:

                        file_type = 'directory'

                    if not prefs['show_hidden_files'] and base_name.startswith('.'):

                        continue

                    if file_type != 'directory' and len(root['types']) > 0 and base_name.split('.')[-1] not in root['types']:

                        continue

                    file_size = os.path.getsize(full_path)

                    file_timestamp = datetime.datetime.fromtimestamp(os.path.getmtime(full_path))

                    utc_timestamp = utc.localize(file_timestamp)

                    data.append({
                        'name': base_name,
                        'type': file_type,
                        'size': file_size,
                        'modified': utc_timestamp.astimezone(tz).strftime(prefs['date_format']),
                        'root': request.GET.get('root'),
                        'folder': folder,
                        'is_valid': is_valid,
                        'error': error
                    })

            elif action == 'read':

                full_path = os.path.join(root['path'], request.GET['folder'], request.GET['name'])

                if os.path.exists(full_path):

                    if os.path.isfile(full_path):

                        if os.stat(full_path).st_size <= prefs['max_edit_size']:

                            with open(full_path, 'r') as text_file:

                                data = {'result': 'ok', 'text': text_file.read()}

                        else:

                            data = {
                                'result': 'failed',
                                'msg': 'The file is larger than ' + str(prefs['max_edit_size']) + 'kb'
                            }

                    else:

                        data = {'result': 'failed', 'msg': 'Target is not a file'}

                else:

                    data = {'result': 'failed', 'msg': 'The file was not found'}

            elif action == 'exists':

                if request.GET['type'] == 'directory':

                    check_method = os.path.isdir

                elif request.GET['type'] == 'file':

                    check_method = os.path.isfile

                else:

                    raise Http404('Invalid object type')

                if check_method(os.path.join(root['path'], request.GET['name'])):

                    data = {'result': 'ok'}

                else:

                    data = {
                        'result': 'failed',
                        'msg': '{} {} does not exist'.format(request.GET['type'].capitalize(), request.GET['name'])
                    }

            elif action == 'download':

                full_path = os.path.join(root['path'], request.GET['folder'], request.GET['name'])

                if os.path.isfile(full_path):

                    target = full_path

                    delete_after = False

                else:

                    target = shutil.make_archive(os.path.join(tempfile.gettempdir(), request.GET['name']), 'zip', full_path)

                    delete_after = True

                stream = StreamingHttpResponse((line for line in open(target, 'r')))

                stream['Content-Length'] = os.path.getsize(target)

                stream['Content-Disposition'] = 'attachment; filename=' + ntpath.basename(target)

                os.remove(target) if delete_after else None

                return stream

            else:

                raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')

    def post(self, request, action):

        root = self._set_root(request.POST['root'], request.POST.get('owner'), request.user)

        print request.POST

        if root['authorized']:

            full_path = os.path.join(root['path'], request.POST['folder'], request.POST['name'])

            new_path = os.path.join(root['path'], request.POST['folder'], request.POST['new_name'])

            is_directory = (request.POST['type'] == 'directory')

            if is_directory or len(root['types']) == 0 or request.POST['new_name'].split('.')[-1] in root['types']:

                if action == 'save':

                    if full_path == new_path or not os.path.exists(new_path):

                        try:

                            with open(new_path, 'w') as f:

                                f.write(request.POST['text'].encode('utf8'))

                                data = {'result': 'ok'}

                        except Exception as e:

                            data = {'result': 'failed', 'msg': str(e)}

                        if full_path != new_path:

                            try:

                                os.remove(full_path)

                            except os.error:

                                pass

                    else:

                        data = {'result': 'failed', 'msg': 'This filename is already in use'}

                elif action == 'rename':

                    if os.path.exists(new_path):

                        data = {'result': 'failed', 'msg': 'This name is already in use'}

                    else:

                        os.rename(full_path, new_path)

                        data = {'result': 'ok'}

                elif action == 'create':

                    if os.path.exists(new_path):

                        data = {'result': 'failed', 'msg': 'This name is already in use'}

                    else:

                        if request.POST['type'] == 'directory':

                            os.makedirs(new_path)

                        else:

                            open(new_path, 'a').close()

                        data = {'result': 'ok'}

                elif action == 'copy':

                    if os.path.exists(new_path):

                        data = {'result': 'failed', 'msg': 'This name is already in use'}

                    else:

                        shutil.copy(full_path, new_path) if os.path.isfile(full_path) else shutil.copytree(full_path, new_path)

                        data = {'result': 'ok'}

                elif action == 'upload':

                    if os.path.exists(new_path):

                        data = {'result': 'failed', 'msg': 'This name is already in use'}

                    else:

                        try:

                            with open(new_path, 'w') as f:

                                for chunk in request.FILES['file_data']:

                                    f.write(chunk)

                        except Exception as e:

                            data = {'result': 'failed', 'msg': str(e)}

                        else:

                            data = {'result': 'ok'}

                elif action == 'delete':

                    os.remove(new_path) if os.path.isfile(new_path) else shutil.rmtree(new_path)

                    data = {'result': 'ok'}

                else:

                    raise Http404('Invalid action')

            else:

                data = {'result': 'failed', 'msg': 'File extension not allowed is this folder'}

        else:

            data = {'result': 'denied'}

        return HttpResponse(json.dumps(data), content_type='application/json')

