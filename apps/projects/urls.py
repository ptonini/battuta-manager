from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [

    url(r'^$', login_required(views.PageView.as_view()), kwargs={'page': 'projects'}),

    url(r'^project/([0-9]+)/$', login_required(views.PageView.as_view()), kwargs={'page': 'project'}),

    url(r'^api/([a-z_]+)/$', login_required(views.ProjectView.as_view())),

]