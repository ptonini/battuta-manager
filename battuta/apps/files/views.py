import json
import os
import shutil
import magic
import ntpath
import tempfile
import datetime
import yaml

from django.shortcuts import render
from django.views.generic import View
from django.http import HttpResponse, StreamingHttpResponse, Http404
from django.conf import settings
from django.contrib.auth.models import User
from pytz import timezone, utc

from apps.preferences.extras import get_preferences


class PageView(View):

    @staticmethod
    def get(request):

        return render(request, 'files/files.html', {'user': request.user})


class FilesView(View):

    file_sources = [
        [settings.FILES_PATH, '{{ files_path }}', [], False],
        [settings.USERDATA_PATH, '{{ userdata_path }}', [], True],
        [settings.ROLES_PATH, '{{ roles_path }}', ['tasks', 'handlers', 'vars', 'defaults', 'meta'], False]
    ]

    archive_types = [
        'application/zip',
        'application/gzip',
        'application/x-tar',
        'application/x-gtar'
    ]

    @staticmethod
    def _validator(root, full_path):

        if root == 'playbooks':

            with open(full_path, 'r') as yaml_file:

                try:

                    yaml.load(yaml_file.read())

                    return True, None

                except yaml.YAMLError as e:

                    return False, type(e).__name__ + ': ' + e.__str__()

        else:

            return True, None

    @staticmethod
    def _set_root(root, user, current_user):

        root_dir = None

        file_types = '*'

        authorized = False

        if root == 'files':

            root_dir = settings.FILES_PATH

            authorized = current_user.has_perm('users.edit_files')

        elif root == 'roles':

            root_dir = settings.ROLES_PATH

            authorized = current_user.has_perm('users.edit_roles')

        elif root == 'playbooks':

            root_dir = settings.PLAYBOOK_PATH

            authorized = current_user.has_perm('users.edit_playbooks')

            file_types = ['yml', 'yaml']

        elif root == 'user' and User.objects.filter(username=user).exists():

            root_dir = os.path.join(settings.USERDATA_PATH, user)

            authorized = True if current_user.username == user else user.has_perm('users.edit_user_files')

        if root_dir and not os.path.exists(root_dir):

            os.makedirs(root_dir)

        return root_dir, file_types, authorized

    def get(self, request, action):

        root_dir, file_types, authorized = self._set_root(request.GET['root'], request.GET['user'], request.user)

        prefs = get_preferences()

        if action == 'search':

            prefs = get_preferences()

            data = list()

            for path, prefix, exclude, is_user_folder in self.file_sources:

                for root, dirs, files in os.walk(path):

                    for file_name in files:

                        full_path = os.path.join(root, file_name)
                        relative_path = root.replace(path, prefix)

                        if not prefs['show_hidden_files'] and any(s.startswith('.') for s in full_path.split('/')):
                            continue

                        if request.GET['term'] not in full_path:
                            continue

                        if root.split('/')[-1] in exclude:
                            continue

                        if request.GET['type'] == 'archive':

                            if magic.from_file(full_path, mime='true') not in self.archive_types:
                                continue

                        if is_user_folder and relative_path.split('/')[1] != request.user.username:
                            continue

                        data.append({'value': os.path.join(relative_path, file_name)})

        else:

            if not root_dir:

                raise Http404('Invalid root')

            if action == 'list':

                tz = timezone(request.user.userdata.timezone)

                data = list()

                if request.GET['folder']:

                    directory = os.path.join(root_dir, request.GET['folder'])

                    folder = request.GET['folder']

                else:

                    directory = root_dir

                    folder = ''

                for base_name in os.listdir(directory):

                    full_path = os.path.join(directory, base_name)

                    if not prefs['show_hidden_files'] and base_name.startswith('.'):

                        continue

                    if file_types != '*' and base_name.split('.')[-1] not in file_types:

                        continue

                    if os.path.isfile(full_path):

                        file_type = magic.from_file(full_path, mime='true')

                        is_valid, error = self._validator(request.GET['root'], full_path)

                    else:

                        file_type = 'directory'

                        is_valid = True

                        error = None

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

                full_path = os.path.join(root_dir, request.GET['folder'], request.GET['name'])

                if os.path.exists(full_path):

                    if os.path.isfile(full_path):

                        if os.stat(full_path).st_size <= prefs['max_edit_size']:

                            with open(full_path, 'r') as text_file:

                                data = {'result': 'ok', 'text': text_file.read()}

                        else:

                            data = {
                                'result': 'fail',
                                'msg': 'The file is larger than ' + str(prefs['max_edit_size']) + 'kb'
                            }

                    else:

                        data = {'result': 'fail', 'msg': 'Target is not a file'}

                else:

                    data = {'result': 'fail', 'msg': 'The file was not found'}

            elif action == 'exists':

                if request.GET['type'] == 'directory':

                    check_method = os.path.isdir

                elif request.GET['type'] == 'file':

                    check_method = os.path.isfile

                else:

                    raise Http404('Invalid object type')

                if check_method(os.path.join(root_dir, request.GET['name'])):

                    data = {'result': 'ok'}

                else:

                    data = {
                        'result': 'failed',
                        'msg': '{} {} does not exist'.format(request.GET['type'].capitalize(), request.GET['name'])
                    }

            elif action == 'download':

                full_path = os.path.join(root_dir, request.GET['folder'], request.GET['name'])

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

        root_dir, file_types, authorized = self._set_root(request.POST['root'], request.POST['user'], request.user)

        if authorized:

            full_path = os.path.join(root_dir, request.POST['folder'], request.POST['name'])

            new_path = os.path.join(root_dir, request.POST['folder'], request.POST['new_name'])

            if file_types != '*' and new_path.split('.')[-1] not in file_types:

                new_path += '.' + file_types[0]

            if action == 'save':

                if full_path == new_path or not os.path.exists(new_path):

                    try:

                        with open(new_path, 'w') as f:

                            f.write(request.POST['text'].encode('utf8'))

                            data = {'result': 'ok'}

                    except Exception as e:

                        data = {'result': 'fail', 'msg': str(e)}

                    if full_path != new_path:

                        try:

                            os.remove(full_path)

                        except os.error:

                            pass

                else:

                    data = {'result': 'fail', 'msg': 'This filename is already in use'}

            elif action == 'rename':

                if os.path.exists(new_path):

                    data = {'result': 'fail', 'msg': 'This name is already in use'}

                else:

                    os.rename(full_path, new_path)

                    data = {'result': 'ok'}

            elif action == 'create':

                if os.path.exists(new_path):

                    data = {'result': 'fail', 'msg': 'This name is already in use'}

                else:

                    if request.POST['is_folder'] == 'true':

                        os.makedirs(new_path)

                    else:

                        open(new_path, 'a').close()

                    data = {'result': 'ok'}

            elif action == 'copy':

                if os.path.exists(new_path):

                    data = {'result': 'fail', 'msg': 'This name is already in use'}

                else:

                    shutil.copy(full_path, new_path) if os.path.isfile(full_path) else shutil.copytree(full_path, new_path)

                    data = {'result': 'ok'}

            elif action == 'upload':

                if os.path.exists(new_path):

                    data = {'result': 'fail', 'msg': 'This name is already in use'}

                else:

                    try:

                        with open(new_path, 'w') as f:

                            for chunk in request.FILES['file_data']:

                                f.write(chunk)

                    except Exception as e:

                        data = {'result': 'fail', 'msg': str(e)}

                    else:

                        data = {'result': 'ok'}

            elif action == 'delete':

                os.remove(new_path) if os.path.isfile(new_path) else shutil.rmtree(new_path)

                data = {'result': 'ok'}

            else:

                raise Http404('Invalid action')

        else:

            data = {'result': 'denied'}

        return HttpResponse(json.dumps(data), content_type='application/json')

