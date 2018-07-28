from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [

    url(r'^$', login_required(views.PageView.as_view()), kwargs={'page': 'runner'}),

    url(r'^job/$', login_required(views.PageView.as_view()), kwargs={'page': 'selector'}),

    url(r'^job/(?P<job_id>[0-9]+)/$', login_required(views.PageView.as_view()), kwargs={'page': 'view'}),

    url(r'^api/job/([a-z_]+)/$', login_required(views.JobView.as_view())),

    url(r'^api/playbook/([a-zA-Z]+)/$', login_required(views.PlaybookView.as_view())),

    url(r'^api/adhoc/([a-zA-Z]+)/$', login_required(views.AdHocView.as_view())),

]
