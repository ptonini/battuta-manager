from django.http import HttpResponse, HttpResponseForbidden
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.views.generic import View

from apps.preferences.models import Item
from apps.preferences.extras import get_default_value
from main.extras.mixins import RESTfulViewMixin


class PreferencesView(View, RESTfulViewMixin):

    def get(self, request, **kwargs):

        response = {'data': list(), 'include': list()}

        for i, group in enumerate(settings.DEFAULT_PREFERENCES):

            response['include'].append({
                'id': i,
                'type': 'preference_group',
                'attributes': {
                    'name': group['name'],
                    'description': group['description']
                }
            })

            for item in group['items']:

                try:

                    stored_item = Item.objects.get(name=item['name'])

                    stored_value = stored_item.value

                except ObjectDoesNotExist:

                    stored_value = None

                response['data'].append({
                    'id': item['name'],
                    'type': 'preference_item',
                    'attributes': {
                        'default': item['value'],
                        'stored': stored_value,
                        'description': item['description'],
                        'data_type': item['data_type'],
                        'group': i
                    }
                })

        return self._api_response(response)

    @staticmethod
    def patch(request, **kwargs):

        if request.user.has_perm('auth.edit_preferences'):

            for item in request.JSON.get('data', {}):

                if item['attributes']['value'] == get_default_value(item['id']):

                    Item.objects.filter(name=item['id']).delete()

                else:

                    Item.objects.update_or_create(name=item['id'], value=item['attributes']['value'])

            return HttpResponse(status=204)

        else:

            return HttpResponseForbidden()
