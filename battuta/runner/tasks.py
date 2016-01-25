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
from ansible import constants as C

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

        # Create default ansible objects
        variable_manager = VariableManager()
        loader = DataLoader()
        inventory = Inventory(loader=loader, variable_manager=variable_manager)
        variable_manager.set_inventory(inventory)

        # Set ansible options
        options = Options(connection='paramiko',
                          module_path=C.DEFAULT_MODULE_PATH,
                          forks=C.DEFAULT_FORKS,
                          remote_user=form_data['username'],
                          private_key_file=rsakey_file.name,
                          ssh_common_args=None,
                          ssh_extra_args=None,
                          sftp_extra_args=None,
                          scp_extra_args=None,
                          become=form_data['become'],
                          become_method=C.DEFAULT_BECOME_METHOD,
                          become_user=C.DEFAULT_BECOME_USER,
                          verbosity=None,
                          check=False)

        # Create ansible play object
        play = Play().load(play_data, variable_manager=variable_manager, loader=loader)

        # Create ansible queue
        tqm = TaskQueueManager(inventory=inventory,
                               variable_manager=variable_manager,
                               passwords=passwords,
                               loader=loader,
                               options=options,
                               stdout_callback=BattutaCallback(runner))
 
        # Check if pattern match any hosts
        hosts_query = inventory.get_hosts(pattern=form_data['pattern'])
        if len(hosts_query) > 0:
            runner.status = 'running'
            runner.save()

            # Create response objects
            for host in hosts_query:
                runner.taskresult_set.create(host=host.name, status='started', message='', response={})

            # Execute play
            tqm.run(play)
            tqm.cleanup()
            runner.status = 'finished'

            # Check is all hosts responded with 'ok' status
            for result in runner.taskresult_set.all():
                if result.status != 'ok':
                    runner.status = 'finished with errors'
        else:
            # Return error if no hosts matched
            runner.status = 'error'
            runner.error_message = 'No hosts matched'
        runner.save()
        os.remove(rsakey_file.name)


class BattutaCallback(CallbackBase):
    def __init__(self, runner):
        super(BattutaCallback, self).__init__()
        self.task = runner

    def __update_db(self, host, status, message, result):
        query_set = self.runner.taskresult_set.filter(host=host)
        host = query_set[0]
        host.status = status
        host.message = message
        host.response = result
        host.save()

    def v2_runner_on_ok(self, result):
        host = result._host.get_name()
        response = result._result
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
        self.__update_db(host, 'ok', message, response)

    def v2_runner_on_failed(self, result, ignore_errors=False):
        host = result._host.get_name()
        response = result._result
        print json.dumps(response)
        message = self.task.module + ' failed'
        if 'exception' in response:
            message = 'Exception raised'
            response = [response]
        elif self.task.module == 'shell' or self.task.module == 'script':
            message = response['stdout'] + response['stderr']
        self.__update_db(host, 'failed', message, response)

    def v2_runner_on_skipped(self, host, item=None):
        self.__update_db(host, 'skipped', host + ' skipped', {})

    def v2_runner_on_unreachable(self, result):
        host = result._host.get_name()
        response = result._result
        if 'msg' in response:
            message = response['msg']
        else:
            message = 'view details'
            response = [response]
        self.__update_db(host, 'unreachable', message, response)
