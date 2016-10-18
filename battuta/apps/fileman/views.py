import json
import os

from django.shortcuts import render
from django.views.generic import View
from django.http import HttpResponse
from django.conf import settings

from . import get_directory_content


class BaseView(View):
    def __init__(self):
        super(BaseView, self).__init__()
        self.context = dict()


class ManagerView(BaseView):
    base_dir = None
    html_template = None

    def get(self, request):
        if 'action' not in request.GET:
            self.context['user'] = request.user
            return render(request, self.html_template, self.context)

        else:
            data = None
            if request.GET['action'] == 'list':
                content = get_directory_content(os.path.join(self.base_dir, request.GET['root']))
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

        return HttpResponse(json.dumps(data), content_type='application/json')


class FileView(ManagerView):
    base_dir = settings.FILE_DIR
    html_template = 'fileman/files.html'


class RoleView(ManagerView):
    base_dir = settings.ROLE_DIR
    html_template = 'fileman/roles.html'
