from django.conf.urls import include, url
from django.contrib import admin
from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [
    url(r'^$', views.MainView.as_view(), name='main'),
    url(r'^admin/', include(admin.site.urls)),
    url(r'^search/', login_required(views.SearchView.as_view()), name='search'),
    url(r'^inventory/', include('apps.inventory.urls', namespace='inventory')),
    url(r'^runner/', include('apps.runner.urls', namespace='runner')),
    url(r'^users/', include('apps.users.urls', namespace='users'))
]