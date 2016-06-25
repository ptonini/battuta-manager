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
    def to_dict():
        groups = Group.objects.order_by('name')
        inventory = {'_meta': {'hostvars': dict()}}

        for host in Host.objects.order_by('name'):

            if len(host.variable_set.all()) > 0:
                inventory['_meta']['hostvars'][host.name] = dict()
                for var in host.variable_set.all():
                    inventory['_meta']['hostvars'][host.name][var.key] = var.value

        for group in groups:
            inventory[group.name] = dict()

            if len(group.members.all()) > 0:
                inventory[group.name]['hosts'] = list()
                for host in group.members.all():
                    inventory[group.name]['hosts'].append(host.name)

            if len(group.children.all()) > 0:
                inventory[group.name]['children'] = list()
                for child in group.children.all():
                    inventory[group.name]['children'].append(child.name)

            inventory[group.name]['vars'] = dict()
            for var in group.variable_set.all():
                inventory[group.name]['vars'][var.key] = var.value

        return inventory

    def get(self, request):
        if 'action' not in request.GET:
            data = self.to_dict()
        else:
            data = list()
            if request.GET['action'] == 'search':
                if request.GET['type'] == 'host':
                    node_class = Host
                elif request.GET['type'] == 'group':
                    node_class = Group
                else:
                    return Http404('Invalid node type')
                for node in node_class.objects.order_by('name'):
                    if node.name.find(request.GET['pattern']) > -1:
                        data.append([node.name, node.id])
            elif request.GET['action'] == 'host_table':
                for host in Host.objects.all():
                    facts = NodeDetailsView.get_facts(host.name)
                    if facts:
                        data.append([host.name,
                                     host.description,
                                     facts['ansible_default_ipv4']['address'],
                                     facts['ansible_processor_count'],
                                     facts['ansible_memtotal_mb'],
                                     facts['ansible_mounts'][0]['size_total'],
                                     facts['ansible_date_time']['date'],
                                     host.id])
                    else:
                        data.append([host.name, '', '', '', '', '', '', host.id])
            elif request.GET['action'] == 'group_table':
                for group in Group.objects.all():
                    data.append([group.name,
                                 group.description,
                                 len(group.members.all()),
                                 len(group.group_set.all()),
                                 len(group.children.all()),
                                 len(group.variable_set.all()),
                                 group.id])
            else:
                return Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type="application/json")

    @staticmethod
    def post(request):
        if request.POST['action'] == 'import':
            if request.POST['type'] == 'csv':
                csv_data = csv.reader(request.POST.getlist('import_data[]'))
                header = next(csv_data)
                try:
                    host_index = header.index('host')
                except ValueError:
                    data = {'result': 'failed', 'msg': 'Error: could not find hosts column'}
                else:
                    added = 0
                    updated = 0
                    for row in csv_data:
                        host, created = Host.objects.get_or_create(name=row[host_index])
                        if created:
                            added += 1
                        else:
                            updated += 1
                        for index, cell in enumerate(row):
                            if index != host_index and cell:
                                if header[index] == 'group':
                                    group, created = Group.objects.get_or_create(name=cell)
                                    host.group_set.add(group)
                                    host.save()
                                else:
                                    var, created = Variable.objects.get_or_create(key=header[index], host=host)
                                    var.value = cell
                                    var.save()
                    data = {'result': 'ok', 'msg': str(added) + ' hosts added<br>' + str(updated) + ' hosts updated'}
            else:
                data = {'result': 'failed', 'msg': 'Error: Invalid file type (.' + request.POST['type'] + ')'}
        elif request.POST['action'] == 'bulk_remove':
            if request.POST['type'] == 'host':
                node_class = Host
            elif request.POST['type'] == 'group':
                node_class = Group
            else:
                raise Http404('Invalid node type')
            for node_id in request.POST.getlist('selection[]'):
                node = get_object_or_404(node_class, pk=node_id)
                node.delete()
            data = {'result': 'ok'}
        else:
            return Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type="application/json")


class ListNodesView(View):
    @staticmethod
    def get(request, node_type_plural):
        context = {'node_type': node_type_plural[:-1], 'node_type_plural': node_type_plural}
        return render(request, 'inventory/list_nodes.html', context)


