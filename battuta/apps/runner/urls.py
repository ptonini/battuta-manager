from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [

    url(r'^(?P<action>(run|kill))/$', login_required(views.RunnerView.as_view())),

    url(r'^roles/$', login_required(views.PageView.as_view()), kwargs={'page': 'roles'}, name='roles'),

    url(r'^playbooks/$', login_required(views.PageView.as_view()), kwargs={'page': 'playbooks'}, name='playbooks'),
    url(r'^playbooks/(?P<playbook>[a-zA-Z0-9-._?]+)/(?P<action>[a-z]+)/$', login_required(views.PlaybookView.as_view())),

    url(r'^history/$', login_required(views.PageView.as_view()), kwargs={'page': 'history'}, name='history'),
    url(r'^history/(?P<action>[a-z]+)/$', login_required(views.HistoryView.as_view())),

    url(r'^adhoc/$', login_required(views.PageView.as_view()), kwargs={'page': 'adhoc'}, name='adhoc'),
    url(r'^adhoc/(?P<action>[a-z]+)/$', login_required(views.AdHocView.as_view())),

    url(r'^result/(?P<runner_id>[0-9]+)/$', login_required(views.ResultView.as_view()), name='result'),


]

