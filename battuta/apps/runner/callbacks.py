import os
import json

from ansible.plugins.callback import CallbackBase
from django.conf import settings

import pprint
pp = pprint.PrettyPrinter(indent=4)

# from __main__ import display as global_display

try:
    from __main__ import display as global_display
except ImportError:
    from ansible.utils.display import Display
    global_display = Display()


class BattutaCallback(CallbackBase):
    def __init__(self, runner, db_conn):
        super(BattutaCallback, self).__init__()
        self._db_conn = db_conn
        self._runner = runner
        self._current_play_id = None
        self._current_task_id = None
        self._current_task_module = None
        self._inventory = None

    @staticmethod
    def _extract_result(result):
        return result._host.get_name(), result._result

    def _get_current_play_failed_count(self):
        with self._db_conn as cursor:
            cursor.execute('SELECT failed_count FROM runner_runnerplay WHERE id=%s', (self._current_play_id,))
            row = cursor.fetchone()
            return row[0]

    def _increase_current_play_failed_count(self):
        failed_count = self._get_current_play_failed_count() + 1
        with self._db_conn as cursor:
            cursor.execute('UPDATE runner_runnerplay SET failed_count=%s WHERE id=%s',
                           (failed_count, self._current_play_id))

    def _get_current_task_host_count(self):
        with self._db_conn as cursor:
            cursor.execute('SELECT host_count FROM runner_runnertask WHERE id=%s', (self._current_task_id,))
            row = cursor.fetchone()
            return row[0]

    def _save_result(self, host, status, message, response):

        with self._db_conn as cursor:
            cursor.execute('SELECT id FROM runner_runnerresult WHERE runner_task_id=%s AND host=%s',
                           (self._current_task_id, host))
            if cursor.rowcount == 0:
                cursor.execute('INSERT INTO runner_runnerresult (host,status,message,response, runner_task_id) '
                               'VALUES (%s, %s, %s, %s, %s)',
                               (host, status, message, json.dumps(response), self._current_task_id))
            else:
                row = cursor.fetchone()
                cursor.execute('UPDATE runner_runnerresult SET host=%s, status=%s, message=%s, response=%s '
                               'WHERE id=%s', (host, status, message, json.dumps(response), row[0]))

    def v2_playbook_on_no_hosts_matched(self):
        with self._db_conn as cursor:
            cursor.execute('UPDATE runner_runner SET message="No hosts matched" WHERE id=%s', (self._runner.id,))

    def v2_playbook_on_play_start(self, play):
        with self._db_conn as cursor:
            cursor.execute('UPDATE runner_runner SET status="running" WHERE id=%s', (self._runner.id,))

        # Set inventory object
        self._inventory = play._variable_manager._inventory

        # Count hosts in play
        host_count = len(self._inventory.get_hosts(play.__dict__['_ds']['hosts']))

        # Get host pattern
        hosts = ', '.join(play.__dict__['_attributes']['hosts'])

        # Set play become value
        become = False
        if play.__dict__['_attributes']['become']:
            become = True

        # Set play name
        play_name = play.get_name().strip()
        if self._runner.type == 'adhoc':
            play_name = 'AdHoc task'

        # Set play gather facts value
        gather_facts = False
        if play.__dict__['_attributes']['gather_facts']:
            gather_facts = play.__dict__['_attributes']['gather_facts']

        # Save play to database
        with self._db_conn as cursor:
            cursor.execute('INSERT INTO runner_runnerplay '
                           '(runner_id,name,hosts,become,gather_facts,host_count,failed_count)'
                           'VALUES (%s, %s, %s, %s, %s, %s, %s)',
                           (self._runner.id, play_name, hosts, become, gather_facts, host_count, 0))
            self._current_play_id = cursor.lastrowid

    def v2_playbook_on_task_start(self, task, is_conditional):

        # Get current play data
        with self._db_conn as cursor:
            cursor.execute('SELECT gather_facts,host_count,failed_count '
                           'FROM runner_runnerplay WHERE id=%s', (self._current_play_id,))
            row = cursor.fetchone()
            if row[0] == 0:
                gather_facts = False
            else:
                gather_facts = True
            play_host_count = row[1]
            play_failed_count = row[2]

        # Set task module
        self._current_task_module = task.__dict__['_attributes']['action']

        # Set task name
        if self._current_task_module == 'setup' and not self._current_task_id and gather_facts:
            task_host_count = play_host_count
            task_name = 'Gather facts'
        elif self._current_task_module == 'include':
            task_host_count = None
            task_name = 'Including ' + task.__dict__['_ds']['include']
        else:
            task_host_count = play_host_count - play_failed_count
            task_name = task.get_name().strip()

        with self._db_conn as cursor:
            cursor.execute('INSERT INTO runner_runnertask (runner_play_id,name,module,host_count) '
                           'VALUES (%s, %s, %s, %s) ',
                           (self._current_play_id, task_name, self._current_task_module, task_host_count))
            self._current_task_id = cursor.lastrowid

    def v2_playbook_on_handler_task_start(self, task):

        # Get current play failed hosts count
        handler_name = 'Handler - ' + task.get_name().strip()
        self._current_task_module = task.__dict__['_attributes']['action']
        handler_host_count = len(self._inventory._restriction) - self._get_current_play_failed_count()

        with self._db_conn:
            cursor = self._db_conn.cursor()
            cursor.execute('INSERT INTO runner_runnertask (runner_play_id,name,module,host_count) '
                           'VALUES (%s, %s, %s, %s) ',
                           (self._current_play_id, handler_name, self._current_task_module, handler_host_count))
            self._current_task_id = cursor.lastrowid

    def v2_playbook_on_stats(self, stats_list):
        stats_dict = stats_list.__dict__
        stats_list = list()
        for key, value in stats_dict['processed'].iteritems():
            row = [key]
            if key in stats_dict['ok']:
                row.append(stats_dict['ok'][key])
            else:
                row.append(0)

            if key in stats_dict['changed']:
                row.append(stats_dict['changed'][key])
            else:
                row.append(0)

            if key in stats_dict['dark']:
                row.append(stats_dict['dark'][key])
            else:
                row.append(0)

            if key in stats_dict['failures']:
                row.append(stats_dict['failures'][key])
            else:
                row.append(0)

            if key in stats_dict['skipped']:
                row.append(stats_dict['skipped'][key])
            else:
                row.append(0)
            stats_list.append(row)

        with self._db_conn as cursor:
            cursor.execute('UPDATE runner_runner SET stats=%s WHERE id=%s', (str(stats_list), self._runner.id))

    def v2_runner_on_failed(self, result, ignore_errors=False):
        host, response = self._extract_result(result)
        self._increase_current_play_failed_count()
        message = None
        if 'msg' in response:
            message = response['msg']
        if 'exception' in response:
            message = 'Exception raised'
        elif self._current_task_module == 'shell' or self._current_task_module == 'script':
            message = response['stdout'] + response['stderr']
        self._save_result(host, 'failed', message, response)

    def v2_runner_on_ok(self, result):
        host, response = self._extract_result(result)
        status = 'ok'
        message = None
        if 'msg' in response:
            message = response['msg']

        if self._current_task_module == 'setup':
            facts = {'ansible_facts': response['ansible_facts']}
            filename = (os.path.join(settings.FACTS_DIR, host))
            with open(filename, "w") as f:
                f.write(json.dumps(facts, indent=4))
                response['ansible_facts'] = 'saved to disc'
                message = 'Facts saved to disc'
        elif self._current_task_module == 'command' or self._current_task_module == 'script':
            message = response['stdout'] + response['stderr']
        elif response['changed']:
            status = 'changed'
        self._save_result(host, status, message, response)

    def v2_runner_on_skipped(self, result):
        host, response = self._extract_result(result)
        if self._runner.data['show_skipped']:
            message = None
            if 'skip_reason' in response:
                message = response['skip_reason']
            elif 'msg' in response:
                message = response['msg']
            self._save_result(host, 'skipped', message, response)
        else:
            host_count = self._get_current_task_host_count() - 1
            with self._db_conn as cursor:
                cursor.execute('UPDATE runner_runnertask SET host_count=%s WHERE id=%s',
                               (host_count, self._current_task_id))

    def v2_runner_on_unreachable(self, result):
        host, response = self._extract_result(result)
        self._increase_current_play_failed_count()
        message = None
        if 'msg' in response:
            message = response['msg']
        self._save_result(host, 'unreachable', message, response)


