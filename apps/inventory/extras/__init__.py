from ansible.parsing.dataloader import DataLoader
from ansible.vars.manager import VariableManager
from ansible.inventory.manager import InventoryManager
from ansible.inventory.host import Host as AnsibleHost

from django.conf import settings
from django.core.cache import cache
from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver

from apps.inventory.models import Host, Group, Variable


def inventory_to_dict(include_internal_vars=True):

    data = {g.name: g.to_ansible_dict() for g in Group.objects.all()}

    data['ungrouped'] = {'hosts': [h.name for h in Host.objects.filter(group=None)]}

    data['_meta'] = {'hostvars': {h.name: h.vars_dict() for h in Host.objects.exclude(variable=None)}}

    if include_internal_vars:

        if 'vars' not in data['all']:

            data['all']['vars'] = dict()

        data['all']['vars']['roles_path'] = settings.ROLES_PATH

        data['all']['vars']['repository_path'] = settings.REPOSITORY_PATH

        data['all']['vars']['userdata_path'] = settings.USERDATA_PATH

    return data


def import_from_json(json_data, response):

    # Iterate over JSON data host vars
    for host_name in json_data.get('_meta', {}).get('hostvars', {}):

        host, created = Host.objects.get_or_create(name=host_name)

        response['added_hosts'] += 1 if created else 0

        for key in json_data['_meta']['hostvars'][host_name]:

            value = json_data['_meta']['hostvars'][host_name][key]

            if key == '_description':

                host.description = value

            else:

                var, created = Variable.objects.get_or_create(key=key, value=value, node=host.node_ptr)

                response['added_vars'] += 1 if created else 0

                var.save()

        host.save()

    json_data.pop('_meta', None)

    # Iterate over JSON data groups
    for group_name in json_data:

        group, created = Group.objects.get_or_create(name=group_name)

        # Iterate over group children

        for child_name in json_data[group_name].get('children', []):

            child, created = Group.objects.get_or_create(name=child_name)

            response['added_groups'] += 1 if created else 0

            group.children.add(child)

        # Iterate over group hosts

        for host_name in json_data[group_name].get('hosts', []):

            host, created = Host.objects.get_or_create(name=host_name)

            response['added_hosts'] += 1 if created else 0

            group.members.add(host)

        # Iterate over group vars

        for key in json_data[group_name].get('vars', {}):

            if key == '_description':

                group.description = json_data[group_name]['vars'][key]

            else:

                var, created = Variable.objects.get_or_create(key=key, node=group.node_ptr)

                response['added_vars'] += 1 if created else 0

                var.value = json_data[group_name]['vars'][key]

                var.save()

        if group.name != 'ungrouped':

            group.save()

            response['added_groups'] += 1 if created else 0

        else:

            group.delete()

    return response


def import_from_list(header, host_list, host_index, result):

    for row in host_list:

        host, created = Host.objects.get_or_create(name=row[host_index])

        result['added_hosts'] += 1 if created else 0

        for index, cell in enumerate(row):

            if index != host_index and cell:

                if header[index] == 'group':

                    group, created = Group.objects.get_or_create(name=cell)

                    result['added_groups'] += 1 if created else 0

                    host.group_set.add(group)

                    host.save()

                else:

                    var, created = Variable.objects.get_or_create(key=header[index], node=host.node_ptr)

                    result['added_vars'] += 1 if created else 0

                    var.value = cell

                    var.save()

    return result


class AnsibleInventory:

    def __init__(self, subset=None):

        self.loader = DataLoader()

        self.inventory = InventoryManager(loader=self.loader)

        self._build_inventory()

        self.inventory.subset(subset)

    def _build_inventory(self):

        inventory = getattr(self.inventory, '_inventory')

        for g in Group.objects.all():

            inventory.add_group(g.name)

            for h in g.members.all():

                inventory.add_host(h.name, g.name)

            for var in g.variable_set.all():

                inventory.set_variable(g.name, var.key, var.value)

            for c in g.children.all():

                inventory.add_group(c.name)

                inventory.add_child(g.name, c.name)

        inventory.set_variable('all', 'repository_path', settings.REPOSITORY_PATH)

        inventory.set_variable('all', 'roles_path', settings.ROLES_PATH)

        inventory.set_variable('all', 'userdata_path', settings.USERDATA_PATH)

        for h in Host.objects.all():

            inventory.add_host(h.name, 'all')

            for var in h.variable_set.all():

                inventory.set_variable(h.name, var.key, var.value)

        for h in Host.objects.filter(group=None):

            inventory.add_host(h.name, 'ungrouped')

    @property
    def var_manager(self):

        return VariableManager(loader=self.loader, inventory=self.inventory)

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
