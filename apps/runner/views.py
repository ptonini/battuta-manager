import json
import psutil
import os
import ast
from pytz import timezone
from multiprocessing import Process
from itertools import chain

from ansible.playbook import Playbook
from ansible.playbook.play import Play as AnsiblePlay
from ansible.errors import AnsibleParserError

from django.http import HttpResponse, Http404, HttpResponseNotFound, HttpResponseForbidden, HttpResponseBadRequest
from django.shortcuts import get_object_or_404, render
from django.views.generic import View

from apps.runner.models import AdHocTask, Job, Play, Task, Result, PlaybookArgs
from apps.runner.forms import AdHocTaskForm, AdHocJobForm, JobForm, PlaybookArgsForm
from apps.runner.extras import run_job
from apps.runner.extras.handlers import JobTableHandler

from apps.iam.models import Credential

from main.extras.mixins import ApiViewMixin
from apps.files.extras import PlaybookHandler
from apps.preferences.extras import get_preferences
from apps.inventory.extras import AnsibleInventory


class PlaybookView(View, ApiViewMixin):

    def get(self, request):

        data = list()

        for p in PlaybookHandler.list(request.user):

            if p.perms['readable']:

                data.append(p.serialize({'attributes': ['path'], 'links': ['self', 'args']}))

        return self._api_response({'data': data})


class PlaybookArgsView(View, ApiViewMixin):

    form_class = PlaybookArgsForm

    def post(self, request, path, args_id):

        args = PlaybookArgs(path=path)

        if args.perms(request.user)['editable']:

            return self._api_response(self._save_instance(request, args))

        else:

            return HttpResponseForbidden()

    def get(self, request, path, args_id):

        data = list()

        if args_id:

            args = get_object_or_404(PlaybookArgs, pk=args_id)

            if args.perms(request.user)['readable']:

                return self._api_response({'data': args.serialize(request.JSON.get('fields'), request.user)})

            else:

                return HttpResponseForbidden()

        else:

            for a in PlaybookArgs.objects.filter(path=path):

                if a.perms(request.user)['readable']:

                    data.append(a.serialize(None, request.user))

            return self._api_response({'data': data})

    def patch(self, request, path, args_id):

        args = get_object_or_404(PlaybookArgs, pk=args_id)

        if args.perms(request.user)['editable'] and args.path == path:

            return self._api_response(self._save_instance(request, args))

        else:

            return HttpResponseForbidden()

    @staticmethod
    def delete(request, path, args_id):

        args = get_object_or_404(PlaybookArgs, pk=args_id)

        if args.perms(request.user)['deletable'] and args.path == path:

            args.delete()

            return HttpResponse(status=204)

        else:

            return HttpResponseForbidden()


class AdHocTaskView(View, ApiViewMixin):

    form_class = AdHocTaskForm

    def post(self, request, task_id):

        task = AdHocTask()

        if task.perms(request.user)['editable']:

            return self._api_response(self._save_instance(request, task))

        else:

            return HttpResponseForbidden()

    def get(self, request, task_id):

        if task_id:

            task = get_object_or_404(AdHocTask, pk=task_id)

            if task.perms(request.user)['readable']:

                response = {'data': (task.serialize(request.JSON.get('fields'), request.user))}

            else:

                return HttpResponseForbidden()

        else:

            data = list()

            for task in AdHocTask.objects.all():

                if task.perms(request.user)['readable']:

                    data.append(task.serialize(request.JSON.get('fields'), request.user))

            response = {'data': data}

        return self._api_response(response)

    def patch(self, request, task_id):

        task = get_object_or_404(AdHocTask, pk=task_id)

        if task.perms(request.user)['editable']:

            return self._api_response(self._save_instance(request, task))

        else:

            return HttpResponseForbidden()

    @staticmethod
    def delete(request, task_id):

        task = get_object_or_404(AdHocTask, pk=task_id)

        if task.perms(request.user)['deletable']:

            task.delete()

            return HttpResponse(status=204)

        else:

            return HttpResponseForbidden()


