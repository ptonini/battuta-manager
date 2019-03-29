from django.urls import path
from django.contrib.auth.decorators import login_required

from apps.inventory.models import Host, Group, Variable
from apps.inventory.views import InventoryView, ManagerView, HostView, GroupView, VariableView, RelationsView

urlpatterns = [

    path('', InventoryView.as_view()),

    path('manage', login_required(ManagerView.as_view())),


    path(Host.type, login_required(HostView.as_view())),

    path(Host.type + '/<int:obj_id>', login_required(HostView.as_view())),

    path(Group.type, login_required(GroupView.as_view())),

    path(Group.type + '/<int:obj_id>', login_required(GroupView.as_view())),


    path(Host.type + '/<int:node_id>/' + Variable.type, login_required(VariableView.as_view())),

    path(Host.type + '/<int:node_id>/' + Variable.type + '/<int:obj_id>', login_required(VariableView.as_view())),

    path(Group.type + '/<int:node_id>/' + Variable.type, login_required(VariableView.as_view())),

    path(Group.type + '/<int:node_id>/' + Variable.type + '/<int:obj_id>', login_required(VariableView.as_view())),



    path(Host.type + '/<int:node_id>/parents', login_required(RelationsView.as_view()), kwargs={'relation': 'parents', 'node_type': Host.type}),

    path(Group.type + '/<int:node_id>/parents', login_required(RelationsView.as_view()), kwargs={'relation': 'parents', 'node_type': Group.type}),

    path(Group.type + '/<int:node_id>/children', login_required(RelationsView.as_view()), kwargs={'relation': 'children', 'node_type': Group.type}),

    path(Group.type + '/<int:node_id>/members', login_required(RelationsView.as_view()), kwargs={'relation': 'members', 'node_type': Group.type}),


]
