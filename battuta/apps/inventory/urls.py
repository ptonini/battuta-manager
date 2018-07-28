from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [

    url(r'^manage/$', login_required(views.PageView.as_view()), kwargs={'page': 'manage'}),

    url(r'^(?P<type>host|group)/$', login_required(views.PageView.as_view()), kwargs={'page': 'selector'}),

    url(r'^(?P<type>host|group)/(?P<name>[a-zA-Z0-9-._]+)/$', login_required(views.PageView.as_view()), kwargs={'page': 'view'}),

    url(r'^api/([a-z_]+)/$', views.InventoryView.as_view()),

    url(r'^api/(host|group)/([a-z_]+)/$', login_required(views.NodeView.as_view())),

]
