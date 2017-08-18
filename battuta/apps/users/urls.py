from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from . import views


urlpatterns = [

    url(r'^users/$', login_required(views.PageView.as_view()), kwargs={'page': 'users'}),

    url(r'^new_user/$', login_required(views.PageView.as_view()), kwargs={'page': 'new_user'}),

    url(r'^user/([a-zA-Z0-9-._" "]+)/$', login_required(views.PageView.as_view()), kwargs={'page': 'user'}),

    url(r'^user/([a-zA-Z0-9-._" "]+)/files/$', login_required(views.PageView.as_view()), kwargs={'page': 'user_files'}),

    url(r'^groups/$', login_required(views.PageView.as_view()), kwargs={'page': 'groups'}),

    url(r'^new_group/$', login_required(views.PageView.as_view()), kwargs={'page': 'new_group'}),

    url(r'^group/([a-zA-Z0-9-._" "]+)/$', login_required(views.PageView.as_view()), kwargs={'page': 'group'}),

    url(r'^api/(login|logout)/$', views.LoginView.as_view()),

    url(r'^api/user/([a-zA-Z0-9-._" "]+)/([a-z_]+)/$', login_required(views.UsersView.as_view())),

    url(r'^api/user/([a-zA-Z0-9-._" "]+)/creds/([a-z]+)/$', login_required(views.CredentialView.as_view())),

    url(r'^api/group/([a-zA-Z0-9-._" "]+)/([a-z_]+)/$', login_required(views.UserGroupView.as_view())),
]
