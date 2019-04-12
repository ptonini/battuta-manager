import os
import pymysql
import shutil

from collections import namedtuple
from ansible.utils.vars import load_extra_vars
from ansible.executor.task_queue_manager import TaskQueueManager
from ansible import constants as c
from django.conf import settings

from apps.runner.extras.callbacks import BattutaCallback


AnsibleOptions = namedtuple('Options', [
    'connection',
    'module_path',
    'forks',
    'become',
    'become_method',
    'become_user',
    'check',
    'diff',
    'remote_user',
    'private_key_file',
    'tags',
    'skip_tags',
    'extra_vars'
])


def run_job(job):

    db_conn = pymysql.connect(
        settings.DATABASES['default']['HOST'],
        settings.DATABASES['default']['USER'],
        settings.DATABASES['default']['PASSWORD'],
        settings.DATABASES['default']['NAME']
    )
    
    db_conn.autocommit(True)

    with db_conn.cursor() as cursor:

        cursor.execute('UPDATE runner_job SET status=%s, pid=%s WHERE id=%s', ('starting', os.getpid(), job.id))

    message = None

    job.data['show_skipped'] = job.data.get('show_skipped', getattr(c, 'DISPLAY_SKIPPED_HOSTS'))

    job.data['show_skipped'] = True if job.check else job.data['show_skipped']

    # Create ansible options tuple
    options = AnsibleOptions(
        connection=job.data.get('connection', 'paramiko'),
        module_path=job.data.get('module_path'),
        forks=job.data.get('forks', getattr(c, 'DEFAULT_FORKS')),
        become=job.data.get('become', getattr(c, 'DEFAULT_BECOME')),
        become_method=job.data.get('become_method', getattr(c, 'DEFAULT_BECOME_METHOD')),
        become_user=job.data.get('become_user', getattr(c, 'DEFAULT_BECOME_USER')),
        check=job.check,
        diff=False,
        remote_user=job.data['remote_user'],
        private_key_file=job.data.get('rsa_file', ''),
        tags=job.data['tags'].split(' ') if job.data.get('tags') else list(),
        skip_tags=job.data['skip_tags'].split() if job.data.get('skip_tags') else list(),
        extra_vars=job.data['extra_vars'].split() if job.data.get('extra_vars') else list()
    )

    job.data['var_manager'].extra_vars = load_extra_vars(loader=job.data['loader'], options=options)

    passwords = {'conn_pass': job.data['remote_pass'], 'become_pass': job.data['become_pass']}

    tqm = TaskQueueManager(
        inventory=job.data['inventory'],
        variable_manager=job.data['var_manager'],
        passwords=passwords,
        loader=job.data['loader'],
        stdout_callback=BattutaCallback(job, db_conn),
        options=options
    )

    try:

        for play in job.data['plays']:

            tqm.run(play)

    except Exception as e:

        status = 'failed'

        message = type(e).__name__ + ': ' + e.__str__()

    else:

        status = 'finished with errors' if job.data['has_exceptions'] else 'finished'

        tqm.send_callback('v2_playbook_on_stats', getattr(tqm, '_stats'))

    finally:

        tqm.cleanup()

        job.data['loader'].cleanup_all_tmp_files()

        shutil.rmtree(getattr(c, 'DEFAULT_LOCAL_TMP'), True)

    try:

        os.remove(job.data.get('rsa_file', ''))

    except OSError:

        pass

    with db_conn as cursor:

        cursor.execute('UPDATE runner_job SET status=%s, message=%s WHERE id=%s', (status, message, job.id))