class NodeDetailsView(View):
    context = dict()

    @staticmethod
    def build_node(node_type, node_id):

        # Get classes based on node type
        if node_type == 'host':
            node_class = Host
            node_form_class = HostForm
        elif node_type == 'group':
            node_class = Group
            node_form_class = GroupForm
        else:
            raise Http404('Invalid node type')

        # Build node object
        if node_id == '0':
            node = node_class()
        else:
            node = get_object_or_404(node_class, pk=node_id)

        setattr(node, 'form_class', node_form_class)
        return node

    @staticmethod
    def get_node_ancestors(node):
        ancestors = set()
        parents = node.group_set.all()
        while len(parents) > 0:
            step_list = set()
            for parent in parents:
                ancestors.add(parent)
                for group in parent.group_set.all():
                    step_list.add(group)
            parents = step_list
        return ancestors

    @staticmethod
    def get_node_descendants(node):
        groups = set()
        hosts = set()
        if node.type == 'group':
            children = node.children.all()
            while len(children) > 0:
                step_list = set()
                for child in children:
                    groups.add(child)
                    for node in child.children.all():
                        step_list.add(node)
                children = step_list

            for host in node.members.all():
                hosts.add(host)

            for group in groups:
                for host in group.members.all():
                    hosts.add(host)
        return groups, hosts

    @staticmethod
    def get_facts(host_name):
        facts_file = os.path.join(settings.FACTS_DIR, host_name)
        if os.path.isfile(facts_file):
            with open(facts_file, "r") as f:
                return json.loads(f.read())['ansible_facts']
        else:
            return None

    def get(self, request, node_id, node_type):
        node = self.build_node(node_type, node_id)
        if 'action' not in request.GET:
            self.context['node'] = node
            return render(request, 'inventory/node_details.html', self.context)
        else:
            if request.GET['action'] == 'facts':
                facts = self.get_facts(node.name)
                if facts:
                    data = {'result': 'ok', 'facts': facts}
                else:
                    data = {'result': 'failed'}
            elif request.GET['action'] == 'descendants':
                data = {'result': 'ok', 'hosts': list(), 'groups': list()}
                groups, hosts = self.get_node_descendants(node)
                for group in groups:
                    data['groups'].append([group.name, group.id])
                for host in hosts:
                    data['hosts'].append([host.name, host.id])

            elif request.GET['action'] == 'copy_vars':
                source = self.build_node(request.GET['type'], request.GET['source_id'])
                for var in source.variable_set.all():
                    node.variable_set.create(key=var.key, value=var.value)
                    node.save()
                data = {'result': 'ok'}
            else:
                raise Http404('Invalid action')
            return HttpResponse(json.dumps(data), content_type="application/json")

    def post(self, request, node_id, node_type):
        node = self.build_node(node_type, node_id)
        if request.POST['action'] == 'save':
            form = node.form_class(request.POST or None, instance=node)
            if form.is_valid():
                node = form.save(commit=True)
                data = node.__dict__
                data.pop('_state', None)
                data.pop('form_class', None)
                data['result'] = 'ok'
                data['type'] = node.type
            else:
                data = {'result': 'fail', 'msg': str(form.errors)}
        elif request.POST['action'] == 'delete':
            node.delete()
            data = {'result': 'ok'}
        else:
            raise Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type="application/json")


class VariablesView(View):

    @staticmethod
    def get(request, node_type, node_id, action):
        node = NodeDetailsView.build_node(node_type, node_id)
        data = list()
        if action == 'list':
            for var in node.variable_set.all():
                data.append([var.key, var.value, var.id])
        elif action == 'list_inh':
            for ancestor in NodeDetailsView.get_node_ancestors(node):
                for var in ancestor.variable_set.all():
                    data.append([var.key, var.value, var.group.name, var.group.id])
            group_all = Group.objects.get(name='all')
            for var in group_all.variable_set.all():
                data.append([var.key, var.value, 'all', var.group.id])
        else:
            raise Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type="application/json")

    @staticmethod
    def post(request, node_type, node_id, action):
        if 'id' in request.POST:
            variable = get_object_or_404(Variable, pk=request.POST['id'])
        else:
            variable = Variable()
        if action == 'save':
            post_data = dict(request.POST.iteritems())
            post_data[node_type] = node_id
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
    def set_relations(node, relation):
        if relation == 'Parents':
            related_set = node.group_set
            related_class = Group
        elif relation == 'Children':
            related_set = node.children
            related_class = Group
        elif relation == 'Members':
            related_set = node.members
            related_class = Host
        else:
            raise Http404('Invalid relation: ' + relation)
        return related_set, related_class

    def get(self, request, node_type, node_id, relation):
        node = NodeDetailsView.build_node(node_type, node_id)
        related_set, related_class = self.set_relations(node, relation)
        data = list()
        if request.GET['list'] == 'related':
            for related in related_set.order_by('name'):
                data.append([related.name, related.id])
        elif request.GET['list'] == 'non_related':
            for related in related_class.objects.order_by('name'):
                if related not in related_set.all() and related != node and related.name != 'all':
                    data.append([related.name, related.id])
        return HttpResponse(json.dumps(data), content_type="application/json")

    def post(self, request, node_type, node_id, relation):
        if node_type == 'host':
            node = get_object_or_404(Host, pk=node_id)
        elif node_type == 'group':
            node = get_object_or_404(Group, pk=node_id)
        else:
            raise Http404('Invalid node')
        related_set, related_class = self.set_relations(node, relation)
        if request.POST['action'] == 'add':
            for selected in request.POST.getlist('selection[]'):
                related_set.add(get_object_or_404(related_class, pk=selected))
        elif request.POST['action'] == 'remove':
            for selected in request.POST.getlist('selection[]'):
                related_set.remove(get_object_or_404(related_class, pk=selected))
        else:
            raise Http404('Invalid action')
        return HttpResponse(json.dumps({'result': 'ok'}), content_type="application/json")
