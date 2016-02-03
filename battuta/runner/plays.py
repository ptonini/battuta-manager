import os
import json
import hashlib
import ast

from Crypto.Cipher import AES
from redis import Redis
from rq import Connection, get_current_job
from rq.decorators import job
from django.conf import settings
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
                                 'check',
                                 'tags',
                                 'skip_tags'])


@job('default', connection=Redis())
def enqueue_play(play_data, runner, encrypted_data):
    with Connection():
        key = hashlib.sha256('12345678').digest()
        decryptor = AES.new(key, AES.MODE_CBC, 16 * '\x00')
        decrypted_data = decryptor.decrypt(encrypted_data)
        form_data = ast.literal_eval(decrypted_data)

        current_job = get_current_job()
        runner.job_id = current_job.get_id()
        runner.status = 'enqueued'
        runner.save()

        # Create ansible default objects
        variable_manager = VariableManager()
        loader = DataLoader()
        inventory = Inventory(loader=loader, variable_manager=variable_manager)
        variable_manager.set_inventory(inventory)

        # Add host list to runner object
        host_list = inventory.get_hosts(pattern=runner.hosts)

        # Create password dictionary
        passwords = {'conn_pass': form_data['remote_pass'], 'become_pass': form_data['become_pass']}

        # Set inventory subset if available:
        if 'subset' in form_data:
            inventory.subset(form_data['subset'])

        # Create ansible options tuple
        options = Options(connection='paramiko',
                          module_path=c.DEFAULT_MODULE_PATH,
                          forks=c.DEFAULT_FORKS,
                          remote_user=form_data['username'],
                          private_key_file=runner.user.userdata.rsa_key,
                          ssh_common_args=None,
                          ssh_extra_args=None,
                          sftp_extra_args=None,
                          scp_extra_args=None,
                          become=form_data['become'],
                          become_method=c.DEFAULT_BECOME_METHOD,
                          become_user=c.DEFAULT_BECOME_USER,
                          verbosity=None,
                          check=False,
                          tags=False,
                          skip_tags=False,)

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
                                   stdout_callback=BattutaCallback(runner, host_list))
            tqm.run(play)
        finally:
            if tqm is not None:
                tqm.cleanup()
                runner.status = 'finished'
                runner.save()
                current_job.delete()


class BattutaCallback(CallbackBase):
    def __init__(self, runner, host_list):
        super(BattutaCallback, self).__init__()
        self.runner = runner
        self.host_list = host_list

    @staticmethod
    def __extract_result(result):
        return result._host.get_name(), result._result

    def __save_result(self, host, status, message, result):
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
        runner_task = self.runner.task_set.create(name=task.get_name().strip())
        for host in self.host_list:
            runner_task.result_set.create(host=host, status='started', response='{}')

    def v2_playbook_on_no_hosts_matched(self):
        self.runner.message = 'No hosts matched'
        self.runner.save()

    def v2_playbook_on_stats(self, stats):
        print 'play stats: ' + str(stats)

    def v2_runner_on_failed(self, result, ignore_errors=False):
        host, response = self.__extract_result(result)
        module = str(response['invocation']['module_name'])
        message = module + ' failed'
        if 'exception' in response:
            message = 'Exception raised'
            response = [response]
        elif module == 'shell' or module == 'script':
            message = response['stdout'] + response['stderr']
        self.__save_result(host, 'failed', message, response)

    def v2_runner_on_ok(self, result):
        host, response = self.__extract_result(result)
        module = str(response['invocation']['module_name'])
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
        self.__save_result(host, status, message, response)

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
