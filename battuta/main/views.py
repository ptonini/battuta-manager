import json

from django.shortcuts import render
from django.views.generic import View
from django.core.exceptions import PermissionDenied
from django.http import HttpResponse
from django.conf import settings
from constance import config


class MainView(View):
    @staticmethod
    def get(request):
        if 'action' not in request.GET:
            return render(request, "main.html", {'user': request.user})
        else:
            if request.user.is_authenticated():
                data = dict()
                if request.GET['action'] == 'config':
                    for key, value in settings.CONSTANCE_CONFIG.iteritems():
                        data[key] = config.__getattr__(key)
                    data['user_id'] = request.user.id
                    data['user_timezone'] = request.user.userdata.timezone
                return HttpResponse(json.dumps(data), content_type="application/json")
            else:
                raise PermissionDenied


class SearchView(View):
    @staticmethod
    def get(request):
        if request.GET['search_pattern'] == '':
            return render(request, 'main.html', {'user': request.user})
        else:
            return render(request, 'search.html', {'search_pattern': request.GET['search_pattern']})

