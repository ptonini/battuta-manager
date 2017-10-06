import json
import psutil
import os
import ast
from pytz import timezone
from multiprocessing import Process

from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404, render
from django.views.generic import View
from django.core.exceptions import PermissionDenied
from django.conf import settings
from django.forms import model_to_dict
from django.core.cache import cache

from apps.runner.models import AdHocTask, Job, Play, Task, Result, PlaybookArgs
from apps.runner.forms import AdHocTaskForm, JobForm, PlaybookArgsForm
from apps.runner.extras import run_job
from apps.runner.extras.handlers import JobTableHandler

from apps.users.models import Credential
from apps.preferences.extras import get_preferences
from apps.inventory.extras import AnsibleInventory
from apps.projects.extras import ProjectAuth


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

        elif kwargs['page'] == 'job':

            return render(request, "runner/job.html", {'job_id': kwargs['job_id']})


class JobView(View):

    @staticmethod
    def get(request, action):

        if action == 'list':

            if request.user.has_perm('users.view_job_history'):

                queryset = Job.objects.all()

            else:

                queryset = Job.objects.filter(user=request.user)

            data = JobTableHandler(request, queryset).build_response()

        elif action == 'get':

            job = get_object_or_404(Job, pk=request.GET['id'])

            auth = {
                request.user.has_perm('users.execute_jobs'),
                request.user == job.user,
            }

            if True in auth:

                prefs = get_preferences()

                tz = timezone(job.user.userdata.timezone)

                # Convert job object to dict
                job_dict = model_to_dict(job)

                job_dict['username'] = job.user.username

                job_dict['created_on'] = job.created_on.astimezone(tz).strftime(prefs['date_format'])

                # Convert status string to dict
                if job.stats:

                    job_dict['stats'] = ast.literal_eval(job.stats)

                # Add plays to job data
                job_dict['plays'] = list()

                for play in Play.objects.filter(job_id=job_dict['id']).values():

                    play['tasks'] = [task for task in Task.objects.filter(play_id=play['id']).values()]

                    job_dict['plays'].append(play)

                data = {'status': 'ok', 'job': job_dict}

            else:

                data = {'status': 'denied'}

        elif action == 'get_task':

            task = get_object_or_404(Task, pk=request.GET['task_id'])

            data = model_to_dict(task)

            data['results'] = list()

            for result in task.result_set.all().values():

                result.pop('response', None)

                data['results'].append(result)

        elif action == 'get_result':

            result = get_object_or_404(Result, pk=json.loads(request.GET['result'])['id'])

            result_dict = model_to_dict(result)

            data = {'status': 'ok', 'result': result_dict}

        else:

            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')

    @staticmethod
    def post(request, action):

        prefs = get_preferences()

        project_auth = cache.get_or_set(str(request.user.username + '_auth'), ProjectAuth(request.user), settings.CACHE_TIMEOUT)

        data = None

        # Run job
        if action == 'run':

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

                auth = project_auth.can_run_playbooks(ansible_inventory, job_data['playbook_path'])

                if not request.user.has_perm('users.execute_jobs') and not auth:

                    data = {'status': 'denied'}

            # Execute task
            elif job_data['type'] == 'adhoc':

                auth = {
                    request.user.has_perm('users.execute_jobs'),
                    project_auth.can_run_tasks(ansible_inventory, job_data['hosts'])
                }

                if True in auth:

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
                                    'args': json.loads(job_data['arguments'])
                                }
                            }]
                        }

                    else:

                        data = {'status': 'failed', 'msg': str(adhoc_form.errors)}

                else:

                    data = {'status': 'denied'}

            elif job_data['type'] == 'gather_facts':

                auth = {
                    request.user.has_perm('users.execute_jobs'),
                    project_auth.can_run_tasks(ansible_inventory, job_data['hosts'])
                }

                if True in auth:

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

                    data = {'status': 'denied'}

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

                        data = {'status': 'failed', 'msg': e.__class__.__name__ + ': ' + e.message}

                    else:

                        data = {'status': 'ok', 'job': {'id': job.id}}

                else:

                    data = {'status': 'failed', 'msg': str(job_form.errors)}

        # Kill job
        elif action == 'kill':

            job = get_object_or_404(Job, pk=request.POST['id'])

            auth = {
                request.user.has_perm('users.execute_jobs'),
                request.user == job.user,
                # project_auth.authorize_job(AnsibleInventory(subset=job.subset if job.subset else ''), job)
            }

            if True in auth:

                try:

                    process = psutil.Process(job.pid)

                except psutil.NoSuchProcess:

                    data = {'status': 'failed', 'msg': 'Job is defunct'}

                except psutil.Error as e:

                    data = {'status': 'failed', 'msg': e.__class__.__name__ + ': ' + str(job.pid)}

                else:

                    process.suspend()

                    for child in process.children(recursive=True):

                        child.kill()

                    process.kill()

                    data = {'status': 'ok', 'runner_id': job.id, 'msg': 'Job canceled'}

                finally:

                    try:

                        os.remove('/tmp/tmp_job_' + str(job.id))

                    except OSError:

                        pass

                    job.status = 'canceled'

                    job.is_running = False

                    job.save()

            else:

                data = {'status': 'denied'}

        else:

            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')


