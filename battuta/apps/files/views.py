import json
import os

from django.shortcuts import render
from django.views.generic import View
from django.http import HttpResponse
from django.conf import settings

from .functions import get_directory_content


class BaseView(View):
    def __init__(self):
        super(BaseView, self).__init__()
        self.context = dict()


class FileView(BaseView):
    def get(self, request):
        if 'action' not in request.GET:
            self.context['user'] = request.user
            return render(request, 'files/files.html', self.context)

        else:
            data = None
            if request.GET['action'] == 'list':
                content = get_directory_content(os.path.join(settings.FILE_DIR, request.GET['root']))
                data = content['filelist']
            return HttpResponse(json.dumps(data), content_type='application/json')


class RoleView(BaseView):
    def get(self, request):
        if 'action' not in request.GET:
            self.context['user'] = request.user
            return render(request, 'files/roles.html', self.context)