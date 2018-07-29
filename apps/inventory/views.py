import json
import csv
import tempfile
import collections
import os
import shutil
import ConfigParser
import yaml
import uuid

from ruamel import yaml
from django.http import HttpResponse, Http404
from django.core.exceptions import PermissionDenied, ObjectDoesNotExist
from django.shortcuts import get_object_or_404, render
from django.views.generic import View
from django.conf import settings
from django.core.cache import cache
from xml.etree.ElementTree import Element, SubElement

from apps.inventory.models import Host, Group, Variable
from apps.inventory.forms import VariableForm
from apps.inventory.extras import AnsibleInventory, build_node

from main.extras import download_file
from apps.preferences.extras import get_preferences
from apps.projects.extras import Authorizer


class PageView(View):

    @staticmethod
    def get(request, **kwargs):

        if kwargs['page'] == 'manage':

            return render(request, 'inventory/manage.html')

        elif kwargs['page'] == 'selector':

            context = {'node_type': kwargs['type']}

            return render(request, 'inventory/node_selector.html', context)

        elif kwargs['page'] == 'view':

            classes = {'host': Host, 'group': Group}

            context = {'node': (get_object_or_404(classes[kwargs['type']], name=kwargs['name']))}

            return render(request, 'inventory/node_view.html', context)

        else:

            raise Http404('Invalid page')


