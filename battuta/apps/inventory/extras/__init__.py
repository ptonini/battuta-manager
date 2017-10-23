import json

from ansible.parsing.dataloader import DataLoader
from ansible.vars import VariableManager
from ansible.inventory import Inventory, Host as AnsibleHost
from django.shortcuts import get_object_or_404

from apps.inventory.models import Host, Group
from apps.inventory.forms import HostForm, GroupForm


def node_to_dict(node):

        default_fields = {
            'name': node.name,
            'type': node.type,
            'description': node.description,
            'id': node.id,
        }

        if hasattr(node, 'editable'):

            default_fields['editable'] = node.editable

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


def build_node(node_dict, node_type, user):

    classes = {
        'host': {'node': Host, 'form': HostForm},
        'group': {'node': Group, 'form': GroupForm}
    }

    if node_dict.get('id', False):

        node = get_object_or_404(classes[node_type]['node'], pk=node_dict['id'])

    else:

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

        if node.type == 'host':

            host = self.inventory.get_host(node.name)

        else:

            host = AnsibleHost('temp_host')

            host.add_group(self.inventory.get_group(node.name))

        host_vars = self.var_manager.get_vars(self.loader, host=host)

        return host_vars[key] if key in host_vars else None

    def get_host_names(self, pattern):

        return {host.name for host in self.inventory.get_hosts(pattern=pattern)}
