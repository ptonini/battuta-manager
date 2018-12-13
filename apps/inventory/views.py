import json
import csv
import tempfile
import os
import shutil
import configparser
import yaml
import uuid

from ruamel import yaml
from django.http import HttpResponse, HttpResponseNotFound, HttpResponseBadRequest, HttpResponseForbidden
from django.core.exceptions import ObjectDoesNotExist
from django.shortcuts import get_object_or_404, render
from django.views.generic import View
from django.conf import settings
from django.core.cache import cache
from xml.etree.ElementTree import ElementTree, Element, SubElement

from apps.inventory.models import Host, Group, Variable
from apps.inventory.forms import HostForm, GroupForm, VariableForm
from apps.inventory.extras import AnsibleInventory, inventory_to_dict

from main.extras import download_file
from main.extras.views import ApiView
from apps.preferences.extras import get_preferences
from apps.projects.extras import ProjectAuthorizer



class InventoryView(View):

    @staticmethod
    def get(request):

        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

        ip = x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')

        if request.user.is_authenticated or ip in get_preferences()['ansible_servers'].split(','):

            return HttpResponse(json.dumps(inventory_to_dict()), content_type='application/json')

        else:

            return HttpResponseForbidden()


class ManageView(ApiView):

    @staticmethod
    def _create_node_var_file(node, folder):

        with open(os.path.join(folder, node.name + '.yml'), 'w+') as vars_file:

            vars_file.write('---\n')

            for var in node.variable_set.all():

                vars_file.write(yaml.safe_dump({var.key: var.value}, default_flow_style=False))

    def get(self, request):

        if request.GET['format'] == 'json':

            json_file = tempfile.TemporaryFile(mode='w+')

            json_file.write(json.dumps(inventory_to_dict()))

            return download_file(json_file, 'inventory.json')

        elif request.GET['format'] == 'zip':

            temp_dir = tempfile.mkdtemp()

            os.makedirs(os.path.join(temp_dir, 'group_vars'))

            os.makedirs(os.path.join(temp_dir, 'host_vars'))

            with open(os.path.join(temp_dir, 'hosts'), 'w+') as hosts_file:

                config = configparser.ConfigParser(allow_no_value=True)

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

            with open(zip_file_name, 'r+b') as zip_file:

                stream = download_file(zip_file, 'inventory.zip')

            shutil.rmtree(temp_dir)

            os.remove(zip_file_name)

            return stream

        elif request.GET['format'] in ['pac', 'filezilla']:

            pac_groups = Group.objects.filter(variable__key='pac_group', variable__value='true')

            mappings = dict()

            config_dict = {
                '__PAC__EXPORTED__': {'children': dict()}
            }

            root = Element('FileZilla3')

            tree = ElementTree(root)

            servers = SubElement(root, 'Servers')

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

                yaml_file = tempfile.TemporaryFile(mode='w+')

                yaml.dump(config_dict, yaml_file, explicit_start=True, Dumper=yaml.RoundTripDumper, width=9999)

                return download_file(yaml_file, 'pac_export.yml')

            else:

                xml_file = tempfile.TemporaryFile()

                tree.write(xml_file)

                return download_file(xml_file, 'sites.xml')

        else:

            return HttpResponseBadRequest()

    def patch(self, request):

        if request.user.has_perms(['users.edit_hosts', 'users.edit_groups']):

            # Create temp file and load import data
            with tempfile.TemporaryFile() as source_file:

                for chunk in request.FILES['file_data']:

                    source_file.write(chunk)

                source_file.seek(0, 0)

                data = {'added_hosts': 0, 'added_groups': 0, 'added_vars': 0}

                # Import from CSV
                if request.PATCH['format'] == 'csv':

                    csv_data = csv.reader(source_file)

                    header = next(csv_data.decode('utf8'))

                    try:

                        host_index = header.index('host')

                    except ValueError:

                        return HttpResponseBadRequest()

                    else:

                        for row in csv_data:

                            host, created = Host.objects.get_or_create(name=row[host_index])

                            data['added_hosts'] += 1 if created else 0

                            for index, cell in enumerate(row):

                                if index != host_index and cell:

                                    if header[index] == 'group':

                                        group, created = Group.objects.get_or_create(name=cell)

                                        data['added_groups'] += 1 if created else 0

                                        host.group_set.add(group)

                                        host.save()

                                    else:

                                        var, created = Variable.objects.get_or_create(key=header[index], host=host)

                                        data['added_vars'] += 1 if created else 0

                                        var.value = cell

                                        var.save()

                # Import from JSON
                elif request.PATCH['format'] == 'json':

                    # Load JSON data
                    try:

                        json_data = json.loads(source_file.read().decode("utf-8"))

                    except ValueError:

                        return HttpResponseBadRequest()

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

                                    var, created = Variable.objects.get_or_create(key=key, host=host, value=value)

                                    data['added_vars'] += 1 if created else 0

                                    var.save()

                            host.save()

                        json_data.pop('_meta', None)

                        # Iterate over JSON data groups
                        for group_name in json_data:

                            group, created = Group.objects.get_or_create(name=group_name)

                            # Iterate over group children

                            for child_name in json_data[group_name].get('children', []):

                                child, created = Group.objects.get_or_create(name=child_name)

                                data['added_groups'] += 1 if created else 0

                                group.children.add(child)

                            # Iterate over group hosts

                            for host_name in json_data[group_name].get('hosts', []):

                                host, created = Host.objects.get_or_create(name=host_name)

                                data['added_hosts'] += 1 if created else 0

                                group.members.add(host)

                            # Iterate over group vars

                            for key in json_data[group_name].get('vars', {}):

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

                else:

                    return HttpResponseBadRequest()

                return self._api_response({'data': data})

        else:

            return HttpResponseForbidden()


