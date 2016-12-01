import os
import MySQLdb

from collections import namedtuple
from ansible.parsing.dataloader import DataLoader
from ansible.vars import VariableManager
from ansible.utils.vars import load_extra_vars
from ansible.inventory import Inventory
from ansible.playbook.play import Play
from ansible.executor.playbook_executor import PlaybookExecutor
from ansible.executor.task_queue_manager import TaskQueueManager
from ansible import constants as c
from django.conf import settings

from .callbacks import BattutaCallback

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
                                        'extra_vars',
                                        'listhosts',
                                        'listtasks',
                                        'listtags',
                                        'syntax'])


def play_runner(runner):

    db_conn = MySQLdb.connect(settings.DATABASES['default']['HOST'],
                              settings.DATABASES['default']['USER'],
                              settings.DATABASES['default']['PASSWORD'],
                              settings.DATABASES['default']['NAME'])
    db_conn.autocommit(True)

    with db_conn as cursor:
        cursor.execute('UPDATE runner_runner SET status="starting", pid=%s WHERE id=%s', (os.getpid(), runner.id))

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

    if 'extra_vars' not in runner.data or runner.data['extra_vars'] == '':
        runner.data['extra_vars'] = []
    else:
        runner.data['extra_vars'] = runner.data['extra_vars'].split(' ')

    # Create ansible options tuple
    options = AnsibleOptions(connection=runner.data['connection'],
                             module_path=runner.data['module_path'],
                             forks=runner.data['forks'],
                             remote_user=runner.data['remote_username'],
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
                             extra_vars=runner.data['extra_vars'],
                             listhosts=None,
                             listtasks=None,
                             listtags=None,
                             syntax=None)

    variable_manager = VariableManager()
    loader = DataLoader()
    inventory = Inventory(loader=loader, variable_manager=variable_manager)
    variable_manager.set_inventory(inventory)
    variable_manager.extra_vars = load_extra_vars(loader=loader, options=options)
    passwords = {'conn_pass': runner.data['remote_pass'], 'become_pass': runner.data['become_pass']}

    if 'subset' in runner.data:
        inventory.subset(runner.data['subset'])

    message = None

    pp.pprint(runner.data)

    if 'playbook' in runner.data:
        try:
            pbex = PlaybookExecutor([runner.data['playbook_path']],
                                    inventory,
                                    variable_manager,
                                    loader,
                                    options,
                                    passwords)
            pbex._tqm._stdout_callback = BattutaCallback(runner, db_conn)
            pbex.run()
        except Exception as e:
            status = 'failed'
            message = type(e).__name__ + ': ' + e.__str__()
        else:
            status = 'finished'

    elif 'adhoc_task' in runner.data:
        play = Play().load(runner.data['adhoc_task'], variable_manager=variable_manager, loader=loader)
        try:
            tqm = TaskQueueManager(inventory=inventory,
                                   variable_manager=variable_manager,
                                   passwords=passwords,
                                   loader=loader,
                                   stdout_callback=BattutaCallback(runner, db_conn),
                                   options=options)
            tqm.run(play)
        except Exception as e:
            status = 'failed'
            message = type(e).__name__ + ': ' + e.__str__()
        else:
            tqm.cleanup()
            status = 'finished'
    else:
        status = 'failed'
        message = 'Invalid runner data'

    with db_conn as cursor:
        cursor.execute('SELECT failed_count FROM runner_runnerplay WHERE runner_id=%s', (runner.id,))
        for row in cursor.fetchall():
            if row[0] != 0:
                status = 'finished with errors'
                break
        cursor.execute('UPDATE runner_runner SET status=%s, is_running=FALSE, message=%s WHERE id=%s',
                       (status, message, runner.id))





