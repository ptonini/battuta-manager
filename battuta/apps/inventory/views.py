import json
import csv
import tempfile
import collections
import os
import shutil
import ntpath
import ConfigParser
import yaml


from django.http import HttpResponse, Http404, StreamingHttpResponse
from django.core.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404, render
from django.views.generic import View
from django.forms import model_to_dict

from apps.inventory.models import Host, Group, Variable
from apps.inventory.forms import HostForm, GroupForm, VariableForm
from apps.inventory.extras import BattutaInventory

from apps.preferences.extras import get_preferences


class PageView(View):

    @staticmethod
    def get(request, **kwargs):

        if kwargs['page'] == 'import':

            return render(request, 'inventory/import.html')

        elif kwargs['page'] == 'nodes':

            context = {'node_type': kwargs['node_type_plural'][:-1], 'node_type_plural': kwargs['node_type_plural']}

            return render(request, 'inventory/nodes.html', context)

        elif kwargs['page'] == 'node':

            context = {'node_type': kwargs['node_type'], 'node_name': kwargs['node_name']}

            return render(request, 'inventory/node.html', context)

        else:

            raise Http404('Invalid page')


class InventoryView(View):

    @staticmethod
    def _create_node_var_file(node, folder):

        with open(os.path.join(folder, node.name + '.yml'), 'w+') as vars_file:

            vars_file.write('---\n')

            for var in node.variable_set.all():

                vars_file.write(yaml.safe_dump({var.key: var.value}, default_flow_style=False))

    def get(self, request, action):

        prefs = get_preferences()

        if action == 'get':

            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

            ip = x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')

            if request.user.is_authenticated or ip in prefs['ansible_servers'].split(','):

                data = BattutaInventory.to_dict()

            else:

                raise PermissionDenied

        elif action == 'search':

            data = list()

            if request.GET['type'] == 'host':

                node_class = Host

            elif request.GET['type'] == 'group':

                node_class = Group

            else:

                raise Http404('Invalid node type')

            for node in node_class.objects.order_by('name'):

                if node.name.find(request.GET['pattern']) > -1:

                    data.append([node.name, node.id])

        elif action == 'export':

            if request.GET['format'] == 'json':

                data = BattutaInventory.to_dict(internal_vars=False)

            elif request.GET['format'] == 'zip':

                temp_dir = tempfile.mkdtemp()

                os.makedirs(os.path.join(temp_dir, 'group_vars'))
                os.makedirs(os.path.join(temp_dir, 'host_vars'))

                with open(os.path.join(temp_dir, 'hosts'), 'w+') as hosts_file:

                    config = ConfigParser.ConfigParser(allow_no_value=True)

                    for group in Group.objects.all():

                        if len(group.members.all()) > 0:

                            config.add_section(group.name)

                            for host in group.members.all():

                                config.set(group.name, host.name)

                        if len(group.children.all()) > 0:

                            section_name = group.name + ':children'

                            config.add_section(section_name)

                            for child in group.children.all():

                                config.set(section_name, child.name)

                        if len(group.variable_set.all()) > 0:

                            self._create_node_var_file(group, os.path.join(temp_dir, 'group_vars'))

                    config.write(hosts_file)

                for host in Host.objects.all():

                    if len(host.variable_set.all()) > 0:

                        self._create_node_var_file(host, os.path.join(temp_dir, 'host_vars'))

                target = shutil.make_archive(os.path.join(tempfile.gettempdir(), 'inventory'), 'zip', temp_dir)

                stream = StreamingHttpResponse((line for line in open(target, 'r')))

                stream['Content-Length'] = os.path.getsize(target)

                stream['Content-Disposition'] = 'attachment; filename=' + ntpath.basename(target)

                os.remove(target)

                shutil.rmtree(temp_dir)

                return stream

            else:

                raise Http404('Invalid format')

        else:

            return Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')

    @staticmethod
    def post(request, action):

        print(request.user.get_group_permissions())

        if request.user.has_perms(['users.edit_hosts', 'users.edit_groups']):

            if action == 'import':

                # Create temp file and load import data
                with tempfile.TemporaryFile() as temp:

                    for chunk in request.FILES['file_data']:

                        temp.write(chunk)

                    temp.seek(0, 0)

                    data = {'added_hosts': 0, 'added_groups': 0, 'added_vars': 0}

                    # Import from CSV
                    if request.POST['format'] == 'csv':

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
                    elif request.POST['format'] == 'json':

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
                        raise Http404('Invalid format')

            else:

                raise Http404('Invalid action')

        else:

            data = {'result': 'denied'}

        return HttpResponse(json.dumps(data), content_type='application/json')


