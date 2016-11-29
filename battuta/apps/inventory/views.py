import json
import csv
import tempfile
import collections

from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404, render
from django.views.generic import View
from django.conf import settings

from .models import Host, Group, Variable
from .forms import HostForm, GroupForm, VariableForm

from apps.preferences.functions import get_preferences
from apps.runner.functions import get_variable


class InventoryView(View):

    @staticmethod
    def inventory_to_dict(hosts=Host.objects.order_by('name'), internal_vars=True):

        data = {'_meta': {'hostvars': dict()}}

        for host in hosts:
            if host.variable_set.all().exists() or host.description:

                data['_meta']['hostvars'][host.name] = {var.key: var.value for var in host.variable_set.all()}
                if host.description and not internal_vars:
                    data['_meta']['hostvars'][host.name]['_description'] = host.description

        for group in Group.objects.order_by('name'):
            data[group.name] = dict()

            if group.members.all().exists():
                data[group.name]['hosts'] = [host.name for host in group.members.all()]

            data[group.name]['children'] = [child.name for child in group.children.all()]

            data[group.name]['vars'] = {var.key: var.value for var in group.variable_set.all()}

            if group.description and not internal_vars:
                data[group.name]['vars']['_description'] = group.description

        if internal_vars:
            data['all']['vars']['roles_path'] = settings.ROLES_PATH
            data['all']['vars']['files_path'] = settings.FILES_PATH
            data['all']['vars']['userdata_path'] = settings.USERDATA_PATH

        return data

    def get(self, request):
        if 'action' not in request.GET:
            data = self.inventory_to_dict()

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
        else:

            if request.GET['action'] == 'export' and request.GET['type'] == 'json':
                data = InventoryView.inventory_to_dict(internal_vars=False)

            else:
                raise Http404('Invalid action')

            return HttpResponse(json.dumps(data), content_type="application/json")

    @staticmethod
    def post(request):

        if request.POST['action'] == 'import':
            print request.POST
            # Create temp file and load import data
            with tempfile.TemporaryFile() as temp:
                for chunk in request.FILES['file_data']:
                    temp.write(chunk)
                temp.seek(0, 0)
                data = {'added_hosts': 0, 'added_groups': 0, 'added_vars': 0}

                # Import from CSV
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

                # Import from JSON
                elif request.POST['type'] == 'json':

                    # Load JSON data
                    try:
                        json_data = json.load(temp)
                    except ValueError:
                        data['result'] = 'failed'
                        data['msg'] = 'Error: File does not contain valid JSON'
                    else:

                        # Iterate over JSON data host vars
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

                        # Iterate over JSON data groups
                        for group_name, group_dict in json_data.iteritems():
                            group, created = Group.objects.get_or_create(name=group_name)
                            if created:
                                data['added_groups'] += 1

                            # Iterate over group children
                            if 'children' in group_dict:
                                for child_name in group_dict['children']:
                                    child, created = Group.objects.get_or_create(name=child_name)
                                    if created:
                                        data['added_groups'] += 1
                                    group.children.add(child)

                            # Iterate over group hosts
                            if 'hosts' in group_dict:
                                for host_name in group_dict['hosts']:
                                    host, created = Host.objects.get_or_create(name=host_name)
                                    if created:
                                        data['added_hosts'] += 1
                                    group.members.add(host)

                            # Iterate over group vars
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
            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type="application/json")


