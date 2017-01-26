import json
import os
import shutil
import magic
import ntpath
import tempfile
import datetime

from django.shortcuts import render
from django.views.generic import View
from django.http import HttpResponse, StreamingHttpResponse, Http404
from django.conf import settings
from pytz import timezone, utc

from apps.preferences.functions import get_preferences


class FileManagerView(View):
    root_dir = None
    html_template = None
    is_user = False

    def get(self, request):

        data = None

        if self.is_user:
            self.root_dir = os.path.join(self.root_dir, request.user.username)

        if 'list' in request.GET:

            tz = timezone(request.user.userdata.timezone)
            prefs = get_preferences()

            if not os.path.exists(self.root_dir):
                os.makedirs(self.root_dir)

            data = list()
            directory = os.path.join(self.root_dir, request.GET['list'])
            for base_name in os.listdir(directory):

                full_path = os.path.join(directory, base_name)

                if not prefs['show_hidden_files'] and base_name.startswith('.'):
                    continue

                if os.path.isfile(full_path):
                    file_mime_type = magic.from_file(full_path, mime='true')
                else:
                    file_mime_type = 'directory'

                file_size = os.path.getsize(full_path)
                file_timestamp = datetime.datetime.fromtimestamp(os.path.getmtime(full_path))

                utc_timestamp = utc.localize(file_timestamp)
                local_timestamp = utc_timestamp.astimezone(tz).strftime(prefs['date_format'])

                data.append([base_name, file_mime_type, file_size, local_timestamp, ''])

        elif 'edit' in request.GET:

            full_path = os.path.join(self.root_dir, request.GET['current_dir'], request.GET['edit'])

            if os.path.exists(full_path):
                with open(full_path, 'r') as text_file:
                    data = {'result': 'ok', 'text': text_file.read()}
            else:
                data = {'result': 'fail', 'msg': 'The file was not found'}

        elif 'exists' in request.GET:

            if request.GET['type'] == 'directory':
                check_method = os.path.isdir
            elif request.GET['type'] == 'file':
                check_method = os.path.isfile
            else:
                raise Http404('Invalid object type')

            if check_method(os.path.join(self.root_dir, request.GET['exists'])):
                data = {'result': 'ok'}
            else:
                data = {'result': 'failed', 'msg': request.GET['type'].capitalize() + ' does not exist'}

        elif 'download' in request.GET:

            full_path = os.path.join(self.root_dir, request.GET['current_dir'], request.GET['download'])

            if os.path.isfile(full_path):
                target = full_path
                delete_after = False

            else:
                target = shutil.make_archive(os.path.join(tempfile.gettempdir(), request.GET['download']), 'zip', full_path)
                delete_after = True

            stream = StreamingHttpResponse((line for line in open(target, 'r')))
            stream['Content-Length'] = os.path.getsize(target)
            stream['Content-Disposition'] = 'attachment; filename=' + ntpath.basename(target)

            if delete_after:
                os.remove(target)

            return stream

        if data is None:
            return render(request, self.html_template, {'user': request.user})
        else:
            return HttpResponse(json.dumps(data), content_type='application/json')

    def post(self, request):

        if self.is_user:
            self.root_dir = os.path.join(self.root_dir, request.user.username)

        full_path = os.path.join(self.root_dir, request.POST['current_dir'], request.POST['base_name'])

        if 'old_base_name' in request.POST:
            old_full_path = os.path.join(self.root_dir, request.POST['current_dir'], request.POST['old_base_name'])
        else:
            old_full_path = None

        if request.POST['action'] == 'save':

            if full_path != old_full_path and os.path.exists(full_path):
                data = {'result': 'fail', 'msg': 'This name is already in use'}
            else:
                try:
                    with open(full_path, 'w') as f:
                        f.write(request.POST['text'].encode('utf8'))
                except Exception as e:
                    data = {'result': 'fail', 'msg': str(e)}
                else:
                    if full_path != old_full_path:
                        try:
                            os.remove(old_full_path)
                        except os.error:
                            pass
                    data = {'result': 'ok'}

        elif request.POST['action'] == 'rename':

            if os.path.exists(full_path):
                data = {'result': 'fail', 'msg': 'This name is already in use'}
            else:
                os.rename(old_full_path, full_path)
                data = {'result': 'ok'}

        elif request.POST['action'] == 'create':

            if os.path.exists(full_path):
                data = {'result': 'fail', 'msg': 'This name is already in use'}
            else:
                if request.POST['is_directory'] == 'true':
                    os.makedirs(full_path)
                else:
                    open(full_path, 'a').close()

                data = {'result': 'ok'}

        elif request.POST['action'] == 'copy':

            if os.path.exists(full_path):
                data = {'result': 'fail', 'msg': 'This name is already in use'}
            else:
                if os.path.isfile(old_full_path):
                    shutil.copy(old_full_path, full_path)
                else:
                    shutil.copytree(old_full_path, full_path)

                data = {'result': 'ok'}

        elif request.POST['action'] == 'upload':

            if os.path.exists(full_path):
                data = {'result': 'fail', 'msg': 'This name is already in use'}
            else:
                try:
                    with open(full_path, 'w') as f:
                        for chunk in request.FILES['file_data']:
                            f.write(chunk)
                except Exception as e:
                    data = {'result': 'fail', 'msg': str(e)}
                else:
                    data = {'result': 'ok'}

        elif request.POST['action'] == 'delete':

            if os.path.isfile(full_path):
                os.remove(full_path)
            else:
                shutil.rmtree(full_path)

            data = {'result': 'ok'}

        else:
            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')


class FileView(FileManagerView):
    root_dir = settings.FILES_PATH
    html_template = 'fileman/files.html'


class RoleView(FileManagerView):
    root_dir = settings.ROLES_PATH
    html_template = 'fileman/roles.html'


class UserFilesView(FileManagerView):
    root_dir = settings.USERDATA_PATH
    html_template = 'fileman/user_files.html'
    is_user = True
