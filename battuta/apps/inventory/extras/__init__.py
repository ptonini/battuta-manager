import json

from ansible.parsing.dataloader import DataLoader
from ansible.vars import VariableManager
from ansible.inventory import Inventory, Host as AnsibleHost
from django.conf import settings

from apps.inventory.models import Host, Group


class BattutaInventory:

    def __init__(self):

        self._variable_manager = VariableManager()

        self._loader = DataLoader()

        self._inventory = Inventory(loader=self._loader, variable_manager=self._variable_manager)

        self._variable_manager.set_inventory(self._inventory)

    @staticmethod
    def to_dict(internal_vars=True):

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
    def get_node_ancestors(node):

        ancestors = set()

        if node.id:

            parents = node.group_set.all()

            while len(parents) > 0:

                step_list = list()

                for parent in parents:

                    if parent not in ancestors:

                        ancestors.add(parent)

                    for group in parent.group_set.all():

                        step_list.append(group)

                parents = step_list

            if node.name != 'all':

                ancestors.add(Group.objects.get(name='all'))

        return ancestors

    @staticmethod
    def get_node_descendants(node):

        if node.type == 'group' and node.id:

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

            return group_descendants, members.union({host for group in group_descendants for host in group.members.all()})

        else:

            return set(), set()

    def get_variable(self, key, node):

        if node.type == 'host':

            host = self._inventory.get_host(node.name)

        else:

            host = AnsibleHost('temp_host')

            host.add_group(self._inventory.get_group(node.name))

        host_vars = self._variable_manager.get_vars(self._loader, host=host)

        return host_vars[key] if key in host_vars else None