class AdHocView(View):

    @staticmethod
    def get(request, action):

        project_auth = cache.get_or_set(str(request.user.username + '_auth'), ProjectAuth(request.user), settings.CACHE_TIMEOUT)

        inventory = AnsibleInventory()

        if action == 'list':

            task_list = list()

            for task in AdHocTask.objects.all().values():

                auth = {
                    request.GET['pattern'] == '' or request.GET['pattern'] == task['hosts'],
                    request.user.has_perm('users.edit_tasks') or project_auth.can_edit_tasks(inventory, task['hosts'])
                }

                if auth == {True}:

                    task['arguments'] = json.loads(task['arguments']) if task['arguments'] else ''

                    task_list.append(task)

            data = {'status': 'ok', 'task_list': task_list}

        elif action == 'modules':

            module_templates = os.listdir(os.path.join(settings.STATICFILES_DIRS[0], 'templates', 'ansible_modules'))

            data = {'status': 'ok', 'modules': [m.split('.')[0] for m in module_templates]}

        else:

            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')

    @staticmethod
    def post(request, action):

        project_auth = cache.get_or_set(str(request.user.username + '_auth'), ProjectAuth(request.user), settings.CACHE_TIMEOUT)

        auth = {
            request.user.has_perm('users.edit_tasks'),
            project_auth.can_edit_tasks(AnsibleInventory(), request.POST['hosts'])
        }

        if True in auth:

            adhoc = get_object_or_404(AdHocTask, pk=request.POST['id']) if request.POST.get('id') else AdHocTask()

            form = AdHocTaskForm(request.POST or None, instance=adhoc)

            if action == 'save':

                if form.is_valid():

                    saved_task = form.save(commit=True)

                    data = {'status': 'ok', 'id': saved_task.id, 'msg': 'Task saved'}

                else:

                    data = {'status': 'failed', 'msg': str(form.errors)}

            elif action == 'delete':

                adhoc.delete()

                data = {'status': 'ok', 'msg': 'Task deleted'}

            else:

                raise Http404('Invalid action')

        else:

            data = {'status': 'denied'}

        return HttpResponse(json.dumps(data), content_type='application/json')


class PlaybookArgsView(View):

    @staticmethod
    def get(request, action):

        project_auth = cache.get_or_set(str(request.user.username + '_auth'), ProjectAuth(request.user), settings.CACHE_TIMEOUT)

        playbook_path = os.path.join(settings.PLAYBOOK_PATH, request.GET['folder'], request.GET['playbook'])

        if request.user.has_perm('users.execute_jobs') or project_auth.can_run_playbooks(AnsibleInventory(), playbook_path):

            if action == 'list':

                args_list = list()

                for args in PlaybookArgs.objects.filter(playbook=request.GET['playbook'], folder=request.GET['folder']).values():

                    args_list.append(args)

                data = {'status': 'ok', 'args': args_list}

            else:

                raise Http404('Invalid action')

        else:

            data = {'status': 'denied'}

        return HttpResponse(json.dumps(data), content_type='application/json')

    @staticmethod
    def post(request, action):

        project_auth = cache.get_or_set(str(request.user.username + '_auth'), ProjectAuth(request.user), settings.CACHE_TIMEOUT)

        ansible_inventory = AnsibleInventory(subset=request.POST.get('subset'))

        playbook_path = os.path.join(settings.PLAYBOOK_PATH, request.POST.get('folder', ''), request.POST.get('playbook'))

        auth = {
            request.user.has_perm('users.edit_playbooks'),
            project_auth.can_run_playbooks(ansible_inventory, playbook_path)
        }

        if True in auth:

            # Save playbook arguments
            if action == 'save':

                # Create new playbook arguments object if no id is supplied
                args = get_object_or_404(PlaybookArgs, pk=request.POST['id']) if 'id' in request.POST else PlaybookArgs()

                form = PlaybookArgsForm(request.POST or None, instance=args)

                # Validate form data and save object
                if form.is_valid():

                    form.save(commit=True)

                    data = {'status': 'ok', 'id': args.id, 'msg': 'Arguments saved'}

                else:

                    data = {'status': 'failed', 'msg': str(form.errors)}

            # Delete playbook arguments
            elif action == 'delete':

                try:

                    args = PlaybookArgs(pk=request.POST['id'])

                    args.delete()

                    data = {'status': 'ok', 'msg': 'Arguments deleted'}

                except Exception as e:

                    data = {'status': 'failed', 'msg': e}

            # Raise exception
            else:

                raise Http404('Invalid action')

        else:

            data = {'status': 'denied'}

        return HttpResponse(json.dumps(data), content_type='application/json')

