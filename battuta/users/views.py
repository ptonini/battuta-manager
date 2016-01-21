import json

from django.contrib.auth import authenticate, login, logout
from django.core.exceptions import PermissionDenied
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404, render
from django.views.generic import View
from pytz import timezone
from users.models import User, UserData

from users.forms import UserForm, UserDataForm


class LoginView(View):
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


class UserView(View):
    @staticmethod
    def get(request, **kwargs):
        context = dict()
        if kwargs['page'] == 'new':
            return render(request, "users/new.html", context)
        elif kwargs['page'] == 'view':
            if request.user.id == int(request.GET['user_id']) or request.user.is_superuser:
                view_user = get_object_or_404(User, pk=request.GET['user_id'])
                tz = timezone(view_user.userdata.timezone)
                view_user.date_joined = view_user.date_joined.astimezone(tz).ctime()
                if view_user.last_login is not None:
                    view_user.last_login = view_user.last_login.astimezone(tz).ctime()
                context['view_user'] = view_user
                return render(request, "users/view.html", context)
            else:
                raise PermissionDenied
        elif kwargs['page'] == 'list':
            if 'action' in request.GET:
                data = list()
                for user in User.objects.all():
                    tz = timezone(user.userdata.timezone)
                    if user.last_login is not None:
                        user.last_login = user.last_login.astimezone(tz).ctime()
                    data.append([user.username,
                                 user.userdata.ansible_username,
                                 user.date_joined.astimezone(tz).ctime(),
                                 user.last_login,
                                 user.is_superuser,
                                 user.id])
                return HttpResponse(json.dumps(data), content_type="application/json")
            else:
                return render(request, "users/list.html", context)

    @staticmethod
    def post(request, **kwargs):
        post_data = dict(request.POST.iteritems())
        if kwargs['page'] == 'new':
            print request.POST
            user = User()
            user.userdata = UserData()
        elif kwargs['page'] == 'view':
            user = get_object_or_404(User, pk=post_data['user_id'])
            post_data['username'] = user.username
            post_data['password'] = user.password
        else:
            raise Http404('Invalid request type')
        if request.POST['action'] == 'save':
            if request.user.id == user.id or request.user.is_superuser:
                user_form = UserForm(post_data or None, instance=user)
                userdata_form = UserDataForm(post_data or None, instance=user.userdata)
                if user_form.is_valid() and userdata_form.is_valid():
                    user = user_form.save()
                    if kwargs['page'] == 'new':
                        user.set_password(post_data['password'])
                    user.save()
                    userdata = userdata_form.save(commit=False)
                    userdata.user = user
                    userdata.save()
                    data = {'result': 'ok'}
                else:
                    data = {'result': 'fail', 'msg': str(user_form.errors) + str(userdata_form.errors)}
            else:
                raise PermissionDenied
        elif request.POST['action'] == 'delete':
            user.userdata.delete()
            user.delete()
            data = {'result': 'ok'}
        elif request.POST['action'] == 'chgpass':
            if request.user.check_password(request.POST['oldpass']):
                request.user.set_password(request.POST['newpass'])
                request.user.save()
                data = {'result': 'ok'}
            else:
                data = {'result': 'fail', 'msg': 'Invalid password'}
        else:
            raise Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type="application/json")
