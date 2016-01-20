from django.conf.urls import url

from . import views

from django.contrib.auth.decorators import login_required

urlpatterns = [

    url(r'^adhoc/$', login_required(views.AdHocView.as_view()), name='adhoc'),
    url(r'^adhoc/result/(?P<task_id>[0-9]+)/$', login_required(views.AdHocResultView.as_view()), name='adhoc_result'),
    url(r'^adhoc/history/$', login_required(views.AdhocHistoryView.as_view()), name='adhoc_history'),

]

