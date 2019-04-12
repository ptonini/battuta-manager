import json

from ansible.plugins.callback import CallbackBase


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

    @staticmethod
    def _extract_result(result):

        return getattr(result, '_host').get_name(), getattr(result, '_result')

    def _execute_query(self, action, sql_query, var_tuple):

        with self._db_conn as cursor:

            cursor.execute(sql_query, var_tuple)

            if cursor.rowcount > 0:

                if action == 'single_value':

                    return cursor.fetchone()[0]

                elif action == 'single_row':

                    return list(cursor.fetchone())

                elif action == 'insert':

                    return cursor.lastrowid

    def _finish_current_play_tasks(self):

        if self._current_task_id:

            var_tuple = (self._current_play_id,)

            self._execute_query('update', 'UPDATE runner_task SET is_running=FALSE WHERE play_id=%s', var_tuple)

    def _on_task_start(self, task, is_handler=False):

        # Set task module
        self._current_task_module = task.__dict__['_attributes']['action']

        if is_handler:

            task_name = '[handler] ' + task.get_name().strip()

        elif self._current_task_module == 'include':

            task_name = 'include ' + task.__dict__['_attributes']['args']['_raw_params']

            if task.__dict__['_role']:

                task_name = '{} : {}'.format(task.__dict__['_role'], task_name)

        elif self._current_task_module == 'setup' and self._gather_facts and not self._current_task_id:

            task_name = 'Gather facts'

        else:

            task_name = task.get_name().strip()

        # Check if is a delegated task
        if task.__dict__['_attributes']['delegate_to']:

            self._current_task_delegate_to = task.__dict__['_attributes']['delegate_to'] or None

        if self._current_task_id:

            sql_query = 'UPDATE runner_task SET is_running=FALSE WHERE id=%s'

            self._execute_query('update', sql_query, (self._current_task_id,))

        sql_query = 'INSERT INTO runner_task (play_id, name, module, is_handler, is_running) ' \
                    'VALUES (%s, %s, %s, %s, TRUE)'

        var_tuple = (self._current_play_id, task_name, self._current_task_module, is_handler)

        self._current_task_id = self._execute_query('insert', sql_query, var_tuple)

    def _save_result(self, host, status, message, response):

        if self._job.data.get('truncate_keys', False):

            for key in self._job.data['truncated_keys'].split(','):

                if key in response:

                    response[key] = self._job.data['truncate_msg']

        if self._current_task_delegate_to:

            host = '{} -> {}'.format(host, self._current_task_delegate_to)

        if self._current_task_run_once and self._current_task_delegate_to:

            host = self._current_task_delegate_to

        if message is not None:

            message = json.dumps(message)

        sql_query = 'INSERT INTO runner_result (host, status, message, response, task_id) VALUES (%s, %s, %s, %s, %s)'

        var_tuple = (host, status, message, json.dumps(response), self._current_task_id)

        self._execute_query('insert', sql_query, var_tuple)

    def v2_playbook_on_play_start(self, play):

        self._finish_current_play_tasks()

        inventory = getattr(getattr(play, '_variable_manager'), '_inventory')

        message = 'No hosts matched' if len(inventory.get_hosts(play.__dict__['_ds']['hosts'])) == 0 else None

        self._execute_query('update', 'UPDATE runner_job SET status=%s WHERE id=%s', ('running', self._job.id,))

        # Get host pattern
        hosts = ', '.join(play.__dict__['_attributes']['hosts'])

        play_name = None

        become = False

        if self._job.job_type == 'playbook':

            play_name = play.get_name().strip()

            become = True if play.__dict__['_attributes']['become'] else False

            self._gather_facts = True if play.__dict__['_attributes']['gather_facts'] else False

        else:

            self._execute_query('update', 'UPDATE runner_job SET subset=%s WHERE id=%s', (hosts, self._job.id))

            self._gather_facts = False

            if self._job.job_type == 'task':

                play_name = self._job.name

                become = self._job.data.get('become', False)

            elif self._job.job_type == 'facts':

                play_name = 'Gather facts'

        # Save play to database
        sql_query = 'INSERT INTO runner_play (job_id, name, hosts, become, gather_facts, message) ' \
                    'VALUES (%s, %s, %s, %s, %s, %s)'

        var_tuple = (self._job.id, play_name, hosts, become, self._gather_facts, message)

        self._current_play_id = self._execute_query('insert', sql_query, var_tuple)

        self._current_task_id = None

    def v2_playbook_on_task_start(self, task, is_conditional):

        self._on_task_start(task)

    def v2_playbook_on_handler_task_start(self, task):

        self._on_task_start(task, is_handler=True)

    def v2_playbook_on_stats(self, stats):

        self._finish_current_play_tasks()

        stats_dict = stats.__dict__

        stats_list = list()

        for key in stats_dict['processed']:

            stats_list.append([
                key,
                stats_dict['ok'].get(key, 0),
                stats_dict['changed'].get(key, 0),
                stats_dict['dark'].get(key, 0),
                stats_dict['failures'].get(key, 0),
                stats_dict['failures'].get(key, 0)
            ])

        var_tuple = (json.dumps(stats_list), self._job.id)

        self._execute_query('update', 'UPDATE runner_job SET statistics=%s WHERE id=%s', var_tuple)

    def v2_runner_on_failed(self, result, ignore_errors=False):

        self._job.data['has_exceptions'] = True

        host, response = self._extract_result(result)

        message = response.get('msg')

        if self._current_task_module in ['command', 'script']:

            message = response.get('stdout') if response.get('stdout') else response.get('stderr')

        elif 'exception' in response:

            message = 'Exception raised'

        self._save_result(host, 'failed', message, response)

    def v2_runner_on_ok(self, result):

        host, response = self._extract_result(result)

        message = response.get('msg')

        if 'ansible_facts' in response:

            host_id = self._execute_query('single_value', 'SELECT id FROM inventory_node WHERE name=%s', (host,))

            query = 'SELECT facts FROM inventory_host WHERE node_ptr_id=%s'

            facts_str = self._execute_query('single_value', query, (host_id,))

            facts = json.loads(facts_str) if facts_str else dict()

            new_facts = response['ansible_facts']

            if 'machine_id' in facts and 'ansible_machine_id' in new_facts:

                if facts['machine_id'] != new_facts['ansible_machine_id']:

                    facts = dict()

            for key in new_facts:

                if 'ansible_' in key:

                    facts[key[8:]] = new_facts[key]

                else:

                    facts[key] = new_facts[key]

            query = 'UPDATE inventory_host SET facts=%s WHERE node_ptr_id=%s'

            self._execute_query('update', query, (json.dumps(facts), host_id))

        if self._current_task_module in ['command', 'script', 'shell']:

            message = response.get('stdout') if response.get('stdout') else response.get('stderr')

        status = 'changed' if response.get('changed', False) else 'ok'

        self._save_result(host, status, message, response)

    def v2_runner_on_skipped(self, result):

        host, response = self._extract_result(result)

        if self._job.data['show_skipped']:

            message = response.get('skip_reason') if response.get('skip_reason') else response.get('msg')

            self._save_result(host, 'skipped', message, response)

    def v2_runner_on_unreachable(self, result):

        self._job.data['has_exceptions'] = True

        host, response = self._extract_result(result)

        self._save_result(host, 'unreachable', response.get('msg'), response)
