from django.urls import path
from django.contrib.auth.decorators import login_required

from main.views import MainView

from apps.inventory.models import Host, Group, Variable
from apps.inventory.views import InventoryView, HostView, GroupView, VarsView, RelationsView

urlpatterns = [

    path('', MainView.as_view()),

    path('inventory', login_required(InventoryView.as_view())),

    path('inventory/' + Host.type, login_required(HostView.as_view()), kwargs={'node_id': None}),

    path('inventory/' + Host.type + '/<int:node_id>', login_required(HostView.as_view())),

    path('inventory/' + Host.type + '/<int:node_id>/' + Variable.type, login_required(VarsView.as_view()), kwargs={'var_id': None, 'node_type': Host.type}),

    path('inventory/' + Host.type + '/<int:node_id>/' + Variable.type + '/<int:var_id>', login_required(VarsView.as_view()), kwargs={'node_type': Host.type}),

    path('inventory/' + Host.type + '/<int:node_id>/parents', login_required(RelationsView.as_view()), kwargs={'relation': 'parents', 'node_type': Host.type}),

    path('inventory/' + Group.type, login_required(GroupView.as_view()), kwargs={'node_id': None}),

    path('inventory/' + Group.type + '/<int:node_id>', login_required(GroupView.as_view())),

    path('inventory/' + Group.type + '/<int:node_id>/' + Variable.type, login_required(VarsView.as_view()), kwargs={'var_id': None, 'node_type': Group.type}),

    path('inventory/' + Group.type + '/<int:node_id>/' + Variable.type + '/<int:var_id>', login_required(VarsView.as_view()), kwargs={'node_type': Group.type}),

    path('inventory/' + Group.type + '/<int:node_id>/parents', login_required(RelationsView.as_view()), kwargs={'relation': 'parents', 'node_type': Group.type}),

    path('inventory/' + Group.type + '/<int:node_id>/children', login_required(RelationsView.as_view()), kwargs={'relation': 'children', 'node_type': Group.type}),

    path('inventory/' + Group.type + '/<int:node_id>/members', login_required(RelationsView.as_view()), kwargs={'relation': 'members', 'node_type': Group.type}),

]
