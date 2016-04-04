import json
import os
import csv

from django.conf import settings
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404, render
from django.views.generic import View

from .models import Host, Group, Variable
from .forms import HostForm, GroupForm, VariableForm


class InventoryView(View):
    @staticmethod
    def get(request):
        if request.GET['action'] == 'search':
            data = list()
            if request.GET['type'] == 'host':
                for host in Host.objects.order_by('name'):
                    if host.name.find(request.GET['pattern']) > -1:
                        data.append([host.name, host.id])
            elif request.GET['type'] == 'group':
                for group in Group.objects.order_by('name'):
                    if group.name.find(request.GET['pattern']) > -1:
                        data.append([group.name, group.id])
            else:
                return Http404('Invalid entity type')
        elif request.GET['action'] == 'list':
            groups = Group.objects.order_by('name')
            data = {'_meta': {'hostvars': {}}}
            for host in Host.objects.order_by('name'):
                data['_meta']['hostvars'][host.name] = {}
                for var in host.variable_set.all():
                    data['_meta']['hostvars'][host.name][var.key] = var.value
            for group in groups:
                data[group.name] = dict()
                data[group.name]['hosts'] = list()
                data[group.name]['vars'] = dict()
                data[group.name]['children'] = list()
                for host in group.members.all():
                    data[group.name]['hosts'].append(host.name)
                for var in group.variable_set.all():
                    data[group.name]['vars'][var.key] = var.value
                for child in group.children.all():
                    data[group.name]['children'].append(child.name)
        elif request.GET['action'] == 'import':
            source_file = request.GET['importFile']
            added = 0
            updated = 0
            with open(os.path.join(settings.DATA_DIR, source_file), 'r') as csv_file:
                reader = csv.reader(csv_file)
                header = next(reader)
                try:
                    host_index = header.index('host')
                except ValueError:
                    data = {'result': 'failed', 'msg': 'Error: could not find hosts column'}
                else:
                    for row in reader:
                        try:
                            host = Host.objects.get(name=row[host_index])
                            updated += 1
                        except Host.DoesNotExist:
                            host = Host(name=row[host_index])
                            host.save()
                            added += 1
                        for index, cel in enumerate(row):
                            if index != host_index and cel != '':
                                if header[index] == 'group':
                                    try:
                                        group = Group.objects.get(name=cel)
                                    except Group.DoesNotExist:
                                        group = Group(name=cel)
                                        group.save()
                                    finally:
                                        host.group_set.add(group)
                                        host.save()
                                else:
                                    try:
                                        var = Variable.objects.get(key=header[index], host=host)
                                    except Variable.DoesNotExist:
                                        var = Variable(key=header[index], host=host)
                                    finally:
                                        var.value = cel
                                        var.save()
                    data = {'result': 'ok', 'msg': str(added) + ' hosts added<br>' + str(updated) + ' hosts updated'}


        else:
            return Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type="application/json")


class EntitiesView(View):
    context = dict()

    @staticmethod
    def build_entity(entity_type, entity_id):
        # Build entity
        if entity_type == 'host':
            if entity_id == '0':
                entity = Host()
            else:
                entity = get_object_or_404(Host, pk=entity_id)
            entity.form_class = HostForm
        elif entity_type == 'group':
            if entity_id == '0':
                entity = Group()
            else:
                entity = get_object_or_404(Group, pk=entity_id)
            entity.form_class = GroupForm
        else:
            raise Http404('Invalid entity type')
        # Build entity ancestors list
        if entity_id != '0':
            entity.ancestors = list()
            parents = entity.group_set.all()
            while len(parents) > 0:
                step_list = list()
                for parent in parents:
                    if parent.id not in entity.ancestors:
                        entity.ancestors.append(parent.id)
                        for group in parent.group_set.all():
                            step_list.append(group)
                parents = step_list
        return entity

    def get(self, request, entity_id, entity_type):
        entity = self.build_entity(entity_type, entity_id)
        if 'action' not in request.GET:
            self.context['entity'] = entity
            self.context['user'] = request.user
            return render(request, 'inventory/entity.html', self.context)
        else:
            if request.GET['action'] == 'facts':
                facts_file = os.path.join(settings.FACTS_DIR, entity.name)
                if os.path.isfile(facts_file):
                    with open(facts_file, "r") as f:
                        data = f.read()
                else:
                    data = ['Facts file not found']
            elif request.GET['action'] == 'copy_vars':
                source = self.build_entity(request.GET['type'], request.GET['source_id'])
                for var in source.variable_set.all():
                    entity.variable_set.create(key=var.key, value=var.value)
                    entity.save()
                data = {'result': 'ok'}
            else:
                raise Http404('Invalid action')
            return HttpResponse(json.dumps(data), content_type="application/json")

    def post(self, request, entity_id, entity_type):
        entity = self.build_entity(entity_type, entity_id)
        if request.POST['action'] == 'save':
            form = entity.form_class(request.POST or None, instance=entity)
            if form.is_valid():
                entity = form.save(commit=True)
                data = entity.__dict__
                data.pop('_state', None)
                data.pop('form_class', None)
                data['result'] = 'ok'
                data['type'] = entity.type
            else:
                data = {'result': 'fail', 'msg': str(form.errors)}
        elif request.POST['action'] == 'delete':
            entity.delete()
            data = {'result': 'ok'}
        else:
            raise Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type="application/json")


