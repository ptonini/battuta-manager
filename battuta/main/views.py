import json

from django.shortcuts import render
from django.views.generic import View
from django.core.exceptions import PermissionDenied
from django.http import HttpResponse, Http404

from apps.preferences.functions import get_preferences


class MainView(View):
    @staticmethod
    def get(request):
        if 'action' not in request.GET:
            return render(request, 'main/main.html', {'user': request.user})
        else:
            if request.user.is_authenticated():
                if request.GET['action'] == 'preferences':
                    data = get_preferences()
                    data['user_id'] = request.user.id
                    data['user_timezone'] = request.user.userdata.timezone
                else:
                    raise Http404('Invalid action')
                return HttpResponse(json.dumps(data), content_type='application/json')
            else:
                raise PermissionDenied


class SearchView(View):
    @staticmethod
    def get(request):
        if request.GET['search_pattern'] == '':
            return render(request, 'main/main.html', {'user': request.user})
        else:
            return render(request, 'main/search.html', {'search_pattern': request.GET['search_pattern']})

