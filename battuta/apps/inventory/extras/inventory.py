from ansible.parsing.dataloader import DataLoader
from ansible.vars import VariableManager
from ansible.inventory import Inventory, Host

from django.conf import settings

from apps.inventory.models import Host, Group


class AnsibleInventory:

    @staticmethod
    def to_dict(internal_vars=True):

        data = {'_meta': {'hostvars': dict()}}

        for host in Host.objects.order_by('name'):
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

    def __init__(self):
        self._variable_manager = VariableManager()
        self._loader = DataLoader()
        self._inventory = Inventory(loader=self._loader, variable_manager=self._variable_manager)
        self._variable_manager.set_inventory(self._inventory)

    def get_variable(self, key, node):

        if node.type == 'host':
            host = self._inventory.get_host(node.name)
        else:
            host = Host('temp_host')
            host.add_group(self._inventory.get_group(node.name))

        host_vars = self._variable_manager.get_vars(self._loader, host=host)

        if key in host_vars:
            return host_vars[key]
        else:
            return None


