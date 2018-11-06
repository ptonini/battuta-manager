import json

from django.http import HttpResponse, Http404, HttpResponseNotFound
from django.shortcuts import get_object_or_404, render
from django.views.generic import View
from django.contrib.auth.models import User, Group as UserGroup

from apps.projects.models import Project
from apps.projects.forms import ProjectForm

from apps.inventory.models import Group as HostGroup


class PageView(View):

    @staticmethod
    def get(request, *args, **kwargs):

        if kwargs['page'] == 'selector':

            return render(request, 'projects/project_selector.html')

        elif kwargs['page'] == 'view':

            return render(request, 'projects/project_view.html', {'project_id': args[0]})
        else:

            raise Http404()


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
            'host_group': p.host_group.name if p.host_group else None,
            'can_edit_variables': p.can_edit_variables.name if p.can_edit_variables else None,
            'can_run_tasks': p.can_run_tasks.name if p.can_run_tasks else None,
            'can_edit_tasks': p.can_edit_tasks.name if p.can_edit_tasks else None,
            'can_run_playbooks': p.can_run_playbooks.name if p.can_run_playbooks else None,
            'can_edit_playbooks': p.can_edit_playbooks.name if p.can_edit_playbooks else None,
            'can_edit_roles': p.can_edit_roles.name if p.can_edit_roles else None,
            'playbooks': [{'name': f['name'], 'folder': f['folder']} for f in json.loads(p.playbooks)],
            'roles': [{'name': f['name'], 'folder': f['folder']} for f in json.loads(p.roles)],
            'editable': True
        }

    def get(self, request, action):

        if action == 'list':

            projects = list()

            for project in Project.objects.all():

                if request.user.has_perm('users.edit_projects') or request.user.username == project.manager.username:

                    projects.append(self._project_to_dict(project))

            data = {'status': 'ok', 'projects': projects}

        else:

            project = get_object_or_404(Project, pk=request.GET['id'])

            if request.user.has_perm('users.edit_projects') or request.user.username == project.manager.username:

                if action == 'get':

                    data = {'status': 'ok', 'project': self._project_to_dict(project)}

                elif action in ['playbooks', 'roles']:

                    file_list = [{'name': f['name'], 'folder': f['folder']} for f in json.loads(project.__getattribute__(action))]

                    data = {'status': 'ok', 'file_list': file_list}

                else:

                    return HttpResponseNotFound('Invalid action')

            else:

                data = {'status': 'denied'}

        return HttpResponse(json.dumps(data), content_type='application/json')

    def post(self, request, action):

        if request.user.has_perm('users.edit_projects'):

            project = get_object_or_404(Project, pk=request.POST['id']) if 'id' in request.POST else Project()

            if action == 'save':

                project_form = ProjectForm(request.POST or None, instance=project)

                if project_form.is_valid():

                    project = project_form.save()

                    project.save()

                    data = {'status': 'ok', 'project': self._project_to_dict(project)}

                else:

                    error_dict = json.loads(project_form.errors.as_json())

                    data = {'status': 'failed', 'error': error_dict}

            elif action == 'delete':

                project.delete()

                data = {'status': 'ok'}

            elif action == 'set_property':

                prop = json.loads(request.POST['property'])

                project.__setattr__(prop['name'], get_object_or_404(self.classes[prop['name']], pk=prop['value']))

                project.save()

                data = {'status': 'ok', 'property_id': project.__getattribute__(prop['name']).id}

            elif action == 'clear_property':

                prop = json.loads(request.POST['property'])

                project.__setattr__(prop['name'], None)

                project.save()

                data = {'status': 'ok'}

            elif action in ['add_playbooks', 'add_roles']:

                file_type = action.split('_')[1]

                files = json.loads(project.__getattribute__(file_type))

                files = files + [r for r in (json.loads(request.POST[file_type])) if r not in files]

                project.__setattr__(file_type, json.dumps(files))

                project.save()

                data = {'status': 'ok'}

            elif action in ['remove_playbook', 'remove_role']:

                file_type = action.split('_')[1] + 's'

                files = [p for p in json.loads(project.__getattribute__(file_type)) if p not in (json.loads(request.POST[file_type]))]

                project.__setattr__(file_type, json.dumps(files))

                project.save()

                data = {'status': 'ok'}

            else:

                return HttpResponseNotFound('Invalid action')
        else:

            data = {'status': 'denied'}

        return HttpResponse(json.dumps(data), content_type='application/json')
