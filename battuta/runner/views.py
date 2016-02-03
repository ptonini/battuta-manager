import ast
import json
import psutil
import hashlib

from Crypto.Cipher import AES
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404, render
from django.views.generic import View
from pytz import timezone
from rq import Worker
from redis import Redis

from .forms import AdHocForm, RunnerForm
from .models import AdHoc, Runner, Task
from .plays import enqueue_play

date_format = '%Y-%m-%d %H:%M:%S'


class BaseView(View):
    def __init__(self):
        super(BaseView, self).__init__()
        self.context = dict()


class RunnerView(View):

    # Execute play
    @staticmethod
    def _execute(form_data, play_data, runner):
        padded_data = form_data + (16 - len(form_data) % 16) * ' '
        key = hashlib.sha256('12345678').digest()
        encryptor = AES.new(key, AES.MODE_CBC, 16 * '\x00')
        encrypted_data = encryptor.encrypt(padded_data)

        if len(Worker.all(connection=(Redis()))) > 0:
            try:
                enqueue_play.delay(play_data, runner, encrypted_data)
            except Exception as e:
                runner.delete()
                return {'result': 'fail', 'msg': e.__class__.__name__ + ': ' + e.message}
            else:
                runner.status = 'enqueued'
                runner.save()
                return {'result': 'ok', 'runner_id': runner.id}
        else:
            return {'result': 'fail', 'msg': 'Error: no workers found'}

    def post(self, request):

        # Execute adhoc task
        if request.POST['action'] == 'run_adhoc':
            runner_form = RunnerForm(request.POST)
            adhoc_form = AdHocForm(request.POST)
            if adhoc_form.is_valid():
                form_data = dict(request.POST.iteritems())
                form_data['username'] = request.user.userdata.ansible_username
                form_data = json.dumps(form_data)
                play_data = {'name': request.POST['name'],
                             'hosts': request.POST['hosts'],
                             'gather_facts': 'no',
                             'tasks': [
                                 {'action': {'module': request.POST['module'], 'args': request.POST['arguments']}}
                             ]}
                runner = runner_form.save(commit=False)
                runner.status = 'created'
                runner.user = request.user
                runner.save()
                data = self._execute(form_data, play_data, runner)
            else:
                data = {'result': 'fail', 'msg': str(adhoc_form.errors)}

        # Kill task/play
        elif request.POST['action'] == 'kill':
            data = {}
            print 'killing', request.POST['runner_id']
            runner = get_object_or_404(Runner, pk=request.POST['runner_id'])
            redis_conn = Redis()
            for worker in Worker.all(connection=redis_conn):
                if worker.get_current_job_id() == runner.job_id:
                    process = psutil.Process(int(worker.name.split('.')[1]))
                    process.terminate()
                    process.terminate()
                    runner.status = 'canceled'
                    runner.save()

        else:
            raise Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type="application/json")


class AdHocView(BaseView):
    def get(self, request):
        self.context['user'] = request.user
        return render(request, "runner/adhoc.html", self.context)

    @staticmethod
    def post(request):
        if 'id' in request.POST and request.POST['id'] is not unicode(''):
            adhoc = get_object_or_404(AdHoc, pk=request.POST['id'])
        else:
            adhoc = AdHoc()
        form = AdHocForm(request.POST or None, instance=adhoc)

        # List saved adhoc tasks
        if request.POST['action'] == 'list':
            data = list()
            for task in AdHoc.objects.all():
                if request.POST['hosts'] == '' or request.POST['hosts'] == task.hosts:
                    data.append([task.hosts, task.module, task.arguments, task.sudo, task.id])
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
            if request.GET['action'] == 'list':
                tz = timezone(request.user.userdata.timezone)
                data = list()
                for runner in Runner.objects.all():
                    if runner.user == request.user or request.user.is_superuser == 1:
                        data.append([runner.created_on.astimezone(tz).strftime(date_format),
                                     runner.user.username,
                                     runner.name,
                                     runner.hosts,
                                     runner.status,
                                     runner.id])
            else:
                raise Http404('Invalid action')
            return HttpResponse(json.dumps(data), content_type="application/json")


class ResultView(BaseView):
    def get(self, request, runner_id):
        runner = get_object_or_404(Runner, pk=runner_id)
        if 'action' not in request.GET:
            tz = timezone(runner.user.userdata.timezone)
            runner.created_on = runner.created_on.astimezone(tz).strftime(date_format)
            self.context['user'] = request.user
            self.context['runner'] = runner
            return render(request, "runner/result.html", self.context)
        else:
            if request.GET['action'] == 'status':
                task_list = list()
                for t in runner.task_set.all():
                    task_list.append([t.id, t.name])
                data = {'status': runner.status, 'message': runner.message, 'task_list': task_list}
            elif request.GET['action'] == 'task_results':
                task = get_object_or_404(Task, pk=request.GET['task_id'])
                data = list()
                for result in task.result_set.all():
                    data.append([result.host,
                                 result.status,
                                 result.message,
                                 {result.host: ast.literal_eval(result.response)}])
            else:
                raise Http404('Invalid action')
            return HttpResponse(json.dumps(data), content_type="application/json")

