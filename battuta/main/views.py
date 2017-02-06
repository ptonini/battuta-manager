import json

from django.shortcuts import render
from django.views.generic import View
from django.core.exceptions import PermissionDenied
from django.http import HttpResponse, Http404
from django.contrib.auth import authenticate, login, logout

from apps.users.models import User, Credential

from apps.preferences.functions import get_preferences


def set_default_cred(username):
    user = User.objects.get(username=username)
    cred, created = Credential.objects.get_or_create(user=user, title='Default')
    cred.username = user.username
    cred.save()
    user.userdata.default_cred = cred
    user.userdata.save()


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

    @staticmethod
    def post(request):
        if request.POST['action'] == 'Login':
            user = authenticate(username=(request.POST['username']), password=(request.POST['password']))
            if user:
                if user.is_active:
                    login(request, user)
                    set_default_cred(request.POST['username'])
                    data = {'result': 'ok'}
                else:
                    data = {'result': 'fail', 'msg': 'Account disabled'}
            else:
                data = {'result': 'fail', 'msg': 'Invalid login'}
        elif request.POST['action'] == 'Logout':
            logout(request)
            data = {'result': 'ok'}
        else:
            raise Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type="application/json")


class SearchView(View):
    @staticmethod
    def get(request, pattern):
        return render(request, 'main/search.html', {'pattern': pattern})


