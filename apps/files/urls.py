from django.urls import re_path, path
from django.contrib.auth.decorators import login_required

from apps.files.views import FileView, FileSearchView

urlpatterns = [

    re_path(r'^repository/(?P<path>(?s).*)$', login_required(FileView.as_view()), kwargs={'root': 'repository'}),

    re_path(r'^playbooks/(?P<path>(?s).*)$', login_required(FileView.as_view()), kwargs={'root': 'playbooks'}),

    re_path(r'^roles/(?P<path>(?s).*)$', login_required(FileView.as_view()), kwargs={'root': 'roles'}),

    path('search', login_required(FileSearchView.as_view()))

]
