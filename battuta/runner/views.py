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
from django.forms import model_to_dict
from pytz import timezone
from multiprocessing import Process

from .forms import AdHocTaskForm, RunnerForm, PlaybookArgsForm
from .models import AdHocTask, Runner, RunnerTask, PlaybookArgs
from users.models import Credential
from . import play_runner

date_format = '%Y-%m-%d %H:%M:%S'


class BaseView(View):
    def __init__(self):
        super(BaseView, self).__init__()
        self.context = dict()


class RunnerView(View):
    @staticmethod
    def _run(playbook, form_data, runner):
        try:
            p = Process(target=play_runner, args=(playbook, form_data, runner))
            p.daemon = False
            p.start()
        except Exception as e:
            runner.delete()
            return {'result': 'fail', 'msg': e.__class__.__name__ + ': ' + e.message}
        else:
            return {'result': 'ok', 'runner_id': runner.id}

    def post(self, request):

        if request.POST['action'] == 'run_play':
            playbook_cache = caches['battuta-playbooks']
            adhoc_task = playbook_cache.get(request.POST['playbook'])[0]
            form_data = dict(request.POST.iteritems())
            form_data['username'] = request.user.userdata.ansible_username
            form_data['name'] = adhoc_task['name']
            form_data['hosts'] = adhoc_task['hosts']

            # Set 'check' value
            if form_data['check'] == 'true':
                form_data['check'] = True
            else:
                form_data['check'] = False

            # Set 'tags' value
            if form_data['tags'] == '':
                form_data['tags'] = None

            # Set 'become' value
            if 'become' in adhoc_task:
                form_data['become'] = adhoc_task['become']
            else:
                form_data['become'] = False

            runner_form = RunnerForm(form_data)
            runner = runner_form.save(commit=False)
            runner.user = request.user
            runner.status = 'created'
            runner.save()
            data = self._run(adhoc_task, form_data, runner)

        # Execute AdHoc task
        elif request.POST['action'] == 'run_adhoc':
            runner_form = RunnerForm(request.POST)
            adhoc_form = AdHocTaskForm(request.POST)
            if adhoc_form.is_valid():
                form_data = dict(request.POST.iteritems())
                credential = request.user.userdata.default_cred
                if 'credential' in form_data:
                    credential = get_object_or_404(Credential, pk=form_data['credential'])
                form_data['username'] = credential.username
                if 'remote_pass' not in form_data:
                    form_data['remote_pass'] = credential.password
                if 'become_pass' not in form_data:
                    form_data['become_pass'] = credential.sudo_pass
                if credential.sudo_user != '':
                    form_data['sudo_user'] = credential.sudo_user
                form_data['rsa_key'] = ''
                if credential.rsa_key != '':
                    form_data['rsa_key'] = os.path.join(settings.DATA_DIR, credential.rsa_key)
                form_data['check'] = None
                form_data['tags'] = None
                adhoc_task = {'name': request.POST['name'],
                              'hosts': request.POST['hosts'],
                              'gather_facts': 'no',
                              'tasks': [{'action': {'module': request.POST['module'],
                                                    'args': request.POST['arguments']}}]}
                runner = runner_form.save(commit=False)
                runner.user = request.user
                runner.status = 'created'
                runner.save()
                data = self._run(adhoc_task, form_data, runner)
            else:
                data = {'result': 'fail', 'msg': str(adhoc_form.errors)}

        # Kill task/play
        elif request.POST['action'] == 'kill':
            runner = get_object_or_404(Runner, pk=request.POST['runner_id'])
            try:
                process = psutil.Process(runner.pid)
            except psutil.NoSuchProcess:
                runner.status = 'canceled'
                data = {'result': 'fail', 'msg': 'Job is defunct'}
            except psutil.Error as e:
                data = {'result': 'fail', 'msg': e.__class__.__name__ + ': ' + str(runner.pid)}
            else:
                process.suspend()
                for child in process.children(recursive=True):
                    child.kill()
                process.kill()
                runner.status = 'canceled'
                data = {'result': 'ok', 'runner_id': runner.id}
            finally:
                runner.save()
        else:
            raise Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type="application/json")


class AdHocView(BaseView):

    def get(self, request):
        if 'action' not in request.GET:
            self.context['user'] = request.user
            return render(request, "runner/adhoc.html", self.context)
        else:
            if request.GET['action'] == 'list':
                data = list()
                for task in AdHocTask.objects.all():
                    if request.GET['hosts'] == '' or request.GET['hosts'] == task.hosts:
                        data.append([task.hosts, task.module, task.arguments, task.become, task.id])
            else:
                raise Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type="application/json")

    @staticmethod
    def post(request):
        if 'id' in request.POST and request.POST['id'] is not unicode(''):
            adhoc = get_object_or_404(AdHocTask, pk=request.POST['id'])
        else:
            adhoc = AdHocTask()
        form = AdHocTaskForm(request.POST or None, instance=adhoc)

        if request.POST['action'] == 'save':
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


class PlaybookView(BaseView):
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
                for args in PlaybookArgs.objects.filter(playbook=request.GET['playbook_file']):
                    data.append(model_to_dict(args))
            else:
                raise Http404('Invalid action')
            return HttpResponse(json.dumps(data), content_type='application/json')

    @staticmethod
    def post(request):
        if request.POST['action'] == 'save_args':
            try:
                args = PlaybookArgs.objects.get(playbook=request.POST['playbook'],
                                                subset=request.POST['subset'],
                                                tags=request.POST['tags'])
            except PlaybookArgs.DoesNotExist:
                args = PlaybookArgs()
            form = PlaybookArgsForm(request.POST or None, instance=args)
            if form.is_valid():
                form.save(commit=True)
                data = {'result': 'ok', 'args_id': args.id}
            else:
                data = {'result': 'fail', 'msg': str(form.errors)}
        elif request.POST['action'] == 'del_args':
            try:
                args = PlaybookArgs(pk=request.POST['args_id'])
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
                data = model_to_dict(runner)
                data['plays'] = list()
                for play in runner.runnerplay_set.all():
                    play_dict = model_to_dict(play)
                    play_dict['tasks'] = list()
                    for task in play.runnertask_set.all():
                        task_dict = model_to_dict(task)
                        play_dict['tasks'].append(task_dict)
                    data['plays'].append(play_dict)

            elif request.GET['action'] == 'task_results':
                task = get_object_or_404(RunnerTask, pk=request.GET['task_id'])
                data = list()
                for result in task.runnerresult_set.all():
                    data.append([result.host,
                                 result.status,
                                 result.message,
                                 {result.host: ast.literal_eval(result.response)}])
            else:
                raise Http404('Invalid action')
            return HttpResponse(json.dumps(data), content_type="application/json")
