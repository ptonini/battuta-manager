import json
import os
import csv
import tempfile

from django.conf import settings
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404, render
from django.views.generic import View

from .models import Host, Group, Variable
from .forms import HostForm, GroupForm, VariableForm


class InventoryView(View):

    @staticmethod
    def get(request):
        if 'action' not in request.GET:
            data = {'_meta': {'hostvars': dict()}}

            for host in Host.objects.order_by('name'):

                if host.variable_set.all().exists() or host.description:

                    data['_meta']['hostvars'][host.name] = {var.key: var.value for var in host.variable_set.all()}
                    if host.description:
                        data['_meta']['hostvars'][host.name]['_description'] = host.description

            for group in Group.objects.order_by('name'):
                data[group.name] = dict()

                if group.members.all().exists():
                    data[group.name]['hosts'] = [host.name for host in group.members.all()]

                if group.children.all().exists():
                    data[group.name]['children'] = [child.name for child in group.children.all()]

                data[group.name]['vars'] = {var.key: var.value for var in group.variable_set.all()}
                if group.description:
                    data[group.name]['vars']['_description'] = group.description

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
            else:
                return Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type="application/json")


class ImportExportView(View):

    @staticmethod
    def get(request):
        if 'action' not in request.GET:
            return render(request, 'inventory/import_export.html')

    @staticmethod
    def post(request):
        if request.POST['action'] == 'import':
            with tempfile.TemporaryFile() as temp:
                for chunk in request.FILES['file']:
                    temp.write(chunk)
                temp.seek(0, 0)
                data = {'added_hosts': 0, 'added_groups': 0, 'added_vars': 0}

                if request.POST['type'] == 'csv':
                    csv_data = csv.reader(temp)
                    header = next(csv_data)
                    try:
                        host_index = header.index('host')
                    except ValueError:
                        data['result'] = 'failed'
                        data['msg'] = 'Error: could not find hosts column'
                    else:
                        for row in csv_data:
                            host, created = Host.objects.get_or_create(name=row[host_index])
                            if created:
                                data['added_hosts'] += 1
                            for index, cell in enumerate(row):
                                if index != host_index and cell:
                                    if header[index] == 'group':
                                        group, created = Group.objects.get_or_create(name=cell)
                                        if created:
                                            data['added_groups'] += 1
                                        host.group_set.add(group)
                                        host.save()
                                    else:
                                        var, created = Variable.objects.get_or_create(key=header[index], host=host)
                                        if created:
                                            data['added_vars'] += 1
                                        var.value = cell
                                        var.save()
                        data['result'] = 'ok'

                elif request.POST['type'] == 'json':
                    try:
                        json_data = json.load(temp)
                    except ValueError:
                        data['result'] = 'failed'
                        data['msg'] = 'Error: File does not contain valid JSON'
                    else:
                        for host_name, variables in json_data['_meta']['hostvars'].iteritems():
                            host, created = Host.objects.get_or_create(name=host_name)
                            if created:
                                data['added_hosts'] += 1
                            for key, value in variables.iteritems():
                                if key == '_description':
                                    host.description = value
                                else:
                                    var, created = Variable.objects.get_or_create(key=key, host=host)
                                    if created:
                                        data['added_vars'] += 1
                                    var.value = value
                                    var.save()
                            host.save()
                        json_data.pop('_meta', None)
                        for group_name, group_dict in json_data.iteritems():
                            group, created = Group.objects.get_or_create(name=group_name)
                            if created:
                                data['added_groups'] += 1
                            if 'children' in group_dict:
                                for child_name in group_dict['children']:
                                    child, created = Group.objects.get_or_create(name=child_name)
                                    if created:
                                        data['added_groups'] += 1
                                    group.children.add(child)
                            if 'hosts' in group_dict:
                                for host_name in group_dict['hosts']:
                                    host, created = Host.objects.get_or_create(name=host_name)
                                    if created:
                                        data['added_hosts'] += 1
                                    group.members.add(host)
                            if 'vars' in group_dict:
                                for key, value in group_dict['vars'].iteritems():
                                    if key == '_description':
                                        group.description = value
                                    else:
                                        var, created = Variable.objects.get_or_create(key=key, group=group)
                                        if created:
                                            data['added_vars'] += 1
                                        var.value = value
                                        var.save()
                            group.save()
                        data['result'] = 'ok'
                else:
                    data['result'] = 'failed'
                    data['msg'] = 'Error: Invalid file type (.' + request.POST['type'] + ')'

        else:
            return Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type="application/json")


