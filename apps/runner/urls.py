from django.urls import path, re_path
from django.contrib.auth.decorators import login_required

from apps.runner.views import PlaybookView, PlaybookArgsView, AdHocTaskView, JobView, TaskView, ResultView
from apps.runner.models import AdHocTask, Job, Task, Result

urlpatterns = [

    path('playbooks', login_required(PlaybookView.as_view())),

    re_path(r'^playbooks/(?P<path>(?s).*)/args$', login_required(PlaybookArgsView.as_view())),

    re_path(r'^playbooks/(?P<path>(?s).*)/args/(?P<obj_id>[0-9]+)$', login_required(PlaybookArgsView.as_view())),

    path(AdHocTask.type, login_required(AdHocTaskView.as_view())),

    path(AdHocTask.type + '/<int:obj_id>', login_required(AdHocTaskView.as_view())),

    path(Job.type, login_required(JobView.as_view())),

    path(Job.type + '/<int:obj_id>', login_required(JobView.as_view())),

    path(Task.type + '/<int:obj_id>', login_required(TaskView.as_view())),

    path(Result.type + '/<int:obj_id>', login_required(ResultView.as_view())),

]