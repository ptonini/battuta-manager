import json
import psutil
import os
import ast
import magic

from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404, render
from django.views.generic import View
from django.core.exceptions import PermissionDenied
from django.conf import settings
from django.forms import model_to_dict
from pytz import timezone
from multiprocessing import Process

from main.extras import DataTableRequestHandler

from apps.runner.models import AdHocTask, Runner, RunnerPlay, RunnerTask, RunnerResult, PlaybookArgs
from apps.runner.forms import AdHocTaskForm, RunnerForm, PlaybookArgsForm
from apps.runner.extras import play_runner

from apps.users.models import Credential

from apps.preferences.extras import get_preferences


class PageView(View):

    @staticmethod
    def get(request, **kwargs):

        if kwargs['page'] == 'roles':

            return render(request, 'runner/roles.html')

        elif kwargs['page'] == 'playbooks':

            return render(request, 'runner/playbooks.html')

        elif kwargs['page'] == 'adhoc':

            return render(request, 'runner/adhoc.html')

        elif kwargs['page'] == 'history':

            return render(request, "runner/history.html")

        elif kwargs['page'] == 'results':

            return render(request, "runner/results.html", {'runner_id': kwargs['runner_id']})


class RunnerView(View):

    @staticmethod
    def get(request, runner_id):
        runner = get_object_or_404(Runner, pk=runner_id)

        prefs = get_preferences()

        tz = timezone(runner.user.userdata.timezone)

        # Convert runner object to dict
        data = model_to_dict(runner)

        data['username'] = runner.user.username
        data['created_on'] = runner.created_on.astimezone(tz).strftime(prefs['date_format'])

        # Convert status string to dict
        if runner.stats:
            data['stats'] = ast.literal_eval(runner.stats)

        # Add plays to runner data
        data['plays'] = list()
        for play in RunnerPlay.objects.filter(runner_id=data['id']).values():
            play['tasks'] = [task for task in RunnerTask.objects.filter(runner_play_id=play['id']).values()]
            data['plays'].append(play)

        return HttpResponse(json.dumps(data), content_type='application/json')

    @staticmethod
    def post(request, action):

        prefs = get_preferences()

        # Run job
        if action == 'run':
            data = None
            run_data = dict(request.POST.iteritems())

            # Add credentials to run data
            if 'cred' not in run_data or run_data['cred'] == '0':

                cred = request.user.userdata.default_cred

            else:

                cred = get_object_or_404(Credential, pk=run_data['cred'])

                if cred.user != request.user and not cred.is_shared:

                    raise PermissionDenied

            run_data['cred'] = cred.id

            if not run_data['remote_user']:
                run_data['remote_user'] = cred.username

            if not run_data['remote_pass']:
                run_data['remote_pass'] = cred.password

            if not run_data['become_user']:
                run_data['become_user'] = cred.sudo_user

            if not run_data['become_pass']:
                if cred.sudo_pass:
                    run_data['become_pass'] = cred.sudo_pass
                else:
                    run_data['become_pass'] = run_data['remote_pass']

            if cred.rsa_key:
                run_data['rsa_key'] = os.path.join(settings.USERDATA_PATH,
                                                   str(cred.user.username),
                                                   '.ssh',
                                                   cred.rsa_key)

            # Execute playbook
            if run_data['type'] == 'playbook':
                run_data['playbook_path'] = os.path.join(settings.PLAYBOOK_PATH, run_data['playbook'])
                run_data['name'] = run_data['playbook']

            # Execute task
            elif run_data['type'] == 'adhoc':
                adhoc_form = AdHocTaskForm(run_data)

                # Convert become value to boolean
                run_data['become'] = (run_data['become'] == 'true')

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

                if prefs['use_ec2_facts']:
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
                    setattr(runner, 'prefs', prefs)
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
        elif action == 'kill':

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

        return HttpResponse(json.dumps(data), content_type='application/json')


