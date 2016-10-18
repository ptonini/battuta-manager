import json
import os
import magic

from django.shortcuts import render
from django.views.generic import View
from django.http import HttpResponse
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
            data = None
            if request.GET['action'] == 'list':

                if not os.path.exists(self.base_dir):
                    os.makedirs(self.base_dir)

                content = self.get_directory_content(os.path.join(self.base_dir, request.GET['root']))
                data = content['filelist']

            elif request.GET['action'] == 'edit':

                with open(os.path.join(self.base_dir, request.GET['file']), 'r') as text_file:
                    data = {'text': text_file.read()}

            return HttpResponse(json.dumps(data), content_type='application/json')

    def post(self, request):
        data = dict()
        if request.POST['action'] == 'save':

            if request.POST['new_filename'] != request.POST['old_filename']:
                try:
                    os.remove(os.path.join(self.base_dir, request.POST['old_filename']))
                except os.error:
                    pass

            # Build filepath
            filepath = os.path.join(self.base_dir, request.POST['new_filename'])

            # Save file
            with open(filepath, 'w') as f:
                f.write(request.POST['text'])

            data['result'] = 'ok'

        elif request.POST['action'] == 'rename':

            old_name = os.path.join(self.base_dir, request.POST['old_name'])
            new_name = os.path.join(self.base_dir, request.POST['new_name'])

            os.rename(old_name, new_name)

            data['result'] = 'ok'

        elif request.POST['action'] == 'delete':

            os.remove(os.path.join(self.base_dir, request.POST['filename']))

            data['result'] = 'ok'

        return HttpResponse(json.dumps(data), content_type='application/json')


class FileView(ManagerView):
    base_dir = settings.FILE_DIR
    html_template = 'fileman/files.html'


class RoleView(ManagerView):
    base_dir = settings.ROLE_DIR
    html_template = 'fileman/roles.html'
