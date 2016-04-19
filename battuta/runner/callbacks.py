import os
import json

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


class AdHocCallback(CallbackBase):
    def __init__(self, runner, form_data):
        super(AdHocCallback, self).__init__()
        self._runner = runner
        self._form_data = form_data
        self._current_play = None
        self._current_task = None

    @staticmethod
    def __extract_result(result):
        return result._host.get_name(), result._result

    def __save_result(self, host, status, message, result):
        runner_result, created = self._current_task.runnerresult_set.get_or_create(host=host)
        runner_result.status = status
        runner_result.message = message
        runner_result.response = self._dump_results(result._result, keep_invocation=True)
        runner_result.save()

    def v2_playbook_on_play_start(self, play):
        self._runner.status = 'running'
        become = False
        if play.__dict__['_attributes']['become']:
            become = True
        play_name = play.__dict__['_attributes']['name']
        if 'adhoc_task' in self._form_data:
            play_name = 'AdHoc task'
        self._current_play = self._runner.runnerplay_set.create(hosts=', '.join(play.__dict__['_attributes']['hosts']),
                                                                become=become,
                                                                name=play_name)
        self._runner.save()

    def v2_playbook_on_task_start(self, task, is_conditional):
        self._current_task = self._current_play.runnertask_set.create(name=task.get_name().strip())
        self._current_task.module = task.__dict__['_attributes']['action']
        self._current_task.save()

    def v2_playbook_on_no_hosts_matched(self):
        self._runner.message = 'No hosts matched'
        self._runner.save()

    def v2_playbook_on_stats(self, stats):
        print 'play stats: ' + str(stats)

    def v2_runner_on_failed(self, result, ignore_errors=False):
        host, response = self.__extract_result(result)
        message = self._current_task.module + ' failed'
        if 'exception' in response:
            message = 'Exception raised'
        elif self._current_task.module == 'shell' or self._current_task.module == 'script':
            message = response['stdout'] + response['stderr']
        self.__save_result(host, 'failed', message, result)

    def v2_runner_on_ok(self, result):
        host, response = self.__extract_result(result)
        message = self._current_task.module + ' successful'
        status = 'ok'
        if self._current_task.module == 'setup':
            facts = {'ansible_facts': response['ansible_facts']}
            filename = (os.path.join(settings.FACTS_DIR, host))
            with open(filename, "w") as f:
                f.write(json.dumps(facts, indent=4))
                response['ansible_facts'] = 'saved to file'
                message = 'Facts saved to ' + filename
        elif self._current_task.module == 'command' or self._current_task.module == 'script':
            message = response['stdout'] + response['stderr']
        elif response['changed']:
            status = 'changed'
        self.__save_result(host, status, message, result)

    def v2_runner_on_skipped(self, result):
        host, response = self.__extract_result(result)
        self.__save_result(host, 'skipped', host + ' skipped', result)

    def v2_runner_on_unreachable(self, result):
        host, response = self.__extract_result(result)
        if 'msg' in response:
            message = response['msg']
        else:
            message = 'Host unreachable'
        self.__save_result(host, 'unreachable', message, result)


class PlaybookCallback(CallbackBase):

    def __init__(self, runner, host_list):
        super(PlaybookCallback, self).__init__()
        self.runner = runner
        self.host_list = host_list

    @staticmethod
    def _extract_result(result):
        return result._host.get_name(), result._result

    def _save_result(self, host, status, message, result):
        runner_task = self.runner.task_set.latest('id')
        query_set = runner_task.result_set.filter(host=host)
        host = query_set[0]
        host.status = status
        host.message = message
        host.response = result
        host.save()

    def v2_playbook_on_play_start(self, play):
        self.runner.status = 'running'
        self.runner.save()

    def v2_playbook_on_task_start(self, task, is_conditional):
        runner_task = self.runner.task_set.create(name=task.get_name().strip(), module=task.action)
        for host in self.host_list:
            runner_task.result_set.create(host=host, status='started', response='{}')

    def v2_playbook_on_no_hosts_matched(self):
        self.runner.message = 'No hosts matched'
        self.runner.save()

    def v2_playbook_on_stats(self, stats):
        print 'play stats: ' + str(stats)

    def v2_runner_on_failed(self, result, ignore_errors=False):
        host, response = self._extract_result(result)
        module = self.runner.task_set.latest('id').module
        message = module + ' failed'
        if 'exception' in response:
            message = 'Exception raised'
            response = [response]
        elif module == 'command' or module == 'script':
            message = response['stdout'] + response['stderr']
        elif 'msg' in response:
            message = response['msg']
        self._save_result(host, 'failed', message, response)

    def v2_runner_on_ok(self, result):
        host, response = self._extract_result(result)
        module = self.runner.task_set.latest('id').module
        message = module + ' successful'
        status = 'ok'
        if module == 'setup':
            facts = {'ansible_facts': response['ansible_facts']}
            filename = (os.path.join(settings.FACTS_DIR, host))
            with open(filename, "w") as f:
                f.write(json.dumps(facts, indent=4))
                response['ansible_facts'] = 'saved to file'
                message = 'Facts saved to ' + filename
        elif module == 'command' or module == 'script':
            message = response['stdout'] + response['stderr']
        elif response['changed']:
            status = 'changed'
        self._save_result(host, status, message, response)

    def v2_runner_on_skipped(self, result):
        host, response = self._extract_result(result)
        self._save_result(host, 'skipped', host + ' skipped', {})

    def v2_runner_on_unreachable(self, result):
        host, response = self._extract_result(result)
        if 'msg' in response:
            message = response['msg']
        else:
            message = 'Host unreachable'
            response = [response]
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

    def v2_runner_on_failed(self, result, ignore_errors=False):
        host = result._host.get_name()
        self.runner_on_failed(host, result._result, ignore_errors)

    def v2_runner_on_ok(self, result):
        host = result._host.get_name()
        self.runner_on_ok(host, result._result)

    def v2_runner_on_skipped(self, result):
        if c.DISPLAY_SKIPPED_HOSTS:
            host = result._host.get_name()
            self.runner_on_skipped(host, self._get_item(getattr(result._result,'results',{})))

    def v2_runner_on_unreachable(self, result):
        host = result._host.get_name()
        self.runner_on_unreachable(host, result._result)

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

    def v2_playbook_on_no_hosts_matched(self):
        self.playbook_on_no_hosts_matched()

    def v2_playbook_on_no_hosts_remaining(self):
        self.playbook_on_no_hosts_remaining()

    def v2_playbook_on_task_start(self, task, is_conditional):
        self.playbook_on_task_start(task, is_conditional)

    def v2_playbook_on_cleanup_task_start(self, task):
        pass #no v1 correspondance

    def v2_playbook_on_handler_task_start(self, task):
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

    def v2_playbook_on_play_start(self, play):
        self.playbook_on_play_start(play.name)

    def v2_playbook_on_stats(self, stats):
        self.playbook_on_stats(stats)

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