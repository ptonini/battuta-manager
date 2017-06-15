from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [


    url(r'^adhoc/$', login_required(views.PageView.as_view()), kwargs={'page': 'adhoc'}),

    url(r'^roles/$', login_required(views.PageView.as_view()), kwargs={'page': 'roles'}),

    url(r'^history/$', login_required(views.PageView.as_view()), kwargs={'page': 'history'}),

    url(r'^playbooks/$', login_required(views.PageView.as_view()), kwargs={'page': 'playbooks'}),

    url(r'^results/(?P<runner_id>[0-9]+)/$', login_required(views.PageView.as_view()), kwargs={'page': 'results'}),


    url(r'^api/(run|kill)/$', login_required(views.JobView.as_view())),

    url(r'^api/job/([0-9]+)/$', login_required(views.JobView.as_view())),

    url(r'^api/task/([0-9]+)/$', login_required(views.TaskView.as_view())),

    url(r'^api/result/([0-9]+)/$', login_required(views.ResultView.as_view())),

    url(r'^api/playbooks/([a-zA-Z0-9-._]+)/([a-z]+)/$', login_required(views.PlaybookView.as_view())),

    url(r'^api/history/([a-z]+)/$', login_required(views.HistoryView.as_view())),

    url(r'^api/adhoc/([a-zA-Z]+)/$', login_required(views.AdHocView.as_view())),

]
