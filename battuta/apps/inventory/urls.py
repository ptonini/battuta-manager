from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [

    url(r'^import/$', login_required(views.PageView.as_view()), kwargs={'page': 'import'}),

    url(r'^(?P<node_type_plural>hosts|groups)/$', login_required(views.PageView.as_view()), kwargs={'page': 'nodes'}),

    url(r'^(?P<node_type>host|group)/(?P<node_name>[a-zA-Z0-9-._]+)/$', login_required(views.PageView.as_view()), kwargs={'page': 'node'}),


    url(r'^api/(get)/$', views.InventoryView.as_view()),

    url(r'^api/(search|import|export)/$', login_required(views.InventoryView.as_view())),

    url(r'^api/(host|group)/([a-z_]+)/$', login_required(views.NodeView.as_view())),

]