class VariablesView(View):
    @staticmethod
    def get(request, entity_type, entity_id, action):
        entity = EntitiesView.build_entity(entity_type, entity_id)
        data = list()
        if action == 'list':
            for var in entity.variable_set.all():
                data.append([var.key, var.value, var.id])
        elif action == 'list_inh':
            for ancestor_id in entity.ancestors:
                ancestor = Group.objects.get(pk=ancestor_id)
                for var in ancestor.variable_set.all():
                    data.append([var.key, var.value, var.group.name, var.group.id])
            group_all = Group.objects.get(name='all')
            for var in group_all.variable_set.all():
                data.append([var.key, var.value, 'all', var.group.id])
        else:
            raise Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type="application/json")

    @staticmethod
    def post(request, entity_type, entity_id, action):
        if request.POST['id'] == '':
            variable = Variable()
        else:
            variable = get_object_or_404(Variable, pk=request.POST['id'])
        if action == 'save':
            post_data = dict(request.POST.iteritems())
            post_data[entity_type] = entity_id
            form = VariableForm(post_data or None, instance=variable)
            if form.is_valid():
                form.save(commit=True)
                data = {'result': 'ok'}
            else:
                data = {'result': 'fail', 'msg': str(form.errors)}
        elif action == 'del':
            variable = get_object_or_404(Variable, pk=request.POST['id'])
            variable.delete()
            data = {'result': 'OK'}
        else:
            raise Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type="application/json")


class RelationsView(View):
    @staticmethod
    def set_relations(entity, relation):
        if relation == 'Parents':
            related_set = entity.group_set
            related_class = Group
        elif relation == 'Children':
            related_set = entity.children
            related_class = Group
        elif relation == 'Members':
            related_set = entity.members
            related_class = Host
        else:
            raise Http404('Invalid relation: ' + relation)
        return related_set, related_class

    def get(self, request, entity_type, entity_id, relation):
        entity = EntitiesView.build_entity(entity_type, entity_id)
        related_set, related_class = self.set_relations(entity, relation)
        data = list()
        if request.GET['list'] == 'related':
            for related in related_set.order_by('name'):
                data.append([related.name, related.id])
        elif request.GET['list'] == 'non_related':
            for related in related_class.objects.order_by('name'):
                if related not in related_set.all() and related != entity and related.name != 'all':
                    data.append([related.name, related.id])
        return HttpResponse(json.dumps(data), content_type="application/json")

    def post(self, request, entity_type, entity_id, relation):
        if entity_type == 'host':
            entity = get_object_or_404(Host, pk=entity_id)
        elif entity_type == 'group':
            entity = get_object_or_404(Group, pk=entity_id)
        else:
            raise Http404('Invalid entity')
        related_set, related_class = self.set_relations(entity, relation)
        if request.POST['action'] == 'add':
            for selected in request.POST.getlist('selection[]'):
                related_set.add(get_object_or_404(related_class, pk=selected))
        elif request.POST['action'] == 'remove':
            for selected in request.POST.getlist('selection[]'):
                related_set.remove(get_object_or_404(related_class, pk=selected))
        else:
            raise Http404('Invalid action')
        return HttpResponse(json.dumps({'result': 'ok'}), content_type="application/json")
