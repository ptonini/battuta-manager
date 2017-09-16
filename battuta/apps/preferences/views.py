import json

from django.views.generic import View
from django.http import HttpResponse, Http404
from django.conf import settings

from apps.preferences.models import Item
from apps.preferences.extras import get_preferences, get_default_value

from apps.users.extras import create_userdata


class PreferencesView(View):

    @staticmethod
    def get(request, action):

        if action == 'basic':

            pref_dict = get_preferences()

            create_userdata(request.user, pref_dict)

            pref_dict['user_name'] = request.user.username

            pref_dict['user_id'] = request.user.id

            pref_dict['user_timezone'] = request.user.userdata.timezone

            print pref_dict

        elif action == 'detailed':

            pref_dict = dict()

            pref_dict['default'] = settings.DEFAULT_PREFERENCES

            pref_dict['stored'] = [[item.name, item.value] for item in Item.objects.all()]

        else:

            raise Http404('Invalid action')

        data = {'status': 'ok', 'prefs': pref_dict}

        return HttpResponse(json.dumps(data), content_type='application/json')

    @staticmethod
    def post(request, action):

        if request.user.has_perm('users.edit_preferences'):

            if action == 'save':

                for key in request.POST:

                    if request.POST[key] == get_default_value(key):

                        Item.objects.filter(name=key).delete()

                    else:

                        item, created = Item.objects.get_or_create(name=key)

                        item.value = request.POST[key]

                        item.save()

                data = {'status': 'ok'}

            else:

                raise Http404('Invalid action')

        else:

            data = {'status': 'denied'}

        return HttpResponse(json.dumps(data), content_type='application/json')
