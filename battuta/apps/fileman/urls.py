from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [

    url(r'^$', login_required(views.FilesView.as_view()), name='files'),

    url(r'^(?P<root>[a-zA-Z0-9-._?]+)/(?P<action>[a-z]+)/$', login_required(views.FileManagerView.as_view()), name='nodes'),

    # url(r'^files/$', login_required(views.FileView.as_view()), name='files'),
    # url(r'^roles/$', login_required(views.RoleView.as_view()), name='roles'),
    # url(r'^user_files/$', login_required(views.UserFilesView.as_view()), name='user_files')
]
