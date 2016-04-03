import json
import os

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.core.exceptions import PermissionDenied
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404, render
from django.views.generic import View
from pytz import timezone

from .models import User, UserData, Credential
from .forms import UserForm, UserDataForm, CredentialForm


def set_credentials(username):
    user = User.objects.get(username=username)
    credential = Credential.objects.get_or_create(user=user, title='Default')[0]
    credential.username = user.username
    credential.save()
    user.userdata.default_cred = credential
    print user, user.userdata.default_cred.id
    user.userdata.save()


class LoginView(View):
    @staticmethod
    def post(request):
        if request.POST['action'] == 'Login':
            user = authenticate(username=(request.POST['username']), password=(request.POST['password']))
            if user:
                if user.is_active:
                    login(request, user)
                    set_credentials(request.POST['username'])
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
        if 'action' not in request.GET:
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
                return render(request, "users/list.html", context)
        else:
            if request.GET['action'] == 'get_users':
                data = list()
                for user in User.objects.all():
                    tz = timezone(user.userdata.timezone)
                    if user.last_login is not None:
                        user.last_login = user.last_login.astimezone(tz).ctime()
                    data.append([user.username,
                                 user.date_joined.astimezone(tz).ctime(),
                                 user.last_login,
                                 user.is_superuser,
                                 user.id])
            else:
                raise Http404('Invalid action')
            return HttpResponse(json.dumps(data), content_type="application/json")

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
                        credential = Credential.objects.get_or_create(user=user, title='Default')[0]
                        credential.username = user.username
                        credential.save()
                        user.userdata.default_cred = credential
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


class CredentialView(View):

    @staticmethod
    def get(request):
        if request.GET['action'] == 'list':
            data = list()
            credentials = Credential.objects.filter(user=request.user)
            if len(credentials) == 0:
                c = Credential(user=request.user, title='Default', username=request.user.username)
                c.save()
            for c in credentials:
                default = False
                if c == request.user.userdata.default_cred:
                    default = True
                data.append([c.id,
                             c.title,
                             c.username,
                             c.password,
                             c.rsa_key,
                             c.sudo_user,
                             c.sudo_pass,
                             c.shared,
                             default])
        else:
            raise Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type="application/json")

    @staticmethod
    def post(request):
        if request.POST['action'] == 'save':
            if request.POST['id'] == '':
                credential = Credential(user=request.user)
            else:
                credential = get_object_or_404(Credential, pk=request.POST['id'])
            if credential.user.id != request.user.id:
                data = {'result': 'fail', 'msg': 'Permission denied: credential does not belong to current user'}
            else:
                form = CredentialForm(request.POST or None, instance=credential)
                if form.is_valid():
                    print 'Key is: ' + request.POST['rsa_key']
                    credential = form.save(commit=True)
                    if request.POST['default'] == 'true':
                        request.user.userdata.default_cred = credential
                        request.user.userdata.save()
                    data = {'result': 'ok', 'cred_id': credential.id}
                else:
                    data = {'result': 'fail', 'msg': str(form.errors)}
        elif request.POST['action'] == 'delete':
            credential = get_object_or_404(Credential, pk=request.POST['id'])
            user_list = list()
            for user_data in UserData.objects.filter(default_cred=credential):
                user_list.append(user_data.user.username)
            if len(user_list) > 0:
                data = {'result': 'fail', 'msg': 'Error: credential is default for ' + ', '.join(user_list)}
            else:
                credential.delete()
                data = {'result': 'ok'}
        else:
            raise Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type="application/json")

