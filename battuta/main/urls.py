from django.conf.urls import include, url
from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [

    url(r'^$', views.PageView.as_view(), kwargs={'page': 'main'}),

    url(r'^search/(?P<pattern>[a-zA-Z0-9-.]+)/$', login_required(views.PageView.as_view()), kwargs={'page': 'search'}),

    url(r'^inventory/', include('apps.inventory.urls', namespace='inventory')),

    url(r'^runner/', include('apps.runner.urls', namespace='runner')),

    url(r'^users/', include('apps.users.urls', namespace='users')),

    url(r'^files/', include('apps.files.urls', namespace='files')),

    url(r'^preferences/', include('apps.preferences.urls', namespace='preferences')),

    url(r'^projects/', include('apps.projects.urls', namespace='projects')),
]
