from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [
    url(r'^$', login_required(views.PageView.as_view()), name='files'),
    url(r'^([a-zA-Z0-9-._?]+)/([a-z]+)/$', login_required(views.FilesView.as_view()))
]
