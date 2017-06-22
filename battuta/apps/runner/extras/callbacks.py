import json

from ansible.plugins.callback import CallbackBase

import pprint
pp = pprint.PrettyPrinter(indent=4)


class BattutaCallback(CallbackBase):
    def __init__(self, job, db_conn):
        super(BattutaCallback, self).__init__()
        self._db_conn = db_conn
        self._job = job
        self._job.data['has_exceptions'] = False
        self._current_play_id = None
        self._current_task_id = None
        self._current_task_module = None
        self._current_task_run_once = None
        self._current_task_delegate_to = None
        self._gather_facts = None
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

    def _finish_current_play_tasks(self):

        if self._current_task_id:

            sql_query = 'UPDATE runner_task SET is_running=FALSE WHERE play_id=%s'

            self._run_query_on_db('update', sql_query, (self._current_play_id,))

    def _on_task_start(self, task, is_handler=False):

        # Set task module
        self._current_task_module = task.__dict__['_attributes']['action']

        if is_handler:

            task_name = '[handler] ' + task.get_name().strip()

        elif self._current_task_module == 'include':

            task_name = 'include ' + task.__dict__['_attributes']['args']['_raw_params']

            if task.__dict__['_role']:

                task_name = str(task.__dict__['_role']) + ' : ' + task_name

        elif self._current_task_module == 'setup' and self._gather_facts and not self._current_task_id:

            task_name = 'Gather facts'

        else:

            task_name = task.get_name().strip()

        # Check if is a delegate_to task
        if task.__dict__['_attributes']['delegate_to']:

            self._current_task_delegate_to = task.__dict__['_attributes']['delegate_to'] or None

        if self._current_task_id:

            sql_query = 'UPDATE runner_task SET is_running=FALSE WHERE id=%s'

            self._run_query_on_db('update', sql_query, (self._current_task_id,))

        sql_query = 'INSERT INTO runner_task (play_id, name, module, is_handler, is_running) ' \
                    'VALUES (%s, %s, %s, %s, TRUE)'

        var_tuple = (self._current_play_id, task_name, self._current_task_module, is_handler)

        self._current_task_id = self._run_query_on_db('insert', sql_query, var_tuple)

    def _save_result(self, host, status, message, response):

        if self._job.prefs['truncate_responses']:

            for key in self._job.prefs['truncated_keys'].split(','):

                if key in response:

                    response[key] = self._job.prefs['truncate_msg']

        if self._current_task_delegate_to:

            host = host + ' -> ' + self._current_task_delegate_to

        if self._current_task_run_once and self._current_task_delegate_to:

            host = self._current_task_delegate_to

        if message:

            message = json.dumps(message)

        sql_query = 'INSERT INTO runner_result (host,status,message,response,task_id) VALUES (%s, %s, %s, %s, %s)'

        var_tuple = (host, status, message, json.dumps(response), self._current_task_id)

        self._run_query_on_db('insert', sql_query, var_tuple)

    def v2_playbook_on_play_start(self, play):

        self._gather_facts = False

        self._finish_current_play_tasks()

        sql_query = 'UPDATE runner_job SET status="running" WHERE id=%s'

        self._run_query_on_db('update', sql_query, (self._job.id,))

        # Set inventory object
        self._inventory = play._variable_manager._inventory

        # Get host pattern
        hosts = ', '.join(play.__dict__['_attributes']['hosts'])

        play_name = None
        become = False

        if self._job.type == 'playbook':

            play_name = play.get_name().strip()

            if play.__dict__['_attributes']['become']:

                become = True

            if play.__dict__['_attributes']['gather_facts']:

                self._gather_facts = play.__dict__['_attributes']['gather_facts']

        else:
    
            sql_query = 'UPDATE runner_job SET subset=%s WHERE id=%s'

            self._run_query_on_db('update', sql_query, (hosts, self._job.id))

            if self._job.type == 'adhoc':

                play_name = 'AdHoc task'

                if self._job.data['become']:

                    become = True

            elif self._job.type == 'gather_facts':

                play_name = 'Gather facts'

        # Save play to database
        sql_query = 'INSERT INTO runner_play (job_id, name, hosts, become, gather_facts) VALUES (%s, %s, %s, %s, %s)'

        var_tuple = (self._job.id, play_name, hosts, become, self._gather_facts)

        self._current_play_id = self._run_query_on_db('insert', sql_query, var_tuple)

        self._current_task_id = None

    def v2_playbook_on_task_start(self, task, is_conditional):

        self._on_task_start(task)

    def v2_playbook_on_handler_task_start(self, task):

        self._on_task_start(task, is_handler=True)

    def v2_playbook_on_stats(self, stats_list):

        self._finish_current_play_tasks()

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

        sql_query = 'UPDATE runner_job SET stats=%s WHERE id=%s'

        self._run_query_on_db('update', sql_query, (str(stats_list), self._job.id))

    def v2_runner_on_failed(self, result, ignore_errors=False):

        self._job.data['has_exceptions'] = True

        host, response = self._extract_result(result)

        message = response.get('msg', None)

        if self._current_task_module == 'command' or self._current_task_module == 'script':

            message = response.get('stdout', '') + response.get('stderr', '')

        elif 'exception' in response:

            message = 'Exception raised'

        self._save_result(host, 'failed', message, response)

    def v2_runner_on_ok(self, result):

        host, response = self._extract_result(result)

        status = 'changed' if response['changed'] else 'ok'

        message = response.get('msg', None)

        if 'ansible_facts' in response:

            sql_query = 'SELECT facts FROM inventory_host WHERE name=%s'

            facts_string = self._run_query_on_db('single_value', sql_query, (host,))

            facts = json.loads(facts_string) if facts_string else dict()

            new_facts = response['ansible_facts']

            if 'machine_id' in facts and 'ansible_machine_id' in new_facts:

                if facts['machine_id'] != new_facts['ansible_machine_id']:

                    facts = dict()

            for key in new_facts:

                if 'ansible_' in key:

                    facts[key[8:]] = new_facts[key]

                else:

                    facts[key] = new_facts[key]

            sql_query = 'UPDATE inventory_host SET facts=%s WHERE name=%s'

            self._run_query_on_db('update', sql_query, (json.dumps(facts), host))

        elif self._current_task_module == 'command' or self._current_task_module == 'script':

            message = response.get('stdout', '') + response.get('stderr', '')

        self._save_result(host, status, message, response)

    def v2_runner_on_skipped(self, result):

        host, response = self._extract_result(result)

        if self._job.data['show_skipped']:

            message = None

            if 'skip_reason' in response:

                message = response['skip_reason']

            elif 'msg' in response:

                message = response['msg']

            self._save_result(host, 'skipped', message, response)

    def v2_runner_on_unreachable(self, result):

        self._job.data['has_exceptions'] = True

        host, response = self._extract_result(result)

        message = response.get('msg', None)

        self._save_result(host, 'unreachable', message, response)
