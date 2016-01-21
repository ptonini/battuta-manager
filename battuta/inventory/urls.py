from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from inventory import views

urlpatterns = [

    url(r'^(?P<entity_type>\w+)/(?P<entity_id>[0-9]+)/$',
        login_required(views.EntitiesView.as_view()), name='entities'),

    url(r'^(?P<entity_type>\w+)/(?P<entity_id>[0-9]+)/variable/(?P<action>\w+)/$',
        login_required(views.VariablesView.as_view()), name='variables'),

    url(r'^(?P<entity_type>\w+)/(?P<entity_id>[0-9]+)/(?P<relation>\w+)/$',
        login_required(views.RelationsView.as_view()), name='relations'),

    url(r'^get/(?P<action>\w+)/$', views.InventoryView.as_view(), name='inventory'),
]
