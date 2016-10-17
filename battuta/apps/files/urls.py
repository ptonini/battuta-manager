from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [
    url(r'^$', login_required(views.FileView.as_view()), name='files'),
    url(r'^$', login_required(views.RoleView.as_view()), name='roles')
]
