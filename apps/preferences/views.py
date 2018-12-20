from django.http import HttpResponse, HttpResponseForbidden
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist

from apps.preferences.models import Item
from apps.preferences.extras import get_default_value

from main.extras.views import ApiView


class PreferencesView(ApiView):

    def get(self, request):

        data = []

        include = []

        for i, group in enumerate(settings.DEFAULT_PREFERENCES):

            include.append({
                'id': i,
                'type': 'preference_group',
                'attributes': {
                    'name': group['name'],
                    'description': group['description'],

                }
            })

            for item in group['items']:

                try:

                    stored_item = Item.objects.get(name=item['name'])

                    stored_value = stored_item.value

                except ObjectDoesNotExist:

                    stored_value = None

                data.append({
                    'id': item['name'],
                    'type': 'preference_item',
                    'attributes': {
                        'default': item['value'],
                        'stored': stored_value,
                        'description': item['description'],
                        'data_type': item['data_type'],
                        'group': i,
                    }
                })

        return self._api_response({'data': data, 'include': include})

    @staticmethod
    def patch(request):

        if request.user.has_perm('users.edit_preferences'):

            for item in request.JSON.get('data', {}):

                if item['attributes']['value'] == get_default_value(item['id']):

                    Item.objects.filter(name=item['id']).delete()

                else:

                    Item.objects.update_or_create(name=item['id'], value=item['attributes']['value'])

            return HttpResponse(status=204)

        else:

            return HttpResponseForbidden()
