from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [

    url(r'^$', login_required(views.PageView.as_view()), kwargs={'page': 'files'}),

    url(r'^playbooks/$', login_required(views.PageView.as_view()), kwargs={'page': 'playbooks'}),

    url(r'^roles/$', login_required(views.PageView.as_view()), kwargs={'page': 'roles'}),

    url(r'^api/([a-z_]+)/$', login_required(views.FilesView.as_view()))

]
