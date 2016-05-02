import os
import json
import django.db

from ansible import constants as c
from ansible.plugins.callback import CallbackBase
from django.conf import settings

import pprint
pp = pprint.PrettyPrinter(indent=4)


try:
    from __main__ import display as global_display
except ImportError:
    from ansible.utils.display import Display
    global_display = Display()


class BattutaCallback(CallbackBase):
    def __init__(self, runner):
        super(BattutaCallback, self).__init__()
        self._runner = runner
        self._current_play = None
        self._current_task = None

    @staticmethod
    def _extract_result(result):
        return result._host.get_name(), result._result

    def _save_result(self, host, status, message, response):
        django.db.close_old_connections()
        runner_result, created = self._current_task.runnerresult_set.get_or_create(host=host)
        runner_result.status = status
        runner_result.message = message
        runner_result.response = json.dumps(response)
        runner_result.save()

    def v2_playbook_on_no_hosts_matched(self):
        django.db.close_old_connections()
        self._runner.message = 'No hosts matched'
        self._runner.save()

    def v2_playbook_on_play_start(self, play):
        django.db.close_old_connections()
        self._runner.status = 'running'

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

        # Create play model object
        self._current_play = self._runner.runnerplay_set.create(hosts=', '.join(play.__dict__['_attributes']['hosts']),
                                                                become=become,
                                                                name=play_name,
                                                                gather_facts=gather_facts)
        self._runner.save()

    def v2_playbook_on_task_start(self, task, is_conditional):
        django.db.close_old_connections()

        # Set task module
        module = task.__dict__['_attributes']['action']

        # Set task name
        if module == 'setup' and not self._current_task and self._current_play.gather_facts:
            name = 'Gather facts'
        elif module == 'include':
            name = 'Including ' + task.__dict__['_ds']['include']
        else:
            name = task.get_name().strip()

        # Create task model object
        self._current_task = self._current_play.runnertask_set.create(name=name)
        self._current_task.module = module
        self._current_task.save()

    def v2_playbook_on_handler_task_start(self, task):
        django.db.close_old_connections()
        self._current_task = self._current_play.runnertask_set.create(name='Handler: ' + task.get_name().strip())
        self._current_task.module = task.__dict__['_attributes']['action']
        self._current_task.save()

    def v2_playbook_on_stats(self, stats):
        django.db.close_old_connections()
        stats_dict = stats.__dict__
        self._runner.stats = list()
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

            if key in stats['skipped']:
                row.append(stats['skipped'][key])
            else:
                row.append(0)
            self._runner.stats.append(row)
        self._runner.save()

    def v2_runner_on_failed(self, result, ignore_errors=False):
        host, response = self._extract_result(result)
        message = None
        if 'msg' in response:
            message = response['msg']
        if 'exception' in response:
            message = 'Exception raised'
        elif self._current_task.module == 'shell' or self._current_task.module == 'script':
            message = response['stdout'] + response['stderr']
        self._save_result(host, 'failed', message, response)

    def v2_runner_on_ok(self, result):
        host, response = self._extract_result(result)
        status = 'ok'
        message = None
        if 'msg' in response:
            message = response['msg']

        if self._current_task.module == 'setup':
            facts = {'ansible_facts': response['ansible_facts']}
            filename = (os.path.join(settings.FACTS_DIR, host))
            with open(filename, "w") as f:
                f.write(json.dumps(facts, indent=4))
                response['ansible_facts'] = 'saved to disc'
                message = 'Facts saved to disc'
        elif self._current_task.module == 'command' or self._current_task.module == 'script':
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

    def v2_runner_on_unreachable(self, result):
        host, response = self._extract_result(result)
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