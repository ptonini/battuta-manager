from django.urls import re_path
from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [

    re_path(r'^repository/(?P<path>(?s).*)$', login_required(views.FileView.as_view()), kwargs={'root': 'repository'}),

    re_path(r'^playbooks/(?P<path>(?s).*)$', login_required(views.FileView.as_view()), kwargs={'root': 'playbooks'}),

    re_path(r'^roles/(?P<path>(?s).*)$', login_required(views.FileView.as_view()), kwargs={'root': 'roles'})

]