class NodesView(View):

    @staticmethod
    def get(request, node_type_plural, action):

        node_type = node_type_plural[:-1]

        if action == 'list':

            data = list()

            if node_type == 'host':

                for host in Host.objects.all():

                    host_info = {
                        'name': host.name,
                        'id': host.id,
                        'address': '',
                        'cores': '',
                        'memory': '',
                        'disc': '',
                        'public_address': '',
                        'instance_type': ''
                    }

                    if host.facts:

                        facts = json.loads(host.facts)

                        if 'default_ipv4' in facts and 'address' in facts['default_ipv4']:

                            host_info['address'] = facts['default_ipv4']['address']

                        host_info['cores'] = facts['processor_count'] if 'processor_count' in facts else None

                        host_info['memory'] = facts['memtotal_mb'] if 'memtotal_mb' in facts else None

                        if 'mounts' in facts:

                            host_info['disc'] = 0

                            for mount in facts['mounts']:

                                host_info['disc'] += mount['size_total']

                        host_info['public_address'] = facts['ec2_public_ipv4'] if 'ec2_public_ipv4' in facts else None

                        host_info['instance_type'] = facts['ec2_instance_type'] if 'ec2_instance_type' in facts else None

                    data.append(host_info)

            elif node_type == 'group':

                for group in Group.objects.all():

                    data.append({
                        'name': group.name,
                        'id': group.id,
                        'description': group.description,
                        'members': len(group.members.all()),
                        'parents': len(group.group_set.all()),
                        'children': len(group.children.all()),
                        'variables': len(group.variable_set.all()),
                    })

        else:

            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')

    @staticmethod
    def post(request, node_type_plural, action):

        node_type = node_type_plural[:-1]

        if request.user.has_perm('users.edit_' + node_type_plural):

            if action == 'delete':

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

        else:

            data = {'result': 'denied'}

        return HttpResponse(json.dumps(data), content_type='application/json')


class NodeView(View):

    context = dict()

    @staticmethod
    def build_node(node_type, node_name, user):

        # Get classes based on node type
        if node_type == 'host':

            node_class = Host

            node_form_class = HostForm

        elif node_type == 'group':

            node_class = Group

            node_form_class = GroupForm

        else:

            raise Http404('Invalid node type')

        ancestors = list()

        group_descendants = list()

        host_descendants = list()

        # Build node object
        if node_name == 'null':

            node = node_class()

        else:

            node = get_object_or_404(node_class, name=node_name)

            parents = node.group_set.all()

            while len(parents) > 0:

                step_list = list()

                for parent in parents:

                    if parent not in ancestors:

                        ancestors.append(parent)

                    for group in parent.group_set.all():

                        step_list.append(group)

                parents = step_list

            if node.name != 'all':

                ancestors.append(Group.objects.get(name='all'))

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

        setattr(node, 'editable', user.has_perm('users.edit_' + node_type + 's'))

        setattr(node, 'form_class', node_form_class)

        setattr(node, 'ancestors', ancestors)

        setattr(node, 'group_descendants', group_descendants)

        setattr(node, 'host_descendants', host_descendants)

        return node

    def get(self, request, node_type, node_name, action):

        node = self.build_node(node_type, node_name, request.user)

        if action == 'info':

            node_dict = model_to_dict(node)

            node_dict['type'] = node.type

            node_dict.pop('members', None)

            node_dict.pop('children', None)

            data = {'result': 'ok', 'node': node_dict}

        elif action == 'facts':

            if node.facts:

                data = {
                    'result': 'ok',
                    'name': node.name,
                    'facts': (collections.OrderedDict(sorted(json.loads(node.facts).items())))
                }

            else:

                data = {'result': 'failed'}

        elif action == 'ancestors':

            data = {'result': 'ok', 'groups': [[group.name, group.id] for group in node.ancestors]}

        elif action == 'descendants':

            if request.GET['type'] == 'groups':

                descendants = [[group.name, group.id] for group in node.group_descendants]

            else:

                descendants = [[host.name, host.id] for host in node.host_descendants]

            descendants.sort()

            data = descendants

        else:

            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')

    def post(self, request, node_type, node_name, action):

        node = self.build_node(node_type, node_name, request.user)

        if node.editable:

            if action == 'save':

                form = node.form_class(request.POST or None, instance=node)

                if form.is_valid():

                    node = form.save(commit=True)

                    data = {'result': 'ok', 'name': node.name, 'type': node.type}

                else:

                    data = {'result': 'failed', 'msg': str(form.errors)}

            elif action == 'delete':

                if node.type == 'host' or node.name != 'all':

                    node.delete()

                data = {'result': 'ok'}

            else:
                raise Http404('Invalid action')

        else:

            data = {'result': 'denied'}

        return HttpResponse(json.dumps(data), content_type='application/json')


