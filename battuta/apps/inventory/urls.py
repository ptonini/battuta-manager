from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [
    url(r'^$', views.InventoryView.as_view(), name='inventory'),

    url(r'^select/(?P<node_type>\w+)/$',
        login_required(views.SelectView.as_view()), name='select'),

    url(r'^(?P<node_type>\w+)/(?P<node_id>[0-9]+)/$',
        login_required(views.NodesView.as_view()), name='nodes'),

    url(r'^(?P<node_type>\w+)/(?P<node_id>[0-9]+)/variable/(?P<action>\w+)/$',
        login_required(views.VariablesView.as_view()), name='variables'),

    url(r'^(?P<node_type>\w+)/(?P<node_id>[0-9]+)/(?P<relation>\w+)/$',
        login_required(views.RelationsView.as_view()), name='relations'),
]
