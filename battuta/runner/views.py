import ast
import json
import django_rq
import os
from rq import Worker
from ansible import runner
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404, render
from django.views.generic import View
from django.conf import settings
from pytz import timezone


from .forms import AdHocForm
from .models import AdHoc, Task
from .tasks import run_task


class BaseView(View):
    def __init__(self):
        super(BaseView, self).__init__()
        self.context = dict()


class AdHocView(BaseView):
    @staticmethod
    def check_rq():
        redis_conn = django_rq.get_connection('default')
        try:
            if len(Worker.all(connection=redis_conn)) > 0:
                return [True]
            else:
                return [False, 'Error: no workers found']
        except Exception as error:
            return [False, str(error)]

    def get(self, request):
        self.context['user'] = request.user
        return render(request, "runner/adhoc.html", self.context)

    def post(self, request):
        if 'id' in request.POST and request.POST['id'] is not unicode(''):
            adhoc = get_object_or_404(AdHoc, pk=request.POST['id'])
        else:
            adhoc = AdHoc()
        form = AdHocForm(request.POST or None, instance=adhoc)
        if request.POST['action'] == 'list':
            data = list()
            for command in AdHoc.objects.all():
                if request.POST['pattern'] == '' or request.POST['pattern'] == command.pattern:
                    data.append([command.pattern, command.module, command.arguments, command.sudo, command.id])
        elif request.POST['action'] == 'file':
            uploaded_file = request.FILES['0']
            user_upload_dir = os.path.join(settings.UPLOAD_DIR[0], str(request.user.username))
            try:
                os.makedirs(user_upload_dir)
            except:
                pass
            filepath = os.path.join(user_upload_dir, str(uploaded_file.name))
            with open(filepath, 'wb+') as destination:
                for chunk in uploaded_file.chunks():
                    destination.write(chunk)
            data = {'result': 'ok', 'filepath': filepath}
        elif request.POST['action'] == 'run':
            if form.is_valid():
                result = self.check_rq()
                if result[0] is True:
                    command = runner.Runner()
                    command.transport = 'paramiko'
                    command.remote_user = request.user.userdata.ansible_username
                    command.remote_pass = request.POST['remote_pass']
                    command.become_pass = request.POST['become_pass']
                    command.pattern = request.POST['pattern']
                    command.module_name = request.POST['module']
                    command.module_args = request.POST['arguments']
                    command.become = request.POST['become']
                    task = Task.objects.create(user=request.user,
                                               module=command.module_name,
                                               pattern=command.pattern,
                                               status='created')
                    task.save()
                    job = run_task.delay(command, task)
                    if job.is_queued is True:
                        task.status = 'enqueued'
                        task.save()
                        data = {'result': 'ok', 'task_id': task.id}
                    else:
                        task.delete()
                        data = {'result': 'fail', 'msg': 'Task was not enqeued'}
                else:
                    data = {'result': 'fail', 'msg': result[1]}
            else:
                data = {'result': 'fail', 'msg': str(form.errors)}
        elif request.POST['action'] == 'save':
            if form.is_valid():
                form.save(commit=True)
                data = {'result': 'ok'}
            else:
                data = {'result': 'fail', 'msg': str(form.errors)}
        elif request.POST['action'] == 'delete':
            adhoc.delete()
            data = {'result': 'ok'}
        elif request.POST['action'] == 'kill':
            data = {}
            task = get_object_or_404(Task, pk=request.POST['task_id'])
            redis_conn = django_rq.get_connection('default')
            for worker in Worker.all(connection=redis_conn):
                if worker.get_current_job_id() == task.job_id:
                    print worker.is_horse
                    print worker.horse_pid
                    print worker.pid
        else:
            raise Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type="application/json")


class AdhocHistoryView(BaseView):
    def get(self, request):
        if 'action' not in request.GET:
            self.context['user'] = request.user
            return render(request, "runner/adhoc_history.html", self.context)
        else:
            if request.GET['action'] == 'tasks':
                tz = timezone(request.user.userdata.timezone)
                data = list()
                for task in Task.objects.all():
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


class AdHocResultView(BaseView):
    def get(self, request, task_id):
        task = get_object_or_404(Task, pk=task_id)
        if 'action' not in request.GET:
            tz = timezone(task.user.userdata.timezone)
            task.created_on = task.created_on.astimezone(tz).ctime()
            self.context['user'] = request.user
            self.context['task'] = task
            return render(request, "runner/adhoc_result.html", self.context)
        else:
            if request.GET['action'] == 'task_status':
                data = {'status': task.status}
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

