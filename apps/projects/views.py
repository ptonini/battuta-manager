import json

from django.http import HttpResponse, HttpResponseForbidden
from django.shortcuts import get_object_or_404
from main.extras.views import ApiView

from apps.iam import builtin_groups
from apps.iam.models import LocalGroup

from apps.files.extras import PlaybookHandler, RoleHandler

from apps.projects.models import Project
from apps.projects.forms import ProjectForm


class ProjectView(ApiView):

    form_class = ProjectForm

    def post(self, request, project_id):

        project = Project()

        if project.authorizer(request.user)['editable']:

            return self._api_response(self._save_instance(request, project))

        else:

            return HttpResponseForbidden()

    def get(self, request, project_id):

        if project_id:

            project = get_object_or_404(Project, pk=project_id)

            response = {'data': project.serialize(request.JSON.get('fields'), request.user)}

        else:

            data = list()

            filter_pattern = request.JSON.get('filter')

            exclude_pattern = request.JSON.get('exclude')

            for project in Project.objects.order_by('name').all():

                match_conditions = {
                    not filter_pattern or project.name.find(filter_pattern) > -1,
                    not exclude_pattern or project.name.find(exclude_pattern) <= -1
                }

                if False not in match_conditions:

                    data.append(project.serialize(request.JSON.get('fields'), request.user))

            response = {'data': data}

        return self._api_response(response)

    def patch(self, request, project_id):

        project = get_object_or_404(Project, pk=project_id)

        if project.authorizer(request.user)['editable']:

            return self._api_response(self._save_instance(request, project))

        else:

            return HttpResponseForbidden()

    @staticmethod
    def delete(request, project_id):

        project = get_object_or_404(Project, pk=project_id)

        if project.authorizer(request.user)['deletable']:

            project.delete()

            return HttpResponse(status=204)

        else:

            return HttpResponseForbidden()


class RelationsView(ApiView):

    def post(self, request, relation, project_id):

        project = get_object_or_404(Project, pk=project_id)

        if project.authorizer(request.user)['editable']:

            related = project.get_relationships(relation)

            if related['many']:

                for selected in request.JSON.get('data', []):

                    getattr(project, relation).add(get_object_or_404(related['class'], pk=selected['id']))

                return HttpResponse(status=204)

            else:

                project.__setattr__(relation, get_object_or_404(related['class'], pk=request.JSON['data']['id']))

                project.save()

                return self._api_response({'data': getattr(project, relation).serialize(None, request.user)})

        else:

            return HttpResponseForbidden()

    def get(self, request, relation, project_id):

        project = get_object_or_404(Project, pk=project_id)

        if project.authorizer(request.user)['readable']:

            fields = request.JSON.get('fields')

            related = project.get_relationships(relation)

            related_manager = getattr(project, relation)

            if request.JSON.get('related', True):

                if related['many']:

                    data = [r.serialize(fields, request.user) for r in related_manager.all()]

                else:

                    data = related_manager.serialize(fields, request.user) if related_manager else None

            else:

                data = list()

                if related['many']:

                    excluded_ids = [related.id for related in related_manager.all()]

                else:

                    excluded_ids = [related_manager.id] if related_manager else []

                for r in related['class'].objects.exclude(pk__in=excluded_ids):

                    data.append(r.serialize(request.JSON.get('fields'), request.user))


            return self._api_response({'data': data})

        else:

            return HttpResponseForbidden()

    @staticmethod
    def delete(request, relation, project_id):

        project = get_object_or_404(Project, pk=project_id)

        if project.authorizer(request.user)['deletable']:

            related = project.get_relationships(relation)

            if related['many']:

                for selected in request.JSON.get('data', []):

                    getattr(project, relation).remove(get_object_or_404(related['class'], pk=selected['id']))

            else:

                project.__setattr__(relation, None)

            return HttpResponse(status=204)

        else:

            return HttpResponseForbidden()


class FsObjRelationsView(ApiView):

    handlers = {
        'playbooks': PlaybookHandler,
        'roles': RoleHandler
    }

    @staticmethod
    def post(request, relation, project_id):

        project = get_object_or_404(Project, pk=project_id)

        if project.authorizer(request.user)['editable']:

            result_set = set(json.loads(getattr(project, relation)) + [f['id'].replace(relation + '/', '') for f in request.JSON.get('data', list())])

            project.__setattr__(relation, json.dumps(list(result_set)))

            project.save()

            return HttpResponse(status=204)

        else:

            return HttpResponseForbidden()


    def get(self, request, relation, project_id):

        project = get_object_or_404(Project, pk=project_id)

        related_fs_obj_list = json.loads(getattr(project, relation))

        related_fs_obj_list.sort()

        if request.JSON.get('related', True):

            return self._api_response({'data': [self.handlers[relation](f, request.user).serialize(request.JSON.get('fields')) for f in related_fs_obj_list]})

        else:

            file_list = [f.serialize(request.JSON.get('fields')) for f in self.handlers[relation].list(request.user) if f.path not in related_fs_obj_list]

            return self._api_response({'data': sorted(file_list, key=lambda k: k['id']) })

    @staticmethod
    def delete(request, relation, project_id):

        project = get_object_or_404(Project, pk=project_id)

        if project.authorizer(request.user)['editable']:

            delete_ids = [f['attributes']['path'] for f in request.JSON.get('data', list())]

            project.__setattr__(relation, json.dumps([i for i in json.loads(getattr(project, relation)) if i not in delete_ids]))

            project.save()

            return HttpResponse(status=204)

        else:

            return HttpResponseForbidden()
