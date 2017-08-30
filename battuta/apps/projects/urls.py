from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [

    url(r'^$', login_required(views.PageView.as_view()), kwargs={'page': 'projects'}),

    url(r'^project/([0-9]+)/$', login_required(views.PageView.as_view()), kwargs={'page': 'project'}),

    url(r'^new_project/$', login_required(views.PageView.as_view()), kwargs={'page': 'new_project'}),

    url(r'^api/project/([0-9]+)/([a-z_]+)/$', login_required(views.ProjectView.as_view())),

]