class JobView(View, ApiViewMixin):

    form_class = JobForm

    @staticmethod
    def _build_play(tasks, job_parameters, run_data):

        play_dict = {
            'name': job_parameters['name'],
            'hosts': job_parameters['hosts'],
            'gather_facts': False,
            'tasks': tasks
        }

        return AnsiblePlay().load(play_dict, variable_manager=run_data['var_manager'], loader=run_data['loader'])

    def post(self, request, job_id):

        request_attr = request.JSON.get('data').get('attributes')

        job_parameters = json.loads(request_attr.get('parameters'))

        job = Job()

        if job.perms(request.user)['editable']:

            inventory = AnsibleInventory(subset=request_attr.get('subset'))

            run_data = {
                'job_type': request_attr.get('job_type'),
                'inventory': inventory.inventory,
                'var_manager': inventory.var_manager,
                'loader': inventory.loader,
            }

            if request_attr.get('cred') == '':

                cred = None

                run_data['cred'] = None

            else:

                cred = get_object_or_404(Credential, pk=request_attr.get('cred'))

                if cred.user.username != request.user.username and not cred.is_shared:

                    return HttpResponseForbidden

            run_data['remote_user'] = cred.username if cred else request_attr.get('remote_user')

            run_data['remote_pass'] = cred.password if cred else request_attr.get('remote_pass')

            run_data['become_user'] = cred.sudo_user if cred else request_attr.get('become_user')

            if cred:

                run_data['become_pass'] = cred.sudo_pass if cred.sudo_pass else run_data.get('remote_pass')

            else:

                run_data['become_pass'] = request_attr.get('become_pass', run_data.get('remote_pass'))

            if request_attr.get('job_type') == 'playbook':

                playbook = PlaybookHandler(request_attr['name'], request.user)

                try:

                    pb = Playbook.load(playbook.absolute_path, variable_manager=run_data['var_manager'], loader=run_data['loader'])

                except AnsibleParserError as e:

                    return self._api_response({'errors': [{'title': e.message}]})

                run_data['plays'] = pb.get_plays()

                run_data = {**run_data, **job_parameters}

            elif request_attr.get('job_type') == 'task':

                task_form = AdHocJobForm(job_parameters)

                if task_form.is_valid():

                    if 'extra_params' in job_parameters['arguments']:

                        for arg in job_parameters['arguments']['extra_params'].split():

                            key, value = arg.split('=')

                            job_parameters['arguments'][key] = value

                        job_parameters['arguments'].pop('extra_params')

                    task = dict()

                    task[job_parameters['module']] = job_parameters['arguments']

                    run_data['plays'] = [self._build_play([task], job_parameters, run_data)]

                else:

                    return self._api_response(self.build_error_dict(task_form.errors))

            elif request_attr.get('job_type') == 'facts':

                tasks = [{'setup': {}}]

                tasks.append({'ec2_instance_facts': {}}) if get_preferences()['use_ec2_facts'] else None

                run_data['plays'] = [self._build_play(tasks, job_parameters, run_data)]

            job_form = JobForm(request_attr)

            if job_form.is_valid():

                job = job_form.save(commit=False)

                job.user = request.user

                job.status = 'created'

                if cred and cred.rsa_key:

                    job.save()

                    rsa_file_name = '/tmp/tmp_job_' + str(job.id)

                    rsa_file = open(rsa_file_name, 'w+')

                    rsa_file.write(cred.rsa_key)

                    rsa_file.flush()

                    run_data['rsa_file'] = rsa_file_name

                setattr(job, 'data', run_data)

                setattr(job, 'prefs', get_preferences())

                job.save()

                try:

                    p = Process(target=run_job, args=(job,))

                    p.start()

                except Exception as e:

                    job.delete()

                    try:

                        os.remove(run_data['rsa_file'])

                    except OSError:

                        pass

                    return self._api_response({'errors': [{'title': getattr(e, 'message')}]})

                else:

                    return self._api_response({'data': job.serialize(request.JSON.get('fields'), request.user)})

            else:

                return self._api_response(self.build_error_dict(job_form.errors))

        else:

            return HttpResponseForbidden()

    def get(self, request, job_id):

        if job_id:

            job = get_object_or_404(Job, pk=job_id)

            if job.perms(request.user)['readable']:

                return self._api_response({'data': job.serialize(request.JSON.get('fields'), request.user)})

            else:

                return HttpResponseForbidden()

        else:

            if request.user.has_perm('users.view_job_history'):

                queryset = Job.objects.all()

            else:

                queryset = Job.objects.filter(user=request.user)

            return self._api_response(JobTableHandler(request, queryset).build_response())

    def patch(self, request, job_id):

        job = get_object_or_404(Job, pk=job_id)

        if job.perms(request.user)['editable']:

            job_status = request.JSON.get('data', {}).get('attributes', {}).get('status')

            if job_status == 'canceled':

                try:

                    process = psutil.Process(job.pid)

                except psutil.NoSuchProcess:

                    return self._api_response({'errors': [{'title': 'Job is defunct'}]})

                except psutil.Error as e:

                    return self._api_response({'errors': [{'title':  e.__class__.__name__ + ': ' + str(job.pid)}]})

                else:

                    process.suspend()

                    for child in process.children(recursive=True):

                        child.kill()

                    process.kill()

                finally:

                    try:

                        os.remove('/tmp/tmp_job_' + str(job.id))

                    except OSError:

                        pass

                    job.status = 'canceled'

                    job.is_running = False

                    job.save()

            return self._api_response({'data': job.serialize(request.JSON.get('fields'), request.user)})

        else:

            return HttpResponseForbidden()


