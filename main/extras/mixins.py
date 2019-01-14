import json

from django.http import HttpResponse


class ApiViewMixin:

    type = None

    model_class = None

    form_class = None

    def _save_instance(self, request, instance):

        form = self.form_class(request.JSON.get('data', {}).get('attributes'), instance=instance)

        if form.is_valid():

            instance = form.save(commit=True)

            response = {'data': instance.serialize(request.JSON.get('fields'), request.user)}

        else:

            errors = list()

            for k, v in form.errors.get_json_data().items():

                errors = errors + [{'code': e['code'], 'title': e['message'],'source': {'parameter': k}} for e in v]

            response = {'errors': errors}

        return response

    @staticmethod
    def _api_response(response):

        return HttpResponse(json.dumps(response), content_type='application/vnd.api+json')


class ModelSerializerMixin:

    id = None

    type = None

    def _serializer(self, fields, attributes, links, meta, relationships, data=False):

        def filter_fields(field_dict, field_dict_name):

            if fields and field_dict_name in fields:

                return {k: v for k, v in field_dict.items() if k in fields[field_dict_name]}

            else:

                return field_dict

        data = data if data else {'id': self.id, 'type': self.type, 'attributes': {}, 'links': {}, 'meta':{}}

        data['attributes'].update(filter_fields(attributes, 'attributes'))

        data['links'].update(filter_fields(links, 'links'))

        data['meta'].update(filter_fields(meta, 'meta'))

        return data