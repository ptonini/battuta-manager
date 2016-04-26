import json
import psutil
import os
import yaml
import ast

from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404, render
from django.views.generic import View
from django.conf import settings
from django.forms import model_to_dict
from django.core.cache import caches
from pytz import timezone
from multiprocessing import Process

from .forms import AdHocTaskForm, RunnerForm, PlaybookArgsForm
from .models import AdHocTask, Runner, RunnerTask, PlaybookArgs
from users.models import Credential
from . import play_runner

date_format = '%Y-%m-%d %H:%M:%S'
runner_cache = caches['battuta-runner']


class BaseView(View):
    def __init__(self):
        super(BaseView, self).__init__()
        self.context = dict()


class RunnerView(View):

    @staticmethod
    def post(request):

        # Run job
        if request.POST['action'] == 'run':
            data = None
            run_data = dict(request.POST.iteritems())

            if 'cred' in run_data:
                cred = get_object_or_404(Credential, pk=run_data['cred'])
            else:
                cred = request.user.userdata.default_cred

            run_data['username'] = cred.username

            if 'remote_pass' not in run_data:
                run_data['remote_pass'] = cred.password
            if 'become_pass' not in run_data:
                run_data['become_pass'] = cred.sudo_pass
            if cred.sudo_user:
                run_data['become_user'] = cred.sudo_user
            if cred.rsa_key:
                run_data['rsa_key'] = os.path.join(settings.DATA_DIR, 'userdata', str(request.user.username),
                                                   '.ssh', cred.rsa_key)

            # Execute playbook
            if 'playbook' in run_data:
                run_data['playbook_path'] = os.path.join(settings.DATA_DIR, 'playbooks', run_data['playbook'])
                run_data['name'] = run_data['playbook']

            # Execute task
            elif 'module' in run_data:
                adhoc_form = AdHocTaskForm(run_data)
                if adhoc_form.is_valid():
                    run_data['adhoc_task'] = {
                        'name': run_data['name'],
                        'hosts': run_data['hosts'],
                        'gather_facts': False,
                        'tasks': [{
                            'action': {
                                'module': run_data['module'],
                                'args': run_data['arguments']
                            }
                        }]
                    }
                else:
                    data = {'result': 'fail', 'msg': str(adhoc_form.errors)}
            else:
                raise Http404('Invalid form data')

            if data is None:
                runner_form = RunnerForm(run_data)
                runner = runner_form.save(commit=False)
                runner.user = request.user
                runner.status = 'created'
                runner.data = run_data
                runner.save()
                try:
                    p = Process(target=play_runner, args=(runner,))
                    p.start()
                except Exception as e:
                    runner.delete()
                    data = {'result': 'fail', 'msg': e.__class__.__name__ + ': ' + e.message}
                else:
                    data = {'result': 'ok', 'runner_id': runner.id}

        # Kill job
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

        adhoc = AdHocTask()
        if 'id' in request.POST:
            adhoc = get_object_or_404(AdHocTask, pk=request.POST['id'])
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
    def load_playbook(f):
        with open(os.path.join(settings.DATA_DIR, 'playbooks', f), 'r') as yaml_file:
            try:
                return yaml.load(yaml_file)
            except yaml.YAMLError as e:
                print type(e).__name__ + ': ' + e.__str__()
                return None

    @classmethod
    def _build_playbook_list(cls):
        playbook_list = list()
        playbook_dir = os.path.join(settings.DATA_DIR, 'playbooks')
        for root, dirs, files in os.walk(playbook_dir):
            for f in files:
                if f.split('.')[-1] == 'yml':
                    playbook = cls.load_playbook(f)
                    if playbook:
                        playbook_list.append({f: playbook})
        return playbook_list

    def get(self, request):
        if 'action' not in request.GET:
            self.context['user'] = request.user
            return render(request, 'runner/playbooks.html', self.context)
        else:
            if request.GET['action'] == 'get_list':
                data = list()
                for item in self._build_playbook_list():
                    playbook_file, playbook = item.items()[0]
                    data.append([playbook[0]['name'], playbook[0]['hosts'], playbook_file])
            else:
                playbook = self.load_playbook(request.GET['playbook_file'])
                if request.GET['action'] == 'get_one':
                    data = {'sudo': False}
                    for play in playbook:
                        if 'become' in play and play['become']:
                            data['sudo'] = True
                    data['playbook'] = playbook
                elif request.GET['action'] == 'get_args':
                    data = list()
                    for args in PlaybookArgs.objects.filter(playbook=request.GET['playbook_file']):
                        data.append(model_to_dict(args))
                else:
                    raise Http404('Invalid action')
            return HttpResponse(json.dumps(data), content_type='application/json')

    @staticmethod
    def post(request):

        # Save or create playbook arguments object
        if request.POST['action'] == 'save_args':

            # Create new playbook arguments object if no id is supplied
            if 'id' in request.POST:
                args = get_object_or_404(PlaybookArgs, pk=request.POST['id'])
            else:
                args = PlaybookArgs(playbook=request.POST['playbook'])
            form = PlaybookArgsForm(request.POST or None, instance=args)

            # Validate form data and save object
            if form.is_valid():
                form.save(commit=True)
                data = {'result': 'ok', 'id': args.id}
            else:
                data = {'result': 'fail', 'msg': str(form.errors)}

        # Delete playbook arguments
        elif request.POST['action'] == 'del_args':
            try:
                args = PlaybookArgs(pk=request.POST['id'])
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
            return render(request, "runner/results.html", self.context)
        else:
            if request.GET['action'] == 'status':
                data = model_to_dict(runner)
                if runner.stats:
                    stats = ast.literal_eval(runner.stats)
                    data['stats_table'] = list()
                    data.pop('stats', None)
                    for key, value in stats['processed'].iteritems():
                        row = [key]
                        if key in stats['ok']:
                            row.append(stats['ok'][key])
                        else:
                            row.append(0)

                        if key in stats['changed']:
                            row.append(stats['changed'][key])
                        else:
                            row.append(0)

                        if key in stats['dark']:
                            row.append(stats['dark'][key])
                        else:
                            row.append(0)

                        if key in stats['failures']:
                            row.append(stats['failures'][key])
                        else:
                            row.append(0)

                        if key in stats['skipped']:
                            row.append(stats['skipped'][key])
                        else:
                            row.append(0)
                        data['stats_table'].append(row)

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
                    try:
                        response = json.loads(result.response)
                    except:
                        response = []
                    data.append([result.host,
                                 result.status,
                                 result.message,
                                 response])
            else:
                raise Http404('Invalid action')
            return HttpResponse(json.dumps(data), content_type="application/json")
