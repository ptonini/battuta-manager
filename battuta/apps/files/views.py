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
from pytz import timezone, utc

from django.shortcuts import render
from django.views.generic import View
from django.http import HttpResponse, StreamingHttpResponse, Http404
from django.conf import settings
from django.core.cache import cache

from apps.preferences.extras import get_preferences
from apps.projects.extras import ProjectAuth

reload(sys)
sys.setdefaultencoding('utf8')


class PageView(View):

    @staticmethod
    def get(request):

        return render(request, 'files/files.html', {'user': request.user})


class FilesView(View):

    @staticmethod
    def _validate_yaml(full_path):

        if os.path.isfile(full_path):

            with open(full_path, 'r') as yaml_file:

                try:

                    yaml.load(yaml_file.read())

                    return True, None

                except yaml.YAMLError as e:

                    return False, type(e).__name__ + ': ' + e.__str__()

        else:

            return True, None

    _file_sources = {
        'files': {
            'name': 'files',
            'path': settings.FILES_PATH,
            'prefix': '{{ files_path }}',
            'exclude': list(),
            'exts': None,
            'validator': None,
            'permission': 'users.edit_files'
        },
        'playbooks': {
            'name': 'playbooks',
            'path': settings.PLAYBOOK_PATH,
            'prefix': None,
            'exclude': list(),
            'exts': ['.yml', '.yaml'],
            'validator': _validate_yaml.__func__,
            'permission': 'users.edit_playbooks'
        },
        'roles': {
            'name': 'roles',
            'path': settings.ROLES_PATH,
            'prefix': '{{ roles_path }}',
            'exclude': ['tasks', 'handlers', 'vars', 'defaults', 'meta'],
            'exts': None,
            'validator': None,
            'permission': 'users.edit_roles'

    },
        'users': {
            'name': 'users',
            'path': settings.USERDATA_PATH,
            'prefix': '{{ userdata_path }}',
            'exclude': list(),
            'types': list(),
            'exts': None,
            'validator': None,
            'permission': 'users.edit_files'
        }
    }

    _archive_types = [
        'application/zip',
        'application/gzip',
        'application/x-tar',
        'application/x-gtar'
    ]

    def _set_root(self, root, owner, user):

        root_dict = self._file_sources[root]

        if root == 'users':

            root_dict['authorized'] = True if user.username == owner else user.has_perm('users.edit_user_files')

            root_dict['path'] = os.path.join(settings.USERDATA_PATH, owner)

        else:

            root_dict['authorized'] = user.has_perm(root_dict['permission'])

        if root_dict['path'] and not os.path.exists(root_dict['path']):

            os.makedirs(root_dict['path'])

        return root_dict

    def _search_files(self, source, request, prefs, project_auth):

        file_list = list()

        root_path = self._set_root(source['name'], '', request.user)

        for root, dirs, files in os.walk(source['path']):

            for file_name in files:

                full_path = os.path.join(root, file_name)

                is_not_archive = magic.from_file(full_path, mime='true') not in self._archive_types

                relative_path = full_path.replace(source['path'] + '/', '')

                exclude_conditions = {
                    request.GET.get('term', '') not in relative_path,
                    request.GET.get('term') and root.split('/')[-1] in source['exclude'],
                    any(s.startswith('.') for s in relative_path.split('/')) and not prefs['show_hidden_files'],
                    request.GET.get('type') == 'archive' and is_not_archive,
                    source['name'] == 'users' and relative_path.split('/')[1] != request.user.username,
                    not root_path['authorized'] and not project_auth.can_view_file(full_path),
                }

                if True not in exclude_conditions:

                    if request.GET.get('term'):

                        file_list.append({'value': os.path.join(source['prefix'], relative_path)})

                    else:

                        head, tail = os.path.split(relative_path)

                        file_dict = {'folder': head, 'name': tail}

                        if file_dict not in json.loads(request.GET.get('exclude', '[]')):

                            file_list.append({'folder': head, 'name': tail})

        return file_list

    def get(self, request, action):

        prefs = get_preferences()

        project_auth = cache.get_or_set(str(request.user.username + '_auth'), ProjectAuth(request.user), settings.CACHE_TIMEOUT)

        if action == 'search':

            data = list()

            if request.GET.get('root'):

                data = self._search_files(self._file_sources[request.GET['root']], request, prefs, project_auth)

            else:

                for key in self._file_sources:

                    source = self._file_sources[key]

                    if source['prefix']:

                        data = data + self._search_files(source, request, prefs, project_auth)

        else:

            root = self._set_root(request.GET['root'], request.GET.get('owner'), request.user)

            if not root['path']:

                raise Http404('Invalid root')

            if action == 'list':

                tz = timezone(request.user.userdata.timezone)

                file_list = list()

                directory = os.path.join(root['path'], request.GET['folder'])

                folder = request.GET['folder']

                for file_name in os.listdir(directory):

                    full_path = os.path.join(directory, file_name)

                    base_name, ext = os.path.splitext(file_name)

                    file_type = magic.from_file(full_path, mime='true') if os.path.isfile(full_path) else 'directory'

                    is_valid, error = root['validator'](full_path) if root['validator'] else True, None

                    exclude_conditions = {
                        file_name.startswith('.') and not prefs['show_hidden_files'],
                        file_type != 'directory' and root['exts'] and ext not in root['exts'],
                        {'name': file_name, 'folder': folder} in json.loads(request.GET.get('exclude', '[]')),
                        not root['authorized'] and not project_auth.can_view_file(full_path),
                    }

                    if True not in exclude_conditions:

                        file_size = os.path.getsize(full_path)

                        file_timestamp = datetime.datetime.fromtimestamp(os.path.getmtime(full_path))

                        utc_timestamp = utc.localize(file_timestamp)

                        file_list.append({
                            'name': file_name,
                            'type': file_type,
                            'size': file_size,
                            'modified': utc_timestamp.astimezone(tz).strftime(prefs['date_format']),
                            'root': request.GET.get('root'),
                            'folder': folder,
                            'is_valid': is_valid,
                            'error': error
                        })

                data = {'status': 'ok', 'file_list': file_list}

            elif action == 'read':

                full_path = os.path.join(root['path'], request.GET['folder'], request.GET['name'])

                if os.path.exists(full_path):

                    if os.path.isfile(full_path):

                        if os.stat(full_path).st_size <= prefs['max_edit_size']:

                            with open(full_path, 'r') as text_file:

                                data = {'status': 'ok', 'text': text_file.read()}

                        else:

                            data = {
                                'status': 'failed',
                                'msg': 'The file is larger than ' + str(prefs['max_edit_size']) + 'kb'
                            }

                    else:

                        data = {'status': 'failed', 'msg': 'Target is not a file'}

                else:

                    data = {'status': 'failed', 'msg': 'The file was not found'}

            elif action == 'exists':

                if request.GET['type'] == 'directory':

                    check_method = os.path.isdir

                elif request.GET['type'] == 'file':

                    check_method = os.path.isfile

                else:

                    raise Http404('Invalid object type')

                if check_method(os.path.join(root['path'], request.GET['name'])):

                    data = {'status': 'ok'}

                else:

                    data = {
                        'status': 'failed',
                        'msg': '{} {} does not exist'.format(request.GET['type'].capitalize(), request.GET['name'])
                    }

            elif action == 'download':

                full_path = os.path.join(root['path'], request.GET['folder'], request.GET['name'])

                if os.path.isfile(full_path):

                    target = full_path

                    delete_after = False

                else:

                    archive_name = os.path.join(tempfile.gettempdir(), request.GET['name'])

                    target = shutil.make_archive(archive_name, 'zip', full_path)

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

        project_auth = cache.get_or_set(str(request.user.username + '_auth'), ProjectAuth(request.user), settings.CACHE_TIMEOUT)

        root = self._set_root(request.POST['root'], request.POST.get('owner'), request.user)

        full_path = os.path.join(root['path'], request.POST['folder'], request.POST['name'])

        if root['authorized'] or project_auth.can_edit_file(full_path):

            new_path = os.path.join(root['path'], request.POST['folder'], request.POST['new_name'])

            base_name, ext = os.path.splitext(new_path)

            is_directory = (request.POST['type'] == 'directory')

            if is_directory or not root['exts'] or ext in root['exts']:

                if action == 'save':

                    if full_path == new_path or not os.path.exists(new_path):

                        try:

                            with open(new_path, 'w') as f:

                                f.write(request.POST['text'].encode('utf8'))

                                data = {'status': 'ok', 'msg': 'File saved'}

                        except Exception as e:

                            data = {'status': 'failed', 'msg': str(e)}

                        if full_path != new_path:

                            try:

                                os.remove(full_path)

                            except os.error:

                                pass

                    else:

                        data = {'status': 'failed', 'msg': 'This name is already in use'}

                elif action == 'rename':

                    if os.path.exists(new_path):

                        data = {'status': 'failed', 'msg': 'This name is already in use'}

                    else:

                        os.rename(full_path, new_path)

                        data = {'status': 'ok', 'msg': request.POST['type'].title() + ' renamed'}

                elif action == 'create':

                    if os.path.exists(new_path):

                        data = {'status': 'failed', 'msg': 'This name is already in use'}

                    else:

                        if request.POST['type'] == 'directory':

                            os.makedirs(new_path)



                        else:

                            open(new_path, 'a').close()

                        data = {'status': 'ok', 'msg': request.POST['type'].title() + ' created'}

                elif action == 'copy':

                    if os.path.exists(new_path):

                        data = {'status': 'failed', 'msg': 'This name is already in use'}

                    else:

                        shutil.copy(full_path, new_path) if os.path.isfile(full_path) else shutil.copytree(full_path, new_path)

                        data = {'status': 'ok', 'msg': request.POST['type'].title() + ' copied'}

                elif action == 'upload':

                    if os.path.exists(new_path):

                        data = {'status': 'failed', 'msg': 'This name is already in use'}

                    else:

                        try:

                            with open(new_path, 'w') as f:

                                for chunk in request.FILES['file_data']:

                                    f.write(chunk)

                        except Exception as e:

                            data = {'status': 'failed', 'msg': str(e)}

                        else:

                            data = {'status': 'ok', 'msg': request.POST['type'].title() + ' uploaded'}

                elif action == 'delete':

                    os.remove(new_path) if os.path.isfile(new_path) else shutil.rmtree(new_path)

                    data = {'status': 'ok', 'msg': request.POST['type'].title() + ' deleted'}

                else:

                    raise Http404('Invalid action')

            else:

                data = {'status': 'failed', 'msg': 'File extension not allowed is this folder'}

        else:

            data = {'status': 'denied'}

        return HttpResponse(json.dumps(data), content_type='application/json')

