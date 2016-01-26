import os
import json
import django_rq

from rq import get_current_job, Connection
from django.conf import settings
from tempfile import NamedTemporaryFile

from collections import namedtuple
from ansible.parsing.dataloader import DataLoader
from ansible.vars import VariableManager
from ansible.inventory import Inventory
from ansible.playbook.play import Play
from ansible.executor.task_queue_manager import TaskQueueManager
from ansible.plugins.callback import CallbackBase
from ansible import constants as c

Options = namedtuple('Options', ['connection',
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
                                 'check'])


@django_rq.job('default')
def run_play(form_data, passwords, play_data, runner):
    with Connection():

        # Get job ID amd mark play as 'enqueued'
        job = get_current_job()
        runner.job_id = job.get_id()
        runner.status = 'enqueued'
        runner.save()

        # Create temporary RSA key file
        rsakey_file = NamedTemporaryFile(delete=False)
        rsakey_file.write(runner.user.userdata.rsa_key)
        rsakey_file.close()

        # Create ansible default objects
        variable_manager = VariableManager()
        loader = DataLoader()
        inventory = Inventory(loader=loader, variable_manager=variable_manager)
        variable_manager.set_inventory(inventory)

        # Set ansible options
        options = Options(connection='paramiko',
                          module_path=c.DEFAULT_MODULE_PATH,
                          forks=c.DEFAULT_FORKS,
                          remote_user=form_data['username'],
                          private_key_file=rsakey_file.name,
                          ssh_common_args=None,
                          ssh_extra_args=None,
                          sftp_extra_args=None,
                          scp_extra_args=None,
                          become=form_data['become'],
                          become_method=c.DEFAULT_BECOME_METHOD,
                          become_user=c.DEFAULT_BECOME_USER,
                          verbosity=None,
                          check=False)

        # Create ansible play object
        play = Play().load(play_data, variable_manager=variable_manager, loader=loader)

        # Execute play
        tqm = None
        try:
            tqm = TaskQueueManager(inventory=inventory,
                                   variable_manager=variable_manager,
                                   passwords=passwords,
                                   loader=loader,
                                   options=options,
                                   stdout_callback=BattutaCallback(runner))
            tqm.run(play)
        finally:
            if tqm is not None:
                tqm.cleanup()
                runner.status = 'finished'
                runner.save()


class BattutaCallback(CallbackBase):
    def __init__(self, runner):
        super(BattutaCallback, self).__init__()
        self.runner = runner

    @staticmethod
    def __extract_result(result):
        return result._host.get_name(), result._result

    def __save_result(self, host, status, message, result):
        runner_task = self.runner.task_set.objects.latest('id')
        query_set = runner_task.result_set.filter(host=host)
        host = query_set[0]
        host.status = status
        host.message = message
        host.response = result
        host.save()

    def v2_playbook_on_play_start(self, play):
        self.runner.status = 'started'
        self.runner.save()

    def v2_playbook_on_task_start(self, task, is_conditional):
        runner_task = self.runner.task_set.create()
        runner_task.name = task.get_name().strip()
        runner_task.save()
        print task

    def v2_playbook_on_no_hosts_matched(self):
        self.runner.message = 'No hosts matched'
        self.runner.save()

    def v2_playbook_on_stats(self, stats):
        self.runner.status = 'finished'
        self.runner.save()
        print stats

    def v2_runner_on_failed(self, result, ignore_errors=False):
        host, response = self.__extract_result(result)
        message = self.task.module + ' failed'
        if 'exception' in response:
            message = 'Exception raised'
            response = [response]
        elif self.task.module == 'shell' or self.task.module == 'script':
            message = response['stdout'] + response['stderr']
        self.__save_result(host, 'failed', message, response)

    def v2_runner_on_ok(self, result):
        host, response = self.__extract_result(result)
        message = self.task.module + ' successful'
        if self.task.module == 'setup':
            facts = {'ansible_facts': response['ansible_facts']}
            filename = (os.path.join(settings.FACTS_DIR, host))
            with open(filename, "w") as f:
                f.write(json.dumps(facts, indent=4))
                response['ansible_facts'] = 'saved to file'
                message = 'Facts saved to ' + filename
        elif self.task.module == 'shell' or self.task.module == 'script':
            message = response['stdout'] + response['stderr']
        self.__save_result(host, 'ok', message, response)

    def v2_runner_on_skipped(self, result):
        host, response = self.__extract_result(result)
        self.__save_result(host, 'skipped', host + ' skipped', {})

    def v2_runner_on_unreachable(self, result):
        host, response = self.__extract_result(result)
        if 'msg' in response:
            message = response['msg']
        else:
            message = 'Host unreachable'
            response = [response]
        self.__save_result(host, 'unreachable', message, response)
