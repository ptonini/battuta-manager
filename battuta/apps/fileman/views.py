import json
import os
import shutil
import magic
import ntpath
import tempfile

from django.shortcuts import render
from django.views.generic import View
from django.http import HttpResponse, StreamingHttpResponse, Http404
from django.conf import settings


class SearchView(View):

    file_sources = [
        [
            settings.FILES_PATH,
            'Files',
            '{{ files_path }}',
            None
        ],
        [
            settings.ROLES_PATH,
            'Roles',
            '{{ roles_path }}',
            ['tasks', 'handlers', 'vars', 'defaults', 'meta']
        ]
    ]

    archive_types = ['application/zip', 'application/gzip', 'application/x-tar', 'application/x-gtar']

    def get(self, request):
        data = list()

        for directory, category, prefix, exclude in self.file_sources:
            for root, dirs, files in os.walk(directory):
                for file_name in files:

                    full_path = os.path.join(root, file_name)
                    relative_path = root.replace(directory, '')
                    file_path = os.path.join(relative_path, file_name)

                    if request.GET['term'] not in file_path:
                        continue
                    if exclude and len(relative_path.split('/')) > 2 and relative_path.split('/')[2] in exclude:
                        continue

                    if 'archives' in request.GET and magic.from_file(full_path, mime='true') not in self.archive_types:
                        continue

                    data.append({'label': os.path.join(relative_path, file_name),
                                 'prefix': prefix,
                                 'category': category})

        return HttpResponse(json.dumps(data), content_type='application/json')


class ManagerView(View):
    base_dir = None
    html_template = None

    def get(self, request):

        if 'action' not in request.GET:
            return render(request, self.html_template, {'user': request.user})

        else:
            if request.GET['action'] == 'table':

                if not os.path.exists(self.base_dir):
                    os.makedirs(self.base_dir)

                data = list()
                directory = os.path.join(self.base_dir, request.GET['directory'])

                for file_name in os.listdir(directory):

                    full_path = os.path.join(directory, file_name)

                    if os.path.isfile(full_path):
                        file_mime_type = magic.from_file(full_path, mime='true')
                    else:
                        file_mime_type = 'directory'

                    file_size = os.path.getsize(full_path)
                    file_timestamp = os.path.getmtime(full_path)

                    data.append([file_name, file_mime_type, file_size, file_timestamp, ''])

            elif request.GET['action'] == 'edit':

                full_path = os.path.join(self.base_dir, request.GET['file_dir'], request.GET['file_name'])

                if os.path.exists(full_path):
                    with open(full_path, 'r') as text_file:
                        data = {'result': 'ok', 'text': text_file.read()}
                else:
                    data = {'result': 'fail', 'msg': 'The file was not found'}

            elif request.GET['action'] == 'download':

                full_path = os.path.join(self.base_dir, request.GET['file_path'])
                file_name = ntpath.basename(full_path)

                if os.path.isfile(full_path):
                    filename = full_path

                else:
                    temp = tempfile.NamedTemporaryFile()
                    filename = temp.name

                    shutil.make_archive(filename, 'zip', full_path)

                    filename += '.zip'
                    file_name += '.zip'

                response = StreamingHttpResponse((line for line in open(filename, 'r')))
                response['Content-Disposition'] = 'attachment; filename=' + file_name
                response['Content-Length'] = os.path.getsize(filename)

                if os.path.isdir(full_path):
                    os.remove(filename)

                return response

            else:
                raise Http404('Invalid action')

            return HttpResponse(json.dumps(data), content_type='application/json')

    def post(self, request):

        full_path = os.path.join(self.base_dir, request.POST['file_dir'], request.POST['file_name'])

        if 'old_file_name' in request.POST:
            old_full_path = os.path.join(self.base_dir, request.POST['file_dir'], request.POST['old_file_name'])
        else:
            old_full_path = None

        if request.POST['action'] == 'save':

            print full_path, old_full_path

            if full_path != old_full_path and os.path.exists(full_path):
                data = {'result': 'fail', 'msg': 'This name is already in use'}
            else:
                try:
                    with open(full_path, 'w') as f:
                        f.write(request.POST['text'])
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
                    if not os.path.exists(full_path):
                        os.makedirs(full_path)
                else:
                    open(full_path, 'a').close()

                if request.POST['is_executable'] == 'true':
                    os.chmod(full_path, 744)

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
                        for chunk in request.FILES['file']:
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


class FileView(ManagerView):
    base_dir = settings.FILES_PATH
    html_template = 'fileman/files.html'


class RoleView(ManagerView):
    base_dir = settings.ROLES_PATH
    html_template = 'fileman/roles.html'
