from django.urls import path
from django.contrib.auth.decorators import login_required

from .views import ProjectView, RelationsView, FsObjRelationsView

urlpatterns = [

    path('', login_required(ProjectView.as_view()), kwargs={'project_id': None}),

    path('<int:obj_id>', login_required(ProjectView.as_view())),

    path('<int:obj_id>/manager', login_required(RelationsView.as_view()), kwargs={'relation': 'manager'}),

    path('<int:obj_id>/host_group', login_required(RelationsView.as_view()), kwargs={'relation': 'host_group'}),

    path('<int:obj_id>/can_edit_variables', login_required(RelationsView.as_view()), kwargs={'relation': 'can_edit_variables'}),

    path('<int:obj_id>/can_run_tasks', login_required(RelationsView.as_view()), kwargs={'relation': 'can_run_tasks'}),

    path('<int:obj_id>/can_edit_tasks', login_required(RelationsView.as_view()), kwargs={'relation': 'can_edit_tasks'}),

    path('<int:obj_id>/can_run_playbooks', login_required(RelationsView.as_view()), kwargs={'relation': 'can_run_playbooks'}),

    path('<int:obj_id>/can_edit_playbooks', login_required(RelationsView.as_view()), kwargs={'relation': 'can_edit_playbooks'}),

    path('<int:obj_id>/can_edit_roles', login_required(RelationsView.as_view()), kwargs={'relation': 'can_edit_roles'}),

    path('<int:obj_id>/playbooks', login_required(FsObjRelationsView.as_view()), kwargs={'relation': 'playbooks'}),

    path('<int:obj_id>/roles', login_required(FsObjRelationsView.as_view()), kwargs={'relation': 'roles'}),

]