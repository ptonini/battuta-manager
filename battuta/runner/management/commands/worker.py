import django_rq
from django.core.management.base import BaseCommand
from rq import Queue, Worker

from runner.models import Runner


def error_handler(job, *exc_info):
    runner = Runner.objects.get(job_id=job.get_id())
    runner.status = 'failed'
    runner.error_message = str(exc_info[0].__name__) + ': ' + str(exc_info[1])
    runner.save()
    job.delete()
    return False


class Command(BaseCommand):
    def handle(self, *args, **options):
        redis_conn = django_rq.get_connection('default')
        q = Queue(connection=redis_conn)
        worker = Worker([q], exc_handler=error_handler, connection=redis_conn)
        worker.work()
