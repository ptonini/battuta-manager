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

from apps.runner.extras.callbacks import BattutaCallback

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


def run_job(job):

    db_conn = MySQLdb.connect(settings.DATABASES['default']['HOST'],
                              settings.DATABASES['default']['USER'],
                              settings.DATABASES['default']['PASSWORD'],
                              settings.DATABASES['default']['NAME'])
    db_conn.autocommit(True)

    with db_conn as cursor:
        cursor.execute('UPDATE runner_job SET status="starting", pid=%s WHERE id=%s', (os.getpid(), job.id))

    if 'show_skipped' not in job.data:
        job.data['show_skipped'] = c.DISPLAY_SKIPPED_HOSTS

    if 'connection' not in job.data:
        job.data['connection'] = 'paramiko'

    if 'module_path' not in job.data:
        job.data['module_path'] = c.DEFAULT_MODULE_PATH

    if 'forks' not in job.data:
        job.data['forks'] = c.DEFAULT_FORKS

    if 'rsa_key' not in job.data:
        job.data['rsa_key'] = ''

    if 'become' not in job.data:
        job.data['become'] = c.DEFAULT_BECOME

    if not job.data['become_user']:
        job.data['become_user'] = c.DEFAULT_BECOME_USER

    if 'become_method' not in job.data:
        job.data['become_method'] = c.DEFAULT_BECOME_METHOD

    if 'check' not in job.data or job.data['check'] == 'false':
        job.data['check'] = False
    elif job.data['check'] == 'true':
        job.data['show_skipped'] = True
        job.data['check'] = True

    if 'tags' not in job.data:
        job.data['tags'] = ''

    if 'skip_tags' not in job.data:
        job.data['skip_tags'] = ''

    if 'extra_vars' not in job.data or job.data['extra_vars'] == '':
        job.data['extra_vars'] = []
    else:
        job.data['extra_vars'] = job.data['extra_vars'].split(' ')

    # Create ansible options tuple
    options = AnsibleOptions(connection=job.data['connection'],
                             module_path=job.data['module_path'],
                             forks=job.data['forks'],
                             remote_user=job.data['remote_user'],
                             private_key_file=job.data['rsa_key'],
                             ssh_common_args=None,
                             ssh_extra_args=None,
                             sftp_extra_args=None,
                             scp_extra_args=None,
                             become=job.data['become'],
                             become_method=job.data['become_method'],
                             become_user=job.data['become_user'],
                             verbosity=None,
                             check=job.data['check'],
                             tags=job.data['tags'],
                             skip_tags=job.data['skip_tags'],
                             extra_vars=job.data['extra_vars'],
                             listhosts=None,
                             listtasks=None,
                             listtags=None,
                             syntax=None)

    variable_manager = VariableManager()
    loader = DataLoader()
    inventory = Inventory(loader=loader, variable_manager=variable_manager)
    variable_manager.set_inventory(inventory)
    variable_manager.extra_vars = load_extra_vars(loader=loader, options=options)
    passwords = {'conn_pass': job.data['remote_pass'], 'become_pass': job.data['become_pass']}

    if 'subset' in job.data:
        inventory.subset(job.data['subset'])

    message = None

    if 'playbook' in job.data:
        try:
            pbex = PlaybookExecutor([job.data['playbook_path']],
                                    inventory,
                                    variable_manager,
                                    loader,
                                    options,
                                    passwords)
            pbex._tqm._stdout_callback = BattutaCallback(job, db_conn)
            pbex.run()
        except Exception as e:
            status = 'failed'
            message = type(e).__name__ + ': ' + e.__str__()
        else:
            status = 'finished'

    elif 'adhoc_task' in job.data:
        play = Play().load(job.data['adhoc_task'], variable_manager=variable_manager, loader=loader)
        try:
            tqm = TaskQueueManager(inventory=inventory,
                                   variable_manager=variable_manager,
                                   passwords=passwords,
                                   loader=loader,
                                   stdout_callback=BattutaCallback(job, db_conn),
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

        cursor.execute('SELECT has_exceptions FROM runner_job WHERE id=%s', (job.id,))

        if cursor.fetchone()[0]:
            status = 'finished with errors'

        cursor.execute('UPDATE runner_job SET status=%s, is_running=FALSE, message=%s WHERE id=%s',
                       (status, message, job.id))