class TestCallback(CallbackBase):

    def set_play_context(self, play_context):
        pass

    def on_any(self, *args, **kwargs):
        pass

    def runner_on_failed(self, host, res, ignore_errors=False):
        pass

    def runner_on_ok(self, host, res):
        pass

    def runner_on_skipped(self, host, item=None):
        pass

    def runner_on_unreachable(self, host, res):
        pass

    def runner_on_no_hosts(self):
        pass

    def runner_on_async_poll(self, host, res, jid, clock):
        pass

    def runner_on_async_ok(self, host, res, jid):
        pass

    def runner_on_async_failed(self, host, res, jid):
        pass

    def playbook_on_start(self):
        pass

    def playbook_on_notify(self, host, handler):
        pass

    def playbook_on_no_hosts_matched(self):
        pass

    def playbook_on_no_hosts_remaining(self):
        pass

    def playbook_on_task_start(self, name, is_conditional):
        pass

    def playbook_on_vars_prompt(self, varname, private=True, prompt=None, encrypt=None, confirm=False, salt_size=None, salt=None, default=None):
        pass

    def playbook_on_setup(self):
        pass

    def playbook_on_import_for_host(self, host, imported_file):
        pass

    def playbook_on_not_import_for_host(self, host, missing_file):
        pass

    def playbook_on_play_start(self, name):
        pass

    def playbook_on_stats(self, stats):
        pass

    def on_file_diff(self, host, diff):
        pass

    def v2_on_any(self, *args, **kwargs):
        self.on_any(args, kwargs)

    def v2_runner_on_no_hosts(self, task):
        self.runner_on_no_hosts()

    def v2_runner_on_async_poll(self, result):
        host = result._host.get_name()
        jid = result._result.get('ansible_job_id')
        #FIXME, get real clock
        clock = 0
        self.runner_on_async_poll(host, result._result, jid, clock)

    def v2_runner_on_async_ok(self, result):
        host = result._host.get_name()
        jid = result._result.get('ansible_job_id')
        self.runner_on_async_ok(host, result._result, jid)

    def v2_runner_on_async_failed(self, result):
        host = result._host.get_name()
        jid = result._result.get('ansible_job_id')
        self.runner_on_async_failed(host, result._result, jid)

    def v2_runner_on_file_diff(self, result, diff):
        pass #no v1 correspondance

    def v2_playbook_on_start(self, playbook):
        self.playbook_on_start()

    def v2_playbook_on_notify(self, result, handler):
        host = result._host.get_name()
        self.playbook_on_notify(host, handler)

    def v2_playbook_on_no_hosts_remaining(self):
        self.playbook_on_no_hosts_remaining()

    def v2_playbook_on_cleanup_task_start(self, task):
        pass #no v1 correspondance

    def v2_playbook_on_vars_prompt(self, varname, private=True, prompt=None, encrypt=None, confirm=False, salt_size=None, salt=None, default=None):
        self.playbook_on_vars_prompt(varname, private, prompt, encrypt, confirm, salt_size, salt, default)

    def v2_playbook_on_setup(self):
        self.playbook_on_setup()

    def v2_playbook_on_import_for_host(self, result, imported_file):
        host = result._host.get_name()
        self.playbook_on_import_for_host(host, imported_file)

    def v2_playbook_on_not_import_for_host(self, result, missing_file):
        host = result._host.get_name()
        self.playbook_on_not_import_for_host(host, missing_file)

    def v2_on_file_diff(self, result):
        host = result._host.get_name()
        if 'diff' in result._result:
            self.on_file_diff(host, result._result['diff'])

    def v2_playbook_on_item_ok(self, result):
        pass # no v1

    def v2_playbook_on_item_failed(self, result):
        pass # no v1

    def v2_playbook_on_item_skipped(self, result):
        pass # no v1

    def v2_playbook_on_include(self, included_file):
        pass #no v1 correspondance

    def v2_playbook_item_on_ok(self, result):
        pass

    def v2_playbook_item_on_failed(self, result):
        pass

    def v2_playbook_item_on_skipped(self, result):
        pass