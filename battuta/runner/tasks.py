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
def run_playbook(form_data, passwords, playbook, task):
    with Connection():
        job = get_current_job()
        task.job_id = job.get_id()
        task.status = 'started'
        task.save()
        rsakey_file = NamedTemporaryFile(delete=False)
        rsakey_file.write(task.user.userdata.rsa_key)
        rsakey_file.close()
        variable_manager = VariableManager()
        loader = DataLoader()
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
        inventory = Inventory(loader=loader, variable_manager=variable_manager)
        variable_manager.set_inventory(inventory)
        play = Play().load(playbook, variable_manager=variable_manager, loader=loader)
        tqm = TaskQueueManager(inventory=inventory,
                               variable_manager=variable_manager,
                               passwords=passwords,
                               loader=loader,
                               options=options,
                               stdout_callback=BattutaCallback(task))
        task.status = 'running'
        task.save()
        hosts_query = inventory.get_hosts(pattern=form_data['pattern'])
        if len(hosts_query) > 0:
            for host in hosts_query:
                task.taskresult_set.create(host=host.name, status='started', message='', response={})
            tqm.run(play)
            tqm.cleanup()
            task.status = 'finished'
        else:
            task.status = 'empty'
        task.save()
        os.remove(rsakey_file.name)


class BattutaCallback(CallbackBase):
    def __init__(self, task):
        super(BattutaCallback, self).__init__()
        self.task = task

    def __update_db(self, host, status, message, result):
        query_set = self.task.taskresult_set.filter(host=host)
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
            message = result._result['stdout'] + result._result['stderr']
        self.__update_db(host, 'failed', message, response)

    def v2_runner_on_skipped(self, host, item=None):
        self.__update_db(host, 'skipped', host + ' skipped', {})

    def v2_runner_on_unreachable(self, result):
        host = result._host.get_name()
        response = result._result
        if 'msg' in result._result:
            message = result._result['msg']
            result = result._result
        else:
            message = 'view details'
            result = [result._result]
        self.__update_db(host, 'unreachable', message, result)
