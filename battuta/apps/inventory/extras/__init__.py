from ansible.parsing.dataloader import DataLoader
from ansible.vars import VariableManager
from ansible.inventory import Inventory, Host

from apps.inventory.models import Group


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

            host = Host('temp_host')

            host.add_group(self.inventory.get_group(node.name))

        host_vars = self.var_manager.get_vars(self.loader, host=host)

        return host_vars[key] if key in host_vars else None

    def get_host_names(self, pattern):

        return {host.name for host in self.inventory.get_hosts(pattern=pattern)}