class NodesView(View):

    @staticmethod
    def get(request, node_type_plural):
        node_type = node_type_plural[:-1]
        prefs = get_preferences()
        if 'action' not in request.GET:
            context = {'node_type': node_type, 'node_type_plural': node_type_plural}
            return render(request, 'inventory/nodes.html', context)
        else:
            data = list()
            if request.GET['action'] == 'host_table':
                for host in Host.objects.all():
                    if host.facts:
                        row = [host.name]
                        facts = json.loads(host.facts)
                        if prefs['use_ec2_facts']:

                            if 'default_ipv4' in facts:
                                row.append(facts['default_ipv4']['address'])
                            else:
                                row.append('')

                            if 'ec2_public_ipv4' in facts:
                                row.append(facts['ec2_public_ipv4'])
                            else:
                                row.append('')

                            if 'ec2_instance_type' in facts:
                                row.append(facts['ec2_instance_type'])
                            else:
                                row.append('')

                            if 'processor_count' in facts:
                                row.append(facts['processor_count'])
                            else:
                                row.append('')

                            if 'memtotal_mb' in facts:
                                row.append(facts['memtotal_mb'])
                            else:
                                row.append('')

                            if 'mounts' in facts:
                                row.append(facts['mounts'][0]['size_total'])
                            else:
                                row.append('')

                            if 'date_time' in facts:
                                row.append(facts['date_time']['date'])
                            else:
                                row.append('')

                            data.append(row)
                        else:
                            data.append([host.name,
                                         facts['default_ipv4']['address'],
                                         facts['processor_count'],
                                         facts['memtotal_mb'],
                                         facts['mounts'][0]['size_total'],
                                         facts['date_time']['date']])
                    else:
                        if prefs['use_ec2_facts']:
                            data.append([host.name, '', '', '', '', '', '', ''])
                        else:
                            data.append([host.name, '', '', '', '', ''])
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
                raise Http404('Invalid action')
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
                if node.type == 'host' or node.name != 'all':
                    node.delete()
            data = {'result': 'ok'}
        else:
            raise Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type="application/json")


class NodeDetailsView(View):
    context = dict()

    @staticmethod
    def build_node(node_type, node_name):

        # Get classes based on node type
        if node_type == 'host':
            node_class = Host
            node_form_class = HostForm
        elif node_type == 'group':
            node_class = Group
            node_form_class = GroupForm
        else:
            raise Http404('Invalid node type')

        ancestors = None
        group_descendants = None
        host_descendants = None

        # Build node object
        if node_name == '0':
            node = node_class()
        else:
            node = get_object_or_404(node_class, name=node_name)

            ancestors = set()
            parents = node.group_set.all()
            while len(parents) > 0:
                step_list = set()
                for parent in parents:
                    ancestors.add(parent)
                    for group in parent.group_set.all():
                        step_list.add(group)
                parents = step_list
            if node.name != 'all':
                ancestors.add(Group.objects.get(name='all'))

            if node.type == 'group':
                group_descendants = set()
                children = node.children.all()
                while len(children) > 0:
                    step_list = set()
                    for child in children:
                        group_descendants.add(child)
                        for grandchild in child.children.all():
                            step_list.add(grandchild)
                    children = step_list

                members = {host for host in node.members.all()}
                host_descendants = members.union({host for group in group_descendants for host in group.members.all()})

        setattr(node, 'form_class', node_form_class)
        setattr(node, 'ancestors', ancestors)
        setattr(node, 'group_descendants', group_descendants)
        setattr(node, 'host_descendants', host_descendants)

        return node

    def get(self, request, node_name, node_type):
        node = self.build_node(node_type, node_name)

        if 'action' not in request.GET:
            self.context['node'] = node
            return render(request, 'inventory/node_details.html', self.context)
        else:
            if request.GET['action'] == 'facts':
                if node.facts:
                    data = {'result': 'ok',
                            'name': node.name,
                            'facts': (collections.OrderedDict(sorted(json.loads(node.facts).items())))}
                else:
                    data = {'result': 'failed'}

            elif request.GET['action'] == 'ancestors':
                data = {'result': 'ok', 'groups': [[group.name, group.id] for group in node.ancestors]}

            elif request.GET['action'] == 'descendants':

                data = {'result': 'ok',
                        'groups': [[group.name, group.id] for group in node.group_descendants],
                        'hosts': [[host.name, host.id] for host in node.host_descendants]}

                data['groups'].sort()
                data['hosts'].sort()

            else:
                raise Http404('Invalid action')
            return HttpResponse(json.dumps(data), content_type="application/json")

    def post(self, request, node_name, node_type):
        node = self.build_node(node_type, node_name)
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
            if node.type == 'host' or node.name != 'all':
                node.delete()
            data = {'result': 'ok'}
        else:
            raise Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type="application/json")


