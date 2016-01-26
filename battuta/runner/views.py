import ast
import json
import os
import django_rq
import psutil
import time

from django.conf import settings
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404, render
from django.views.generic import View
from pytz import timezone
from rq import Worker

from .forms import AdHocForm, RunnerForm, TaskForm
from .models import AdHoc, Runner
from .tasks import run_play


class BaseView(View):
    def __init__(self):
        super(BaseView, self).__init__()
        self.context = dict()


class RunnerView(View):
    queues = ['default']

    # Check if there are workers running
    def check_rq(self):
        redis_conn = django_rq.get_connection(self.queues)
        try:
            if len(Worker.all(connection=redis_conn)) > 0:
                return [True]
            else:
                return [False, 'Error: no workers found']
        except Exception as error:
            return [False, str(error)]

    # Execute task/play
    def execute(self, form_data, play_data, passwords, runner):
        result = self.check_rq()
        if result[0] is True:
            job = run_play.delay(form_data, passwords, play_data, runner)
            index = 0
            while job.is_queued is False:
                if index > 3:
                    runner.delete()
                    return {'result': 'fail', 'msg': 'Play was not enqueued'}
                else:
                    time.sleep(1)
                index += 1
            runner.status = 'enqueued'
            runner.save()
            return {'result': 'ok', 'runner_id': runner.id}
        else:
            return {'result': 'fail', 'msg': result[1]}

    def post(self, request):

        # Upload file for task
        if request.POST['action'] == 'upload':
            user_upload_dir = os.path.join(settings.UPLOAD_DIR, str(request.user.username))
            try:
                os.makedirs(user_upload_dir)
            finally:
                pass
            filepaths = list()
            for key, value in request.FILES.iteritems():
                filepath = os.path.join(user_upload_dir, str(value.name))
                filepaths.append(filepath)
                with open(filepath, 'wb+') as destination:
                    for chunk in value.chunks():
                        destination.write(chunk)
            data = {'result': 'ok', 'filepaths': filepaths}

        # Execute adhoc task
        elif request.POST['action'] == 'run_adhoc':
            runner_form = RunnerForm(request.POST)
            task_form = TaskForm(request.POST)
            if runner_form.is_valid() and task_form.is_valid():
                form_data = dict(request.POST.iteritems())
                request.POST['username'] = request.user.userdata.ansible_username
                passwords = {'conn_pass': request.POST['remote_pass'], 'become_pass': request.POST['become_pass']}
                play_data = {'name': request.POST['name'],
                             'hosts': request.POST['pattern'],
                             'gather_facts': 'no',
                             'tasks': [
                                 {'action': {'module': request.POST['module'], 'args': request.POST['arguments']}}
                             ]}
                runner = runner_form.save()
                data = self.execute(form_data, play_data, passwords, runner)
            else:
                data = {'result': 'fail', 'msg': str(runner_form.errors) + str(task_form.errors)}

        # Kill task/play
        elif request.POST['action'] == 'kill':
            data = {}
            runner = get_object_or_404(Runner, pk=request.POST['runner_id'])
            redis_conn = django_rq.get_connection(self.queues)
            for worker in Worker.all(connection=redis_conn):
                if worker.get_current_job_id() == runner.job_id:
                    process = psutil.Process(int(worker.name.split('.')[1]))
                    process.terminate()
                    process.terminate()
                    print 'Worker killed'

        else:
            raise Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type="application/json")


class AdHocView(BaseView):
    def get(self, request):
        self.context['user'] = request.user
        return render(request, "runner/adhoc.html", self.context)

    def post(self, request):
        if 'id' in request.POST and request.POST['id'] is not unicode(''):
            adhoc = get_object_or_404(AdHoc, pk=request.POST['id'])
        else:
            adhoc = AdHoc()
        form = AdHocForm(request.POST or None, instance=adhoc)

        # List saved adhoc tasks
        if request.POST['action'] == 'list':
            data = list()
            for task in AdHoc.objects.all():
                if request.POST['pattern'] == '' or request.POST['pattern'] == task.pattern:
                    data.append([task.pattern, task.module, task.arguments, task.sudo, task.id])
        elif request.POST['action'] == 'save':
            if form.is_valid():
                form.save(commit=True)
                data = {'result': 'ok'}
            else:
                data = {'result': 'fail', 'msg': str(form.errors)}
        elif request.POST['action'] == 'delete':
            adhoc.delete()
            data = {'result': 'ok'}
        else:
            raise Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type="application/json")


class HistoryView(BaseView):
    def get(self, request):
        if 'action' not in request.GET:
            self.context['user'] = request.user
            return render(request, "runner/history.html", self.context)
        else:
            if request.GET['action'] == 'tasks':
                tz = timezone(request.user.userdata.timezone)
                data = list()
                for task in Runner.objects.all():
                    if task.user == request.user or request.user.is_superuser == 1:
                        data.append([task.created_on.astimezone(tz).ctime(),
                                     task.user.username,
                                     task.module,
                                     task.pattern,
                                     task.status,
                                     task.id])
            else:
                raise Http404('Invalid action')
            return HttpResponse(json.dumps(data), content_type="application/json")


class ResultView(BaseView):
    def get(self, request, task_id):
        task = get_object_or_404(Runner, pk=task_id)
        if 'action' not in request.GET:
            tz = timezone(task.user.userdata.timezone)
            task.created_on = task.created_on.astimezone(tz).ctime()
            self.context['user'] = request.user
            self.context['task'] = task
            return render(request, "runner/result.html", self.context)
        else:
            if request.GET['action'] == 'task_status':
                data = {'status': task.status, 'error_message': task.error_message}
            elif request.GET['action'] == 'task_results':
                result_list = list()
                for result in task.taskresult_set.all():
                    result_list.append([result.host,
                                        result.status,
                                        result.message,
                                        {result.host: ast.literal_eval(result.response)}])
                data = result_list
            else:
                raise Http404('Invalid action')
            return HttpResponse(json.dumps(data), content_type="application/json")

