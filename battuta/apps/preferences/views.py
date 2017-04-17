import json

from django.views.generic import View
from django.http import HttpResponse, Http404
from django.core.exceptions import PermissionDenied
from django.conf import settings

from .functions import get_preferences, get_default_value

from models import Item


class PreferencesView(View):

    @staticmethod
    def get(request, action):

        if action == 'basic':

            data = get_preferences()
            data['user_name'] = request.user.username
            data['user_id'] = request.user.id
            data['user_timezone'] = request.user.userdata.timezone

        elif action == 'detailed':

            if request.user.is_superuser:

                data = dict()
                data['default'] = settings.DEFAULT_PREFERENCES
                data['stored'] = [[item.name, item.value] for item in Item.objects.all()]

            else:
                raise PermissionDenied

        else:
            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')

    @staticmethod
    def post(request, action):
        if action == 'save':

            for key, value in json.loads(request.POST['item_values']).iteritems():

                if value == get_default_value(key):
                    Item.objects.filter(name=key).delete()

                else:
                    item, created = Item.objects.get_or_create(name=key)
                    item.value = value
                    item.save()

            data = {'result': 'ok'}
        else:
            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')