class NodeView(ApiView):

    def post(self, request, node_id):

        if request.user.has_perm('users.edit_' + self.type):

            return self._api_response(self._save_instance(request, self.model_class()))

        else:

            return HttpResponseForbidden()

    def get(self, request, node_id):

        if node_id:

            node = get_object_or_404(self.model_class, pk=node_id)

            response = {'data': node.serialize(request.JSON.get('fields'), request.user)}

        else:

            data = list()

            filter_pattern = request.JSON.get('filter')

            exclude_pattern = request.JSON.get('exclude')

            for node in self.model_class.objects.order_by('name').all():

                match_conditions = {
                    not filter_pattern or node.name.find(filter_pattern) > -1,
                    not exclude_pattern or node.name.find(exclude_pattern) <= -1
                }

                if False not in match_conditions:

                    data.append(node.serialize(request.JSON.get('fields'), request.user))

            response = {'data': data}

        return self._api_response(response)

    def patch(self, request, node_id):

        node = get_object_or_404(self.model_class, pk=node_id)

        if node.authorizer(request.user)['editable']:

            return self._api_response(self._save_instance(request, node))

        else:

            return HttpResponseForbidden()

    def delete(self, request, node_id):

        if node_id:

            node = get_object_or_404(self.model_class, pk=node_id)

            if node.authorizer(request.user)['deletable']:

                node.delete()

                return HttpResponse(status=204)

            else:

                return HttpResponseForbidden()

        else:

            id_list = list()

            for node_dict in request.JSON.get('data'):

                node = self.model_class.objects.get(pk=node_dict['id'])

                if node.authorizer(request.user)['deletable']:

                    id_list.append(node_dict['id'])

            self.model_class.objects.filter(pk__in=id_list).delete()

            return HttpResponse(status=204)

        #
        # elif action == 'descendants':
        #
        #     data = {
        #         'status': 'ok',
        #         'group_descendants': [group.to_dict() for group in node.group_descendants],
        #         'host_descendants': [host.to_dict() for host in node.host_descendants]
        #     }


class HostView(NodeView):

    type = Host.type

    model_class = Host

    form_class = HostForm


class GroupView(NodeView):

    type = Group.type

    model_class = Group

    form_class = GroupForm


