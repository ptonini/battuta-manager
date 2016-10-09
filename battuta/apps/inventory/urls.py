from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [
    url(r'^$', views.InventoryView.as_view(), name='inventory'),

    url(r'^import/$', views.ImportExportView.as_view(), name='import_export'),

    url(r'^(?P<node_type_plural>\w+)/$', login_required(views.NodesView.as_view()), name='nodes'),

    url(r'^(?P<node_type>\w+)/(?P<node_name>[a-zA-Z0-9-]+)/$',
        login_required(views.NodeDetailsView.as_view()), name='node_details'),

    url(r'^(?P<node_type>\w+)/(?P<node_name>[a-zA-Z0-9-]+)/vars/$',
        login_required(views.VariablesView.as_view()), name='variables'),

    url(r'^(?P<node_type>\w+)/(?P<node_name>[a-zA-Z0-9-]+)/(?P<relation>\w+)/$',
        login_required(views.RelationsView.as_view()), name='relations'),
]