class InventoryView(View):

    @staticmethod
    def _inventory_to_dict(internal_vars=True):

        data = {
            '_meta': {
                'hostvars': dict()
            },
            'ungrouped': {
                'hosts': list()
            }
        }

        for host in Host.objects.order_by('name'):

            if host.variable_set.all().exists() or host.description:

                data['_meta']['hostvars'][host.name] = dict()

                for var in host.variable_set.all():

                    try:

                        data['_meta']['hostvars'][host.name][var.key] = json.loads(var.value)

                    except ValueError or TypeError:

                        data['_meta']['hostvars'][host.name][var.key] = var.value

                if host.description and not internal_vars:

                    data['_meta']['hostvars'][host.name]['_description'] = host.description

            if host.group_set.count() == 0 and internal_vars:

                data['ungrouped']['hosts'].append(host.name)

        for group in Group.objects.order_by('name'):

            data[group.name] = dict()

            if group.members.all().exists():

                data[group.name]['hosts'] = [host.name for host in group.members.all()]

            data[group.name]['children'] = [child.name for child in group.children.all()]

            if group.variable_set.all().exists() or group.description:

                data[group.name]['vars'] = dict()

                for var in group.variable_set.all():

                    try:

                        data[group.name]['vars'][var.key] = json.loads(var.value)

                    except ValueError or TypeError:

                        data[group.name]['vars'][var.key] = var.value

            if group.description and not internal_vars:

                data[group.name]['vars']['_description'] = group.description

        if internal_vars:

            if 'vars' not in data['all']:

                data['all']['vars'] = dict()

            data['all']['vars']['roles_path'] = settings.ROLES_PATH

            data['all']['vars']['files_path'] = settings.FILES_PATH

            data['all']['vars']['userdata_path'] = settings.USERDATA_PATH

        return data

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

                data = self._inventory_to_dict()

            else:

                raise PermissionDenied

        elif action == 'export':

            temp_file = tempfile.TemporaryFile()

            if request.GET['format'] == 'json':

                temp_file.write(json.dumps(self._inventory_to_dict()))

                return download_file(temp_file, 'inventory.json')

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

                zip_file_name = shutil.make_archive(os.path.join(tempfile.gettempdir(), 'inventory'), 'zip', temp_dir)

                with open(zip_file_name, 'r') as f:

                    stream = download_file(f, 'inventory.zip')

                shutil.rmtree(temp_dir)

                os.remove(zip_file_name)

                return stream

            elif request.GET['format'] in ['pac', 'filezilla']:

                pac_groups = Group.objects.filter(variable__key='pac_group', variable__value='true')

                mappings = dict()

                config_dict = {
                    '__PAC__EXPORTED__': {'children': dict()}
                }

                top = Element('FileZilla3')

                servers = SubElement(top, 'Servers')

                for group in pac_groups:

                    group_descendants, host_descendants = group.get_descendants()

                    descendants = [g for g in group_descendants if len(g.variable_set.filter(key='pac_group', value='true'))]

                    ancestors = [g for g in group.get_ancestors() if len(g.variable_set.filter(key='pac_group', value='true'))]

                    if request.GET['format'] == 'pac':

                        group_uuid = str(uuid.uuid4())

                        config_dict[group_uuid] = {
                            '_is_group': 1,
                            'children': dict(),
                            'description': "Connection group '" + group.name + "'",
                            'name': group.name,
                            'parent': '__PAC__EXPORTED__',
                        }

                        mappings[group.name] = {'id': group_uuid}

                    else:

                        folder_element = Element('Folder', expanded="0")

                        folder_element.text = group.name

                        mappings[group.name] = {'element': folder_element}

                    if len(ancestors):

                        mappings[group.name]['parent'] = ancestors[-1].name

                    if not len(descendants):

                        for host in host_descendants:

                            try:

                                address = host.variable_set.get(key='ansible_host').value

                            except ObjectDoesNotExist:

                                address = host.name

                            if request.GET['format'] == 'pac':

                                host_uuid = str(uuid.uuid4())

                                config_dict[group_uuid]['children'][host_uuid] = 1

                                config_dict[host_uuid] = {
                                    'method': 'SSH',
                                    'KPX title regexp': "'.*" + host.name + ".*'",
                                    '_is_group': 0,
                                    'description': "Connection with '" + host.name + "'",
                                    'ip': address,
                                    'name': host.name,
                                    'title': host.name,
                                    'parent': group_uuid
                                }

                            else:

                                host_element = SubElement(mappings[group.name]['element'], 'Server')

                                host_element.text = host.name

                                host_child_elements = {
                                    'Host': address,
                                    'Port': '22',
                                    'Protocol': '1',
                                    'Type': '0',
                                    'User': request.GET.get('sftp_user'),
                                    'Logontype': '1',
                                    'TimezoneOffset': '0',
                                    'PasvMode': 'MODE_DEFAULT',
                                    'MaximumMultipleConnections': '0',
                                    'EncodingType': 'Auto',
                                    'BypassProxy': '0',
                                    'Name': host.name,
                                    'SyncBrowsing': '0',
                                    'DirectoryComparison': '0',
                                    'Comments': '',
                                    'LocalDir': '',
                                    'RemoteDir': ''
                                }

                                SubElement(host_element, 'Pass', encoding='base64')

                                for key in host_child_elements:

                                    element = SubElement(host_element, key)

                                    element.text = host_child_elements[key]

                for group_name in mappings:

                    group_uuid = mappings[group_name].get('id')

                    parent = mappings[group_name].get('parent')

                    if parent:

                        if request.GET['format'] == 'pac':

                            parent_uuid = mappings[parent]['id']

                            config_dict[group_uuid]['parent'] = parent_uuid

                            config_dict[parent_uuid]['children'][group_uuid] = 1

                        else:

                            parent_element = mappings[parent]['element']

                            parent_element.append(mappings[group_name]['element'])

                    else:

                        if request.GET['format'] == 'pac':

                            config_dict['__PAC__EXPORTED__']['children'][group_uuid] = 1

                        else:

                            servers.append(mappings[group_name]['element'])

                if request.GET['format'] == 'pac':

                    yaml.dump(config_dict, temp_file, explicit_start=True, Dumper=yaml.RoundTripDumper, width=9999)

                    return download_file(temp_file, 'pac_export.yml')

                else:

                    temp_file.write(top)

                    return download_file(temp_file, 'sites.xml')

            else:

                raise Http404('Invalid format')

        elif action == 'list':

            classes = {'host': Host, 'group': Group}

            node_list = list()

            filter_pattern = request.GET.get('filter')

            exclude_pattern = request.GET.get('exclude')

            for node_dict in classes[request.GET['type']].objects.all().values():

                match_conditions = {
                    not filter_pattern or node_dict['name'].find(filter_pattern) > -1,
                    not exclude_pattern or node_dict['name'].find(exclude_pattern) <= -1
                }

                if False not in match_conditions:

                    node = build_node(node_dict, request.GET['type'], request.user)

                    node_list.append(node.to_dict())

            data = {'status': 'ok', 'nodes': node_list}

        else:

            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')

    @staticmethod
    def post(request, action):

        if action == 'import':

            if request.user.has_perms(['users.edit_hosts', 'users.edit_groups']):

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

                            data['status'] = 'failed'

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

                            data['status'] = 'ok'

                    # Import from JSON
                    elif request.POST['format'] == 'json':

                        # Load JSON data
                        try:

                            json_data = json.load(temp)

                        except ValueError:

                            data['status'] = 'failed'

                            data['msg'] = 'Error: File does not contain valid JSON'

                        else:

                            # Iterate over JSON data host vars
                            for host_name in json_data['_meta']['hostvars']:

                                host, created = Host.objects.get_or_create(name=host_name)

                                data['added_hosts'] += 1 if created else 0

                                for key in json_data['_meta']['hostvars'][host_name]:

                                    value = json_data['_meta']['hostvars'][host_name][key]

                                    if key == '_description':

                                        host.description = value

                                    else:

                                        var, created = Variable.objects.get_or_create(key=key, host=host)

                                        data['added_vars'] += 1 if created else 0

                                        var.value = value

                                        var.save()

                                host.save()

                            json_data.pop('_meta', None)

                            # Iterate over JSON data groups
                            for group_name in json_data:

                                group, created = Group.objects.get_or_create(name=group_name)


                                # Iterate over group children
                                if 'children' in json_data[group_name]:

                                    for child_name in json_data[group_name]['children']:

                                        child, created = Group.objects.get_or_create(name=child_name)

                                        data['added_groups'] += 1 if created else 0

                                        group.children.add(child)

                                # Iterate over group hosts
                                if 'hosts' in json_data[group_name]:

                                    for host_name in json_data[group_name]['hosts']:

                                        host, created = Host.objects.get_or_create(name=host_name)

                                        data['added_hosts'] += 1 if created else 0

                                        group.members.add(host)

                                # Iterate over group vars
                                if 'vars' in json_data[group_name]:

                                    for key in json_data[group_name]['vars']:

                                        if key == '_description':

                                            group.description = json_data[group_name]['vars'][key]

                                        else:

                                            var, created = Variable.objects.get_or_create(key=key, group=group)

                                            data['added_vars'] += 1 if created else 0

                                            var.value = json_data[group_name]['vars'][key]

                                            var.save()

                                if group.name != 'ungrouped':

                                    group.save()

                                    data['added_groups'] += 1 if created else 0

                                else:

                                    group.delete()

                            data['status'] = 'ok'

                    else:

                        raise Http404('Invalid format')

            else:

                data = {'status': 'denied'}

        elif action == 'delete':

            for node_id in json.loads(request.POST['selection']):

                node = build_node({'id': node_id}, request.POST['type'], request.user)

                if node.editable and (node.type == 'host' or node.name != 'all'):

                    node.delete()

            data = {'status': 'ok', 'msg': request.POST['type'].capitalize() + 's deleted'}

        else:

            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')


