import ast
import json
import psutil
import os
import yaml

from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404, render
from django.views.generic import View
from django.core.cache import caches
from django.conf import settings
from pytz import timezone
from multiprocessing import Process

from .forms import AdHocForm, RunnerForm, PlayArgsForm
from .models import AdHoc, Runner, Task, PlayArguments
from . import run_playbook

date_format = '%Y-%m-%d %H:%M:%S'


class BaseView(View):
    def __init__(self):
        super(BaseView, self).__init__()
        self.context = dict()


class RunnerView(View):
    @staticmethod
    def _run(playbook, form_data, runner):
        try:
            p = Process(target=run_playbook, args=(playbook, form_data, runner))
            p.daemon = False
            p.start()
        except Exception as e:
            runner.delete()
            return {'result': 'fail', 'msg': e.__class__.__name__ + ': ' + e.message}
        else:
            return {'result': 'ok', 'runner_id': runner.id}

    def post(self, request):
        # Execute adhoc task
        if request.POST['action'] == 'run_play':
            playbook_cache = caches['battuta-playbooks']
            playbook = playbook_cache.get(request.POST['playbook'])[0]
            form_data = dict(request.POST.iteritems())
            form_data['username'] = request.user.userdata.ansible_username
            form_data['name'] = playbook['name']
            form_data['hosts'] = playbook['hosts']

            # Set 'check' value
            if form_data['check'] == 'true':
                form_data['check'] = True
            else:
                form_data['check'] = False

            # Set 'tags' value
            if form_data['tags'] == '':
                form_data['tags'] = None

            # Set 'become' value
            if 'become' in playbook:
                form_data['become'] = playbook['become']
            else:
                form_data['become'] = False

            runner_form = RunnerForm(form_data)
            runner = runner_form.save(commit=False)
            runner.user = request.user
            runner.status = 'created'
            runner.save()
            data = self._run(playbook, form_data, runner)
        elif request.POST['action'] == 'run_adhoc':
            runner_form = RunnerForm(request.POST)
            adhoc_form = AdHocForm(request.POST)
            if adhoc_form.is_valid():
                form_data = dict(request.POST.iteritems())
                form_data['username'] = request.user.userdata.ansible_username
                form_data['check'] = None
                form_data['tags'] = None
                playbook = {'name': request.POST['name'],
                            'hosts': request.POST['hosts'],
                            'gather_facts': 'no',
                            'tasks': [
                                {'action': {'module': request.POST['module'], 'args': request.POST['arguments']}}
                             ]}
                runner = runner_form.save(commit=False)
                runner.user = request.user
                runner.status = 'created'
                runner.save()
                data = self._run(playbook, form_data, runner)
            else:
                data = {'result': 'fail', 'msg': str(adhoc_form.errors)}

        # Kill task/play
        elif request.POST['action'] == 'kill':
            runner = get_object_or_404(Runner, pk=request.POST['runner_id'])
            try:
                process = psutil.Process(runner.pid)
            except Exception as e:
                data = {'result': 'fail', 'msg': e.__class__.__name__ + ': ' + str(runner.pid)}
            else:
                process.suspend()
                for child in process.children(recursive=True):
                    child.kill()
                process.kill()
                runner.status = 'canceled'
                runner.save()
                data = {'result': 'ok', 'runner_id': runner.id}
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
                    data.append([task.hosts, task.module, task.arguments, task.become, task.id])
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


class PlaybooksView(BaseView):
    @staticmethod
    def _build_playbook_cache(playbook_cache):
        playbook_dir = os.path.join(settings.DATA_DIR, 'playbooks')
        for root, dirs, files in os.walk(playbook_dir):
            for f in files:
                if f.split('.')[-1] == 'yml':
                    with open(os.path.join(root, f), 'r') as yaml_file:
                        playbook = yaml.load(yaml_file)
                        playbook_cache.set(f, playbook)

    def get(self, request):
        if 'action' not in request.GET:
            self.context['user'] = request.user
            return render(request, 'runner/playbooks.html', self.context)
        else:
            playbook_cache = caches['battuta-playbooks']
            if request.GET['action'] == 'get_list':
                data = list()
                self._build_playbook_cache(playbook_cache)
                for key in playbook_cache.keys('*.yml'):
                    playbook = playbook_cache.get(key)[0]
                    data.append([playbook['name'], playbook['hosts'], key])
            elif request.GET['action'] == 'get_one':
                data = playbook_cache.get(request.GET['playbook_file'])
            elif request.GET['action'] == 'get_args':
                data = list()
                for play_args in PlayArguments.objects.filter(playbook=request.GET['playbook_file']):
                    data.append([play_args.id, play_args.subset, play_args.tags])
            else:
                raise Http404('Invalid action')
            return HttpResponse(json.dumps(data), content_type='application/json')

    @staticmethod
    def post(request):
        if request.POST['action'] == 'save_args':
            try:
                args = PlayArguments.objects.get(playbook=request.POST['playbook'],
                                                 subset=request.POST['subset'],
                                                 tags=request.POST['tags'])
            except PlayArguments.DoesNotExist:
                args = PlayArguments()
            form = PlayArgsForm(request.POST or None, instance=args)
            if form.is_valid():
                form.save(commit=True)
                data = {'result': 'ok', 'args_id': args.id}
            else:
                data = {'result': 'fail', 'msg': str(form.errors)}
        elif request.POST['action'] == 'del_args':
            try:
                args = PlayArguments(pk=request.POST['args_id'])
                args.delete()
                data = {'result': 'ok'}
            except Exception as e:
                data = {'result': 'failed', 'msg': e}
        else:
            raise Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type='application/json')


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
