from django.urls import include, path, re_path
from django.contrib.auth.decorators import login_required
from django.contrib.staticfiles.storage import staticfiles_storage
from django.views.generic.base import RedirectView

from . import views

urlpatterns = [

    path('', views.PageView.as_view(), kwargs={'page': 'main'}),

    re_path(r'^(?P<action>login|logout)$', views.LoginView.as_view()),

    path('search/<str:pattern>/', login_required(views.PageView.as_view()), kwargs={'page': 'search'}),

    # path('inventory/', include('apps.inventory.urls')),

    path('runner/', include('apps.runner.urls')),

    path('iam/', include('apps.iam.urls')),

    path('files/', include('apps.files.urls')),

    path('preferences/', include('apps.preferences.urls')),

    path('projects/', include('apps.projects.urls')),

    path('favicon.ico', RedirectView.as_view(url=staticfiles_storage.url('images/favicon.ico')), name='favicon'),

    path('api/', include('main.api_urls')),

    #re_path(r'^.*/$', views.PageView.as_view(), kwargs={'page': 'main'})

]