class NodeView(View):

    @staticmethod
    def _get_relationships(node, relation):

        if relation == 'parents':

            related_set = node.group_set

            related_class = Group

            related_type = 'group'

        elif relation == 'children':

            related_set = node.children

            related_class = Group

            related_type = 'group'

        elif relation == 'members':

            related_set = node.members

            related_class = Host

            related_type = 'host'

        else:

            raise ValueError('Invalid relation')

        return related_set, related_class, related_type

    def get(self, request, node_type, action):

        node = build_node(request.GET.dict(), node_type, request.user)

        if action == '':

            classes = {'host': Host, 'group': Group}

            node_list = list()

            filter_pattern = request.GET.get('filter')

            exclude_pattern = request.GET.get('exclude')

            for node_dict in classes[request.GET['type']].objects.all().values():

                match_conditions = {
                    not filter_pattern or node_dict['name'].find(filter_pattern) > -1,
                    not exclude_pattern or node_dict['name'].find(exclude_pattern) <= -1
                }

                if False not in match_conditions:

                    node = build_node(node_dict, request.GET['type'], request.user)

                    node_list.append(node.to_dict())

            data = {'status': 'ok', 'nodes': node_list}

        elif action == 'get':

            data = {'status': 'ok', 'node': node.to_dict()}

        elif action == 'facts':

            if node.type == 'host':

                facts = collections.OrderedDict(sorted(json.loads(node.facts).items()))

                data = {
                    'status': 'ok',
                    'name': node.name,
                    'facts': facts if facts else None
                }

            else:

                data = {'status': 'failed', 'msg': 'Groups do not have facts'}

        elif action == 'descendants':

            data = {
                'status': 'ok',
                'group_descendants': [group.to_dict() for group in node.group_descendants],
                'host_descendants': [host.to_dict() for host in node.host_descendants]
            }

        elif action == 'vars':

            variables = dict()

            inventory = AnsibleInventory()

            for var in node.variable_set.all():

                variables[var.key] = [{'key': var.key, 'value': var.value, 'source': '', 'id': var.id, 'primary': True}]

            for ancestor in node.get_ancestors():

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

            for key in variables:

                primary_count = len([value for value in variables[key] if value['primary']])

                if primary_count == 0 and len(variables[key]) == 1:

                    variables[key][0]['primary'] = True

                elif primary_count == 0 and len(variables[key]) > 1:

                    actual_value = inventory.get_variable(key, node)

                    for value in variables[key]:

                        if value['value'] == actual_value:

                            value['primary'] = True

                            break

                var_list += variables[key]

            data = {'status': 'ok', 'var_list': var_list}

        elif action in ['parents', 'children', 'members']:

            related_set, related_class, related_type = self._get_relationships(node, action)

            if 'related' not in request.GET or request.GET['related'] == 'true':

                node_list = [related_node.to_dict() for related_node in related_set.order_by('name')]

            else:

                candidate_set = related_class.objects.order_by('name').exclude(name='all')

                candidate_set = candidate_set.exclude(pk__in=[related.id for related in related_set.all()])

                if related_class == type(node):

                    candidate_set = candidate_set.exclude(pk=node.id)

                if action == 'parents' and node.group_descendants:

                    candidate_set = candidate_set.exclude(pk__in=[group.id for group in node.group_descendants])

                elif action == 'children' and node.get_ancestors():

                    candidate_set = candidate_set.exclude(pk__in=[group.id for group in node.get_ancestors()])

                node_list = [candidate.to_dict() for candidate in candidate_set]

            data = {'status': 'ok', 'nodes': node_list}

        else:

            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')

    def post(self, request, node_type, action):

        node = build_node(request.POST.dict(), node_type, request.user)

        project_auth = cache.get_or_set(str(request.user.username + '_auth'), Authorizer(request.user), settings.CACHE_TIMEOUT)

        if action == 'save':

            if node.editable and node.type != 'group' or node.name != 'all':

                form = node.form_class(request.POST or None, instance=node)

                if form.is_valid():

                    node = form.save(commit=True)

                    data = {'status': 'ok', 'name': node.name, 'type': node.type}

                else:

                    data = {'status': 'failed', 'msg': str(form.errors)}

            else:

                data = {'status': 'denied'}

        elif action == 'delete':

            if node.editable and (node.type == 'host' or node.name != 'all'):

                node.delete()

                data = {'status': 'ok', 'msg': node.type.title() + ' deleted'}

            else:

                data = {'status': 'denied'}

        elif action == 'save_var':

            if node.editable or project_auth.can_edit_variables(node):

                var_dict = json.loads(request.POST['variable'])

                variable = get_object_or_404(Variable, pk=var_dict['id']) if var_dict.get('id') else Variable()

                var_dict[node_type] = node.id

                form = VariableForm(var_dict or None, instance=variable)

                if form.is_valid():

                    form.save(commit=True)

                    data = {'status': 'ok', 'msg': 'Variable saved'}

                else:

                    data = {'status': 'failed', 'msg': str(form.errors)}

            else:

                data = {'status': 'denied'}

        elif action == 'delete_var':

            if node.editable or project_auth.can_edit_variables(node):

                variable = get_object_or_404(Variable, pk=json.loads(request.POST['variable'])['id'])

                variable.delete()

                data = {'status': 'ok', 'msg': 'Variable deleted'}

            else:

                data = {'status': 'denied'}

        elif action == 'copy_vars':

            if node.editable or project_auth.can_edit_variables(node):

                source_dict = json.loads(request.POST['source'])

                source = build_node(source_dict, source_dict['type'], request.user)

                for source_var in source.variable_set.all():

                    var, created = node.variable_set.get_or_create(key=source_var.key)

                    var.value = source_var.value

                    var.save()

                data = {'status': 'ok', 'msg': 'Variable copied from ' + source.name}

            else:

                data = {'status': 'denied'}

        elif action in ['add_parents', 'add_children', 'add_members']:

            if node.editable:

                related_set, related_class, related_type = self._get_relationships(node, action.split('_')[1])

                for selected in json.loads(request.POST['selection']):

                    related_set.add(get_object_or_404(related_class, pk=selected['id']))

                data = {'status': 'ok'}

            else:

                data = {'status': 'denied'}

        elif action in ['remove_parents', 'remove_children', 'remove_members']:

            if node.editable:

                related_set, related_class, related_type = self._get_relationships(node, action.split('_')[1])

                for selected in json.loads(request.POST['selection']):

                    related_set.remove(get_object_or_404(related_class, pk=selected['id']))

                data = {'status': 'ok'}

            else:

                data = {'status': 'denied'}

        else:

            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')