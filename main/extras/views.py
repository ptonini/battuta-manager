import json

from django.views.generic import View
from django.http import HttpResponse


class ApiView(View):

    type = None

    model_class = None

    form_class = None

    def _save_instance(self, request, instance):

        form = self.form_class(request.JSON.get('data', {}).get('attributes'), instance=instance)

        if form.is_valid():

            instance = form.save(commit=True)

            response = {'data': instance.serialize(request)}

        else:

            errors = list()

            for k, v in form.errors.get_json_data().items():

                errors = errors + [{'code': e['code'], 'title': e['message'],'source': {'parameter': k}} for e in v]

            response = {'errors': errors}

        return response

    @staticmethod
    def _api_response(response):

        return HttpResponse(json.dumps(response), content_type='application/vnd.api+json')
