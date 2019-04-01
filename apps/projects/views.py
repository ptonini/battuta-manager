import json

from django.http import HttpResponse, HttpResponseForbidden, HttpResponseNotAllowed
from django.shortcuts import get_object_or_404
from django.views.generic import View

from main.extras.mixins import RESTfulViewMixin
from apps.projects.models import Project
from apps.projects.forms import ProjectForm


class ProjectView(View, RESTfulViewMixin):

    model = Project

    form = ProjectForm


class RelationsView(View, RESTfulViewMixin):

    def post(self, request, **kwargs):

        project = get_object_or_404(Project, pk=kwargs['obj_id'])

        if project.perms(request.user)['editable']:

            related = project.get_relationships(kwargs['relation'])

            if related['many']:

                for selected in request.JSON.get('data', []):

                    s = get_object_or_404(related['class'], pk=selected['id'])

                    if not getattr(s, 'is_superuser', False):

                        getattr(project, kwargs['relation']).add(s)

                return HttpResponse(status=204)

            else:

                r = get_object_or_404(related['class'], pk=request.JSON['data']['id'])

                if not getattr(r, 'is_superuser', False):

                    project.__setattr__(kwargs['relation'], r)

                    project.save()

                return self._api_response({'data': getattr(project, kwargs['relation']).serialize(None, request.user)})

        else:

            return HttpResponseForbidden()

    def get(self, request, **kwargs):

        project = get_object_or_404(Project, pk=kwargs['obj_id'])

        if project.perms(request.user)['readable']:

            fields = request.JSON.get('fields')

            related = project.get_relationships(kwargs['relation'])

            related_manager = getattr(project, kwargs['relation'])

            if request.JSON.get('related', True):

                if related['many']:

                    data = [r.serialize(fields, request.user) for r in related_manager.order_by(related['sort']).all() if not getattr(r, 'is_superuser', False)]

                else:

                    data = related_manager.serialize(fields, request.user) if related_manager else None

            else:

                data = list()

                if related['many']:

                    excluded_ids = [r.id for r in related_manager.all()]

                else:

                    excluded_ids = [related_manager.id] if related_manager else set()

                for r in related['class'].objects.order_by(related['sort']).exclude(pk__in=excluded_ids):

                    if not getattr(r, 'is_superuser', False):

                        data.append(r.serialize(request.JSON.get('fields'), request.user))

            return self._api_response({'data': data})

        else:

            return HttpResponseForbidden()

    def patch(self, request, **kwargs):

        return HttpResponseNotAllowed(['GET', 'POST', 'DELETE'])

    def delete(self, request, **kwargs):

        project = get_object_or_404(Project, pk=kwargs['obj_id'])

        if project.perms(request.user)['editable']:

            related = project.get_relationships(kwargs['relation'])

            if related['many']:

                for selected in request.JSON.get('data', []):

                    getattr(project, kwargs['relation']).remove(get_object_or_404(related['class'], pk=selected['id']))

            else:

                project.__setattr__(kwargs['relation'], None)

                project.save()

            return HttpResponse(status=204)

        else:

            return HttpResponseForbidden()


class FsObjRelationsView(View, RESTfulViewMixin):

    def post(self, request, **kwargs):

        project = get_object_or_404(Project, pk=kwargs['obj_id'])

        if project.perms(request.user)['editable']:

            result_set = set(json.loads(getattr(project, kwargs['relation'])))

            result_set.update([f['id'].replace(kwargs['relation'] + '/', '') for f in request.JSON.get('data', list())])

            project.__setattr__(kwargs['relation'], json.dumps(list(result_set)))

            project.save()

            return HttpResponse(status=204)

        else:

            return HttpResponseForbidden()

    def get(self, request, **kwargs):

        project = get_object_or_404(Project, pk=kwargs['obj_id'])

        if project.perms(request.user)['readable']:

            fields = request.JSON.get('fields')

            related_list = project.get_fs_obj_relations(kwargs['relation'], request.user, request.JSON.get('related', True))

            return self._api_response({'data': [f.serialize(fields) for f in related_list]})

        else:

            return HttpResponseForbidden()

    def patch(self, request, **kwargs):

        return HttpResponseNotAllowed(['GET', 'POST', 'DELETE'])

    def delete(self, request, **kwargs):

        project = get_object_or_404(Project, pk=kwargs['obj_id'])

        if project.perms(request.user)['editable']:

            delete_ids = [f['attributes']['path'] for f in request.JSON.get('data', list())]

            project.__setattr__(kwargs['relation'], json.dumps([i for i in json.loads(getattr(project, kwargs['relation'])) if i not in delete_ids]))

            project.save()

            return HttpResponse(status=204)

        else:

            return HttpResponseForbidden()
