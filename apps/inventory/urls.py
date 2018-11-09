from django.urls import path, re_path
from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [

    path('ansible', views.PageView.as_view(), kwargs={'node_type': None, 'node_id': None, 'page': 'ansible'}),

    path('manage', login_required(views.PageView.as_view()), kwargs={'node_type': None, 'node_id': None, 'page': 'manage'}),

    re_path(r'^(?P<node_type>host|group)$', login_required(views.PageView.as_view()), kwargs={'node_id': None, 'page': 'selector'}),

    re_path(r'^(?P<node_type>host|group)/(?P<node_id>[0-9]+)$', login_required(views.PageView.as_view()), kwargs={'page': 'view'}),

    path('api', login_required(views.InventoryView.as_view())),

    path('api/host', login_required(views.HostView.as_view()), kwargs={'node_id': None}),

    path('api/host/<int:node_id>', login_required(views.HostView.as_view())),

    path('api/host/<int:node_id>/facts', login_required(views.FactsView.as_view())),

    path('api/host/<int:node_id>/vars', login_required(views.VarsView.as_view()), kwargs={'var_id': None, 'node_type': 'host'}),

    path('api/host/<int:node_id>/vars/<int:var_id>', login_required(views.VarsView.as_view()), kwargs={'node_type': 'host'}),

    path('api/group', login_required(views.GroupView.as_view()), kwargs={'node_id': None}),

    path('api/group/<int:node_id>', login_required(views.GroupView.as_view())),

    path('api/group/<int:node_id>/vars', login_required(views.VarsView.as_view()), kwargs={'var_id': None, 'node_type': 'group'}),

    path('api/group/<int:node_id>/vars/<int:var_id>', login_required(views.VarsView.as_view()), kwargs={'node_type': 'group'}),




]
