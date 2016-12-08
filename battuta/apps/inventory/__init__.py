from ansible.parsing.dataloader import DataLoader
from ansible.vars import VariableManager
from ansible.inventory import Inventory, Host


class AnsibleInventory:

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