class VariablesView(View):

    @staticmethod
    def get(request, node_type, node_name, action):

        node = NodeView.build_node(node_type, node_name, request.user)

        if action == 'list':

            variables = dict()

            inventory = BattutaInventory()

            for var in node.variable_set.all():

                variables[var.key] = [{'key': var.key, 'value': var.value, 'source': '', 'id': var.id, 'primary': True}]

            for ancestor in node.ancestors:

                for var in ancestor.variable_set.all():

                    var_dict = {
                        'key': var.key,
                        'value': var.value,
                        'source': var.group.name,
                        'id': var.group.id,
                        'primary': False
                    }

                    if var.key in variables:

                        variables[var.key].append(var_dict)

                    else:

                        variables[var.key] = [var_dict]

            data = list()

            for key, values in variables.iteritems():

                primary_count = len([value for value in values if value['primary']])

                if primary_count == 0 and len(values) == 1:

                    values[0]['primary'] = True

                elif primary_count == 0 and len(values) > 1:

                    actual_value = inventory.get_variable(key, node)

                    for value in values:

                        if value['value'] == actual_value:

                            value['primary'] = True

                            break

                data += values

        else:

            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')

    @staticmethod
    def post(request, node_type, node_name, action):

        node = NodeView.build_node(node_type, node_name, request.user)

        if 'id' in request.POST and request.POST['id']:

            variable = get_object_or_404(Variable, pk=request.POST['id'])

        else:

            variable = Variable()

        if node.editable:

            if action == 'save':

                post_data = dict(request.POST.iteritems())

                post_data[node_type] = node.id

                form = VariableForm(post_data or None, instance=variable)

                if form.is_valid():

                    form.save(commit=True)

                    data = {'result': 'ok'}

                else:

                    data = {'result': 'failed', 'msg': str(form.errors)}

            elif action == 'delete':

                variable.delete()

                data = {'result': 'ok'}

            elif action == 'copy':

                source = NodeView.build_node(request.POST['source_type'], request.POST['source_name'], request.user)

                for source_var in source.variable_set.all():

                    var, created = node.variable_set.get_or_create(key=source_var.key)

                    var.value = source_var.value

                    var.save()

                data = {'result': 'ok'}

            else:

                raise Http404('Invalid action')

        else:

            data = {'result': 'denied'}

        return HttpResponse(json.dumps(data), content_type='application/json')


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

    def get(self, request, node_type, node_name, relationship, action):

        node = NodeView.build_node(node_type, node_name, request.user)

        related_set, related_class = self.get_relationships(node, relationship)

        if action == 'related':

            data = [[related.name, related.id] for related in related_set.order_by('name')]

        elif action == 'not_related':

            candidate_set = related_class.objects.order_by('name').exclude(name='all')

            candidate_set = candidate_set.exclude(pk__in=[related.id for related in related_set.all()])

            if related_class == type(node):

                candidate_set = candidate_set.exclude(pk=node.id)

            if relationship == 'parents' and node.group_descendants:

                candidate_set = candidate_set.exclude(pk__in=[group.id for group in node.group_descendants])

            elif relationship == 'children' and node.ancestors:

                candidate_set = candidate_set.exclude(pk__in=[group.id for group in node.ancestors])

            data = [[candidate.name, candidate.id] for candidate in candidate_set]

        else:
            raise Http404('Invalid request')

        return HttpResponse(json.dumps(data), content_type='application/json')

    def post(self, request, node_type, node_name, relationship, action):

        node = NodeView.build_node(node_type, node_name, request.user)

        related_set, related_class = self.get_relationships(node, relationship)

        if node.editable:

            if action == 'add':

                for selected in request.POST.getlist('selection[]'):

                    related_set.add(get_object_or_404(related_class, pk=selected))

            elif action == 'remove':

                for selected in request.POST.getlist('selection[]'):

                    related_set.remove(get_object_or_404(related_class, pk=selected))

            else:
                raise Http404('Invalid action')

            data = {'result': 'ok'}

        else:

            data = {'result': 'denied'}

        return HttpResponse(json.dumps(data), content_type='application/json')
