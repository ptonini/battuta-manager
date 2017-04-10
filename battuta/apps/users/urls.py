from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from . import views


urlpatterns = [

    url(r'^list/$', login_required(views.PageView.as_view()), kwargs={'page': 'list'}),
    url(r'^files/$', login_required(views.PageView.as_view()), kwargs={'page': 'files'}),


    url(r'^api/([a-z]+)/$', login_required(views.UsersApiView.as_view())),



    url(r'^new/$', login_required(views.UserView.as_view()), kwargs={'page': 'new'}, name='new'),

    url(r'^view/$', login_required(views.UserView.as_view()), kwargs={'page': 'view'}, name='view'),

    url(r'^credentials/$', login_required(views.CredentialView.as_view()), name='credentials'),
]
