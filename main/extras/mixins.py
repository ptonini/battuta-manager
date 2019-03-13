import json

from django.http import HttpResponse


class ApiViewMixin:

    def _save_instance(self, request, instance):

        form = getattr(self, 'form_class')(request.JSON.get('data', {}).get('attributes'), instance=instance)

        if form.is_valid():

            instance = form.save(commit=True)

            response = {'data': instance.serialize(request.JSON.get('fields'), request.user)}

        else:

            response = self.build_error_dict(form.errors)

        return response

    @staticmethod
    def build_error_dict(form_errors):

        errors = list()

        for k, v in form_errors.get_json_data().items():

            errors = errors + [{'code': e['code'], 'title': e['message'],'source': {'parameter': k}} for e in v]

        return {'errors': errors}


    @staticmethod
    def _api_response(response):

        return HttpResponse(json.dumps(response), content_type='application/vnd.api+json')


class ModelSerializerMixin:

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