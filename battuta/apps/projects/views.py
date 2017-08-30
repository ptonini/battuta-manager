import json

from django.http import HttpResponse, Http404, StreamingHttpResponse
from django.core.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404, render
from django.views.generic import View
from django.forms import model_to_dict

from .models import Project

from apps.preferences.extras import get_preferences


class PageView(View):

    @staticmethod
    def get(request, *args, **kwargs):

        if kwargs['page'] == 'projects':

            return render(request, 'projects/project_table.html')

        elif kwargs['page'] == 'new_project':

            return render(request, 'projects/project.html')

        elif kwargs['page'] == 'project':

            return render(request, 'projects/project.html', {'project_id': args[0]})
        else:

            raise Http404('Invalid page')


class ProjectView(View):

    def get(self, request, project_id, action):

        if action == 'list':

            projects = list()

            for project in Project.objects.all():

                projects.append({
                    'name': project.name,
                    'id': project.id,
                    'description': project.description,
                    'manager': {'name': project.manager.username, 'id': project.manager.id},
                    'host_group': {'name': project.host_group.name, 'id': project.host_group.id},
                    'roles': project.roles
                })

            data = {'result': 'ok', 'projects': projects}

        else:

            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')

    def post(self, request, project_id, action):

        if action == 'save':

            data = {}

        else:

            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')
