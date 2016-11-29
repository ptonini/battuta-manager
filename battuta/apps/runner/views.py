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
from pytz import timezone
from multiprocessing import Process

from .models import AdHocTask, Runner, RunnerPlay, RunnerTask, PlaybookArgs
from .forms import AdHocTaskForm, RunnerForm, PlaybookArgsForm
from .functions import play_runner

from main import DataTableRequestHandler
from apps.users.models import Credential
from apps.preferences.functions import get_preferences


class BaseView(View):
    def __init__(self):
        super(BaseView, self).__init__()
        self.prefs = get_preferences()
        self.context = dict()


class RunnerView(BaseView):

    def post(self, request):

        # Run job
        if request.POST['action'] == 'run':
            data = None
            run_data = dict(request.POST.iteritems())

            # Add credentials to run data
            if 'cred' in run_data:
                cred = get_object_or_404(Credential, pk=run_data['cred'])
            else:
                cred = request.user.userdata.default_cred
                run_data['cred'] = cred.id

            run_data['username'] = request.user.username

            if cred.username == request.user.username:
                run_data['username'] += ' ({0})'.format(cred.username)

            if 'remote_pass' not in run_data:
                run_data['remote_pass'] = cred.password

            if 'become_pass' not in run_data:
                if cred.sudo_pass:
                    run_data['become_pass'] = cred.sudo_pass
                else:
                    run_data['become_pass'] = cred.password

            if cred.sudo_user:
                run_data['become_user'] = cred.sudo_user

            if cred.rsa_key:
                run_data['rsa_key'] = os.path.join(settings.USERDATA_PATH, str(request.user.username),
                                                   '.ssh', cred.rsa_key)

            # Execute playbook
            if run_data['type'] == 'playbook':
                run_data['playbook_path'] = os.path.join(settings.PLAYBOOK_PATH, run_data['playbook'])
                run_data['name'] = run_data['playbook']

            # Execute task
            elif run_data['type'] == 'adhoc':
                adhoc_form = AdHocTaskForm(run_data)

                # Convert become value to boolean
                if run_data['become'] == 'true':
                    run_data['become'] = True
                else:
                    run_data['become'] = False

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

            elif run_data['type'] == 'gather_facts':

                tasks = [{'action': {'module': 'setup'}}]

                if self.prefs['use_ec2_facts']:
                    tasks.append({'action': {'module': 'ec2_facts'}})

                run_data['name'] = 'Gather facts'
                run_data['become'] = False
                run_data['adhoc_task'] = {
                    'name': run_data['name'],
                    'hosts': run_data['hosts'],
                    'gather_facts': False,
                    'tasks': tasks
                }
            else:
                raise Http404('Invalid form data')

            if data is None:
                runner_form = RunnerForm(run_data)
                if runner_form.is_valid():
                    runner = runner_form.save(commit=False)
                    runner.user = request.user
                    runner.status = 'created'
                    runner.is_running = True
                    setattr(runner, 'data', run_data)
                    setattr(runner, 'prefs', self.prefs)
                    runner.save()
                    try:
                        p = Process(target=play_runner, args=(runner,))
                        p.start()
                    except Exception as e:
                        runner.delete()
                        data = {'result': 'fail', 'msg': e.__class__.__name__ + ': ' + e.message}
                    else:
                        data = {'result': 'ok', 'runner_id': runner.id}
                else:
                    data = {'result': 'fail', 'msg': str(runner_form.errors)}

        # Kill job
        elif request.POST['action'] == 'kill':
            runner = get_object_or_404(Runner, pk=request.POST['runner_id'])
            try:
                process = psutil.Process(runner.pid)
            except psutil.NoSuchProcess:
                data = {'result': 'fail', 'msg': 'Job is defunct'}
            except psutil.Error as e:
                data = {'result': 'fail', 'msg': e.__class__.__name__ + ': ' + str(runner.pid)}
            else:
                process.suspend()
                for child in process.children(recursive=True):
                    child.kill()
                process.kill()
                data = {'result': 'ok', 'runner_id': runner.id}
            finally:
                runner.status = 'canceled'
                runner.is_running = False
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
    playbook_path = settings.PLAYBOOK_PATH

    def load_playbook(self, filename):
        with open(os.path.join(self.playbook_path, filename), 'r') as yaml_file:
            data = {'text': yaml_file.read()}
            try:
                data['filename'] = filename
                data['dict'] = yaml.load(data['text'])
                data['is_valid'] = True
                data['sudo'] = False
                for play in data['dict']:
                    if 'become' in play and play['become']:
                        data['sudo'] = True
            except yaml.YAMLError as e:
                data['is_valid'] = False
                data['msg'] = type(e).__name__ + ': ' + e.__str__()
            return data

    def get(self, request):
        if 'action' not in request.GET:
            self.context['user'] = request.user
            return render(request, 'runner/playbooks.html', self.context)
        else:
            if request.GET['action'] == 'get_list':
                data = list()
                for root, dirs, files in os.walk(self.playbook_path):
                    for filename in files:
                        if filename.split('.')[-1] == 'yml':
                            playbook_data = self.load_playbook(filename)
                            data.append([filename, playbook_data['is_valid']])
            else:
                if request.GET['action'] == 'get_one':
                    data = self.load_playbook(request.GET['playbook_file'])
                    data['result'] = 'ok'
                elif request.GET['action'] == 'get_args':
                    data = list()
                    for args in PlaybookArgs.objects.filter(playbook=request.GET['playbook_file']).values():
                        data.append(args)
                else:
                    raise Http404('Invalid action')
            return HttpResponse(json.dumps(data), content_type='application/json')

    def post(self, request):

        # Save playbook
        if request.POST['action'] == 'save':

            old_full_path = os.path.join(self.playbook_path, request.POST['file_dir'], request.POST['old_file_name'])
            full_path = os.path.join(self.playbook_path, request.POST['file_dir'], request.POST['file_name'])

            if full_path != old_full_path and os.path.exists(full_path):
                data = {'result': 'fail', 'msg': 'This name is already in use'}
            else:
                try:
                    with open(full_path, 'w') as f:
                        f.write(request.POST['text'])
                except Exception as e:
                    data = {'result': 'fail', 'msg': e}
                else:
                    if full_path != old_full_path:
                        try:
                            os.remove(old_full_path)
                        except os.error:
                            pass
                        for args in PlaybookArgs.objects.filter(playbook=request.POST['old_file_name']):
                            args.playbook = request.POST['file_name']
                            args.save()

                    data = self.load_playbook(request.POST['file_name'])
                    data['result'] = 'ok'

        elif request.POST['action'] == 'delete':
            try:
                os.remove(os.path.join(settings.PLAYBOOK_PATH, request.POST['playbook_file']))
            except os.error:
                pass
            for args in PlaybookArgs.objects.filter(playbook=request.POST['playbook_file']):
                args.delete()
            data = {'result': 'ok'}

        # Save or create playbook arguments object
        elif request.POST['action'] == 'save_args':

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
                data = {'result': 'fail', 'msg': e}

        # Raise exception
        else:
            raise Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type='application/json')