class NodesView(View):

    @staticmethod
    def get(request, node_type_plural):
        node_type = node_type_plural[:-1]
        if 'action' not in request.GET:
            context = {'node_type': node_type, 'node_type_plural': node_type_plural}
            return render(request, 'inventory/nodes.html', context)
        else:
            data = list()
            if request.GET['action'] == 'host_table':
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
    def post(request, node_type_plural):
        node_type = node_type_plural[:-1]
        if request.POST['action'] == 'delete':
            if node_type == 'host':
                node_class = Host
            elif node_type == 'group':
                node_class = Group
            else:
                raise Http404('Invalid node type')
            for node_id in request.POST.getlist('selection[]'):
                node = get_object_or_404(node_class, pk=node_id)
                if node_type == 'group' and node.name == 'all':
                    pass
                else:
                    node.delete()
            data = {'result': 'ok'}
        else:
            return Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type="application/json")


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
                data = {'result': 'ok'}

                groups, hosts = self.get_node_descendants(node)

                data['groups'] = [[group.name, group.id] for group in groups]
                data['hosts'] = [[host.name, host.id] for host in hosts]

                data['groups'].sort()
                data['hosts'].sort()

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
            if node_type == 'group' and node.name == 'all':
                pass
            else:
                node.delete()
            data = {'result': 'ok'}
        else:
            raise Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type="application/json")


class VariablesView(View):

    @staticmethod
    def get(request, node_type, node_id):
        node = NodeDetailsView.build_node(node_type, node_id)

        data = [[var.key, var.value, '', var.id] for var in node.variable_set.all()]

        for ancestor in NodeDetailsView.get_node_ancestors(node):
            for var in ancestor.variable_set.all():
                data.append([var.key, var.value, var.group.name, var.group.id])
        group_all = Group.objects.get(name='all')

        for var in group_all.variable_set.all():
            data.append([var.key, var.value, 'all', var.group.id])

        return HttpResponse(json.dumps(data), content_type="application/json")

    @staticmethod
    def post(request, node_type, node_id):
        if 'id' in request.POST:
            variable = get_object_or_404(Variable, pk=request.POST['id'])
        else:
            variable = Variable()

        if 'action' in request.POST:
            if request.POST['action'] == 'save':
                post_data = dict(request.POST.iteritems())
                post_data[node_type] = node_id
                form = VariableForm(post_data or None, instance=variable)
                if form.is_valid():
                    form.save(commit=True)
                    data = {'result': 'ok'}
                else:
                    data = {'result': 'fail', 'msg': str(form.errors)}
            elif request.POST['action'] == 'del':
                variable = get_object_or_404(Variable, pk=request.POST['id'])
                variable.delete()
                data = {'result': 'OK'}

            elif request.POST['action'] == 'copy':
                node = NodeDetailsView.build_node(node_type, node_id)
                source = NodeDetailsView.build_node(request.POST['type'], request.POST['source_id'])
                for var in source.variable_set.all():
                    node.variable_set.create(key=var.key, value=var.value)
                    node.save()
                data = {'result': 'ok'}
            else:
                raise Http404('Invalid action')
        else:
            raise Http404('Invalid request')
        return HttpResponse(json.dumps(data), content_type="application/json")


class RelationsView(View):
    @staticmethod
    def get_relations(node, relation):
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
        related_set, related_class = self.get_relations(node, relation)
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
            raise Http404('Invalid node type')
        related_set, related_class = self.get_relations(node, relation)
        if request.POST['action'] == 'add':
            for selected in request.POST.getlist('selection[]'):
                related_set.add(get_object_or_404(related_class, pk=selected))
        elif request.POST['action'] == 'remove':
            for selected in request.POST.getlist('selection[]'):
                related_set.remove(get_object_or_404(related_class, pk=selected))
        else:
            raise Http404('Invalid action')
        return HttpResponse(json.dumps({'result': 'ok'}), content_type="application/json")
