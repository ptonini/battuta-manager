import os
import django.db

from collections import namedtuple
from ansible.parsing.dataloader import DataLoader
from ansible.vars import VariableManager
from ansible.inventory import Inventory
from ansible.playbook.play import Play
from ansible.executor.playbook_executor import PlaybookExecutor
from ansible.executor.task_queue_manager import TaskQueueManager
from ansible import constants as c
from .callbacks import BattutaCallback, TestCallback


import pprint
pp = pprint.PrettyPrinter(indent=4)

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


def play_runner(runner):

    runner.pid = os.getpid()
    runner.status = 'starting'
    runner.save()

    variable_manager = VariableManager()
    loader = DataLoader()
    inventory = Inventory(loader=loader, variable_manager=variable_manager)
    variable_manager.set_inventory(inventory)

    passwords = {'conn_pass': runner.data['remote_pass'], 'become_pass': runner.data['become_pass']}

    if 'subset' in runner.data:
        inventory.subset(runner.data['subset'])

    if 'show_skipped' not in runner.data:
        runner.data['show_skipped'] = c.DISPLAY_SKIPPED_HOSTS

    if 'connection' not in runner.data:
        runner.data['connection'] = 'paramiko'

    if 'module_path' not in runner.data:
        runner.data['module_path'] = c.DEFAULT_MODULE_PATH

    if 'forks' not in runner.data:
        runner.data['forks'] = c.DEFAULT_FORKS

    if 'rsa_key' not in runner.data:
        runner.data['rsa_key'] = ''

    if 'become' not in runner.data:
        runner.data['become'] = c.DEFAULT_BECOME

    if 'become_user' not in runner.data:
        runner.data['become_user'] = c.DEFAULT_BECOME_USER

    if 'become_method' not in runner.data:
        runner.data['become_method'] = c.DEFAULT_BECOME_METHOD

    if 'check' not in runner.data or runner.data['check'] == 'false':
        runner.data['check'] = False
    elif runner.data['check'] == 'true':
        runner.data['show_skipped'] = True
        runner.data['check'] = True

    if 'tags' not in runner.data or runner.data['tags'] == '':
        runner.data['tags'] = None

    if 'skip_tags' not in runner.data or runner.data['skip_tags'] == '':
        runner.data['skip_tags'] = None

    # Create ansible options tuple
    options = AnsibleOptions(connection=runner.data['connection'],
                             module_path=runner.data['module_path'],
                             forks=runner.data['forks'],
                             remote_user=runner.data['username'],
                             private_key_file=runner.data['rsa_key'],
                             ssh_common_args=None,
                             ssh_extra_args=None,
                             sftp_extra_args=None,
                             scp_extra_args=None,
                             become=runner.data['become'],
                             become_method=runner.data['become_method'],
                             become_user=runner.data['become_user'],
                             verbosity=None,
                             check=runner.data['check'],
                             tags=runner.data['tags'],
                             skip_tags=runner.data['skip_tags'],
                             listhosts=None,
                             listtasks=None,
                             listtags=None,
                             syntax=None)

    if 'playbook' in runner.data:
        try:
            pbex = PlaybookExecutor([runner.data['playbook_path']],
                                    inventory,
                                    variable_manager,
                                    loader,
                                    options,
                                    passwords)
            pbex._tqm._stdout_callback = BattutaCallback(runner)
            pbex.run()
        except Exception as e:
            runner.status = 'failed'
            runner.message = type(e).__name__ + ': ' + e.__str__()
        else:
            runner.status = 'finished'

    elif 'adhoc_task' in runner.data:
        play = Play().load(runner.data['adhoc_task'], variable_manager=variable_manager, loader=loader)
        try:
            tqm = TaskQueueManager(inventory=inventory,
                                   variable_manager=variable_manager,
                                   passwords=passwords,
                                   loader=loader,
                                   stdout_callback=BattutaCallback(runner),
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
    for play in runner.runnerplay_set.all():
        for task in play.runnertask_set.all():
            for result in task.runnerresult_set.all():
                if result.status in ['unreachable', 'failed', 'error']:
                    runner.status = 'finished with errors'
    runner.save()




