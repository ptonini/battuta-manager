import json
import os
from pytz import timezone

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.core.exceptions import PermissionDenied
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404, render
from django.views.generic import View
from django.forms import model_to_dict
from constance import config

from .models import User, UserData, Credential
from .forms import UserForm, UserDataForm, CredentialForm


def set_default_cred(username):
    user = User.objects.get(username=username)
    cred = Credential.objects.get_or_create(user=user, title='Default')[0]
    cred.username = user.username
    cred.save()
    user.userdata.default_cred = cred
    user.userdata.save()


class LoginView(View):
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
                    view_user.date_joined = view_user.date_joined.astimezone(tz).strftime(config.date_format)
                    if view_user.last_login is not None:
                        view_user.last_login = view_user.last_login.astimezone(tz).strftime(config.date_format)
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
                        user.last_login = user.last_login.astimezone(tz).strftime(config.date_format)
                    data.append([user.username,
                                 user.date_joined.astimezone(tz).strftime(config.date_format),
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
            except os.error:
                pass
            uploaded_files = list()
            for key, value in request.FILES.iteritems():
                try:
                    uploaded_files.append(os.path.join(relative_path, str(value.name)))
                except UnicodeEncodeError:
                    raise Http404('Error: non-ASCII characters in filename')
                else:
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
                        cred = Credential.objects.get_or_create(user=user, title='Default')[0]
                        cred.username = user.username
                        cred.save()
                        user.userdata.default_cred = cred
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
    def _truncate_secure_data(c, c_dict):
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
        page_user = request.user
        if 'user_id' in request.GET:
            page_user = get_object_or_404(User, pk=request.GET['user_id'])
            set_default_cred(page_user)
        if request.user == page_user or request.user.is_superuser:
            if request.GET['action'] == 'list':
                data = list()
                for cred in Credential.objects.filter(user=page_user):
                    cred_dict = model_to_dict(cred)
                    cred_dict['user_id'] = cred_dict['user']
                    cred_dict.pop('user', None)
                    cred_dict['is_default'] = False
                    if cred == page_user.userdata.default_cred:
                        cred_dict['is_default'] = True
                    data.append(self._truncate_secure_data(cred, cred_dict))
                if request.GET['runner'] == 'true':
                    for cred in Credential.objects.filter(is_shared=True).exclude(user=page_user):
                        cred_dict = model_to_dict(cred)
                        cred_dict['title'] = cred.title + ' (' + cred.user.username + ')'
                        data.append(self._truncate_secure_data(cred, cred_dict))
            elif request.GET['action'] == 'default':
                cred = request.user.userdata.default_cred
                cred_dict = model_to_dict(cred)
                cred_dict['user_id'] = cred_dict['user']
                cred_dict.pop('user', None)
                cred_dict['is_default'] = False
                if cred == page_user.userdata.default_cred:
                    cred_dict['is_default'] = True
                data = self._truncate_secure_data(cred, cred_dict)
            else:
                raise Http404('Invalid action')
        else:
            raise PermissionDenied
        return HttpResponse(json.dumps(data), content_type="application/json")

    @staticmethod
    def post(request):
        page_user = get_object_or_404(User, pk=request.POST['user_id'])

        # Validate user
        if request.user == page_user or request.user.is_superuser:
            ssh_path = os.path.join(settings.DATA_DIR, 'userdata', str(page_user.username), '.ssh')

            # Save/Update credential
            if request.POST['action'] == 'save':
                form_data = dict(request.POST.iteritems())
                form_data['user'] = page_user.id

                # Build credential object
                if form_data['id'] == 'undefined':
                    cred = Credential(user=page_user)
                else:
                    cred = get_object_or_404(Credential, pk=form_data['id'])

                # Set form data passwords
                if form_data['password'] == '':
                    form_data['password'] = cred.password
                if form_data['sudo_pass'] == '':
                    form_data['sudo_pass'] = cred.sudo_pass
                else:
                    form_data['ask_sudo_pass'] = False

                # Check RSA key filename encoding
                try:
                    str(form_data['rsa_key'])
                except UnicodeEncodeError:
                    data = {'result': 'fail', 'msg': 'Non-ASCII characters in RSA key filename'}
                else:

                    # Check if RSA key is in use by another credential
                    duplicate = page_user.credential_set.filter(rsa_key=form_data['rsa_key']).exclude(id=cred.id)
                    if form_data['rsa_key'] == '' or len(duplicate) == 0:
                        current_key = cred.rsa_key
                        form = CredentialForm(form_data or None, instance=cred)

                        # Validate form data
                        if form.is_valid():

                            # Remove old RSA key if changed
                            if form_data['rsa_key'] != current_key:
                                try:
                                    os.remove(os.path.join(ssh_path, current_key))
                                except os.error:
                                    pass

                            # Save new RSA key
                            if form_data['upload_rsa'] == 'true':
                                with open(os.path.join(ssh_path, form_data['rsa_key']), 'w+b') as f:
                                    for chunk in request.FILES['0'].chunks():
                                        f.write(chunk)

                            # Set credential as default
                            if form_data['is_default'] == 'true':
                                page_user.userdata.default_cred = cred
                                page_user.userdata.save()

                            # Save credential
                            cred.save()
                            data = {'result': 'ok', 'cred_id': cred.id}
                        else:
                            data = {'result': 'fail', 'msg': str(form.errors)}
                    else:
                        data = {'result': 'fail',
                                'msg': '"' + form_data['rsa_key'] + '" is in use by another credential'}

            # Delete credential
            elif request.POST['action'] == 'delete':
                cred = get_object_or_404(Credential, pk=request.POST['id'])

                # List users using this credential as default
                user_list = list()
                for user_data in UserData.objects.filter(default_cred=cred):
                    user_list.append(user_data.user.username)

                # Return fail if credential is default for a user(s)
                if len(user_list) > 0:
                    data = {'result': 'fail', 'msg': 'Credential is default for ' + ', '.join(user_list)}

                # Remove RSA key from disk
                else:
                    try:
                        os.remove(os.path.join(ssh_path, cred.rsa_key))
                    except os.error:
                        pass

                    # Delete credential
                    cred.delete()
                    data = {'result': 'ok'}

            # Raise error
            else:
                raise Http404('Invalid action')
        else:
            raise PermissionDenied
        return HttpResponse(json.dumps(data), content_type="application/json")