class VariablesView(View):

    @staticmethod
    def get(request, node_type, node_name):
        node = NodeDetailsView.build_node(node_type, node_name)

        variables = dict()

        for var in node.variable_set.all():
            variables[var.key] = [{'value': var.value, 'source': '', 'id': var.id}]

        for ancestor in node.ancestors:
            for var in ancestor.variable_set.all():
                var_dict = {'value': var.value, 'source': var.group.name, 'id': var.group.id}
                if var.key in variables:
                    variables[var.key].append(var_dict)
                else:
                    variables[var.key] = [var_dict]

        data = list()
        for key, values in variables.iteritems():
            from_node = False
            value_list = list()

            for value in values:

                if value['source'] == '':
                    from_node = True
                    value_list.append([key, value['value'], value['source'], value['id'], True])
                else:
                    value_list.append([key, value['value'], value['source'], value['id'], False])

            if len([value for value in value_list if value[2] != '']) > 1 and not from_node:

                actual_value = get_variable(key, node)

                for value in value_list:
                    if value[1] == actual_value:
                        value[4] = True
                        break

            data += value_list

        return HttpResponse(json.dumps(data), content_type="application/json")

    @staticmethod
    def post(request, node_type, node_name):
        node = NodeDetailsView.build_node(node_type, node_name)

        if 'id' in request.POST:
            variable = get_object_or_404(Variable, pk=request.POST['id'])
        else:
            variable = Variable()

        if 'action' in request.POST:
            if request.POST['action'] == 'save':
                post_data = dict(request.POST.iteritems())
                post_data[node_type] = node.id
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
                source = NodeDetailsView.build_node(request.POST['source_type'], request.POST['source_name'])
                for source_var in source.variable_set.all():
                    var, created = node.variable_set.get_or_create(key=source_var.key)
                    var.value = source_var.value
                    var.save()
                data = {'result': 'ok'}
            else:
                raise Http404('Invalid action')
        else:
            raise Http404('Invalid request')
        return HttpResponse(json.dumps(data), content_type="application/json")


class RelationsView(View):
    @staticmethod
    def get_relationships(node, relation):
        if relation == 'parents':
            related_set = node.group_set
            related_class = Group
        elif relation == 'children':
            related_set = node.children
            related_class = Group
        elif relation == 'members':
            related_set = node.members
            related_class = Host
        else:
            raise Http404('Invalid relation: ' + relation)
        return related_set, related_class

    def get(self, request, node_type, node_name, relationship):
        node = NodeDetailsView.build_node(node_type, node_name)
        related_set, related_class = self.get_relationships(node, relationship)

        if request.GET['list'] == 'related':

            data = [[related.name, related.id] for related in related_set.order_by('name')]

        elif request.GET['list'] == 'not_related':

            candidate_set = related_class.objects.order_by('name').exclude(name='all')

            if related_class == type(node):
                candidate_set = candidate_set.exclude(pk=node.id)

            if relationship == 'parents' and node.group_descendants:
                candidate_set = candidate_set.exclude(pk__in=[group.id for group in node.group_descendants])
            elif relationship == 'children' and node.ancestors:
                candidate_set = candidate_set.exclude(pk__in=[group.id for group in node.ancestors])

            data = [[candidate.name, candidate.id] for candidate in candidate_set if candidate not in related_set.all()]

        else:
            raise Http404('Invalid request')

        return HttpResponse(json.dumps(data), content_type="application/json")

    def post(self, request, node_type, node_name, relationship):

        node = NodeDetailsView.build_node(node_type, node_name)

        related_set, related_class = self.get_relationships(node, relationship)

        if request.POST['action'] == 'add':
            for selected in request.POST.getlist('selection[]'):
                related_set.add(get_object_or_404(related_class, pk=selected))

        elif request.POST['action'] == 'remove':

            for selected in request.POST.getlist('selection[]'):
                related_set.remove(get_object_or_404(related_class, pk=selected))

        else:
            raise Http404('Invalid action')
        return HttpResponse(json.dumps({'result': 'ok'}), content_type="application/json")
