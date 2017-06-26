from django.conf.urls import url
from django.contrib.auth.decorators import login_required

from . import views

urlpatterns = [

    url(r'^$', login_required(views.PageView.as_view())),

    url(r'^api/([a-z]+)/$', login_required(views.FilesView.as_view()))

]
