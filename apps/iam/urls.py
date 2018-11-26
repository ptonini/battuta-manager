from django.urls import path
from django.contrib.auth.decorators import login_required

from .views import UserView, CredsView, UserGroupView, RelationsView, PermissionView
from .models import LocalUser, LocalGroup, Credential


urlpatterns = [

    path(LocalUser.type, login_required(UserView.as_view()), kwargs={'user_id': None}),

    path(LocalUser.type + '/<int:user_id>', login_required(UserView.as_view())),

    path(LocalUser.type + '/<int:user_id>/' + Credential.type, login_required(CredsView.as_view()), kwargs={'cred_id': None}),

    path(LocalUser.type + '/<int:user_id>/' + Credential.type + '/<int:cred_id>', login_required(CredsView.as_view())),

    path(LocalUser.type + '/<int:obj_id>/' + LocalGroup.type, login_required(RelationsView.as_view()), kwargs={'obj_type': LocalUser.type, 'relation': LocalGroup.type}),

    path(LocalGroup.type, login_required(UserGroupView.as_view()), kwargs={'group_id': None}),

    path(LocalGroup.type + '/<int:group_id>', login_required(UserGroupView.as_view())),

    path(LocalGroup.type + '/<int:obj_id>/' + LocalUser.type, login_required(RelationsView.as_view()), kwargs={'obj_type': LocalGroup.type, 'relation': LocalUser.type}),

    path(LocalGroup.type + '/<int:group_id>/permissions', login_required(PermissionView.as_view())),

]
