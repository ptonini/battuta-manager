import json
import copy

from django.shortcuts import render
from django.views.generic import View
from django.http import HttpResponse, Http404
from django.conf import settings

from models import Item
from . import default_prefs


class PreferencesView(View):

    @staticmethod
    def get(request):
        if 'action' not in request.GET:
            return render(request, 'preferences/preferences.html')
        else:
            if request.GET['action'] == 'preferences':
                data = list()

                for item_group in list(default_prefs):

                    data.append(item_group.copy())

                # for i, item_group in enumerate(data):
                #     for j, item in enumerate(item_group['items']):
                #         try:
                #             data[i]['items'][j]['value'] = Item.objects.get(name=item['name']).value
                #         except Item.DoesNotExist:
                #             pass

            else:
                raise Http404('Invalid action')
            return HttpResponse(json.dumps(data), content_type="application/json")

    @staticmethod
    def post(request):
        if request.POST['action'] == 'save':
            print default_prefs
            for k, v in json.loads(request.POST['item_values']).iteritems():
                i, created = Item.objects.get_or_create(name=k)
                i.value = v
                i.save()

        data = {'result': 'ok'}

        return HttpResponse(json.dumps(data), content_type="application/json")
