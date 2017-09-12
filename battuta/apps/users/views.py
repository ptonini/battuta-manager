import json
from pytz import timezone

from django.shortcuts import get_object_or_404, render
from django.views.generic import View
from django.forms import model_to_dict
from django.http import HttpResponse, Http404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import Permission
from django.core.cache import cache
from django.conf import settings

from apps.users.models import User, Group, UserData, GroupData, Credential
from apps.users.forms import UserForm, UserDataForm, GroupForm, CredentialForm
from apps.users.extras import create_userdata, create_groupdata

from apps.preferences.extras import get_preferences
from apps.projects.extras import ProjectAuth


class PageView(View):

    @staticmethod
    def get(request, *args, **kwargs):

        if kwargs['page'] == 'users':

            return render(request, 'users/user_table.html')

        elif kwargs['page'] == 'new_user':

            return render(request, 'users/user.html')

        elif kwargs['page'] == 'user':

            return render(request, 'users/user.html', {'user_name': args[0]})

        elif kwargs['page'] == 'user_files':

            if User.objects.filter(username=args[0]).exists():

                return render(request, 'users/files.html', {'owner': args[0]})

            else:

                raise Http404('Invalid user')

        elif kwargs['page'] == 'groups':

            return render(request, 'users/group_table.html')

        elif kwargs['page'] == 'new_group':

            return render(request, 'users/group.html')

        elif kwargs['page'] == 'group':

            return render(request, 'users/group.html', {'group_name': args[0]})


class LoginView(View):

    @staticmethod
    def post(request, action):

        if action == 'login':

            user = authenticate(username=(request.POST['username']), password=(request.POST['password']))

            if user:

                if user.is_active:

                    login(request, user)

                    cache.set(str(user.username + '_auth'), ProjectAuth(user), 30)

                    data = {'result': 'ok'}

                else:

                    data = {'result': 'failed', 'msg': 'Account disabled'}

            else:

                data = {'result': 'failed', 'msg': 'Invalid login'}

        elif action == 'logout':

            logout(request)

            data = {'result': 'ok'}

        else:

            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')


