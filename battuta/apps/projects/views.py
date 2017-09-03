import json

from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404, render
from django.views.generic import View

from .models import Project
from .forms import ProjectForm

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

    @staticmethod
    def _project_to_dict(project):

        return {
            'name': project.name,
            'id': project.id,
            'description': project.description,
            'manager': {'name': project.manager.username, 'id': project.manager.id},
            'host_group': {'name': project.host_group.name, 'id': project.host_group.id},
            'inventory_admins': {'name': project.inventory_admins.name, 'id': project.inventory_admins.id},
            'runner_admins': {'name': project.runner_admins.name, 'id': project.runner_admins.id},
            'execute_jobs': {'name': project.execute_jobs.name, 'id': project.execute_jobs.id},
            'roles': project.roles
        }

    def get(self, request, action):

        if action == 'list':

            projects = list()

            for project in Project.objects.all():

                if request.user.has_perm('users.edit_projects') or request.user.username == project.manager.username:

                    projects.append(self._project_to_dict(project))

            data = {'result': 'ok', 'projects': projects}

        elif action == 'get':

            project = get_object_or_404(Project, pk=request.GET['id'])

            if request.user.has_perm('users.edit_projects') or request.user.username == project.manager.username:

                data = {'result': 'ok', 'project': self._project_to_dict(project)}

            else:

                data = {'result': 'denied'}

        else:

            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')

    def post(self, request, action):

        if request.user.has_perm('users.edit_projects'):

            project = get_object_or_404(Project, pk=request.POST['id']) if request.POST['id'] else Project()

            if action == 'save':

                project_form = ProjectForm(request.POST or None, instance=project)

                if project_form.is_valid():

                    project = project_form.save()

                    data = {'result': 'ok', 'project': self._project_to_dict(project)}

                else:

                    data = {'result': 'failed', 'msg': str(project_form.errors)}

            elif action == 'delete':

                project.delete()

                data = {'result': 'ok'}

            else:

                raise Http404('Invalid action')
        else:

            data = {'result': 'denied'}

        return HttpResponse(json.dumps(data), content_type='application/json')
