import os
import json

from ansible.plugins.callback import CallbackBase
from django.conf import settings

import pprint
pp = pprint.PrettyPrinter(indent=4)


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

    def _run_query_on_db(self, action, sql_query, var_tuple):
        with self._db_conn as cursor:
            cursor.execute(sql_query, var_tuple)
            if cursor.rowcount > 0:
                if action == 'single_value':
                    return cursor.fetchone()[0]
                elif action == 'single_row':
                    return list(cursor.fetchone())
                elif action == 'insert':
                    return cursor.lastrowid
            else:
                return None

    def _get_current_play_failed_count(self):
        sql_query = 'SELECT failed_count FROM runner_runnerplay WHERE id=%s'
        return self._run_query_on_db('single_value', sql_query, (self._current_play_id,))

    def _increase_current_play_failed_count(self):
        failed_count = self._get_current_play_failed_count() + 1
        sql_query = 'UPDATE runner_runnerplay SET failed_count=%s WHERE id=%s'
        self._run_query_on_db('update', sql_query, (failed_count, self._current_play_id))

    def _on_task_start(self, task, is_handler=False):

        # Get current play data
        sql_query = 'SELECT gather_facts,host_count,failed_count FROM runner_runnerplay WHERE id=%s'
        row = self._run_query_on_db('single_row', sql_query, (self._current_play_id,))
        if row[0] == 0:
            gather_facts = False
        else:
            gather_facts = True
        play_host_count = row[1]
        play_failed_count = row[2]

        # Set task module
        self._current_task_module = task.__dict__['_attributes']['action']

        # Set task name
        if is_handler:
            task_host_count = len(self._inventory._restriction) - self._get_current_play_failed_count()
            task_name = '[Handler] ' + task.get_name().strip()
        elif self._current_task_module == 'setup' and not self._current_task_id and gather_facts:
            task_host_count = play_host_count
            task_name = 'Gather facts'
        elif self._current_task_module == 'include':
            task_host_count = 0
            task_name = 'Including ' + task.__dict__['_ds']['include']
        else:
            task_host_count = play_host_count - play_failed_count
            task_name = task.get_name().strip()

        sql_query = 'INSERT INTO runner_runnertask (runner_play_id,name,module,host_count) VALUES (%s, %s, %s, %s)'
        var_tuple = (self._current_play_id, task_name, self._current_task_module, task_host_count)
        self._current_task_id = self._run_query_on_db('insert', sql_query, var_tuple)

    def _save_result(self, host, status, message, response):

        sql_query = 'SELECT id FROM runner_runnerresult WHERE runner_task_id=%s AND host=%s'
        result_id = self._run_query_on_db('single_value', sql_query, (self._current_task_id, host))

        if result_id:
            sql_query = 'UPDATE runner_runnerresult SET host=%s, status=%s, message=%s, response=%s WHERE id=%s'
            self._run_query_on_db('update', sql_query, (host, status, message, json.dumps(response), result_id))
        else:
            sql_query = 'INSERT INTO runner_runnerresult (host,status,message,response,runner_task_id) ' \
                        'VALUES (%s, %s, %s, %s, %s)'
            var_tuple = (host, status, message, json.dumps(response), self._current_task_id)
            self._run_query_on_db('insert', sql_query, var_tuple)

    def v2_playbook_on_no_hosts_matched(self):
        sql_query = 'UPDATE runner_runner SET message="No hosts matched" WHERE id=%s'
        self._run_query_on_db('update', sql_query, (self._runner.id,))

    def v2_playbook_on_play_start(self, play):
        sql_query = 'UPDATE runner_runner SET status="running" WHERE id=%s'
        self._run_query_on_db('update', sql_query, (self._runner.id,))

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
        sql_query = 'INSERT INTO runner_runnerplay (runner_id,name,hosts,become,gather_facts,host_count,failed_count) '\
                    'VALUES (%s, %s, %s, %s, %s, %s, %s)'
        var_tuple = (self._runner.id, play_name, hosts, become, gather_facts, host_count, 0)
        self._current_play_id = self._run_query_on_db('insert', sql_query, var_tuple)

    def v2_playbook_on_task_start(self, task, is_conditional):
        self._on_task_start(task)

    def v2_playbook_on_handler_task_start(self, task):
        self._on_task_start(task, is_handler=True)

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

        sql_query = 'UPDATE runner_runner SET stats=%s WHERE id=%s'
        self._run_query_on_db('update', sql_query, (str(stats_list), self._runner.id))

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

        if response['changed']:
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
            sql_query = 'SELECT host_count FROM runner_runnertask WHERE id=%s'
            host_count = self._run_query_on_db('single_value', sql_query, (self._current_task_id,)) - 1
            sql_query = 'UPDATE runner_runnertask SET host_count=%s WHERE id=%s'
            self._run_query_on_db('update', sql_query, (host_count, self._current_task_id))

    def v2_runner_on_unreachable(self, result):
        host, response = self._extract_result(result)
        self._increase_current_play_failed_count()
        message = None
        if 'msg' in response:
            message = response['msg']
        self._save_result(host, 'unreachable', message, response)
