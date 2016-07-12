import json

from django.shortcuts import get_object_or_404, render
from django.views.generic import View
from django.http import HttpResponse, Http404
from django.conf import settings

from models import Item, ItemGroup
from forms import ItemForm, ItemGroupForm


class PreferencesView(View):

    def get(self, request):
        if 'action' not in request.GET:
            return render(request, 'preferences/preferences.html')
        else:
            if request.GET['action'] == 'preferences':

                # Load default preferences
                data = settings.DEFAULT_PREFERENCES

                # Generate default preferences group name list
                default_group_list = list()
                for group in data:
                    default_group_list.append(group['name'])

                # Iterate over saved preferences groups
                for db_item_group in ItemGroup.objects.all():

                    # Test if default preferences group has saved counterpart on database
                    try:
                        i = default_group_list.index(db_item_group.name)

                        # Generate default preferences item list for matched preferences group
                        default_item_list = list()
                        for item in data[i]['items']:
                            default_item_list.append(item['name'])

                        # Iterate over saved items in group:
                        for db_item in db_item_group.item_set.values():

                            # Remove non serializable keys
                            db_item.pop('id', None)
                            db_item.pop('item_group_id', None)

                            # Replace default item with database item if name matches
                            try:
                                j = default_item_list.index(db_item['name'])
                                data[i]['items'][j] = db_item

                            except ValueError:
                                data[i]['items'].append(db_item)

                    except ValueError:
                        data.append({'name': db_item_group.name,
                                     'description': db_item_group.description,
                                     'items': db_item_group.item_set.values()})

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
