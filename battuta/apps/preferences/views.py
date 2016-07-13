import json

from django.shortcuts import render
from django.views.generic import View
from django.http import HttpResponse, Http404
from django.conf import settings

from models import Item


class PreferencesView(View):

    @staticmethod
    def get(request):
        if 'action' not in request.GET:
            return render(request, 'preferences/preferences.html')
        else:
            if request.GET['action'] == 'preferences':
                data = list(settings.DEFAULT_PREFERENCES)
                for i, item_group in enumerate(data):
                    for j, item in enumerate(item_group['items']):
                        try:
                            data[i]['items'][j]['value'] = Item.objects.get(name=item['name']).value
                        except Item.DoesNotExist:
                            pass
            else:
                raise Http404('Invalid action')
            return HttpResponse(json.dumps(data), content_type="application/json")

    @staticmethod
    def post(request):
        if 'action' in request.POST:
            if request.POST['action'] == 'save':
                for key, value in json.loads(request.POST['item_values']).iteritems():
                    item, created = Item.objects.get_or_create(name=key)
                    item.value = value
                    item.save()
                data = {'result': 'ok'}
            else:
                raise Http404('Invalid action')
        else:
            raise Http404('Invalid request')
        return HttpResponse(json.dumps(data), content_type="application/json")
