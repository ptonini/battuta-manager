import json

from django.http import HttpResponse, HttpResponseForbidden, HttpResponseBadRequest, HttpResponseNotAllowed
from django.shortcuts import get_object_or_404


class RESTfulMethods:

    @staticmethod
    def build_error_dict(form_errors):

        errors = list()

        for k, v in form_errors.get_json_data().items():

            errors = errors + [{'code': e['code'], 'title': e['message'], 'source': {'parameter': k}} for e in v]

        return {'errors': errors}

    @staticmethod
    def _api_response(response):

        return HttpResponse(json.dumps(response), content_type='application/vnd.api+json')


class RESTfulViewMixin(RESTfulMethods):

    methods = ['POST', 'GET', 'PATCH', 'DELETE']

    def _new_instance(self):

        return getattr(self, 'model')()

    def _get_instance(self, obj_id):

        return get_object_or_404(getattr(self, 'model'), pk=obj_id)

    def _save_instance(self, request, instance):

        form = getattr(self, 'form')(request.JSON.get('data', {}).get('attributes'), instance=instance)

        if form.is_valid():

            instance = form.save(commit=True)

            response = {'data': instance.serialize(request.JSON.get('fields'), request.user)}

        else:

            response = self.build_error_dict(form.errors)

        return response

    def _get_queryset(self, request, kwargs):

        return getattr(self, 'model').objects.all()

    def post(self, request, **kwargs):

        if 'POST' in self.methods:

            obj = self._new_instance()

            if obj.perms(request.user)['editable']:

                return self._api_response(self._save_instance(request, obj))

            else:

                return HttpResponseForbidden()

        else:

            return HttpResponseNotAllowed(self.methods)

    def get(self, request, **kwargs):

        if 'GET' in self.methods:

            if 'obj_id' in kwargs:

                obj = self._get_instance(kwargs['obj_id'])

                if obj.perms(request.user)['readable']:

                    response = {'data': obj.serialize(request.JSON.get('fields'), request.user)}

                    if hasattr(self, 'included'):

                        response['included'] = self.included(request, obj)

                    return self._api_response(response)

                else:

                    return HttpResponseForbidden()

            else:

                if 'draw' in request.GET and hasattr(self, 'datatable_handler'):

                    handler = getattr(self, 'datatable_handler')(request, self._get_queryset(request, kwargs))

                    return self._api_response(handler.build_response())

                else:

                    data = list()

                    filter_pattern = request.JSON.get('filter')

                    for obj in self._get_queryset(request, kwargs):

                        if all({not filter_pattern or obj.name.find(filter_pattern) > -1, obj.perms(request.user)['readable']}):

                            data.append(obj.serialize(request.JSON.get('fields'), request.user))

                    return self._api_response({'data': data})

        else:

            return HttpResponseNotAllowed(self.methods)

    def patch(self, request, **kwargs):

        if 'PATCH' in self.methods:

            obj = self._get_instance(kwargs['obj_id'])

            if obj.perms(request.user)['editable']:

                return self._api_response(self._save_instance(request, obj))

            else:

                return HttpResponseForbidden()

        else:

            return HttpResponseNotAllowed(self.methods)

    def delete(self, request, **kwargs):

        if 'DELETE' in self.methods:

            if 'obj_id' in kwargs:

                obj = self._get_instance(kwargs['obj_id'])

                if obj.perms(request.user)['deletable']:

                    obj.delete()

                    return HttpResponse(status=204)

                else:

                    return HttpResponseForbidden()

            elif 'data' in request.JSON:

                id_list = list()

                for obj_dict in request.JSON.get('data'):

                    obj = self._get_instance(obj_dict['id'])

                    if obj.perms(request.user)['deletable']:

                        id_list.append(obj_dict['id'])

                getattr(self, 'model').objects.filter(pk__in=id_list).delete()

                return HttpResponse(status=204)

            else:

                return HttpResponseBadRequest()

        else:

            return HttpResponseNotAllowed(self.methods)


class RESTfulModelMixin:

    @property
    def link(self):

        return '/'.join([getattr(self, 'route'), str(getattr(self, 'id'))])

    def _serialize_data(self, fields, **kwargs):

        data = kwargs['data'] if 'data' in kwargs else {'id': getattr(self, 'id'), 'type': getattr(self, 'type')}

        for field_dict_name, field_dict in kwargs.items():

            filtered_fields = {}

            if field_dict_name != 'data':

                if fields and field_dict_name in fields:

                    if fields[field_dict_name] is not False:

                        filtered_fields = {k: v for k, v in field_dict.items() if k in fields[field_dict_name]}

                else:

                    filtered_fields = field_dict

                if len(filtered_fields) > 0:

                    if field_dict_name not in data:

                        data[field_dict_name] = dict()

                    data[field_dict_name].update(filtered_fields)

        return data
