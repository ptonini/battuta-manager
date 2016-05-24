import json

from django.shortcuts import get_object_or_404, render
from django.views.generic import View
from django.http import HttpResponse, Http404
from django.forms import model_to_dict

from models import Item, ItemGroup
from forms import ItemForm, ItemGroupForm
# Create your views here.


class PreferencesView(View):
    @staticmethod
    def get(request):
        if 'action' not in request.GET:
            return render(request, 'preferences/preferences.html')
        else:
            if request.GET['action'] == 'preferences':
                data = list()
                for item_group in ItemGroup.objects.all():
                    item_group_dict = model_to_dict(item_group)
                    item_group_dict['items'] = list()
                    for item in item_group.item_set.all().values():
                        item_group_dict['items'].append(item)
                    data.append(item_group_dict)
            else:
                raise Http404('Invalid action')
            return HttpResponse(json.dumps(data), content_type="application/json")

    @staticmethod
    def post(request):

        if request.POST['action'] == 'save_item_or_group':
            if request.POST['type'] == 'item':
                preference_object_class = Item
                form_class = ItemForm
            elif request.POST['type'] == 'item_group':
                preference_object_class = ItemGroup
                form_class = ItemGroupForm
            else:
                raise Http404('Invalid type')

            if request.POST['id'] == '':
                preference_object = preference_object_class()
            else:
                preference_object = get_object_or_404(preference_object_class(), pk=request.POST['id'])
            post_data = dict(request.POST.iteritems())
            form = form_class(post_data or None, instance=preference_object)
            if form.is_valid():
                form.save(commit=True)
                data = {'result': 'ok'}
            else:
                data = {'result': 'fail', 'msg': str(form.errors)}
        else:
            raise Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type="application/json")