class UsersView(View):

    @staticmethod
    def _user_to_dict(user):

        prefs = get_preferences()

        create_userdata(user, prefs)

        tz = timezone(user.userdata.timezone)

        user_dict = {
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'date_joined': user.date_joined.astimezone(tz).strftime(prefs['date_format']),
            'timezone': user.userdata.timezone,
            'is_active': user.is_active,
            'is_superuser': user.is_superuser,
            'last_login': user.last_login
        }

        if user.last_login is not None:

            user_dict['last_login'] = user.last_login.astimezone(tz).strftime(prefs['date_format'])

        return user_dict

    @staticmethod
    def _truncate_secure_data(cred):

        prefs = get_preferences()

        if cred['password']:

            cred['password'] = prefs['password_placeholder']

        if cred['sudo_pass']:

            cred['sudo_pass'] = prefs['password_placeholder']

        return cred

    def get(self, request, action):

        project_auth = cache.get_or_set(str(request.user.username + '_auth'), ProjectAuth(request.user), settings.CACHE_TIMEOUT)

        if action == 'list':

            if request.user.has_perm('users.edit_users'):

                data = {'result': 'ok', 'users': [self._user_to_dict(user) for user in User.objects.all()]}

            else:

                data = {'result': 'denied'}

        else:

            user = get_object_or_404(User, username=request.GET['username'])

            if request.user.has_perm('users.edit_users') or request.user.username == user.username:

                if action == 'get':

                    data = {'result': 'ok', 'user': self._user_to_dict(user)}

                elif action == 'groups':

                    if 'reverse' in request.GET and request.GET['reverse'] == 'true':

                        groups = [[group.name, group.id] for group in Group.objects.all() if group not in user.groups.all()]

                    else:

                        groups = [[group.name, group.id] for group in user.groups.all()]

                    data = {'result': 'ok', 'groups': groups}

                elif action == 'creds':

                    data = list()

                    for cred in Credential.objects.filter(user=user).values():

                        cred['is_default'] = (cred['id'] == user.userdata.default_cred.id)

                        data.append(self._truncate_secure_data(cred))

                    if request.GET['runner'] == 'true':

                        for cred in Credential.objects.filter(is_shared=True).exclude(user=user).values():

                            cred_owner = get_object_or_404(User, id=cred['user_id'])

                            cred['title'] += ' (' + cred_owner.username + ')'

                            data.append(self._truncate_secure_data(cred))

                elif action == 'default_cred':

                    data = self._truncate_secure_data(model_to_dict(user.userdata.default_cred))

                else:

                    raise Http404('Invalid action')

            else:

                data = {'result': 'denied'}

        return HttpResponse(json.dumps(data), content_type='application/json')

    def post(self, request, action):

        project_auth = cache.get_or_set(str(request.user.username + '_auth'), ProjectAuth(request.user), settings.CACHE_TIMEOUT)

        if request.user.has_perm('users.edit_users') or request.user.id == request.POST['id']:

            form_data = request.POST.dict()

            if form_data['id']:

                user = get_object_or_404(User, pk=form_data['id'])

                form_data['username'] = user.username

                form_data['password'] = user.password

            else:

                user = User()

                user.userdata = UserData()

            prefs = get_preferences()

            if action == 'save':

                user_form = UserForm(form_data or None, instance=user)

                userdata_form = UserDataForm(form_data or None, instance=user.userdata)

                if user_form.is_valid() and userdata_form.is_valid():

                    user = user_form.save()

                    if not form_data['id']:

                        user.set_password(form_data['password'])

                        cred, created = Credential.objects.get_or_create(user=user, title='Default')

                        cred.username = user.username

                        cred.save()

                        user.userdata.default_cred = cred

                    user.save()

                    userdata = userdata_form.save(commit=False)

                    userdata.user = user

                    userdata.save()

                    data = {'result': 'ok', 'user': self._user_to_dict(user)}

                else:

                    data = {'result': 'failed', 'msg': str(user_form.errors) + str(userdata_form.errors)}

            elif action == 'delete':

                if user.is_superuser:

                    data = {'result': 'failed', 'msg': 'Cannot delete a superuser'}

                elif user == request.user:

                    data = {'result': 'failed', 'msg': 'User cannot delete itself'}

                else:

                    user.userdata.delete()

                    user.delete()

                    data = {'result': 'ok'}

            elif action == 'chgpass':

                if request.user.check_password(request.POST['current_password']):

                    user.set_password(form_data['new_password'])

                    user.save()

                    data = {'result': 'ok'}

                else:

                    data = {'result': 'failed', 'msg': 'Invalid password'}

            elif action == 'add_groups':

                if request.user.has_perm('users.edit_user_groups'):

                    for selected in request.POST.getlist('selection[]'):

                        user.groups.add(get_object_or_404(Group, pk=selected))

                    data = {'result': 'ok'}

                else:

                    data = {'result': 'denied'}

            elif action == 'remove_groups':

                if request.user.has_perm('users.edit_user_groups'):

                    for selected in request.POST.getlist('selection[]'):

                        user.groups.remove(get_object_or_404(Group, pk=selected))

                    data = {'result': 'ok'}

                else:

                    data = {'result': 'denied'}

            elif action == 'save_cred':

                cred_dict = json.loads(form_data['cred'])

                # Build credential object

                if cred_dict['id']:

                    cred = get_object_or_404(Credential, pk=cred_dict['id'])

                else:

                    cred = Credential(user=user)

                # Set form data passwords
                if cred_dict['password'] == prefs['password_placeholder']:

                    cred_dict['password'] = cred.password

                if cred_dict['sudo_pass'] == prefs['password_placeholder']:

                    cred_dict['sudo_pass'] = cred.sudo_pass

                if cred_dict['password'] or cred_dict['rsa_key']:

                    cred_dict['ask_pass'] = False

                if cred_dict['sudo_pass']:

                    cred_dict['ask_sudo_pass'] = False

                form = CredentialForm(cred_dict or None, instance=cred)

                # Validate form data
                if form.is_valid():

                    # Set credential as default
                    if cred_dict['is_default'] == 'true':

                        user.userdata.default_cred = cred

                        user.userdata.save()

                    # Save credential
                    cred.save()

                    data = {
                        'result': 'ok',
                        'msg': 'Credential saved',
                        'cred': self._truncate_secure_data(model_to_dict(cred))
                    }

                else:

                    data = {'result': 'failed', 'msg': str(form.errors)}

            elif action == 'delete_cred':

                cred_dict = json.loads(form_data['cred'])

                cred = get_object_or_404(Credential, pk=cred_dict['id'])

                # List users using this credential as default
                user_list = [user_data.user.username for user_data in UserData.objects.filter(default_cred=cred)]

                # Return fail if credential is default for a user(s)
                if len(user_list) > 0:

                    data = {'result': 'failed', 'msg': 'Credential is default for ' + ', '.join(user_list)}

                else:

                    # Delete credential
                    cred.delete()

                    data = {'result': 'ok', 'msg': 'Credential deleted', 'cred': {'id': None}}

            else:

                raise Http404('Invalid action')

        else:

            data = {'result': 'denied'}

        return HttpResponse(json.dumps(data), content_type='application/json')


