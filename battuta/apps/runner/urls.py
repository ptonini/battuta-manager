from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [

    url(r'^adhoc/$', login_required(views.PageView.as_view()), kwargs={'page': 'adhoc'}),

    url(r'^roles/$', login_required(views.PageView.as_view()), kwargs={'page': 'roles'}),

    url(r'^history/$', login_required(views.PageView.as_view()), kwargs={'page': 'history'}),

    url(r'^playbooks/$', login_required(views.PageView.as_view()), kwargs={'page': 'playbooks'}),

    url(r'^job/(?P<job_id>[0-9]+)/$', login_required(views.PageView.as_view()), kwargs={'page': 'job'}),


    url(r'^api/job/([a-z_]+)/$', login_required(views.JobView.as_view())),

    url(r'^api/playbook_args/([a-z]+)/$', login_required(views.PlaybookArgsView.as_view())),

    url(r'^api/adhoc/([a-zA-Z]+)/$', login_required(views.AdHocView.as_view())),

]
