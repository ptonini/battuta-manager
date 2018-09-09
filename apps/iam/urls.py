from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from . import views


urlpatterns = [

    url(r'^user/$', login_required(views.PageView.as_view()), kwargs={'page': 'user_selector'}),

    url(r'^user/([a-zA-Z0-9-._]+)/$', login_required(views.PageView.as_view()), kwargs={'page': 'user_view'}),

    url(r'^group/$', login_required(views.PageView.as_view()), kwargs={'page': 'group_selector'}),

    url(r'^group/([a-zA-Z0-9-._" "]+)/$', login_required(views.PageView.as_view()), kwargs={'page': 'group_view'}),

    url(r'^api/(login|logout)/$', views.LoginView.as_view()),

    url(r'^api/user/([a-z_]+)/$', login_required(views.UserView.as_view())),

    url(r'^api/group/([a-z_]+)/$', login_required(views.UserGroupView.as_view())),
]
