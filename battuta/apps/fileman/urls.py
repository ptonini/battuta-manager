from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [
    url(r'^search/$', login_required(views.SearchView.as_view()), name='search'),
    url(r'^files/$', login_required(views.FileView.as_view()), name='files'),
    url(r'^roles/$', login_required(views.RoleView.as_view()), name='roles'),
    url(r'^user_files/$', login_required(views.UserFilesView.as_view()), name='user_files')
]
