import json

from ansible.parsing.dataloader import DataLoader
from ansible.vars import VariableManager
from ansible.inventory import Inventory, Host as AnsibleHost

from django.shortcuts import get_object_or_404
from django.core.exceptions import ObjectDoesNotExist
from django.conf import settings

from apps.inventory.models import Host, Group
from apps.inventory.forms import HostForm, GroupForm



node_classes = {
    'host': {'node': Host, 'form': HostForm},
    'group': {'node': Group, 'form': GroupForm}
}

node_relations = {
    'parents': {},
    'children': {},
    'members': {},
}


def load_node(node_id, node_type, user):

    node = get_object_or_404(node_classes[node_type]['node'], pk=node_id)

    group_descendants, host_descendants = node.get_descendants()

    setattr(node, 'editable', user.has_perm('users.edit_' + node_type + 's'))

    setattr(node, 'form_class', node_classes[node_type]['form'])

    setattr(node, 'group_descendants', group_descendants)

    setattr(node, 'host_descendants', host_descendants)

    node.editable = False if node.type == 'group' and node.name == 'all' else node.editable

    return node


def inventory_to_dict(internal_vars=True):

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


class AnsibleInventory:

    def __init__(self, subset=None):

        self.var_manager = VariableManager()

        self.loader = DataLoader()

        self.inventory = Inventory(loader=self.loader, variable_manager=self.var_manager)

        self.var_manager.set_inventory(self.inventory)

        self.inventory.subset(subset)

    def get_variable(self, key, node):

        if node.type == 'host':

            host = self.inventory.get_host(node.name)

        else:

            host = AnsibleHost('temp_host')

            host.add_group(self.inventory.get_group(node.name))

        host_vars = self.var_manager.get_vars(self.loader, host=host)

        return host_vars[key] if key in host_vars else None

    def get_host_names(self, pattern):

        return {host.name for host in self.inventory.get_hosts(pattern=pattern)}
