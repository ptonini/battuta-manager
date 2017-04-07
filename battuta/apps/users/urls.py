from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from . import views


urlpatterns = [
    url(r'^files/$', login_required(views.UserFilesView.as_view()), name='files'),
    url(r'^view/$', login_required(views.UserView.as_view()), kwargs={'page': 'view'}, name='view'),
    url(r'^new/$', login_required(views.UserView.as_view()), kwargs={'page': 'new'}, name='new'),
    url(r'^list/$', login_required(views.UserView.as_view()), kwargs={'page': 'list'}, name='list'),
    url(r'^credentials/$', login_required(views.CredentialView.as_view()), name='credentials'),
]
