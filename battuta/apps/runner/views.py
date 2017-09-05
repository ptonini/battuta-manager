import json
import psutil
import os
import ast

from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404, render
from django.views.generic import View
from django.core.exceptions import PermissionDenied
from django.conf import settings
from django.forms import model_to_dict
from pytz import timezone
from multiprocessing import Process

from apps.runner.models import AdHocTask, Job, Play, Task, Result, PlaybookArgs
from apps.runner.forms import AdHocTaskForm, JobForm, PlaybookArgsForm
from apps.runner.extras import run_job, get_playbook_hosts
from apps.runner.extras.handlers import JobTableHandler

from apps.users.models import Credential

from apps.preferences.extras import get_preferences
from apps.projects.extras import authorize_action
from apps.inventory.extras import AnsibleInventory


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


class JobView(View):

    @staticmethod
    def get(request, job_id):

        job = get_object_or_404(Job, pk=job_id)

        prefs = get_preferences()

        tz = timezone(job.user.userdata.timezone)

        # Convert job object to dict
        data = model_to_dict(job)

        data['username'] = job.user.username

        data['created_on'] = job.created_on.astimezone(tz).strftime(prefs['date_format'])

        # Convert status string to dict
        if job.stats:

            data['stats'] = ast.literal_eval(job.stats)

        # Add plays to job data
        data['plays'] = list()

        for play in Play.objects.filter(job_id=data['id']).values():

            play['tasks'] = [task for task in Task.objects.filter(play_id=play['id']).values()]

            data['plays'].append(play)

        return HttpResponse(json.dumps(data), content_type='application/json')

    @staticmethod
    def post(request, action):

        prefs = get_preferences()

        # Run job
        if action == 'run':

            data = None

            ansible_inventory = AnsibleInventory(subset=request.POST.get('subset'))

            job_data = request.POST.dict()

            job_data['inventory'] = ansible_inventory.inventory

            job_data['var_manager'] = ansible_inventory.var_manager

            job_data['loader'] = ansible_inventory.loader

            if job_data['cred'] == '0':

                cred = None

                job_data['cred'] = None

            else:

                cred = get_object_or_404(Credential, pk=job_data['cred'])

                if cred.user.username != request.user.username and not cred.is_shared:

                    raise PermissionDenied

            job_data.setdefault('remote_user', cred.username if cred else None)

            job_data.setdefault('remote_pass', cred.password if cred else None)

            job_data.setdefault('become_user', cred.sudo_user if cred else None)

            job_data.setdefault('become_pass', cred.sudo_pass if cred and cred.sudo_pass else job_data['remote_pass'])

            # Execute playbook
            if job_data['type'] == 'playbook':

                job_data['playbook_path'] = os.path.join(settings.PLAYBOOK_PATH, job_data['folder'], job_data['playbook'])

                job_data['name'] = job_data['playbook']

                authorize_conditions = set()

                for hosts in get_playbook_hosts(job_data['playbook_path']):

                    authorize_conditions.add(authorize_action(request.user, 'execute_job', pattern=hosts, inventory=ansible_inventory))

                if not request.user.has_perm('users.execute_jobs') or False in authorize_conditions:

                    data = {'result': 'denied'}

            # Execute task
            elif job_data['type'] == 'adhoc':

                authorize_conditions = {
                    request.user.has_perm('users.execute_jobs'),
                    authorize_action(request.user, 'execute_job', pattern=job_data['hosts'], inventory=ansible_inventory)
                }

                if True in authorize_conditions:

                    adhoc_form = AdHocTaskForm(job_data)

                    # Convert become value to boolean
                    job_data['become'] = (job_data['become'] == 'true')

                    if adhoc_form.is_valid():

                        job_data['adhoc_task'] = {
                            'name': job_data['name'],
                            'hosts': job_data['hosts'],
                            'gather_facts': False,
                            'tasks': [{
                                'action': {
                                    'module': job_data['module'],
                                    'args': job_data['arguments']
                                }
                            }]
                        }

                    else:

                        data = {'result': 'failed', 'msg': str(adhoc_form.errors)}

                else:

                    data = {'result': 'denied'}

            elif job_data['type'] == 'gather_facts':

                authorize_conditions = {
                    request.user.has_perm('users.execute_jobs'),
                    authorize_action(request.user, 'execute_job', pattern=job_data['hosts'], inventory=ansible_inventory)
                }

                if True in authorize_conditions:

                    tasks = [{'action': {'module': 'setup'}}]

                    tasks.append({'action': {'module': 'ec2_facts'}}) if prefs['use_ec2_facts'] else None

                    job_data['name'] = 'Gather facts'

                    job_data['become'] = False

                    job_data['adhoc_task'] = {
                        'name': job_data['name'],
                        'hosts': job_data['hosts'],
                        'gather_facts': False,
                        'tasks': tasks
                    }

                else:

                    data = {'result': 'denied'}

            else:

                raise Http404('Invalid form data')

            if data is None:

                job_form = JobForm(job_data)

                if job_form.is_valid():

                    job = job_form.save(commit=False)

                    job.user = request.user

                    job.status = 'created'

                    job.is_running = True

                    if cred and cred.rsa_key:

                        job.save()

                        rsa_file_name = '/tmp/tmp_job_' + str(job.id)

                        rsa_file = open(rsa_file_name, 'w+')

                        rsa_file.write(cred.rsa_key)

                        rsa_file.flush()

                        job_data['rsa_file'] = rsa_file_name

                    setattr(job, 'data', job_data)

                    setattr(job, 'prefs', prefs)

                    job.save()

                    try:

                        p = Process(target=run_job, args=(job,))

                        p.start()

                    except Exception as e:

                        job.delete()

                        try:

                            os.remove(job_data['rsa_file'])

                        except OSError:

                            pass

                        data = {'result': 'failed', 'msg': e.__class__.__name__ + ': ' + e.message}

                    else:

                        data = {'result': 'ok', 'runner_id': job.id}

                else:

                    data = {'result': 'failed', 'msg': str(job_form.errors)}

        # Kill job
        elif action == 'kill':

            job = get_object_or_404(Job, pk=request.POST['runner_id'])

            ansible_inventory = AnsibleInventory(subset=job.subset if job.subset else '')

            authorize_conditions = set()

            if job.type == 'playbook':

                playbook_path = os.path.join(settings.PLAYBOOK_PATH, job.folder, job.name)

                for hosts in get_playbook_hosts(playbook_path):

                    authorize_conditions.add(authorize_action(request.user, 'execute_job', pattern=hosts, inventory=ansible_inventory))

            else:

                authorize_conditions.add(authorize_action(request.user, 'execute_job', pattern=job.subset, inventory=ansible_inventory))

            if request.user.has_perm('users.execute_jobs') or False not in authorize_conditions:

                try:

                    process = psutil.Process(job.pid)

                except psutil.NoSuchProcess:

                    data = {'result': 'failed', 'msg': 'Job is defunct'}

                except psutil.Error as e:

                    data = {'result': 'failed', 'msg': e.__class__.__name__ + ': ' + str(job.pid)}

                else:

                    process.suspend()

                    for child in process.children(recursive=True):

                        child.kill()

                    process.kill()

                    data = {'result': 'ok', 'runner_id': job.id}

                finally:

                    try:

                        os.remove('/tmp/tmp_job_' + str(job.id))

                    except OSError:

                        pass

                    job.status = 'canceled'

                    job.is_running = False

                    job.save()

            else:

                data = {'result': 'denied'}

        else:

            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')


