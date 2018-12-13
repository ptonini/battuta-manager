from django.urls import path
from django.contrib.auth.decorators import login_required

from .views import ProjectView, RelationsView

urlpatterns = [

    path('', login_required(ProjectView.as_view()), kwargs={'project_id': None}),

    path('/<int:project_id>', login_required(ProjectView.as_view())),

    path('/<int:project_id>/manager', login_required(RelationsView.as_view()), kwargs={'relation': 'manager'}),

    path('/<int:project_id>/host_group', login_required(RelationsView.as_view()), kwargs={'relation': 'host_group'}),

    path('/<int:project_id>/can_edit_variables', login_required(RelationsView.as_view()), kwargs={'relation': 'can_edit_variables'}),

    path('/<int:project_id>/can_run_tasks', login_required(RelationsView.as_view()), kwargs={'relation': 'can_run_tasks'}),

    path('/<int:project_id>/can_edit_tasks', login_required(RelationsView.as_view()), kwargs={'relation': 'can_edit_tasks'}),

    path('/<int:project_id>/can_run_playbooks', login_required(RelationsView.as_view()), kwargs={'relation': 'can_run_playbooks'}),

    path('/<int:project_id>/can_edit_playbooks', login_required(RelationsView.as_view()), kwargs={'relation': 'can_edit_playbooks'}),

    path('/<int:project_id>/can_edit_roles', login_required(RelationsView.as_view()), kwargs={'relation': 'can_edit_roles'}),

]