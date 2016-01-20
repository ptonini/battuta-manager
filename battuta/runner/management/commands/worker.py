import django_rq
from django.core.management.base import BaseCommand
from rq import Queue, Worker
from runner.models import Task


def error_handler(job, *exc_info):
    if exc_info[0].__name__ == 'JobTimeoutException':
        job_status = 'timeout'
        message = exc_info[1]
    else:
        print '---------- worker.py ------------'
        print exc_info[0]
        print exc_info[1]
        print exc_info[2]
        print '--------------------------------'
        job_status = 'undefined'
        message = 'undefined'
    task = Task.objects.get(job_id=job.get_id())
    task.status = job_status
    for task_result in task.taskresult_set.all():
        if task_result.status == 'started':
            task_result.status = job_status
            task_result.message = message
            task_result.save()
    task.save()
    job.delete()
    return False


class Command(BaseCommand):
    def handle(self, *args, **options):
        redis_conn = django_rq.get_connection('default')
        q = Queue(connection=redis_conn)
        worker = Worker([q], exc_handler=error_handler, connection=redis_conn)
        worker.work()
