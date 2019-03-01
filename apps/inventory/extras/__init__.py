from ansible.parsing.dataloader import DataLoader
from ansible.vars.manager import VariableManager
from ansible.inventory.manager import InventoryManager
from ansible.inventory.host import Host as AnsibleHost

from django.conf import settings
from django.core.cache import cache
from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver

from apps.inventory.models import Host, Group


def inventory_to_dict(include_internal_vars=True):

    data = {g.name: g.to_ansible_dict() for g in Group.objects.all()}

    data['ungrouped'] = [h.name for h in Host.objects.filter(group=None)]

    data['_meta'] = {'hostvars': {h.name: h.vars_dict() for h in Host.objects.exclude(variable=None)}}

    if include_internal_vars:

        if 'vars' not in data['all']:

            data['all']['vars'] = dict()

        data['all']['vars']['roles_path'] = settings.ROLES_PATH

        data['all']['vars']['repository_path'] = settings.REPOSITORY_PATH

        data['all']['vars']['userdata_path'] = settings.USERDATA_PATH

    return data


class AnsibleInventory:

    def __init__(self, subset=None):

        self.loader = DataLoader()

        self.inventory = InventoryManager(loader=self.loader, sources=settings.INVENTORY_SCRIPT)

        self.var_manager= VariableManager(loader=self.loader, inventory=self.inventory)

        self.inventory.subset(subset)

    def get_variable(self, key, node):

        if node.type == Host.type:

            host = self.inventory.get_host(node.name)

        else:

            host = AnsibleHost('temp_host')

            self.inventory.groups[node.name].add_host(host)

        host_vars = self.var_manager.get_vars(host=host)

        return host_vars[key] if key in host_vars else None

    def get_host_names(self, pattern):

        return {host.name for host in self.inventory.get_hosts(pattern=pattern)}


@receiver(post_save)
@receiver(post_delete)
@receiver(m2m_changed)
def clear_inventory(sender, **kwargs):

    if sender in [Host, Group]:

        cache.delete('inventory')