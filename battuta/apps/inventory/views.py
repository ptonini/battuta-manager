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

            context = {'node_type': kwargs['node_type_plural'][:-1]}

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

                        if group.members.all().count() > 0:

                            config.add_section(group.name)

                            for host in group.members.all():

                                config.set(group.name, host.name)

                        if group.children.all().count() > 0:

                            section_name = group.name + ':children'

                            config.add_section(section_name)

                            for child in group.children.all():

                                config.set(section_name, child.name)

                        if group.variable_set.all().count() > 0:

                            self._create_node_var_file(group, os.path.join(temp_dir, 'group_vars'))

                    config.write(hosts_file)

                for host in Host.objects.all():

                    if host.variable_set.all().count() > 0:

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

            raise Http404('Invalid action')

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


class NodeView(View):

    @staticmethod
    def _node_to_dict(node):

        default_fields = {
            'name': node.name,
            'type': node.type,
            'description': node.description,
            'id': node.id,
        }

        node_dict = default_fields.copy()

        if node.type == 'host':

            facts = json.loads(node.facts)

            host_fields = {
                'public_address': facts.get('ec2_public_ipv4'),
                'instance_type': facts.get('ec2_instance_type'),
                'cores': facts.get('processor_count'),
                'memory': facts.get('memtotal_mb'),
                'address': facts.get('default_ipv4', {}).get('address'),
                'disc': sum([m['size_total'] for m in facts.get('mounts', [])]),
            }

            node_dict.update(host_fields)

        else:

            group_fields = {
                'members': node.members.all().count(),
                'parents': node.group_set.all().count(),
                'children': node.children.all().count(),
                'variables': node.variable_set.all().count(),
            }

            node_dict.update(group_fields)

        return node_dict

    @staticmethod
    def _build_node(node_type, node_name, user):

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

        if node_class.objects.filter(name=node_name).exists():

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

        else:

            node = node_class()

        setattr(node, 'editable', user.has_perm('users.edit_' + node_type + 's'))

        setattr(node, 'form_class', node_form_class)

        setattr(node, 'ancestors', ancestors)

        setattr(node, 'group_descendants', group_descendants)

        setattr(node, 'host_descendants', host_descendants)

        return node

    @staticmethod
    def _get_relationships(node, action):

        if action == 'parents':

            related_set = node.group_set

            related_class = Group

        elif action == 'children':

            related_set = node.children

            related_class = Group

        elif action == 'members':

            related_set = node.members

            related_class = Host

        else:

            raise Http404('Invalid relation: ' + action)

        return related_set, related_class

    def get(self, request, node_type, action):

        node = self._build_node(node_type, request.GET.get('name'), request.user)

        if action == 'list':

            node_list = list()

            for node in node.__class__.objects.all():

                if 'filter' not in request.GET or node.name.find(request.GET['filter']) > -1:

                    node_list.append(self._node_to_dict(node))

            data = {'result': 'ok', 'nodes': node_list}

        elif action == 'get':

            data = {'result': 'ok', 'node': self._node_to_dict(node)}

        elif action == 'facts':

            if node.type == 'host':

                data = {
                    'result': 'ok',
                    'name': node.name,
                    'facts': (collections.OrderedDict(sorted(json.loads(node.facts).items())))
                }

            else:

                data = {'result': 'failed', 'msg': 'Groups do not have facts'}

        elif action == 'descendants':

            if request.GET['type'] == 'groups':

                descendants = [self._node_to_dict(group) for group in node.group_descendants]

            elif request.GET['type'] == 'hosts':

                descendants = [self._node_to_dict(host) for host in node.host_descendants]

            else:

                raise Http404('Invalid node type')

            data = {'result': 'ok', 'descendants': descendants}

        elif action == 'vars':

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

            var_list = list()

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

                var_list += values

            data = {'result': 'ok', 'var_list': var_list}

        elif action == 'parents' or action == 'children' or action == 'members':

            related_set, related_class = self._get_relationships(node, action)

            if 'related' not in request.GET or request.GET['related'] == 'true':

                node_list = [self._node_to_dict(related_node) for related_node in related_set.order_by('name')]

            else:

                candidate_set = related_class.objects.order_by('name').exclude(name='all')

                candidate_set = candidate_set.exclude(pk__in=[related.id for related in related_set.all()])

                if related_class == type(node):

                    candidate_set = candidate_set.exclude(pk=node.id)

                if action == 'parents' and node.group_descendants:

                    candidate_set = candidate_set.exclude(pk__in=[group.id for group in node.group_descendants])

                elif action == 'children' and node.ancestors:

                    candidate_set = candidate_set.exclude(pk__in=[group.id for group in node.ancestors])

                node_list = [self._node_to_dict(candidate) for candidate in candidate_set]

            data = {'result': 'ok', 'nodes': node_list}

        else:

            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')

    def post(self, request, node_type, action):

        node = self._build_node(node_type, request.POST.get('name'), request.user)

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

            elif action == 'delete_bulk':

                for node_id in request.POST.getlist('selection[]'):

                    node = get_object_or_404(node.__class__, pk=node_id)

                    if node.type == 'host' or node.name != 'all':

                        node.delete()

                data = {'result': 'ok'}

            elif action == 'save_var':

                if 'id' in request.POST and request.POST['id']:

                    variable = get_object_or_404(Variable, pk=request.POST['id'])

                else:

                    variable = Variable()

                post_data = dict(request.POST.iteritems())

                post_data[node_type] = node.id

                form = VariableForm(post_data or None, instance=variable)

                if form.is_valid():

                    form.save(commit=True)

                    data = {'result': 'ok'}

                else:

                    data = {'result': 'failed', 'msg': str(form.errors)}

            elif action == 'delete_var':

                variable = get_object_or_404(Variable, pk=request.POST['id'])

                variable.delete()

                data = {'result': 'ok'}

            elif action == 'copy_vars':

                source = NodeView._build_node(request.POST['source_type'], request.POST['source_name'], request.user)

                for source_var in source.variable_set.all():

                    var, created = node.variable_set.get_or_create(key=source_var.key)

                    var.value = source_var.value

                    var.save()

                data = {'result': 'ok'}

            elif action == 'add_parents' or action == 'add_children' or action == 'add_members':

                related_set, related_class = self._get_relationships(node, action.split('_')[1])

                for selected in request.POST.getlist('selection[]'):

                    related_set.add(get_object_or_404(related_class, pk=selected))

                data = {'result': 'ok'}

            elif action == 'remove_parents' or action == 'remove_children' or action == 'remove_members':

                related_set, related_class = self._get_relationships(node, action.split('_')[1])

                for selected in request.POST.getlist('selection[]'):

                    related_set.remove(get_object_or_404(related_class, pk=selected))

                data = {'result': 'ok'}

            else:

                raise Http404('Invalid action')

        else:

            data = {'result': 'denied'}

        return HttpResponse(json.dumps(data), content_type='application/json')
