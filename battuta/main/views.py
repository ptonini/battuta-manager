import json

from django.shortcuts import render
from django.views.generic import View
from django.http import HttpResponse, Http404
from django.contrib.auth import authenticate, login, logout


class MainView(View):
    @staticmethod
    def get(request):
        return render(request, 'main/main.html', {'user': request.user})

    @staticmethod
    def post(request):
        if request.POST['action'] == 'login':
            user = authenticate(username=(request.POST['username']), password=(request.POST['password']))
            if user:
                if user.is_active:
                    login(request, user)
                    data = {'result': 'ok'}
                else:
                    data = {'result': 'fail', 'msg': 'Account disabled'}
            else:
                data = {'result': 'fail', 'msg': 'Invalid login'}
        elif request.POST['action'] == 'logout':

            logout(request)
            data = {'result': 'ok'}
        else:
            raise Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type="application/json")


class SearchView(View):
    @staticmethod
    def get(request, pattern):
        return render(request, 'main/search.html', {'pattern': pattern})


