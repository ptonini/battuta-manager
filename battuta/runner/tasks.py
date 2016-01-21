import os
import json
from rq import get_current_job, Connection
from ansible import inventory
import django_rq
from django.conf import settings
from tempfile import NamedTemporaryFile

@django_rq.job('default')
def run_task(command, task):
    with Connection():
        rsakey_file = NamedTemporaryFile(delete=False)
        rsakey_file.write(task.user.userdata.rsa_key)
        rsakey_file.close()
        command.private_key_file = rsakey_file.name
        command.callbacks = BattutaCallback(task)
        job = get_current_job()
        task.job_id = job.get_id()
        task.status = 'running'
        task.save()
        inv = inventory.Inventory()
        hosts_query = inv.get_hosts(pattern=command.pattern)
        if len(hosts_query) > 0:
            for host in hosts_query:
                task.taskresult_set.create(host=host.name, status='started', message='', response={})
            command.run()
            task.status = 'finished'
        else:
            task.status = 'empty'
        task.save()
        os.remove(rsakey_file.name)


class BattutaCallback(object):
    def __init__(self, task):
        self.task = task

    def __update_db(self, host, status, message, response):
        query_set = self.task.taskresult_set.filter(host=host)
        host = query_set[0]
        host.status = status
        host.message = message
        host.response = response
        host.save()

    def on_ok(self, host, response):
        message = self.task.module + ' successful'
        if self.task.module == 'setup':
            facts = {'ansible_facts': response['ansible_facts']}
            filename = (os.path.join(settings.FACTS_DIR, str(host)))
            with open(filename, "w") as f:
                f.write(json.dumps(facts, indent=4))
                response['ansible_facts'] = 'saved to file'
                message = 'Facts saved to ' + filename
        elif self.task.module == 'shell' or self.task.module == 'script':
            message = response['stdout'] + response['stderr']
        self.__update_db(host, 'ok', message, response)

    def on_failed(self, host, response, ignore_errors=False):
        message = self.task.module + ' failed'
        if self.task.module == 'shell' or self.task.module == 'script':
            message = response['stdout'] + response['stderr']
        self.__update_db(host, 'failed', message, response)

    def on_skipped(self, host, item=None):
        self.__update_db(host, 'skipped', host + ' skipped', {})

    def on_unreachable(self, host, response):
        if 'msg' in response:
            message = response['msg']
        else:
            message = 'view details'
            response = [response]
        self.__update_db(host, 'unreachable', message, response)
