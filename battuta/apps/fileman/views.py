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


class ManagerView(View):
    base_dir = None
    html_template = None

    def __init__(self):
        super(ManagerView, self).__init__()
        self.context = dict()

    @staticmethod
    def get_directory_content(root):
        content = {'root': root, 'filelist': list()}

        for filename in os.listdir(root):

            full_filename = os.path.join(root, filename)

            if os.path.isfile(full_filename):
                file_mime_type = magic.from_file(full_filename, mime='true')
            else:
                file_mime_type = 'directory'

            file_size = os.path.getsize(full_filename)
            file_timestamp = os.path.getmtime(full_filename)

            content['filelist'].append([filename, file_mime_type, file_size, file_timestamp, ''])

        return content

    def get(self, request):
        if 'action' not in request.GET:
            self.context['user'] = request.user
            return render(request, self.html_template, self.context)

        else:
            if request.GET['action'] == 'list':

                if not os.path.exists(self.base_dir):
                    os.makedirs(self.base_dir)

                content = self.get_directory_content(os.path.join(self.base_dir, request.GET['root']))
                data = content['filelist']

            elif request.GET['action'] == 'edit':

                full_path = os.path.join(self.base_dir, request.GET['file_dir'], request.GET['file_path'])

                if os.path.exists(full_path):
                    with open(full_path, 'r') as text_file:
                        data = {'result': 'ok', 'text': text_file.read()}
                else:
                    data = {'result': 'fail', 'msg': 'The file was not found'}

            elif request.GET['action'] == 'download':

                object_full_path = os.path.join(self.base_dir, request.GET['object'])
                object_name = ntpath.basename(object_full_path)

                if os.path.isfile(object_full_path):
                    filename = object_full_path

                else:
                    temp = tempfile.NamedTemporaryFile()
                    filename = temp.name

                    shutil.make_archive(filename, 'zip', object_full_path)

                    filename += '.zip'
                    object_name += '.zip'

                response = StreamingHttpResponse((line for line in open(filename, 'r')))
                response['Content-Disposition'] = 'attachment; filename=' + object_name
                response['Content-Length'] = os.path.getsize(filename)

                if os.path.isdir(object_full_path):
                    os.remove(filename)

                return response

            else:
                raise Http404('Invalid action')

            return HttpResponse(json.dumps(data), content_type='application/json')

    def post(self, request):
        data = dict()
        if request.POST['action'] == 'save':

            old_full_path = os.path.join(self.base_dir, request.POST['file_dir'], request.POST['old_file_name'])
            full_path = os.path.join(self.base_dir, request.POST['file_dir'], request.POST['file_name'])

            if full_path != old_full_path and os.path.exists(full_path):
                data = {'result': 'fail', 'msg': 'This name is already in use'}
            else:
                try:
                    with open(full_path, 'w') as f:
                        f.write(request.POST['text'])
                except Exception as e:
                    data = {'result': 'fail', 'msg': e}
                else:
                    if full_path != old_full_path:
                        try:
                            os.remove(old_full_path)
                        except os.error:
                            pass
                    data = {'result': 'ok'}

        elif request.POST['action'] == 'rename':

            old_name = os.path.join(self.base_dir, request.POST['old_name'])
            new_name = os.path.join(self.base_dir, request.POST['file_name'])

            if os.path.exists(new_name):
                data['result'] = 'fail'
                data['msg'] = 'This name is already in use'
            else:
                os.rename(old_name, new_name)
                data['result'] = 'ok'

        elif request.POST['action'] == 'create':

            new_object = os.path.join(self.base_dir, request.POST['file_name'])

            if os.path.exists(new_object):
                data['result'] = 'fail'
                data['msg'] = 'This name is already in use'
            else:
                if request.POST['is_directory'] == 'true':
                    if not os.path.exists(new_object):
                        os.makedirs(new_object)
                else:
                    open(new_object, 'a').close()

                data['result'] = 'ok'

        elif request.POST['action'] == 'copy':

            old_object = os.path.join(self.base_dir, request.POST['old_name'])
            new_object = os.path.join(self.base_dir, request.POST['file_name'])

            if os.path.exists(new_object):
                data['result'] = 'fail'
                data['msg'] = 'This name is already in use'
            else:
                if os.path.isfile(old_object):
                    shutil.copy(old_object, new_object)
                else:
                    shutil.copytree(old_object, new_object)

                data['result'] = 'ok'

        elif request.POST['action'] == 'upload':

            file_path = os.path.join(self.base_dir, request.POST['file_path'])

            if os.path.exists(file_path):
                data['result'] = 'fail'
                data['msg'] = 'This name is already in use'
            else:
                with open(file_path, 'w') as f:
                    for chunk in request.FILES['file']:
                        f.write(chunk)
                data['result'] = 'ok'

        elif request.POST['action'] == 'delete':

            full_path = os.path.join(self.base_dir, request.POST['object'])

            if os.path.isfile(full_path):
                os.remove(full_path)
            else:
                shutil.rmtree(full_path)

            data['result'] = 'ok'

        else:
            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')


class FileView(ManagerView):
    base_dir = settings.FILES_PATH
    html_template = 'fileman/files.html'


class RoleView(ManagerView):
    base_dir = settings.ROLES_PATH
    html_template = 'fileman/roles.html'
