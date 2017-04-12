from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from . import views


urlpatterns = [

    url(r'^list/$', login_required(views.PageView.as_view()), kwargs={'page': 'list'}),

    url(r'^files/$', login_required(views.PageView.as_view()), kwargs={'page': 'files'}),

    url(r'^new/$', login_required(views.PageView.as_view()), kwargs={'page': 'new'}),

    url(r'^(?P<user_name>[a-zA-Z0-9-._]+)/$', login_required(views.PageView.as_view()), kwargs={'page': 'edit'}),


    url(r'^api/(login|logout)/$', views.UsersView.as_view()),

    url(r'^api/([a-zA-Z0-9-._]+)/([a-z]+)/$', login_required(views.UsersView.as_view())),

    url(r'^api/([a-zA-Z0-9-._]+)/creds/([a-z]+)/$', login_required(views.CredentialView.as_view())),




]
