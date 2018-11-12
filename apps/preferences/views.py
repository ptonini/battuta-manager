import json

from django.views.generic import View
from django.http import HttpResponse, HttpResponseNotFound
from django.conf import settings

from apps.preferences.models import Item
from apps.preferences.extras import get_default_value

from apps.iam.extras import create_userdata

from main.extras.views import ApiView

class PreferencesView(ApiView):

    def get(self, request):

        create_userdata(request.user)

        pref_dict = dict()

        pref_dict['default'] = settings.DEFAULT_PREFERENCES

        pref_dict['stored'] = {item.name: item.value for item in Item.objects.all()}

        pref_dict['user'] = {
            'name': request.user.username,
            'id': request.user.id,
            'tz': request.user.userdata.timezone
        }

        return self._api_response({'data': pref_dict})

    def post(self, request, action):

        if request.user.has_perm('users.edit_preferences'):

            if action == 'save':

                prefs_dict = json.loads(request.POST['prefs'])

                for key in prefs_dict:

                    if prefs_dict[key] == get_default_value(key):

                        Item.objects.filter(name=key).delete()

                    else:

                        item, created = Item.objects.get_or_create(name=key)

                        item.value = prefs_dict[key]

                        item.save()

                data = {'status': 'ok', 'msg': 'Preferences saved - reloading page'}

            else:

                return HttpResponseNotFound('Invalid action')

        else:

            data = {'status': 'denied'}

        return self._api_response({'data': data})
