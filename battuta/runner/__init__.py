import os

from collections import namedtuple
from ansible.parsing.dataloader import DataLoader
from ansible.vars import VariableManager
from ansible.inventory import Inventory
from ansible.playbook.play import Play
from ansible.executor.playbook_executor import PlaybookExecutor
from ansible.executor.task_queue_manager import TaskQueueManager
from ansible import constants as c
import django.db

import pprint
pp = pprint.PrettyPrinter(indent=4)

from .callbacks import BattutaCallback, TestCallback

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
                                        'skip_tags',
                                        'listhosts',
                                        'listtasks',
                                        'listtags',
                                        'syntax'])


def play_runner(run_data, runner):

    runner.pid = os.getpid()
    runner.status = 'starting'
    runner.save()

    variable_manager = VariableManager()
    loader = DataLoader()
    inventory = Inventory(loader=loader, variable_manager=variable_manager)
    variable_manager.set_inventory(inventory)

    passwords = {'conn_pass': run_data['remote_pass'], 'become_pass': run_data['become_pass']}

    if 'subset' in run_data:
        inventory.subset(run_data['subset'])

    if 'connection' not in run_data:
        run_data['connection'] = 'paramiko'

    if 'module_path' not in run_data:
        run_data['module_path'] = c.DEFAULT_MODULE_PATH

    if 'forks' not in run_data:
        run_data['forks'] = c.DEFAULT_FORKS

    if 'rsa_key' not in run_data:
        run_data['rsa_key'] = ''

    if 'become' not in run_data:
        run_data['become'] = c.DEFAULT_BECOME

    if 'become_user' not in run_data:
        run_data['become_user'] = c.DEFAULT_BECOME_USER

    if 'become_method' not in run_data:
        run_data['become_method'] = c.DEFAULT_BECOME_METHOD

    if 'check' not in run_data:
        run_data['check'] = None

    if 'tags' not in run_data:
        run_data['tags'] = None

    if 'skip_tags' not in run_data:
        run_data['skip_tags'] = None

    # Create ansible options tuple
    options = AnsibleOptions(connection=run_data['connection'],
                             module_path=run_data['module_path'],
                             forks=run_data['forks'],
                             remote_user=run_data['username'],
                             private_key_file=run_data['rsa_key'],
                             ssh_common_args=None,
                             ssh_extra_args=None,
                             sftp_extra_args=None,
                             scp_extra_args=None,
                             become=run_data['become'],
                             become_method=run_data['become_method'],
                             become_user=run_data['become_user'],
                             verbosity=None,
                             check=run_data['check'],
                             tags=run_data['tags'],
                             skip_tags=run_data['skip_tags'],
                             listhosts=None,
                             listtasks=None,
                             listtags=None,
                             syntax=None)

    if 'playbook' in run_data:
        try:
            pbex = PlaybookExecutor([run_data['playbook_path']],
                                    inventory,
                                    variable_manager,
                                    loader,
                                    options,
                                    passwords)
            pbex._tqm._stdout_callback = BattutaCallback(runner, 'playbook')
            pbex.run()
            runner.status = 'finished'
        except Exception as e:
            runner.status = 'failed'
            runner.message = type(e).__name__ + ': ' + e.__str__()

    elif 'adhoc_task' in run_data:
        play = Play().load(run_data['adhoc_task'], variable_manager=variable_manager, loader=loader)
        try:
            tqm = TaskQueueManager(inventory=inventory,
                                   variable_manager=variable_manager,
                                   passwords=passwords,
                                   loader=loader,
                                   stdout_callback=BattutaCallback(runner, 'adhoc_task'),
                                   options=options)
            tqm.run(play)
        except Exception as e:
            runner.status = 'failed'
            runner.message = type(e).__name__ + ': ' + e.__str__()
        else:
            tqm.cleanup()
            runner.status = 'finished'
    else:
        runner.status = 'failed'
        runner.message = 'Invalid form_data'
    django.db.close_old_connections()
    runner.save()




