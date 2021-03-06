import os

from collections import namedtuple
from ansible.parsing.dataloader import DataLoader
from ansible.vars import VariableManager
from ansible.inventory import Inventory
from ansible.playbook.play import Play
from ansible.executor.task_queue_manager import TaskQueueManager
from ansible import constants as c

from .callbacks import AdHocCallback, PlaybookCallback, TestCallback

AnsibleOptions = namedtuple('Options', ['connection',
                                        'module_path',
                                        'forks',
                                        'remote_user',
                                        'private_key_file',
                                        'ssh_common_args',
                                        'ssh_extra_args',
                                        'sftp_extra_args',
                                        'scp_extra_args',
                                        'become',
                                        'become_method',
                                        'become_user',
                                        'verbosity',
                                        'check',
                                        'tags',
                                        'skip_tags'])


def run_playbook(playbook, form_data, runner):

    # Mark play as started
    runner.pid = os.getpid()
    runner.status = 'started'
    runner.save()

    # Create ansible default objects
    variable_manager = VariableManager()
    loader = DataLoader()
    inventory = Inventory(loader=loader, variable_manager=variable_manager)
    variable_manager.set_inventory(inventory)

    # Set inventory subset if available:
    if 'subset' in form_data:
        inventory.subset(form_data['subset'])

    # Add host list to runner object
    host_list = inventory.get_hosts(pattern=runner.hosts)

    # Create password dictionary
    passwords = {'conn_pass': form_data['remote_pass'], 'become_pass': form_data['become_pass']}

    # Set sudo user
    become_user = c.DEFAULT_BECOME_USER
    if 'sudo_user' in form_data:
        become_user = form_data['sudo_user']

    # Create ansible options tuple
    options = AnsibleOptions(connection='paramiko',
                             module_path=c.DEFAULT_MODULE_PATH,
                             forks=c.DEFAULT_FORKS,
                             remote_user=form_data['username'],
                             private_key_file=form_data['rsa_key'],
                             ssh_common_args=None,
                             ssh_extra_args=None,
                             sftp_extra_args=None,
                             scp_extra_args=None,
                             become=form_data['become'],
                             become_method=c.DEFAULT_BECOME_METHOD,
                             become_user=become_user,
                             verbosity=None,
                             check=form_data['check'],
                             tags=form_data['tags'],
                             skip_tags=None)

    # Create ansible play object
    play = Play().load(playbook, variable_manager=variable_manager, loader=loader)

    # Execute play
    tqm = None
    if True:
    # try:
        tqm = TaskQueueManager(inventory=inventory,
                               variable_manager=variable_manager,
                               passwords=passwords,
                               loader=loader,
                               options=options,
                               # stdout_callback=TestCallback()
                               stdout_callback=AdHocCallback(runner, host_list))
        tqm.run(play)
    # finally:
        if tqm is not None:
            tqm.cleanup()
            runner.status = 'finished'
        else:
            runner.status = 'failed'
            runner.message = 'tqm object in not None'
        runner.save()




