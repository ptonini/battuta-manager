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
from pytz import timezone, utc

from apps.preferences.functions import get_preferences


class FilesView(View):

    @staticmethod
    def get(request):
        return render(request, 'fileman/files.html', {'user': request.user})


class FileManagerView(View):

    @staticmethod
    def validator(root, full_path):
        if root == 'playbooks':
            with open(full_path, 'r') as yaml_file:
                try:
                    yaml.load(yaml_file.read())
                    return True, None
                except yaml.YAMLError as e:
                    return False, type(e).__name__ + ': ' + e.__str__()
        else:
            return True

    @staticmethod
    def set_root(root, request):

        root_dir = None

        if root == 'files':
            root_dir = settings.FILES_PATH
        elif root == 'roles':
            root_dir = settings.ROLES_PATH
        elif root == 'playbooks':
            root_dir = settings.PLAYBOOK_PATH
        else:
            temp_list = root.split('?')
            if temp_list[0] == 'user':
                root_dir = os.path.join(settings.USERDATA_PATH, request.user.username)

        if root_dir and not os.path.exists(root_dir):
            os.makedirs(root_dir)

        return root_dir

    @staticmethod
    def get(request, root, action):

        root_dir = FileManagerView.set_root(root, request)
        prefs = get_preferences()

        if not root_dir:
            raise Http404('Invalid root')

        if action == 'list':

            tz = timezone(request.user.userdata.timezone)
            data = list()

            if request.GET['folder']:
                directory = os.path.join(root_dir, request.GET['folder'])
            else:
                directory = root_dir

            for base_name in os.listdir(directory):

                full_path = os.path.join(directory, base_name)

                if not prefs['show_hidden_files'] and base_name.startswith('.'):
                    continue

                if os.path.isfile(full_path):
                    file_mime_type = magic.from_file(full_path, mime='true')
                    is_valid, error = FileManagerView.validator(root, full_path)
                else:
                    file_mime_type = 'directory'
                    is_valid = True
                    error = None

                file_size = os.path.getsize(full_path)
                file_timestamp = datetime.datetime.fromtimestamp(os.path.getmtime(full_path))
                utc_timestamp = utc.localize(file_timestamp)

                data.append({'name': base_name,
                             'type': file_mime_type,
                             'size': file_size,
                             'modified': utc_timestamp.astimezone(tz).strftime(prefs['date_format']),
                             'root': root,
                             'is_valid': is_valid,
                             'error': error})

        elif action == 'edit':

            full_path = os.path.join(root_dir, request.GET['folder'], request.GET['name'])

            if os.path.exists(full_path):
                if os.path.isfile(full_path):
                    if os.stat(full_path).st_size <= prefs['max_edit_size']:
                        with open(full_path, 'r') as text_file:
                            data = {'result': 'ok', 'text': text_file.read()}
                    else:
                        data = {'result': 'fail',
                                'msg': 'The file is larger than ' + str(prefs['max_edit_size']) + 'kb'}
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
                data = {'result': 'failed', 'msg': request.GET['type'].capitalize() + ' does not exist'}

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

            if delete_after:
                os.remove(target)

            return stream

        else:
            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')

    @staticmethod
    def post(request, root, action):

        root_dir = FileManagerView.set_root(root, request)

        full_path = os.path.join(root_dir, request.POST['folder'], request.POST['name'])
        new_path = os.path.join(root_dir, request.POST['folder'], request.POST['new_name'])

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
                if request.POST['is_directory'] == 'true':
                    os.makedirs(new_path)
                else:
                    open(new_path, 'a').close()

                data = {'result': 'ok'}

        elif action == 'copy':

            if os.path.exists(new_path):
                data = {'result': 'fail', 'msg': 'This name is already in use'}
            else:
                if os.path.isfile(full_path):
                    shutil.copy(full_path, new_path)
                else:
                    shutil.copytree(full_path, new_path)

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

            if os.path.isfile(new_path):
                os.remove(new_path)
            else:
                shutil.rmtree(new_path)

            data = {'result': 'ok'}

        else:
            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')

