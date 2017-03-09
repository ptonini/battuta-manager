from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [

    url(r'^$', views.InventoryView.as_view(), name='inventory'),


    url(r'^import/$', views.ImportExportView.as_view(), name='import_export'),


    url(r'^(hosts|groups)/$', login_required(views.NodesView.as_view()), name='nodes'),

    url(r'^(hosts|groups)/([a-z]+)/$', login_required(views.NodesApiView.as_view())),


    url(r'^(host|group)/([a-zA-Z0-9-._]+)/$', login_required(views.NodeDetailsView.as_view()), name='node_details'),

    url(r'^(host|group)/([a-zA-Z0-9-._]+)/vars/$', login_required(views.VariablesView.as_view())),

    url(r'^(host|group)/([a-zA-Z0-9-._]+)/(parents|children|members)/$', login_required(views.RelationsView.as_view())),

]
