import json
import os
from pytz import timezone

from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404, render
from django.views.generic import View
from django.forms import model_to_dict

from .models import User, UserData, Credential
from .forms import UserForm, UserDataForm, CredentialForm

from apps.preferences.functions import get_preferences


class PageView(View):

    @staticmethod
    def get(request, **kwargs):

        if kwargs['page'] == 'files':

            return render(request, 'users/files.html')

        elif kwargs['page'] == 'list':

            return render(request, 'users/list.html')

        elif kwargs['page'] == 'new':

            return render(request, 'users/new.html')

        elif kwargs['page'] == 'edit':

            return render(request, 'users/edit.html', {'user_name': kwargs['user_name']})


class UsersView(View):

    @staticmethod
    def _user_to_dict(user):

        prefs = get_preferences()

        user_dict = model_to_dict(user)

        tz = timezone(user.userdata.timezone)

        user_dict['date_joined'] = user.date_joined.astimezone(tz).strftime(prefs['date_format'])
        user_dict['timezone'] = user.userdata.timezone

        if user.last_login is not None:
            user_dict['last_login'] = user.last_login.astimezone(tz).strftime(prefs['date_format'])

        user_dict.pop('password', None)

        return user_dict

    def get(self, request, user_name, action):

        if action == 'list':

            if user_name == request.user.username or request.user.is_superuser:

                data = list()

                for user in User.objects.all():

                    data.append(self._user_to_dict(user))

            else:
                raise PermissionDenied

        elif action == 'get':

            if user_name == request.user.username or request.user.is_superuser:

                data = {'result': 'ok', 'user': self._user_to_dict(get_object_or_404(User, username=user_name))}

            else:
                raise PermissionDenied
        else:
            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type="application/json")


class LoginView(View):
    pass


class UserView(View):

    @staticmethod
    def get(request, **kwargs):
        context = dict()
        prefs = get_preferences()
        if 'action' not in request.GET:
            if kwargs['page'] == 'new':
                return render(request, "users/new.html", context)
            elif kwargs['page'] == 'view':
                if request.user.id == int(request.GET['user_id']) or request.user.is_superuser:
                    view_user = get_object_or_404(User, pk=request.GET['user_id'])
                    tz = timezone(view_user.userdata.timezone)
                    view_user.date_joined = view_user.date_joined.astimezone(tz).strftime(prefs['date_format'])
                    if view_user.last_login is not None:
                        view_user.last_login = view_user.last_login.astimezone(tz).strftime(prefs['date_format'])
                    context['view_user'] = view_user
                    return render(request, "users/view.html", context)
                else:
                    raise PermissionDenied
            elif kwargs['page'] == 'list':
                return render(request, "users/list.html", context)
        else:
            if request.GET['action'] == 'list':
                data = list()
                for user in User.objects.all():
                    tz = timezone(user.userdata.timezone)
                    if user.last_login is not None:
                        user.last_login = user.last_login.astimezone(tz).strftime(prefs['date_format'])
                    data.append([user.username,
                                 user.date_joined.astimezone(tz).strftime(prefs['date_format']),
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

        if request.POST['action'] == 'save':
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
    def _truncate_secure_data(cred):
        prefs = get_preferences()
        if cred['password']:
            cred['password'] = prefs['password_placeholder']

        if cred['sudo_pass']:
            cred['sudo_pass'] = prefs['password_placeholder']

        return cred

    def get(self, request):
        page_user = request.user

        if 'user_id' in request.GET:
            page_user = get_object_or_404(User, pk=request.GET['user_id'])

        if request.user == page_user or request.user.is_superuser:

            if request.GET['action'] == 'list':
                data = list()
                for cred in Credential.objects.filter(user=page_user).values():
                    if cred['id'] == page_user.userdata.default_cred.id:
                        cred['is_default'] = True
                    else:
                        cred['is_default'] = False
                    data.append(self._truncate_secure_data(cred))
                if request.GET['runner'] == 'true':
                    for cred in Credential.objects.filter(is_shared=True).exclude(user=page_user).values():
                        cred_owner = get_object_or_404(User, id=cred['user_id'])
                        cred['title'] += ' (' + cred_owner.username + ')'
                        data.append(self._truncate_secure_data(cred))

            elif request.GET['action'] == 'default':
                cred = model_to_dict(request.user.userdata.default_cred)
                cred['user_id'] = cred['user']
                cred.pop('user', None)

                if cred == page_user.userdata.default_cred:
                    cred['is_default'] = True
                else:
                    cred['is_default'] = False
                data = self._truncate_secure_data(cred)

            elif request.GET['action'] == 'get_one':
                cred = get_object_or_404(Credential, pk=request.GET['cred_id'])

                if request.user.is_superuser or request.user is cred.user or cred.is_shared:
                    data = {'result': 'ok', 'cred': self._truncate_secure_data(model_to_dict(cred))}
                else:
                    raise PermissionDenied

            else:
                raise Http404('Invalid action')
        else:
            raise PermissionDenied
        return HttpResponse(json.dumps(data), content_type="application/json")

    @staticmethod
    def post(request):
        page_user = get_object_or_404(User, pk=request.POST['user_id'])
        prefs = get_preferences()

        # Validate user
        if request.user == page_user or request.user.is_superuser:
            ssh_path = os.path.join(settings.USERDATA_PATH, str(page_user.username), '.ssh')

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
                if form_data['password'] == prefs['password_placeholder']:
                    form_data['password'] = cred.password

                if form_data['sudo_pass'] == prefs['password_placeholder']:
                    form_data['sudo_pass'] = cred.sudo_pass

                if form_data['password'] or form_data['rsa_key']:
                    form_data['ask_pass'] = False

                if form_data['sudo_pass']:
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
                            if request.FILES:
                                with open(os.path.join(ssh_path, form_data['rsa_key']), 'w+b') as f:
                                    for chunk in request.FILES['rsa_key_file'].chunks():
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
                user_list = [user_data.user.username for user_data in UserData.objects.filter(default_cred=cred)]

                # Return fail if credential is default for a user(s)
                if len(user_list) > 0:
                    data = {'result': 'fail', 'msg': 'Credential is default for ' + ', '.join(user_list)}
                else:

                    # Remove RSA key from disk
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