class AdHocView(View):

    @staticmethod
    def get(request, action):

        if action == 'list':

            task_list = list()

            for task in AdHocTask.objects.all().values():

                if request.GET['pattern'] == '' or request.GET['pattern'] == task['hosts']:

                    task['arguments'] = json.loads(task['arguments'])

                    task_list.append(task)

            data = {'result': 'ok', 'task_list': task_list}

        else:

            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')

    @staticmethod
    def post(request, action):

        authorize_conditions = {
            request.user.has_perm('users.edit_tasks'),
            authorize_action(request.user, 'edit_job', pattern=request.POST['hosts'], inventory=AnsibleInventory())
        }

        if True in authorize_conditions:

            adhoc = get_object_or_404(AdHocTask, pk=request.POST['id']) if request.POST['id'] else AdHocTask()

            form = AdHocTaskForm(request.POST or None, instance=adhoc)

            if action == 'save':

                if form.is_valid():

                    saved_task = form.save(commit=True)

                    data = {'result': 'ok', 'id': saved_task.id}

                else:

                    data = {'result': 'failed', 'msg': str(form.errors)}

            elif action == 'delete':

                adhoc.delete()

                data = {'result': 'ok'}

            else:

                raise Http404('Invalid action')

        else:

            data = {'result': 'denied'}

        return HttpResponse(json.dumps(data), content_type='application/json')


