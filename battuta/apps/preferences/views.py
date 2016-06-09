import json

from django.shortcuts import get_object_or_404, render
from django.views.generic import View
from django.http import HttpResponse, Http404
from django.forms import model_to_dict

from models import Item, ItemGroup
from forms import ItemForm, ItemGroupForm


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

        if 'type' in request.POST:

            if request.POST['type'] == 'item':
                item_or_group_class = Item
                item_or_group_form_class = ItemForm
            elif request.POST['type'] == 'item_group':
                item_or_group_class = ItemGroup
                item_or_group_form_class = ItemGroupForm
            else:
                raise Http404('Invalid type')

            if request.POST['id'] == '':
                item_or_group = item_or_group_class()
            else:
                item_or_group = get_object_or_404(item_or_group_class, pk=request.POST['id'])

            if request.POST['action'] == 'save_item_or_group':
                form = item_or_group_form_class(request.POST or None, instance=item_or_group)
                if form.is_valid():
                    form.save(commit=True)
                    data = {'result': 'ok'}
                else:
                    data = {'result': 'fail', 'msg': str(form.errors)}
            elif request.POST['action'] == 'delete_item_or_group':
                item_or_group.delete()
                data = {'result': 'ok'}
            else:
                raise Http404('Invalid action')
        else:
            if request.POST['action'] == 'save_items':
                for key, value in json.loads(request.POST['item_values']).iteritems():
                    item = get_object_or_404(Item, pk=key)
                    item.value = value
                    item.save()

            data = None
        return HttpResponse(json.dumps(data), content_type="application/json")