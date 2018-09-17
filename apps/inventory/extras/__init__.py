import json

from ansible.parsing.dataloader import DataLoader
from ansible.vars import VariableManager
from ansible.inventory import Inventory, Host as AnsibleHost

from django.shortcuts import get_object_or_404
from django.core.exceptions import ObjectDoesNotExist

from apps.inventory.models import Host, Group
from apps.inventory.forms import HostForm, GroupForm


def build_node(node_dict, node_type, user):

    classes = {
        'hosts': {'node': Host, 'form': HostForm},
        'groups': {'node': Group, 'form': GroupForm}
    }

    if node_dict.get('id', False):

        node = get_object_or_404(classes[node_type]['node'], pk=node_dict['id'])

    else:

        try:

            node = classes[node_type]['node'].objects.get(name=node_dict['name'])

        except ObjectDoesNotExist:

            node = classes[node_type]['node']()

    group_descendants, host_descendants = node.get_descendants()

    setattr(node, 'editable', user.has_perm('users.edit_' + node_type + 's'))

    setattr(node, 'form_class', classes[node_type]['form'])

    setattr(node, 'group_descendants', group_descendants)

    setattr(node, 'host_descendants', host_descendants)

    node.editable = False if node.type == 'group' and node.name == 'all' else node.editable

    return node


class AnsibleInventory:

    def __init__(self, subset=None):

        self.var_manager = VariableManager()

        self.loader = DataLoader()

        self.inventory = Inventory(loader=self.loader, variable_manager=self.var_manager)

        self.var_manager.set_inventory(self.inventory)

        self.inventory.subset(subset)

    def get_variable(self, key, node):

        if node.type == 'hosts':

            host = self.inventory.get_host(node.name)

        else:

            host = AnsibleHost('temp_host')

            host.add_group(self.inventory.get_group(node.name))

        host_vars = self.var_manager.get_vars(self.loader, host=host)

        return host_vars[key] if key in host_vars else None

    def get_host_names(self, pattern):

        return {host.name for host in self.inventory.get_hosts(pattern=pattern)}