class HistoryView(BaseView):
    def get(self, request):
        if 'draw' not in request.GET:
            self.context['user'] = request.user
            return render(request, "runner/history.html", self.context)
        else:

            # Build queryset
            if request.user.is_superuser:
                queryset = Runner.objects.all()
            else:
                queryset = Runner.objects.filter(user=request.user)

            # Initiate handler
            handler = DataTableRequestHandler(request.GET, queryset)

            # Build list from queryset
            tz = timezone(request.user.userdata.timezone)
            for runner in queryset:
                if runner.subset:
                    target = runner.subset
                else:
                    play = runner.runnerplay_set.first()
                    if play:
                        target = play.hosts
                    else:
                        target = None

                row = [runner.created_on.astimezone(tz).strftime(self.prefs['date_format']),
                       runner.user.username,
                       runner.name,
                       target,
                       runner.status,
                       runner.id]

                handler.add_and_filter_row(row)

            return HttpResponse(handler.build_response(), content_type="application/json")


class ResultView(BaseView):
    def get(self, request, runner_id):
        runner = get_object_or_404(Runner, pk=runner_id)

        if 'action' not in request.GET:
            tz = timezone(runner.user.userdata.timezone)
            runner.created_on = runner.created_on.astimezone(tz).strftime(self.prefs['date_format'])
            self.context['runner'] = runner
            return render(request, "runner/results.html", self.context)
        else:
            if request.GET['action'] == 'status':

                # Convert runner object to dict
                data = model_to_dict(runner)

                # Convert status string to dict
                if runner.stats:
                    data['stats'] = ast.literal_eval(runner.stats)

                # Add plays to runner data
                data['plays'] = list()
                for play in RunnerPlay.objects.filter(runner_id=data['id']).values():
                    play['tasks'] = [task for task in RunnerTask.objects.filter(runner_play_id=play['id']).values()]
                    data['plays'].append(play)

            elif request.GET['action'] == 'task_results':
                task = get_object_or_404(RunnerTask, pk=request.GET['task_id'])
                data = list()
                for result in task.runnerresult_set.all():
                    data.append([result.host,
                                 result.status,
                                 result.message,
                                 json.loads(result.response)])
            else:
                raise Http404('Invalid action')
            return HttpResponse(json.dumps(data), content_type="application/json")