class PlaybookArgsView(View):

    @staticmethod
    def get(request, action):

        if action == 'list':

            data = list()

            for args in PlaybookArgs.objects.filter(playbook=request.GET['name'], folder=request.GET['folder']).values():

                data.append(args)

        else:

            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')

    @staticmethod
    def post(request, action):

        authorize_conditions = {request.user.has_perm('users.edit_playbooks')}

        ansible_inventory = AnsibleInventory(subset=request.POST.get('subset'))

        playbook_path = os.path.join(settings.PLAYBOOK_PATH, request.POST.get('folder', ''), request.POST.get('playbook'))

        for hosts in get_playbook_hosts(playbook_path):

            authorize_conditions.add(authorize_action(request.user, 'edit_job', pattern=hosts, inventory=ansible_inventory))

        if True in authorize_conditions:

            # Save playbook arguments
            if action == 'save':

                # Create new playbook arguments object if no id is supplied
                args = get_object_or_404(PlaybookArgs, pk=request.POST['id']) if 'id' in request.POST else PlaybookArgs()

                form = PlaybookArgsForm(request.POST or None, instance=args)

                # Validate form data and save object
                if form.is_valid():

                    form.save(commit=True)

                    data = {'result': 'ok', 'id': args.id}

                else:

                    data = {'result': 'failed', 'msg': str(form.errors)}

            # Delete playbook arguments
            elif action == 'delete':

                try:

                    args = PlaybookArgs(pk=request.POST['id'])

                    args.delete()

                    data = {'result': 'ok'}

                except Exception as e:

                    data = {'result': 'failed', 'msg': e}

            # Raise exception
            else:

                raise Http404('Invalid action')

        else:

            data = {'result': 'denied'}

        return HttpResponse(json.dumps(data), content_type='application/json')


class HistoryView(View):

    @staticmethod
    def get(request, action):

        if action == 'list':

            # Build queryset
            queryset = Job.objects.all() if request.user.has_perm('users.view_job_history') else Job.objects.filter(user=request.user)

            data = JobTableHandler(request, queryset).build_response()

        else:

            raise Http404('Invalid action')

        return HttpResponse(data, content_type='application/json')


class TaskView(View):

    @staticmethod
    def get(request, task_id):

        task = get_object_or_404(Task, pk=task_id)

        data = model_to_dict(task)

        data['results'] = list()

        for result in task.result_set.all().values():

            result.pop('response', None)

            data['results'].append(result)

        return HttpResponse(json.dumps(data), content_type='application/json')


class ResultView(View):

    @staticmethod
    def get(request, result_id):

        result = get_object_or_404(Result, pk=result_id)

        data = model_to_dict(result)

        data['response'] = json.loads(result.response)

        return HttpResponse(json.dumps(data), content_type='application/json')
