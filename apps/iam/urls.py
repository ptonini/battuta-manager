from django.urls import path
from django.contrib.auth.decorators import login_required

from .views import UserView #, UserGroupView
from .models import LocalUser


urlpatterns = [

    path(LocalUser.type, login_required(UserView.as_view()), kwargs={'user_id': None}),

    path(LocalUser.type + '/<int:user_id>', login_required(UserView.as_view())),

    # path(LocalUser.type, login_required(UserGroupView.as_view()), kwargs={'usergroup_id': None}),
    #
    # path(LocalUser.type + '/<int:usergroup_id>', login_required(UserGroupView.as_view())),
]
