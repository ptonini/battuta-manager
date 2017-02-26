import json

from django.views.generic import View
from django.http import HttpResponse, Http404

from models import Item
from main import DefaultPrefs


class PreferencesView(View):

    @staticmethod
    def get(request):

        data = dict()
        data['default'] = DefaultPrefs().get_schema()
        data['stored'] = [[item.name, item.value] for item in Item.objects.all()]

        return HttpResponse(json.dumps(data), content_type="application/json")

    @staticmethod
    def post(request):

        for key, value in json.loads(request.POST['item_values']).iteritems():
            if value == DefaultPrefs().get_value(key):
                Item.objects.filter(name=key).delete()
            else:
                item, created = Item.objects.get_or_create(name=key)
                item.value = value
                item.save()
        data = {'result': 'ok'}

        return HttpResponse(json.dumps(data), content_type="application/json")
