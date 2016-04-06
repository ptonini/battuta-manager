import json
import os


from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.core.exceptions import PermissionDenied
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404, render
from django.views.generic import View
from django.forms import model_to_dict
from pytz import timezone

from .models import User, UserData, Credential
from .forms import UserForm, UserDataForm, CredentialForm


def set_credentials(username):
    user = User.objects.get(username=username)
    credential = Credential.objects.get_or_create(user=user, title='Default')[0]
    credential.username = user.username
    credential.save()
    user.userdata.default_cred = credential
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
            relative_path = os.path.join('userdata', str(request.user.username))
            if request.POST['type'] == 'rsakey':
                relative_path = os.path.join(relative_path, '.ssh')
            full_path = os.path.join(settings.DATA_DIR, relative_path)
            try:
                os.makedirs(full_path)
            except:
                pass
            uploaded_files = list()
            for key, value in request.FILES.iteritems():
                uploaded_files.append(os.path.join(relative_path, str(value.name)))
                with open(os.path.join(full_path, str(value.name)), 'wb+') as f:
                    for chunk in value.chunks():
                        f.write(chunk)
            data = {'result': 'ok', 'filepaths': uploaded_files}

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
            current_user = get_object_or_404(User, pk=request.POST['user_id'])
            if request.user.check_password(request.POST['current_password']):
                if current_user == request.user or request.user.is_superuser:
                    current_user.set_password(request.POST['new_password'])
                    current_user.save()
                    data = {'result': 'ok'}
                else:
                    raise PermissionDenied
            else:
                data = {'result': 'fail', 'msg': 'Invalid password'}
        else:
            raise Http404('Invalid action')
        return HttpResponse(json.dumps(data), content_type="application/json")


class CredentialView(View):

    @staticmethod
    def _hide_passwords(c, c_dict):
        if c.password != '':
            c_dict['password'] = True
        else:
            c_dict['password'] = False
        if c.sudo_pass != '':
            c_dict['sudo_pass'] = True
        else:
            c_dict['sudo_pass'] = False
        return c_dict

    def get(self, request):
        page_user = get_object_or_404(User, pk=request.GET['user_id'])
        set_credentials(page_user)
        if request.user == page_user or request.user.is_superuser:
            if request.GET['action'] == 'list':
                data = list()
                for c in Credential.objects.filter(user=page_user):
                    c_dict = model_to_dict(c)
                    c_dict['user_id'] = c_dict['user']
                    if c == page_user.userdata.default_cred:
                        c_dict['is_default'] = True
                    data.append(self._hide_passwords(c, c_dict))
                if 'runner' in request.GET:
                    for c in Credential.objects.filter(is_shared=True).exclude(user=page_user):
                        c_dict = model_to_dict(c)
                        c_dict['title'] = c.title + ' (' + c.user.username + ')'
                        data.append(self._hide_passwords(c, c_dict))
            else:
                raise Http404('Invalid action')
        else:
            raise PermissionDenied
        return HttpResponse(json.dumps(data), content_type="application/json")

    @staticmethod
    def post(request):
        page_user = get_object_or_404(User, pk=request.POST['user_id'])
        if request.user == page_user or request.user.is_superuser:
            if request.POST['action'] == 'save':
                if request.POST['id'] == '':
                    credential = Credential(user=page_user)
                else:
                    credential = get_object_or_404(Credential, pk=request.POST['id'])
                print credential.rsa_key, request.POST['rsa_key']
                if credential.rsa_key != request.POST['rsa_key']:
                    print 'cheguei'
                    try:
                        os.remove(os.path.join(settings.DATA_DIR, credential.rsa_key))
                    except:
                        pass
                form_data = dict(request.POST.iteritems())
                if request.POST['password'] == '':
                    form_data['password'] = credential.password
                if request.POST['sudo_pass'] == '':
                    form_data['sudo_pass'] = credential.sudo_pass
                form = CredentialForm(form_data or None, instance=credential)
                if form.is_valid():
                    credential = form.save(commit=True)
                    if request.POST['is_default'] == 'true':
                        page_user.userdata.default_cred = credential
                        page_user.userdata.save()
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
                    try:
                        os.remove(os.path.join(settings.DATA_DIR, credential.rsa_key))
                    except:
                        pass
                    credential.delete()
                    data = {'result': 'ok'}
            else:
                raise Http404('Invalid action')
        else:
            raise PermissionDenied
        return HttpResponse(json.dumps(data), content_type="application/json")

