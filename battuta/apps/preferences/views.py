import json

from django.shortcuts import get_object_or_404, render
from django.views.generic import View
from django.core.exceptions import PermissionDenied
from django.http import HttpResponse, Http404
from django.conf import settings
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
                data = dict()
                for item_group in ItemGroup.objects.all():
                    print item_group.name
                    data[item_group.name] = {'description': item_group.description, 'items': list()}
                    for item in item_group.item_set.all().values():
                        data[item_group.name]['items'].append(item)
            else:
                raise Http404('Invalid action')
            return HttpResponse(json.dumps(data), content_type="application/json")

    @staticmethod
    def post(request):

        if request.POST['action'] == 'save_item':
            if request.POST['id'] == '':
                item = Item()
            else:
                item = get_object_or_404(Item(), pk=request.POST['id'])
            post_data = dict(request.POST.iteritems())
            form = ItemForm(post_data or None, instance=item)
            if form.is_valid():
                form.save(commit=True)
                data = {'result': 'ok'}
            else:
                data = {'result': 'fail', 'msg': str(form.errors)}

        elif request.POST['action'] == 'save_group':
            if request.POST['id'] == '':
                item_group = ItemGroup()
            else:
                item_group = get_object_or_404(ItemGroup(), pk=request.POST['id'])
            post_data = dict(request.POST.iteritems())
            form = ItemGroupForm(post_data or None, instance=item_group)
            if form.is_valid():
                form.save(commit=True)
                data = {'result': 'ok'}
            else:
                data = {'result': 'fail', 'msg': str(form.errors)}
        else:
            raise Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type="application/json")


