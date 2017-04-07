from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [
    url(r'^([a-z]+)/$', login_required(views.PreferencesView.as_view()), name='preferences'),
]
