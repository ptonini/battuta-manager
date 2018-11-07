from django.urls import path, re_path
from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [

    re_path(r'^(?P<page>manage|ansible)$', login_required(views.PageView.as_view()), kwargs={'node_type': None, 'node_id': None}),

    re_path(r'^(?P<node_type>host|group)$', login_required(views.PageView.as_view()), kwargs={'node_id': None, 'page': 'selector'}),

    re_path(r'^(?P<node_type>host|group)/(?P<node_id>[0-9]+)$', login_required(views.PageView.as_view()), kwargs={'page': 'view'}),

    path('api/', views.InventoryView.as_view()),

    re_path(r'^api/(?P<node_type>host|group)/$', login_required(views.NodeView.as_view()), kwargs={'node_id': None}),

    re_path(r'^api/(?P<node_type>host|group)/<int:node_id>/$', login_required(views.NodeView.as_view()))

]
