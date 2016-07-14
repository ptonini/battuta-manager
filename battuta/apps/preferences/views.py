import json

from django.shortcuts import render
from django.views.generic import View
from django.http import HttpResponse, Http404
from django.conf import settings

from models import Item
from . import DefaultPreferences


class PreferencesView(View):

    @staticmethod
    def get(request):
        if 'action' not in request.GET:
            return render(request, 'preferences/preferences.html')
        else:
            if request.GET['action'] == 'preferences':
                data = dict()
                data['default'] = settings.DEFAULT_PREFERENCES
                data['stored'] = [[item.name, item.value] for item in Item.objects.all()]
            else:
                raise Http404('Invalid action')
            return HttpResponse(json.dumps(data), content_type="application/json")

    @staticmethod
    def post(request):
        if 'action' in request.POST:
            if request.POST['action'] == 'save':
                for key, value in json.loads(request.POST['item_values']).iteritems():
                    if value == DefaultPreferences().get_value(key):
                        Item.objects.filter(name=key).delete()
                    else:
                        item, created = Item.objects.get_or_create(name=key)
                        item.value = value
                        item.save()
                data = {'result': 'ok'}
            else:
                raise Http404('Invalid action')
        else:
            raise Http404('Invalid request')
        return HttpResponse(json.dumps(data), content_type="application/json")
