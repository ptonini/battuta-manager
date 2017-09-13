import json

from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404, render
from django.views.generic import View
from django.contrib.auth.models import User, Group as UserGroup
from django.core.cache import cache
from django.conf import settings

from apps.projects.models import Project
from apps.projects.forms import ProjectForm
from apps.projects.extras import ProjectAuth

from apps.inventory.models import Group as HostGroup


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

    classes = {
        'manager': User,
        'host_group': HostGroup,
        'can_edit_variables': UserGroup,
        'can_run_tasks': UserGroup,
        'can_edit_tasks': UserGroup,
        'can_run_playbooks': UserGroup,
        'can_edit_playbooks': UserGroup,
        'can_edit_roles': UserGroup,
    }

    @staticmethod
    def _project_to_dict(p):

        return {
            'name': p.name,
            'id': p.id,
            'description': p.description,
            'manager': p.manager.username if p.manager else None,
            'host_group': {'name': p.host_group.name, 'id': p.host_group.id} if p.host_group else None,
            'can_edit_variables': p.can_edit_variables.name if p.can_edit_variables else None,
            'can_run_tasks': p.can_run_tasks.name if p.can_run_tasks else None,
            'can_edit_tasks': p.can_edit_tasks.name if p.can_edit_tasks else None,
            'can_run_playbooks': p.can_run_playbooks.name if p.can_run_playbooks else None,
            'can_edit_playbooks': p.can_edit_playbooks.name if p.can_edit_playbooks else None,
            'can_edit_roles': p.can_edit_roles.name if p.can_edit_roles else None,
            'playbooks': [{'name': f['name'], 'folder': f['folder']} for f in json.loads(p.playbooks)],
            'roles': [{'name': f['name'], 'folder': f['folder']} for f in json.loads(p.roles)]
        }

    def get(self, request, action):

        project_auth = cache.get_or_set(str(request.user.username + '_auth'), ProjectAuth(request.user), settings.CACHE_TIMEOUT)

        if action == 'list':

            projects = list()

            for project in Project.objects.all():

                if request.user.has_perm('users.edit_projects') or request.user.username == project.manager.username:

                    projects.append(self._project_to_dict(project))

            data = {'result': 'ok', 'projects': projects}

        else:

            project = get_object_or_404(Project, pk=request.GET['id'])

            if request.user.has_perm('users.edit_projects') or request.user.username == project.manager.username:

                if action == 'get':

                    data = {'result': 'ok', 'project': self._project_to_dict(project)}

                elif action in ['playbooks', 'roles']:

                    file_list = [{'name': f['name'], 'folder': f['folder']} for f in json.loads(project.__getattribute__(action))]

                    data = {'result': 'ok', 'file_list': file_list}

                else:

                    raise Http404('Invalid action')

            else:

                data = {'result': 'denied'}

        return HttpResponse(json.dumps(data), content_type='application/json')

    def post(self, request, action):

        project_auth = cache.get_or_set(str(request.user.username + '_auth'), ProjectAuth(request.user), settings.CACHE_TIMEOUT)

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

            elif action == 'set_property':

                prop = json.loads(request.POST['property'])

                project.__setattr__(prop['name'], get_object_or_404(self.classes[prop['name']], pk=prop['value']))

                project.save()

                data = {'result': 'ok'}

            elif action == 'clear_property':

                prop = json.loads(request.POST['property'])

                project.__setattr__(prop['name'], None)

                project.save()

                data = {'result': 'ok'}

            elif action in ['add_playbooks', 'add_roles']:

                file_type = action.split('_')[1]

                files = json.loads(project.__getattribute__(file_type))

                files = files + [r for r in (json.loads(request.POST[file_type])) if r not in files]

                project.__setattr__(file_type, json.dumps(files))

                project.save()

                data = {'result': 'ok'}

            elif action in ['remove_playbooks', 'remove_roles']:

                file_type = action.split('_')[1]

                files = [p for p in json.loads(project.__getattribute__(file_type)) if p not in (json.loads(request.POST[file_type]))]

                project.__setattr__(file_type, json.dumps(files))

                project.save()

                data = {'result': 'ok', 'msg': 'Playbooks removed'}

            else:

                raise Http404('Invalid action')
        else:

            data = {'result': 'denied'}

        return HttpResponse(json.dumps(data), content_type='application/json')
