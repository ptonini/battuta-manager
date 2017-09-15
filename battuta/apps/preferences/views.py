import json

from django.views.generic import View
from django.http import HttpResponse, Http404
from django.conf import settings
from django.core.cache import cache

from apps.preferences.models import Item
from apps.preferences.extras import get_preferences, get_default_value

from apps.users.extras import create_userdata
from apps.projects.extras import ProjectAuth


class PreferencesView(View):

    @staticmethod
    def get(request, action):

        project_auth = cache.get_or_set(str(request.user.username + '_auth'), ProjectAuth(request.user), settings.CACHE_TIMEOUT)

        if action == 'basic':

            data = get_preferences()

            create_userdata(request.user, data)

            data['user_name'] = request.user.username

            data['user_id'] = request.user.id

            data['user_timezone'] = request.user.userdata.timezone

        elif action == 'detailed':

            data = dict()

            data['default'] = settings.DEFAULT_PREFERENCES

            data['stored'] = [[item.name, item.value] for item in Item.objects.all()]

        else:

            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')

    @staticmethod
    def post(request, action):

        project_auth = cache.get_or_set(str(request.user.username + '_auth'), ProjectAuth(request.user), settings.CACHE_TIMEOUT)

        if request.user.has_perm('users.edit_preferences'):

            if action == 'save':

                for key, value in json.loads(request.POST['item_values']).iteritems():

                    if value == get_default_value(key):

                        Item.objects.filter(name=key).delete()

                    else:

                        item, created = Item.objects.get_or_create(name=key)

                        item.value = value

                        item.save()

                data = {'status': 'ok'}

            else:

                raise Http404('Invalid action')

        else:

            data = {'status': 'denied'}

        return HttpResponse(json.dumps(data), content_type='application/json')