class TaskView(View, ApiViewMixin):

    def get(self, request, task_id):

        task = get_object_or_404(Task, pk=task_id)

        if task.perms(request.user)['readable']:

            result_fields = {'attributes': ['host', 'status', 'message']}

            response = {
                'data': task.serialize(request.JSON.get('fields'), request.user),
                'included': [r.serialize(result_fields, request.user) for r in task.result_set.all()]
            }

            return self._api_response(response)

        else:

            return HttpResponseForbidden


class ResultView(View, ApiViewMixin):

    def get(self, request, result_id):

        result = get_object_or_404(Result, pk=result_id)

        if result.perms(request.user)['readable']:

            return self._api_response({'data': result.serialize(request.JSON.get('fields'), request.user)})

        else:

            return HttpResponseForbidden()













# class JobView(View):
#
#     @staticmethod
#     def get(request, action):

#         if action == 'list':
#
#             if request.user.has_perm('users.view_job_history'):
#
#                 queryset = Job.objects.all()
#
#             else:
#
#                 queryset = Job.objects.filter(user=request.user)
#
#             data = JobTableHandler(request, queryset).build_response()

#         elif action == 'get':
#
#             job = get_object_or_404(Job, pk=request.GET['id'])
#
#             auth = {
#                 request.user.has_perm('users.execute_jobs'),
#                 request.user == job.user,
#             }
#
#             if True in auth:
#
#                 prefs = get_preferences()
#
#                 tz = timezone(job.user.userdata.timezone)
#
#                 # Convert job object to dict
#                 job_dict = model_to_dict(job)
#
#                 job_dict['username'] = job.user.username
#
#                 job_dict['created_on'] = job.created_on.astimezone(tz).strftime(prefs['date_format'])
#
#                 # Convert status string to dict
#                 if job.stats:
#
#                     job_dict['stats'] = ast.literal_eval(job.stats)
#
#                 # Add plays to job data
#                 job_dict['plays'] = list()
#
#                 for play in Play.objects.filter(job_id=job_dict['id']).values():
#
#                     play['tasks'] = [task for task in Task.objects.filter(play_id=play['id']).values()]
#
#                     job_dict['plays'].append(play)
#
#                 data = {'status': 'ok', 'job': job_dict}
#
#             else:
#
#                 data = {'status': 'denied'}

