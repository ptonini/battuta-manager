import json

from django.http import HttpResponse, HttpResponseForbidden, HttpResponseBadRequest
from django.shortcuts import get_object_or_404


class RESTfulViewMixin:

    @staticmethod
    def build_error_dict(form_errors):

        errors = list()

        for k, v in form_errors.get_json_data().items():

            errors = errors + [{'code': e['code'], 'title': e['message'], 'source': {'parameter': k}} for e in v]

        return {'errors': errors}

    @staticmethod
    def _api_response(response):

        return HttpResponse(json.dumps(response), content_type='application/vnd.api+json')

    def _save_instance(self, request, instance):

        form = getattr(self, 'form_class')(request.JSON.get('data', {}).get('attributes'), instance=instance)

        if form.is_valid():

            instance = form.save(commit=True)

            response = {'data': instance.serialize(request.JSON.get('fields'), request.user)}

        else:

            response = self.build_error_dict(form.errors)

        return response

    def post(self, request, **kwargs):

        obj = getattr(self, 'model_class')()

        if obj.perms(request.user)['editable']:

            return self._api_response(self._save_instance(request, obj))

        else:

            return HttpResponseForbidden()

    def get(self, request, **kwargs):

        if 'obj_id' in kwargs:

            obj = get_object_or_404(getattr(self, 'model_class'), pk=kwargs.get('obj_id'))

            if obj.perms(request.user)['readable']:

                return self._api_response({'data': obj.serialize(request.JSON.get('fields'), request.user)})

            else:

                return HttpResponseForbidden()

        else:

            data = list()

            filter_pattern = request.JSON.get('filter')

            for obj in getattr(self, 'model_class').objects.all():

                match_conditions = all({
                    not filter_pattern or obj.name.find(filter_pattern) > -1,
                    obj.perms(request.user)['readable']
                })

                if match_conditions:

                    data.append(obj.serialize(request.JSON.get('fields'), request.user))

            return self._api_response({'data': data})

    def patch(self, request, **kwargs):

        obj = get_object_or_404(getattr(self, 'model_class'), pk=kwargs.get('obj_id'))

        if obj.perms(request.user)['editable']:

            return self._api_response(self._save_instance(request, obj))

        else:

            return HttpResponseForbidden()

    def delete(self, request, **kwargs):

        if 'obj_id' in kwargs:

            obj = get_object_or_404(getattr(self, 'model_class'), pk=kwargs.get('obj_id'))

            if obj.perms(request.user)['deletable']:

                obj.delete()

                return HttpResponse(status=204)

            else:

                return HttpResponseForbidden()

        elif 'data' in request.JSON:

            id_list = list()

            for obj_dict in request.JSON.get('data'):

                obj = getattr(self, 'model_class').objects.get(pk=obj_dict['id'])

                if obj.perms(request.user)['deletable']:

                    id_list.append(obj_dict['id'])

            getattr(self, 'model_class').objects.filter(pk__in=id_list).delete()

            return HttpResponse(status=204)

        else:

            return HttpResponseBadRequest()



class RESTfulModelMixin:

    @property
    def link(self):

        return '/'.join([getattr(self, 'route'), str(getattr(self, 'id'))])

    def _build_filtered_dict(self, fields, **kwargs):

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
