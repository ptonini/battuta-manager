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

from .callbacks import BattutaCallback, PlaybookCallback, TestCallback

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


def play_runner(form_data, runner):

    runner.pid = os.getpid()
    runner.status = 'starting'
    runner.save()

    variable_manager = VariableManager()
    loader = DataLoader()
    inventory = Inventory(loader=loader, variable_manager=variable_manager)
    variable_manager.set_inventory(inventory)

    if 'subset' in form_data:
        inventory.subset(form_data['subset'])

    passwords = {'conn_pass': form_data['remote_pass'], 'become_pass': form_data['become_pass']}

    if 'become' not in form_data:
        form_data['become'] = c.DEFAULT_BECOME

    if 'rsa_key' not in form_data:
        form_data['rsa_key'] = ''

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
                             skip_tags=None,
                             listhosts=None,
                             listtasks=None,
                             listtags=None,
                             syntax=None)

    if 'playbook' in form_data:
        try:
            pbex = PlaybookExecutor([form_data['playbook_path']],
                                    inventory,
                                    variable_manager,
                                    loader,
                                    options,
                                    passwords)
            #pbex._tqm._stdout_callback = BattutaCallback(runner, form_data)
            result = pbex.run()
            print result
            runner.status = 'finished'
        except Exception as e:
            runner.status = 'failed'
            runner.message = type(e).__name__ + ': ' + e.__str__()
        finally:
            django.db.close_old_connections()
            runner.save()

    elif 'adhoc_task' in form_data:
        play = Play().load(form_data['adhoc_task'], variable_manager=variable_manager, loader=loader)
        tqm = None
        try:
            tqm = TaskQueueManager(inventory=inventory,
                                   variable_manager=variable_manager,
                                   passwords=passwords,
                                   loader=loader,
                                   options=options,
                                   stdout_callback=BattutaCallback(runner, form_data))
            tqm.run(play)
        finally:
            if tqm is None:
                runner.status = 'failed'
            else:
                tqm.cleanup()
                runner.status = 'finished'
            django.db.close_old_connections()
            runner.save()

    else:
        runner.status = 'failed'
        runner.message = 'Invalid form_data'
        django.db.close_old_connections()
        runner.save()