class VariableView(ApiView):

    type = Variable.type

    form_class = VariableForm

    def post(self, request, node_id, var_id, node_type):

        authorizer = cache.get_or_set(request.user.username + '_auth', ProjectAuthorizer(request.user), settings.CACHE_TIMEOUT)

        node = get_object_or_404(Host if node_type == Host.type else Group, pk=node_id)

        if request.user.has_perm('users.edit_' + node_type) or authorizer.can_edit_variables(node):

            if 'data' in request.JSON:

                return self._api_response(self._save_instance(request, Variable()))

            else:

                return HttpResponseBadRequest()

        else:

            return HttpResponseForbidden()

    def get(self, request, node_id, var_id, node_type):

        node = get_object_or_404(Host if node_type == Host.type else Group, pk=node_id)

        variables = dict()

        inventory = AnsibleInventory()

        for var in node.variable_set.all():

            variables[var.key] = [var.serialize(request.JSON.get('fields'), request.user)]

            variables[var.key][0]['meta']['primary'] = True

        for ancestor in node.get_ancestors():

            for var in ancestor.variable_set.all():

                var_dict = var.serialize(request.JSON.get('fields'), request.user)

                additional_meta = {
                    'primary': False,
                    'source': var.group.serialize({'attributes': ['name'], 'links': ['self']}, request.user)
                }

                var_dict['meta'].update(additional_meta)

                if var.key in variables:

                    variables[var.key].append(var_dict)

                else:

                    variables[var.key] = [var_dict]

        data = list()

        for key in variables:

            if len([value for value in variables[key] if value['meta']['primary']]) == 0:

                if len(variables[key]) == 1:

                    variables[key][0]['meta']['primary'] = True

                else:

                    actual_value = inventory.get_variable(key, node)

                    for value in variables[key]:

                        if value['attributes']['value'] == actual_value:

                            value['meta']['primary'] = True

                            break

            data += variables[key]

        response = {'data': data, 'links': {'self': request.META['PATH_INFO']}}

        return self._api_response(response)

    def patch(self, request, node_id, var_id, node_type):

        if 'data' in request.JSON:

            var = get_object_or_404(Variable, pk=var_id)

            if var.authorizer(request.user)['editable']:

                return self._api_response(self._save_instance(request, var))

            else:

                return HttpResponseForbidden()

        elif 'source' in request.JSON.get('meta', {}):

            data = request.JSON['meta']['source']

            node = get_object_or_404(Host if node_type == Host.type else Group, pk=node_id)

            source = get_object_or_404(Host if data['type'] == Host.type else Group, pk=data['id'])

            authorizer = cache.get_or_set(request.user.username + '_auth', ProjectAuthorizer(request.user), settings.CACHE_TIMEOUT)

            if request.user.has_perm('edit_' + node_type) or authorizer.can_edit_variables(node):

                for source_var in source.variable_set.all():

                    var, created = node.variable_set.update_or_create(key=source_var.key, value=source_var.value)

                    var.save()

                return HttpResponse(status=204)

            else:

                return HttpResponseForbidden()

    @staticmethod
    def delete(request, node_id, var_id, node_type):

        var = get_object_or_404(Variable, pk=var_id)

        if var.authorizer(request.user)['deletable']:

            get_object_or_404(Variable, pk=var_id).delete()

            return HttpResponse(status=204)

        else:

            return HttpResponseForbidden()


class RelationsView(ApiView):

    @staticmethod
    def post(request, relation, node_id, node_type):

        node = get_object_or_404(Host if node_type == Host.type else Group, pk=node_id)

        if node.authorizer(request.user)['editable']:

            related_set, related_class = node.get_relationships(relation)

            for selected in request.JSON.get('data', []):

                related_set.add(get_object_or_404(related_class, pk=selected['id']))

            return HttpResponse(status=204)

        else:

            return HttpResponseForbidden()

    def get(self, request, relation, node_id, node_type):

        node = get_object_or_404(Host if node_type == Host.type else Group, pk=node_id)

        related_set, related_class = node.get_relationships(relation)

        if 'related' not in request.JSON or request.JSON['related']:

            data = [related_node.serialize(request.JSON.get('fields'), request.user) for related_node in related_set.order_by('name')]

        else:

            candidate_set = related_class.objects.order_by('name').exclude(name='all')

            candidate_set = candidate_set.exclude(pk__in=[related.id for related in related_set.all()])

            if related_class == type(node):

                candidate_set = candidate_set.exclude(pk=node.id)

            if relation == 'parents' and node_type == Group.type:

                group_descendants, host_descendants = node.get_descendants()

                candidate_set = candidate_set.exclude(pk__in=[group.id for group in group_descendants])

            elif relation == 'children':

                candidate_set = candidate_set.exclude(pk__in=[group.id for group in node.get_ancestors()])

            data = [candidate.serialize(request.JSON.get('fields'), request.user) for candidate in candidate_set]

        return self._api_response({'data': data})

    @staticmethod
    def delete(request, relation, node_id, node_type):

        node = get_object_or_404(Host if node_type == Host.type else Group, pk=node_id)

        if node.authorizer(request.user)['editable']:

            related_set, related_class = node.get_relationships(relation)

            for selected in request.JSON.get('data', []):

                related_set.remove(get_object_or_404(related_class, pk=selected['id']))

            return HttpResponse(status=204)

        else:

            return HttpResponseForbidden()