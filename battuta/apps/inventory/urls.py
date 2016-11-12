from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [
    url(r'^$', views.InventoryView.as_view(), name='inventory'),

    url(r'^import/$', views.ImportExportView.as_view(), name='import_export'),

    url(r'^(?P<node_type_plural>(hosts|groups))/$', login_required(views.NodesView.as_view()), name='nodes'),

    url(r'^(?P<node_type>(host|group))/(?P<node_name>[a-zA-Z0-9-._]+)/$',
        login_required(views.NodeDetailsView.as_view()), name='node_details'),

    url(r'^(?P<node_type>(host|group))/(?P<node_name>[a-zA-Z0-9-._]+)/vars/$',
        login_required(views.VariablesView.as_view()), name='variables'),

    url(r'^(?P<node_type>(host|group))/(?P<node_name>[a-zA-Z0-9-._]+)/(?P<relation>(parents|children|members))/$',
        login_required(views.RelationsView.as_view()), name='relations'),
]