class AdHocView(View):

    @staticmethod
    def get(request, action):

        if action == 'list':

            data = list()

            for task in AdHocTask.objects.all().values():

                if request.GET['pattern'] == '' or request.GET['pattern'] == task['hosts']:

                    task['arguments'] = json.loads(task['arguments'])

                    data.append(task)

        elif 'term' in request.GET:
            prefs = get_preferences()
            data = list()
            file_sources = [
                [settings.FILES_PATH, '{{files_path}}', [], False],
                [settings.USERDATA_PATH, '{{userdata_path}}', [], True],
                [settings.ROLES_PATH, '{{roles_path}}', ['tasks', 'handlers', 'vars', 'defaults', 'meta'], False]
            ]

            archive_types = ['application/zip', 'application/gzip', 'application/x-tar', 'application/x-gtar']

            for path, prefix, exclude, is_user_folder in file_sources:
                for root, dirs, files in os.walk(path):
                    for file_name in files:

                        full_path = os.path.join(root, file_name)
                        relative_path = root.replace(path, prefix)

                        if not prefs['show_hidden_files'] and any(s.startswith('.') for s in full_path.split('/')):
                            continue

                        if request.GET['term'] not in full_path:
                            continue

                        if root.split('/')[-1] in exclude:
                            continue

                        if request.GET['type'] == 'archive':
                            if magic.from_file(full_path, mime='true') not in archive_types:
                                continue

                        if is_user_folder and relative_path.split('/')[1] != request.user.username:
                            continue

                        data.append({'value': os.path.join(relative_path, file_name)})

        else:

            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')

    @staticmethod
    def post(request, action):

        if request.POST['id']:

            adhoc = get_object_or_404(AdHocTask, pk=request.POST['id'])

        else:

            adhoc = AdHocTask()

        form = AdHocTaskForm(request.POST or None, instance=adhoc)

        if action == 'save':

            if form.is_valid():

                saved_task = form.save(commit=True)

                data = {'result': 'ok', 'id': saved_task.id}

            else:

                data = {'result': 'fail', 'msg': str(form.errors)}

        elif action == 'delete':

            adhoc.delete()

            data = {'result': 'ok'}

        else:

            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')


class PlaybookView(View):

    @staticmethod
    def get(request, playbook, action):

        if action == 'list':
            data = list()
            for args in PlaybookArgs.objects.filter(playbook=playbook).values():
                data.append(args)
        else:
            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')

    @staticmethod
    def post(request, playbook, action):

        # Save playbook arguments
        if action == 'save':

            # Create new playbook arguments object if no id is supplied
            if 'id' in request.POST:
                args = get_object_or_404(PlaybookArgs, pk=request.POST['id'])
            else:
                args = PlaybookArgs(playbook=playbook)
            form = PlaybookArgsForm(request.POST or None, instance=args)

            # Validate form data and save object
            if form.is_valid():
                form.save(commit=True)
                data = {'result': 'ok', 'id': args.id}
            else:
                data = {'result': 'fail', 'msg': str(form.errors)}

        # Delete playbook arguments
        elif action == 'delete':
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


class HistoryView(View):

    @staticmethod
    def get(request, action):

        if action == 'list':

            prefs = get_preferences()

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

                row = [runner.created_on.astimezone(tz).strftime(prefs['date_format']),
                       runner.user.username,
                       runner.name,
                       target,
                       runner.status,
                       runner.id]

                handler.add_and_filter_row(row)

            data = handler.build_response()

        else:
            raise Http404('Invalid action')

        return HttpResponse(data, content_type='application/json')


class TaskView(View):

    @staticmethod
    def get(request, task_id):

        task = get_object_or_404(RunnerTask, pk=task_id)

        data = model_to_dict(task)
        data['results'] = list()

        for result in task.runnerresult_set.all().values():
            result.pop('response', None)
            data['results'].append(result)

        return HttpResponse(json.dumps(data), content_type='application/json')


class ResultView(View):

    @staticmethod
    def get(request, result_id):
        result = get_object_or_404(RunnerResult, pk=result_id)

        data = model_to_dict(result)
        data['response'] = json.loads(result.response)

        return HttpResponse(json.dumps(data), content_type='application/json')