class UserGroupView(View):

    @staticmethod
    def _group_to_dict(group):

        create_groupdata(group)

        return {
            'id': group.id,
            'name': group.name,
            'description': group.groupdata.description,
            'permissions': [perm.codename for perm in group.permissions.all()],
            'member_count': len(User.objects.filter(groups__name=group.name)),
            'editable': group.groupdata.editable
        }

    def get(self, request, action):

        project_auth = cache.get_or_set(str(request.user.username + '_auth'), ProjectAuth(request.user), settings.CACHE_TIMEOUT)

        if action == 'list':

            if request.user.has_perm('users.edit_user_groups'):

                if 'editable' in request.GET and request.GET['editable'] == 'true':

                    query_set = Group.objects.all().filter(groupdata__editable=True)

                else:

                    query_set = Group.objects.all()

                data = {'result': 'ok', 'groups': [self._group_to_dict(group) for group in query_set]}

            else:

                data = {'result': 'denied'}

        elif action == 'get':

            group = get_object_or_404(Group, name=request.GET['name'])

            if request.user.has_perm('users.edit_user_groups') or group in request.user.groups.all():

                data = {'result': 'ok', 'group': self._group_to_dict(group)}

            else:

                data = {'result': 'denied'}

        elif action == 'members':

            if request.user.has_perm('users.edit_user_groups'):

                if 'reverse' in request.GET and request.GET['reverse'] == 'true':

                    members = [[user.username, user.id] for user in User.objects.exclude(groups__name=request.GET['name']) if not user.is_superuser]

                else:

                    members = [[user.username, user.id] for user in User.objects.filter(groups__name=request.GET['name'])]

            else:

                members = []

            data = {'result': 'ok', 'members': members}

        else:

            raise Http404('Invalid action')

        return HttpResponse(json.dumps(data), content_type='application/json')

    def post(self, request, action):

        project_auth = cache.get_or_set(str(request.user.username + '_auth'), ProjectAuth(request.user), settings.CACHE_TIMEOUT)

        if request.user.has_perm('users.edit_user_groups'):

            form_data = request.POST.dict()

            if form_data['id']:

                group = get_object_or_404(Group, name=request.POST['name'])

                form_data['name'] = group.name

            else:

                group = Group()

                group.groupdata = GroupData()

            if action == 'save':

                if group.groupdata.editable:

                    group_form = GroupForm(form_data or None, instance=group)

                    if group_form.is_valid():

                        group = group_form.save()

                        GroupData.objects.get_or_create(group=group)

                        group.groupdata.description = request.POST['description']

                        group.groupdata.save()

                        if request.user.has_perm('edit_preferences'):

                            for permission in json.loads(request.POST['permissions']):

                                perm = Permission.objects.get(codename=permission[0])

                                group.permissions.add(perm) if permission[1] else group.permissions.remove(perm)

                        data = {'result': 'ok', 'group': self._group_to_dict(group)}

                    else:

                        data = {'result': 'failed', 'msg': str(group_form.errors)}
                else:

                    data = {'result': 'failed', 'msg': 'This group is not editable'}

            elif action == 'delete':

                if group.groupdata.editable:

                    group.delete()

                    data = {'result': 'ok'}

                else:

                    data = {'result': 'failed', 'msg': 'This group can not be removed'}

            elif action == 'add_members':

                for selected in request.POST.getlist('selection[]'):

                    group.user_set.add(get_object_or_404(User, pk=selected))

                data = {'result': 'ok'}

            elif action == 'remove_members':

                for selected in request.POST.getlist('selection[]'):

                    group.user_set.remove(get_object_or_404(User, pk=selected))

                data = {'result': 'ok'}

            else:

                raise Http404('Invalid action')

        else:

            data = {'result': 'denied'}

        return HttpResponse(json.dumps(data), content_type='application/json')