from django.urls import include, path
from django.contrib.auth.decorators import login_required
from django.contrib.staticfiles.storage import staticfiles_storage
from django.views.generic.base import RedirectView

from . import views

urlpatterns = [

    path('', views.PageView.as_view()),

    path('login', views.LoginView.as_view(), kwargs={'action': 'login'}),

    path('main', login_required(views.MainView.as_view())),

    path('logout', login_required(views.LoginView.as_view()), kwargs={'action': 'logout'}),

    path('favicon.ico', RedirectView.as_view(url=staticfiles_storage.url('images/favicon.ico')), name='favicon'),

    path('inventory/', include('apps.inventory.urls')),

    path('runner/', include('apps.runner.urls')),

    path('iam/', include('apps.iam.urls')),

    path('files/', include('apps.files.urls')),

    path('preferences/', include('apps.preferences.urls')),

    path('projects/', include('apps.projects.urls')),

]