#         elif action == 'get_task':
#
#             task = get_object_or_404(Task, pk=request.GET['task_id'])
#
#             data = model_to_dict(task)
#
#             data['results'] = list()
#
#             for result in task.result_set.all().values():
#
#                 result.pop('response', None)
#
#                 data['results'].append(result)
#
#         elif action == 'get_result':
#
#             result = get_object_or_404(Result, pk=json.loads(request.GET['result'])['id'])
#
#             result_dict = model_to_dict(result)
#
#             data = {'status': 'ok', 'result': result_dict}
#
#         else:
#
#             return HttpResponseNotFound('Invalid action')
#
#         return HttpResponse(json.dumps(data), content_type='application/json')
#
#     @staticmethod
#     def post(request, action):
#
#         prefs = get_preferences()
#
#         authorizer = caches['authorizer'].get_or_set(request.user.username, ProjectAuthorizer(request.user), settings.CACHE_TIMEOUT)
#
#         data = None
#
#         # Run job
#         if action == 'run':
#
#             ansible_inventory = AnsibleInventory(subset=request.POST.get('subset'))
#
#             job_data = request.POST.dict()
#
#             job_data['inventory'] = ansible_inventory.inventory
#
#             job_data['var_manager'] = ansible_inventory.var_manager
#
#             job_data['loader'] = ansible_inventory.loader
#
#             if job_data['cred'] == '0':
#
#                 cred = None
#
#                 job_data['cred'] = None
#
#             else:
#
#                 cred = get_object_or_404(Credential, pk=job_data['cred'])
#
#                 if cred.user.username != request.user.username and not cred.is_shared:
#
#                     raise PermissionDenied
#
#             job_data.setdefault('remote_user', cred.username if cred else None)
#
#             job_data.setdefault('remote_pass', cred.password if cred else None)
#
#             job_data.setdefault('become_user', cred.sudo_user if cred else None)
#
#             job_data.setdefault('become_pass', cred.sudo_pass if cred and cred.sudo_pass else job_data['remote_pass'])
#
#             # Execute playbook
#             if job_data['type'] == 'playbook':
#
#                 job_data['playbook_path'] = os.path.join(settings.PLAYBOOK_PATH, job_data['folder'], job_data['name'])
#
#                 auth = authorizer.can_run_playbooks(ansible_inventory, job_data['playbook_path'])
#
#                 if not request.user.has_perm('users.execute_jobs') and not auth:
#
#                     data = {'status': 'denied'}
#
#             # Execute task
#             elif job_data['type'] == 'adhoc':

#                 # job_data['hosts'] = job_data['hosts'] or 'all'
#
#                 auth = {
#                     request.user.has_perm('users.execute_jobs'),
#                     authorizer.can_run_tasks(ansible_inventory, job_data['hosts'])
#                 }
#
#                 if True in auth:
#
#                     adhoc_form = AdHocTaskForm(job_data)
#
#                     # Convert become value to boolean
#                     job_data['become'] = (job_data['become'] == 'true')
#
#                     if adhoc_form.is_valid():
#
#                         arguments = json.loads(job_data['arguments'])
#
#                         if 'extra_params' in arguments:
#
#                             for arg in arguments['extra_params'].split():
#
#                                 key, value = arg.split('=')
#
#                                 arguments[key] = value
#
#                             arguments.pop('extra_params')
#
#                         job_data['adhoc_task'] = {
#                             'name': job_data['name'],
#                             'hosts': job_data['hosts'],
#                             'gather_facts': False,
#                             'tasks': [{
#                                 'action': {
#                                     'module': job_data['module'],
#                                     'args': arguments
#                                 }
#                             }]
#                         }
#
#                     else:
#
#                         data = {'status': 'failed', 'msg': str(adhoc_form.errors)}
#
#                 else:
#
#                     data = {'status': 'denied'}

