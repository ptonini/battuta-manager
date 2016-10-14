from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [

    url(r'^$', login_required(views.RunnerView.as_view()), name='runner'),
    url(r'^adhoc/$', login_required(views.AdHocView.as_view()), name='adhoc'),
    url(r'^playbooks/$', login_required(views.PlaybookView.as_view()), name='playbooks'),
    url(r'^files/$', login_required(views.FileView.as_view()), name='files'),
    url(r'^roles/$', login_required(views.RoleView.as_view()), name='roles'),
    url(r'^result/(?P<runner_id>[0-9]+)/$', login_required(views.ResultView.as_view()), name='result'),
    url(r'^history/$', login_required(views.HistoryView.as_view()), name='history'),

]

