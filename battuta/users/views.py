import json
import os

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.core.exceptions import PermissionDenied
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404, render
from django.views.generic import View
from pytz import timezone

*
from .models import User, UserData
from .forms import UserForm, UserDataForm


class LoginView(View):
    @staticmethod
    def post(request):
        if request.POST['action'] == 'Login':
            user = authenticate(username=(request.POST['username']), password=(request.POST['password']))
            if user:
                if user.is_active:
                    login(request, user)
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
        form_data = dict(request.POST.iteritems())
        if kwargs['page'] == 'new':
            user = User()
            user.userdata = UserData()
        elif kwargs['page'] == 'view':
            user = get_object_or_404(User, pk=form_data['user_id'])
            form_data['username'] = user.username
            form_data['password'] = user.password
        else:
            user = request.user

        if request.POST['action'] == 'upload':
            upload_dir = os.path.join(settings.DATA_DIR, 'userdata', str(request.user.username))
            filepaths = list()
            if request.POST['type'] == 'rsakey':
                upload_dir = os.path.join(upload_dir, '.ssh')
            try:
                os.makedirs(upload_dir)
            except:
                pass
            for key, value in request.FILES.iteritems():
                if request.POST['type'] == 'rsakey':
                    filepath = os.path.join(upload_dir, 'rsakey')
                else:
                    filepath = os.path.join(upload_dir, str(value.name))
                filepaths.append(filepath)
                with open(filepath, 'wb+') as destination:
                    for chunk in value.chunks():
                        destination.write(chunk)
            data = {'result': 'ok', 'filepaths': filepaths}

        elif request.POST['action'] == 'save':
            if request.user.id == user.id or request.user.is_superuser:
                user_form = UserForm(form_data or None, instance=user)
                userdata_form = UserDataForm(form_data or None, instance=user.userdata)
                if user_form.is_valid() and userdata_form.is_valid():
                    user = user_form.save()
                    if kwargs['page'] == 'new':
                        user.set_password(form_data['password'])
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