#             elif job_data['type'] == 'gather_facts':
#
#                 auth = {
#                     request.user.has_perm('users.execute_jobs'),
#                     authorizer.can_run_tasks(ansible_inventory, job_data['hosts'])
#                 }
#
#                 if True in auth:
#

#
#                     job_data['name'] = 'Gather facts'
#
#                     job_data['become'] = False
#
#                     job_data['adhoc_task'] = {
#                         'name': job_data['name'],
#                         'hosts': job_data['hosts'],
#                         'gather_facts': False,
#                         'tasks': tasks
#                     }
#
#                 else:
#
#                     data = {'status': 'denied'}
#
#             else:
#
#                 return HttpResponseNotFound('Invalid form data')
#
#             if data is None:
#
#                 job_form = JobForm(job_data)
#
#                 if job_form.is_valid():
#
#                     job = job_form.save(commit=False)
#
#                     job.user = request.user
#
#                     job.status = 'created'
#
#                     job.is_running = True
#
#                     if cred and cred.rsa_key:
#
#                         job.save()
#
#                         rsa_file_name = '/tmp/tmp_job_' + str(job.id)
#
#                         rsa_file = open(rsa_file_name, 'w+')
#
#                         rsa_file.write(cred.rsa_key)
#
#                         rsa_file.flush()
#
#                         job_data['rsa_file'] = rsa_file_name
#
#                     setattr(job, 'data', job_data)
#
#                     setattr(job, 'prefs', prefs)
#
#                     job.save()
#
#                     try:
#
#                         p = Process(target=run_job, args=(job,))
#
#                         p.start()
#
#                     except Exception as e:
#
#                         job.delete()
#
#                         try:
#
#                             os.remove(job_data['rsa_file'])
#
#                         except OSError:
#
#                             pass
#
#                         data = {'status': 'failed', 'msg': e.__class__.__name__ + ': ' + e.message}
#
#                     else:
#
#                         data = {'status': 'ok', 'job': {'id': job.id}}
#
#                 else:
#
#                     data = {'status': 'failed', 'msg': str(job_form.errors)}
#
#         # Kill job
#         elif action == 'kill':
#
#             job = get_object_or_404(Job, pk=request.POST['id'])
#
#             auth = {
#                 request.user.has_perm('users.execute_jobs'),
#                 request.user == job.user,
#                 # project_auth.authorize_job(AnsibleInventory(subset=job.subset if job.subset else ''), job)
#             }
#
#             if True in auth:
#
#                 try:
#
#                     process = psutil.Process(job.pid)
#
#                 except psutil.NoSuchProcess:
#
#                     data = {'status': 'failed', 'msg': 'Job is defunct'}
#
#                 except psutil.Error as e:
#
#                     data = {'status': 'failed', 'msg': e.__class__.__name__ + ': ' + str(job.pid)}
#
#                 else:
#
#                     process.suspend()
#
#                     for child in process.children(recursive=True):
#
#                         child.kill()
#
#                     process.kill()
#
#                     data = {'status': 'ok', 'runner_id': job.id, 'msg': 'Job canceled'}
#
#                 finally:
#
#                     try:
#
#                         os.remove('/tmp/tmp_job_' + str(job.id))
#
#                     except OSError:
#
#                         pass
#
#                     job.status = 'canceled'
#
#                     job.is_running = False
#
#                     job.save()
#
#             else:
#
#                 data = {'status': 'denied'}
#
#         else:
#
#             return HttpResponseNotFound('Invalid action')
#
#         return HttpResponse(json.dumps(data), content_type='application/json')
#






