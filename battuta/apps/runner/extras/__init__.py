import os
import MySQLdb

from collections import namedtuple
from ansible.utils.vars import load_extra_vars
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

    message = None

    job.data['show_skipped'] = job.data.get('show_skipped', c.DISPLAY_SKIPPED_HOSTS)

    if 'extra_vars' not in job.data or job.data['extra_vars'] == '':

        job.data['extra_vars'] = []

    else:

        job.data['extra_vars'] = job.data['extra_vars'].split(' ')

    if 'check' not in job.data or job.data['check'] == 'false':

        job.data['check'] = False

    elif job.data['check'] == 'true':

        job.data['show_skipped'] = True

        job.data['check'] = True

    # Create ansible options tuple
    options = AnsibleOptions(connection=job.data.get('connection', 'paramiko'),
                             module_path=job.data.get('module_path'),
                             forks=job.data.get('forks', c.DEFAULT_FORKS),
                             remote_user=job.data['remote_user'],
                             private_key_file=job.data.get('rsa_file', ''),
                             ssh_common_args=None,
                             ssh_extra_args=None,
                             sftp_extra_args=None,
                             scp_extra_args=None,
                             become=job.data.get('become', c.DEFAULT_BECOME),
                             become_method=job.data.get('become_method', c.DEFAULT_BECOME_METHOD),
                             become_user=job.data['become_user'] if job.data['become_user'] else c.DEFAULT_BECOME_USER,
                             verbosity=None,
                             check=job.data['check'],
                             tags=job.data.get('tags', ''),
                             skip_tags=job.data.get('skip_tags', ''),
                             extra_vars=job.data['extra_vars'],
                             listhosts=None,
                             listtasks=None,
                             listtags=None,
                             syntax=None)

    job.data['var_manager'].extra_vars = load_extra_vars(loader=job.data['loader'], options=options)

    passwords = {'conn_pass': job.data['remote_pass'], 'become_pass': job.data['become_pass']}

    if 'playbook' in job.data:

        try:

            pbex = PlaybookExecutor([job.data['playbook_path']],
                                    job.data['inventory'],
                                    job.data['var_manager'],
                                    job.data['loader'],
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

        play = Play().load(job.data['adhoc_task'], variable_manager=job.data['var_manager'], loader=job.data['loader'])

        try:

            tqm = TaskQueueManager(inventory=job.data['inventory'],
                                   variable_manager=job.data['var_manager'],
                                   passwords=passwords,
                                   loader=job.data['loader'],
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

        message = 'Invalid job data'

    if job.data['has_exceptions']:

        status = 'finished with errors'

    try:

        os.remove(job.data.get('rsa_file', ''))

    except OSError:

        pass

    with db_conn as cursor:

        cursor.execute('UPDATE runner_job SET status=%s, is_running=FALSE, message=%s WHERE id=%s',
                       (status, message, job.id))

