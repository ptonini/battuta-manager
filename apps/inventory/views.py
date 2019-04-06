import json
import csv
import tempfile
import os
import shutil
import configparser
import yaml
import uuid
from xml.etree.ElementTree import ElementTree, Element, SubElement

from django.http import HttpResponse, HttpResponseBadRequest, HttpResponseForbidden, HttpResponseNotAllowed
from django.core.exceptions import ObjectDoesNotExist
from django.shortcuts import get_object_or_404
from django.views.generic import View
from django.core.cache import cache

from apps.inventory.models import Node, Host, Group, Variable
from apps.inventory.forms import HostForm, GroupForm, VariableForm
from apps.inventory.extras import AnsibleInventory, inventory_to_dict, import_from_json, import_from_list
from apps.preferences.extras import get_prefs
from main.extras import download_file
from main.extras.mixins import RESTfulMethods, RESTfulViewMixin


class InventoryView(View):

    @staticmethod
    def get(request):

        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')

        ip = x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')

        if request.user.is_authenticated or ip in get_prefs('ansible_servers').split(','):

            return HttpResponse(json.dumps(inventory_to_dict()), content_type='application/json')

        else:

            return HttpResponseForbidden()


class ManagerView(View, RESTfulMethods):

    @staticmethod
    def _create_node_var_file(node, folder):

        with open(os.path.join(folder, node.name + '.yml'), 'w+') as vars_file:

            vars_file.write('---\n')

            for var in node.variable_set.all():

                vars_file.write(yaml.safe_dump({var.key: var.value}, default_flow_style=False))

    def get(self, request):

        if request.GET['format'] == 'json':

            json_file = tempfile.TemporaryFile(mode='w+')

            json_file.write(json.dumps(inventory_to_dict(include_internal_vars=False)))

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

            config_dict = {'__PAC__EXPORTED__': {'children': dict()}}

            root = Element('FileZilla3')

            tree = ElementTree(root)

            servers = SubElement(root, 'Servers')

            for group in pac_groups:

                groups, hosts = group.get_descendants()

                descendants = [g for g in groups if g.config]

                ancestors = [g for g in group.get_ancestors() if g.config]

                group_uuid = None

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

                    for host in hosts:

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
            with tempfile.TemporaryFile(mode='w+') as source_file:

                for chunk in request.FILES['file_data']:

                    source_file.write(chunk.decode("utf-8"))

                source_file.seek(0, 0)

                result = {'added_hosts': 0, 'added_groups': 0, 'added_vars': 0}

                # Import from CSV
                if request.PATCH['format'] == 'csv':

                    csv_data = csv.reader(source_file)

                    header = next(csv_data)

                    try:

                        host_index = header.index('host')

                    except ValueError:

                        return HttpResponseBadRequest()

                    else:

                        result = import_from_list(csv_data, host_index, result)

                # Import from JSON
                elif request.PATCH['format'] == 'json':

                    # Load JSON data
                    try:

                        json_data = json.loads(source_file.read())

                    except ValueError:

                        return HttpResponseBadRequest()

                    else:

                        result = import_from_json(json_data, result)

                else:

                    return HttpResponseBadRequest()

                return self._api_response({'data': result})

        else:

            return HttpResponseForbidden()


class HostView(View, RESTfulViewMixin):

    model = Host

    form = HostForm


class GroupView(View, RESTfulViewMixin):

    model = Group

    form = GroupForm


class VariableView(View, RESTfulViewMixin):

    model = Variable

    form = VariableForm

    def post(self, request, **kwargs):

        node = get_object_or_404(Node, pk=kwargs['node_id'])

        var = Variable(node=node)

        if var.perms(request.user)['editable']:

            if 'source' in request.JSON.get('meta', {}):

                source_data = request.JSON['meta']['source']

                source = get_object_or_404(Node, pk=source_data['id'])

                if var.perms(request.user)['editable']:

                    for source_var in source.variable_set.all():

                        node.variable_set.update_or_create(key=source_var.key, value=source_var.value)

                    return HttpResponse(status=204)

                else:

                    return HttpResponseForbidden()

            else:

                return self._api_response(self._save_instance(request, var))

        else:

            return HttpResponseForbidden()

    def get(self, request, **kwargs):

        node = get_object_or_404(Node, pk=kwargs['node_id'])

        temp_var = Variable(node=node)

        if temp_var.perms(request.user)['readable']:

            variables = dict()

            inventory = cache.get_or_set('inventory', AnsibleInventory)

            for var in node.variable_set.all():

                variables[var.key] = [var.serialize(request.JSON.get('fields'), request.user)]

                variables[var.key][0]['meta']['primary'] = True

            for ancestor in node.get_child_instance().get_ancestors():

                for var in ancestor.variable_set.all():

                    var_dict = var.serialize(request.JSON.get('fields'), request.user)

                    additional_meta = {
                        'primary': False,
                        'source': ancestor.serialize({'attributes': ['name'], 'links': ['self']}, request.user)
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

        else:

            return HttpResponseForbidden()


class RelationsView(View, RESTfulViewMixin):

    @staticmethod
    def _get_object(kwargs):

        return get_object_or_404(Host if kwargs['node_type'] == Host.type else Group, pk=kwargs['node_id'])

    def post(self, request, **kwargs):

        obj = self._get_object(kwargs)

        if obj.perms(request.user)['editable']:

            related_set, related_class = obj.get_relationships(kwargs['relation'])

            for selected in request.JSON.get('data', []):

                related_set.add(get_object_or_404(related_class, pk=selected['id']))

            return HttpResponse(status=204)

        else:

            return HttpResponseForbidden()

    def get(self, request, **kwargs):

        node = self._get_object(kwargs)

        related_set, related_class = node.get_relationships(kwargs['relation'])

        if 'related' not in request.JSON or request.JSON['related']:

            data = [related_node.serialize(request.JSON.get('fields'), request.user) for related_node in related_set.order_by('name')]

        else:

            candidate_set = related_class.objects.order_by('name').exclude(name='all')

            excluded_ids = [related.id for related in related_set.all()]

            if related_class == type(node):

                excluded_ids.append(node.id)

            if kwargs['relation'] == 'parents' and kwargs['node_type'] == Group.type:

                excluded_ids = excluded_ids + [g.id for g in node.get_descendants()[0]]

            elif kwargs['relation'] == 'children':

                excluded_ids = excluded_ids + [g.id for g in node.get_ancestors()]

            candidate_set = candidate_set.exclude(pk__in=excluded_ids)

            data = [candidate.serialize(request.JSON.get('fields'), request.user) for candidate in candidate_set]

        return self._api_response({'data': data})

    def patch(self, request, **kwargs):

        return HttpResponseNotAllowed(['GET', 'POST', 'DELETE'])

    def delete(self, request, **kwargs):

        node = self._get_object(kwargs)

        if node.perms(request.user)['editable']:

            related_set, related_class = node.get_relationships(kwargs['relation'])

            for selected in request.JSON.get('data', []):

                related_set.remove(get_object_or_404(related_class, pk=selected['id']))

            return HttpResponse(status=204)

        else:

            return HttpResponseForbidden()
