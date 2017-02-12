from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [

    url(r'^rules/$', login_required(views.RolesView.as_view()), name='roles'),
    url(r'^playbooks/$', login_required(views.PlaybooksView.as_view()), name='playbooks'),

    url(r'^$', login_required(views.RunnerView.as_view()), name='runner'),

    url(r'^playargs/(?P<playbook>[a-zA-Z0-9-._?]+)/(?P<action>[a-z]+)/$', login_required(views.PlayArgsView.as_view())),

    url(r'^adhoc/$', login_required(views.AdHocView.as_view()), name='adhoc'),
    url(r'^result/(?P<runner_id>[0-9]+)/$', login_required(views.ResultView.as_view()), name='result'),
    url(r'^history/$', login_required(views.HistoryView.as_view()), name='history'),

]

