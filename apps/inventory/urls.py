from django.urls import path
from django.contrib.auth.decorators import login_required

from . import views
from .models import Host, Group

urlpatterns = [

    path('', views.PageView.as_view(), kwargs={'node_id': None, 'page': 'ansible'}),

    path("manage", login_required(views.PageView.as_view()), kwargs={'node_id': None, 'page': 'manage'}),

    path(Host.type, login_required(views.PageView.as_view()), kwargs={'node_id': None, 'page': 'host_selector'}),

    path(Host.type + '/<int:node_id>', login_required(views.PageView.as_view()), kwargs={'page': 'host_view'}),

    path(Group.type, login_required(views.PageView.as_view()), kwargs={'node_id': None, 'page': 'group_selector'}),

    path(Group.type + '/<int:node_id>', login_required(views.PageView.as_view()), kwargs={'page': 'group_view'}),

]
