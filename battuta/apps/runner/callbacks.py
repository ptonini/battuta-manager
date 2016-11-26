import json

from ansible.plugins.callback import CallbackBase

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
        self._current_task_run_once = None
        self._current_task_delegate_to = None
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
        sql_query = 'SELECT host_count,failed_count,gather_facts FROM runner_runnerplay WHERE id=%s'
        row = self._run_query_on_db('single_row', sql_query, (self._current_play_id,))

        play_host_count = row[0]
        play_failed_count = row[1]
        gather_facts = row[2]

        # Set task module
        self._current_task_module = task.__dict__['_attributes']['action']

        # Set task host count based on module
        if self._current_task_module == 'include':
            task_host_count = 0
        else:
            task_host_count = play_host_count - play_failed_count

        # Set task host count to one if run_once is enabled
        if task.__dict__['_attributes']['run_once']:
            self._current_task_run_once = True
            task_host_count = 1
        else:
            self._current_task_run_once = False

        # Set task name
        if is_handler:
            task_name = '[handler] ' + task.get_name().strip()
        elif self._current_task_module == 'setup' and gather_facts and not self._current_task_id:
            task_name = 'Gather facts'
        else:
            task_name = task.get_name().strip()

        # Check if is a delegates task
        if task.__dict__['_attributes']['delegate_to']:
            self._current_task_delegate_to = task.__dict__['_attributes']['delegate_to']
        else:
            self._current_task_delegate_to = None

        sql_query = 'INSERT INTO runner_runnertask (runner_play_id,name,module,host_count,is_handler) ' \
                    'VALUES (%s, %s, %s, %s, %s)'
        var_tuple = (self._current_play_id, task_name, self._current_task_module, task_host_count, is_handler)
        self._current_task_id = self._run_query_on_db('insert', sql_query, var_tuple)

    def _save_result(self, host, status, message, response):

        if self._runner.prefs['truncate_responses']:
            for key in self._runner.prefs['truncated_keys'].split(','):
                if key in response:
                    response[key] = self._runner.prefs['truncate_msg']

        if self._current_task_delegate_to:
            host = host + ' -> ' + self._current_task_delegate_to

        if self._current_task_run_once and self._current_task_delegate_to:
            host = self._current_task_delegate_to

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

    def v2_playbook_on_play_start(self, play):
        sql_query = 'UPDATE runner_runner SET status="running" WHERE id=%s'
        self._run_query_on_db('update', sql_query, (self._runner.id,))

        # Set inventory object
        self._inventory = play._variable_manager._inventory

        # Count hosts in play
        host_count = len(self._inventory.get_hosts(play.__dict__['_ds']['hosts']))

        # Get host pattern
        hosts = ', '.join(play.__dict__['_attributes']['hosts'])

        play_name = None
        gather_facts = False
        become = False

        if self._runner.type == 'playbook':
            play_name = play.get_name().strip()
            if play.__dict__['_attributes']['become']:
                become = True
            if play.__dict__['_attributes']['gather_facts']:
                gather_facts = play.__dict__['_attributes']['gather_facts']
        elif self._runner.type == 'adhoc':
            play_name = 'AdHoc task'
            if self._runner.data['become']:
                become = True
        elif self._runner.type == 'gather_facts':
            play_name = 'Gather facts'

        # Save play to database
        sql_query = 'INSERT INTO runner_runnerplay (runner_id,name,hosts,become,gather_facts,host_count,failed_count) '\
                    'VALUES (%s, %s, %s, %s, %s, %s, %s)'
        var_tuple = (self._runner.id, play_name, hosts, become, gather_facts, host_count, 0)
        self._current_play_id = self._run_query_on_db('insert', sql_query, var_tuple)
        self._current_task_id = None

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
        if self._current_task_module == 'command' or self._current_task_module == 'script':
            message = response['stdout'] + response['stderr']
        elif 'exception' in response:
            message = 'Exception raised'
        self._save_result(host, 'failed', message, response)

    def v2_runner_on_ok(self, result):
        host, response = self._extract_result(result)
        status = 'ok'
        message = None

        if 'msg' in response:
            message = response['msg']

        if 'ansible_facts' in response:

            sql_query = 'SELECT facts FROM inventory_host WHERE name=%s'
            facts_string = self._run_query_on_db('single_value', sql_query, (host,))

            if facts_string:
                facts = json.loads(facts_string)
            else:
                facts = dict()

            new_facts = response['ansible_facts']

            for key in new_facts:
                new_key = key
                if 'ansible_' in key:
                    new_key = key[8:]

                facts[new_key] = new_facts[key]

            sql_query = 'UPDATE inventory_host SET facts=%s WHERE name=%s'
            self._run_query_on_db('update', sql_query, (json.dumps(facts), host))

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
