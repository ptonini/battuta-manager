import json
from pytz import timezone

from django.shortcuts import get_object_or_404, render
from django.views.generic import View
from django.forms import model_to_dict
from django.http import HttpResponse, HttpResponseForbidden, Http404, HttpResponseNotFound
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.core.cache import cache
from django.conf import settings

from apps.iam.models import LocalUser,  Credential
from apps.iam.forms import LocalUserForm, CredentialForm
#from apps.iam.extras import create_userdata, create_groupdata

from apps.preferences.extras import get_preferences
from apps.projects.extras import ProjectAuthorizer

from main.extras.views import ApiView



class UserView(ApiView):

    form_class = LocalUserForm

    @staticmethod
    def _set_password(request, user):

        password = request.JSON.get('data', {}).get('attributes', {}).get('password')

        if password:

            user.set_password(password)

        return user

    def post(self, request, user_id):

        user = self._set_password(request, LocalUser())

        if user.authorizer(request.user)['editable']:

            response = self._save_instance(request, user)

            if 'data' in response:

                cred, created = Credential.objects.get_or_create(user=user, username=user.username, title='Default')

                user.default_cred = cred

                user.save()

            return self._api_response(response)

        else:

            return HttpResponseForbidden()

    def get(self, request, user_id):

        if request.user.has_perm('users.edit_users'):

            if user_id:

                user = get_object_or_404(LocalUser, pk=user_id)

                response = {'data': (user.serialize(request.JSON.get('fields'), request.user))}

            else:

                data = list()

                for user in LocalUser.objects.order_by('username').all():

                    data.append(user.serialize(request.JSON.get('fields'), request.user))

                response = {'data': data}

            return self._api_response(response)

        else:

            return HttpResponseForbidden()

    def patch(self, request, user_id):

        user = get_object_or_404(LocalUser, pk=user_id)

        if user.authorizer(request.user)['editable']:

            attr = request.JSON.get('data', {}).get('attributes', {})

            if attr.get('username') != user.username or attr.get('password'):

                if request.user.check_password(attr.get('current_password')):

                    self._set_password(request, user)

                    return self._api_response(self._save_instance(request, user))

                else:

                    return HttpResponseForbidden()

            else:

                return self._api_response(self._save_instance(request, user))

        else:

            return HttpResponseForbidden()

    @staticmethod
    def delete(request, user_id):

        if user_id:

            user = get_object_or_404(LocalUser, pk=user_id)

            if user.authorizer(request.user)['deletable']:

                user.delete()

                return HttpResponse(status=204)

            else:

                return HttpResponseForbidden()



class CredsView(ApiView):

    form_class = CredentialForm


    @staticmethod
    def _set_default_cred(cred, request, response):

        if 'data' in response and request.JSON.get('data', {}).get('attributes', {}).get('is_default'):

            cred.user.default_cred = cred

            cred.user.save()

    def post(self, request, user_id, cred_id):

        cred = Credential(user=LocalUser.objects.get(pk=user_id))

        if cred.authorizer(request.user)['editable']:

            response = self._save_instance(request, cred)

            self._set_default_cred(cred, request, response)

            return self._api_response(response)

        else:

            return HttpResponseForbidden()

    def get(self, request, user_id, cred_id):

        user = get_object_or_404(LocalUser, pk=user_id)

        cred = Credential(user=user)

        if cred.authorizer(request.user)['editable']:

            data = [c.serialize(request.JSON.get('fields'), request.user) for c in user.credential_set.all()]

            return self._api_response({'data': data})

        else:

            return HttpResponseForbidden()

    def patch(self, request, user_id, cred_id):

        cred = get_object_or_404(Credential, pk=cred_id)

        placeholder = get_preferences()['password_placeholder']

        if cred.authorizer(request.user)['editable']:

            if request.JSON.get('data', {}).get('attributes',{}).get('password') == placeholder:

                request.JSON['data']['attributes']['password'] = cred.password

            if request.JSON.get('data', {}).get('attributes',{}).get('sudo_pass') == placeholder:

                request.JSON['data']['attributes']['sudo_pass'] = cred.sudo_pass

            if request.JSON.get('data', {}).get('attributes',{}).get('rsa_key') == placeholder:

                request.JSON['data']['attributes']['rsa_key'] = cred.rsa_key

            if request.JSON.get('data', {}).get('attributes',{}).get('password') or request.JSON.get('data', {}).get('attributes',{}).get('rsa_key'):

                request.JSON['data']['attributes']['ask_pass'] = False

            if request.JSON.get('data', {}).get('attributes',{}).get('sudo_pass'):

                request.JSON['data']['attributes']['sudo_pass'] = False

            response = self._save_instance(request, cred)

            self._set_default_cred(cred, request, response)

            return self._api_response(response)

        else:

            return HttpResponseForbidden()

    @staticmethod
    def delete(request, user_id, cred_id):

        cred = get_object_or_404(Credential, pk=cred_id)

        if cred.authorizer(request.user)['deletable']:

            cred.delete()

            return HttpResponse(status=204)

        else:

            return HttpResponseForbidden()

    # else:
    #
    #
    #         elif action == 'groups':
    #
    #             if 'reverse' in request.GET and request.GET['reverse'] == 'true':
    #
    #                 groups = [[group.name, group.id] for group in Group.objects.all() if group not in user.groups.all()]
    #
    #             else:
    #
    #                 groups = [[group.name, group.id] for group in user.groups.all()]
    #
    #             data = {'status': 'ok', 'groups': groups}


    #         elif action == 'default_cred':
    #
    #             data = {
    #                 'status': 'ok',
    #                 'cred': self._truncate_secure_data(model_to_dict(user.userdata.default_cred))
    #             }
    #
    #         else:
    #
    #             return HttpResponseNotFound('Invalid action')
    #
    #     else:
    #
    #         data = {'status': 'denied'}


    #         elif action == 'add_groups':
    #
    #             if request.user.has_perm('users.edit_user_groups'):
    #
    #                 for selected in json.loads(request.POST['selection']):
    #
    #                     user.groups.add(get_object_or_404(Group, pk=selected['id']))
    #
    #                 data = {'status': 'ok'}
    #
    #             else:
    #
    #                 data = {'status': 'denied'}
    #
    #         elif action == 'remove_groups':
    #
    #             if request.user.has_perm('users.edit_user_groups'):
    #
    #                 for selected in json.loads(request.POST['selection']):
    #
    #                     user.groups.remove(get_object_or_404(Group, pk=selected['id']))
    #
    #                 data = {'status': 'ok'}
    #
    #             else:
    #
    #                 data = {'status': 'denied'}
    #





# class UserGroupView(View):
#
#     @staticmethod
#     def _group_to_dict(group):
#
#         create_groupdata(group)
#
#         return {
#             'id': group.id,
#             'name': group.name,
#             'description': group.groupdata.description,
#             'member_count': len(User.objects.filter(groups__name=group.name)),
#             'editable': group.groupdata.editable
#         }
#
#     def get(self, request, action):
#
#         project_auth = cache.get_or_set(str(request.user.username + '_auth'), Authorizer(request.user), settings.CACHE_TIMEOUT)
#
#         if action == 'list':
#
#             query_set = Group.objects.all().exclude(name=request.GET.get('exclude'))
#
#             if request.GET.get('editable') == 'true':
#
#                 query_set = query_set.filter(groupdata__editable=True)
#
#             group_list = list()
#
#             for group in query_set:
#
#                 auth = {
#                     request.user.has_perm('users.edit_user_groups'),
#                     group in request.user.groups.all(),
#                     project_auth.can_add_to_group(group)
#                 }
#
#                 if True in auth:
#
#                     group_list.append(self._group_to_dict(group))
#
#             data = {'status': 'ok', 'groups': group_list}
#
#         else:
#
#             group = get_object_or_404(Group, name=request.GET['name'])
#
#             if action == 'get':
#
#                 group = get_object_or_404(Group, name=request.GET['name'])
#
#                 auth = {
#                     request.user.has_perm('users.edit_user_groups'),
#                     group in request.user.groups.all(),
#                     project_auth.can_add_to_group(group)
#                 }
#
#                 data = {'status': 'ok', 'group': self._group_to_dict(group)} if True in auth else {'status': 'denied'}
#
#             elif action == 'members':
#
#                 group = get_object_or_404(Group, name=request.GET['name'])
#
#                 members = []
#
#                 if request.user.has_perm('users.edit_user_groups') or project_auth.can_add_to_group(group):
#
#                     if 'reverse' in request.GET and request.GET['reverse'] == 'true':
#
#                         for user in User.objects.exclude(groups__name=request.GET['name']):
#
#                             if not user.is_superuser:
#
#                                 members.append({'username': user.username, 'id': user.id})
#
#                     else:
#
#                         for user in User.objects.filter(groups__name=request.GET['name']):
#
#                             members.append({'username': user.username, 'id': user.id})
#
#                 data = {'status': 'ok', 'members': members}
#
#             elif action == 'permissions':
#
#                 data = {'status': 'ok', 'permissions': list()}
#
#                 if request.GET.get('reverse', False):
#
#                     content_type = ContentType.objects.get_for_model(GroupData)
#
#                     exclude_list = [p['codename'] for p in json.loads(request.GET.get('exclude', '[]'))]
#
#                     for p in Permission.objects.filter(content_type=content_type):
#
#                         if p.codename.split('_')[1] != 'groupdata' and p.codename not in exclude_list:
#
#                             data['permissions'].append({'codename': p.codename, 'name': p.name})
#
#                 else:
#
#                     data['permissions'] = [{'name': p.name, 'codename': p.codename} for p in group.permissions.all()]
#
#             else:
#
#                 return HttpResponseNotFound('Invalid action')
#
#         return HttpResponse(json.dumps(data), content_type='application/json')
#
#     def post(self, request, action):
#
#         project_auth = cache.get_or_set(str(request.user.username + '_auth'), Authorizer(request.user), settings.CACHE_TIMEOUT)
#
#         form_data = request.POST.dict()
#
#         if form_data.get('id'):
#
#             group = get_object_or_404(Group, pk=request.POST['id'])
#
#         else:
#
#             group = Group()
#
#             group.groupdata = GroupData()
#
#         if action == 'save':
#
#             if group.groupdata.editable and request.user.has_perm('users.edit_user_groups'):
#
#                 group_form = GroupForm(form_data or None, instance=group)
#
#                 if group_form.is_valid():
#
#                     group = group_form.save()
#
#                     GroupData.objects.get_or_create(group=group)
#
#                     group.groupdata.description = request.POST.get('description', '')
#
#                     group.groupdata.save()
#
#                     data = {'status': 'ok', 'group': self._group_to_dict(group), 'msg': 'User group saved'}
#
#                 else:
#
#                     data = {'status': 'denied', 'msg': str(group_form.errors)}
#             else:
#
#                 data = {'status': 'denied'}
#
#         elif action == 'delete':
#
#             if group.groupdata.editable and request.user.has_perm('users.edit_user_groups'):
#
#                 group.delete()
#
#                 data = {'status': 'ok', 'msg': 'Group deleted'}
#
#             else:
#
#                 data = {'status': 'denied'}
#
#         elif action == 'add_members':
#
#             if request.user.has_perm('users.edit_user_groups') or project_auth.can_add_to_group(group):
#
#                 for selected in json.loads(request.POST['selection']):
#
#                     group.user_set.add(get_object_or_404(User, pk=selected['id']))
#
#                 data = {'status': 'ok'}
#
#             else:
#
#                 data = {'status': 'denied'}
#
#         elif action == 'remove_members':
#
#             if request.user.has_perm('users.edit_user_groups') or project_auth.can_add_to_group(group):
#
#                 for selected in json.loads(request.POST['selection']):
#
#                     group.user_set.remove(get_object_or_404(User, pk=selected['id']))
#
#                 data = {'status': 'ok'}
#
#             else:
#
#                 data = {'status': 'denied'}
#
#             if request.user.has_perm('users.edit_user_groups') or project_auth.can_add_to_group(group):
#
#                 for selected in json.loads(request.POST['selection']):
#
#                     group.user_set.remove(get_object_or_404(User, pk=selected['id']))
#
#                 data = {'status': 'ok'}
#
#             else:
#
#                 data = {'status': 'denied'}
#
#         elif action == 'add_permissions':
#
#             if request.user.has_perm('edit_preferences') and group.groupdata.editable:
#
#                 for permission in json.loads(request.POST.get('selection', '[]')):
#
#                     perm = Permission.objects.get(codename=permission['codename'])
#
#                     group.permissions.add(perm)
#
#                 data = {'status': 'ok'}
#
#             else:
#
#                 data = {'status': 'denied'}
#
#         elif action == 'remove_permissions':
#
#             if request.user.has_perm('edit_preferences') and group.groupdata.editable:
#
#                 for permission in json.loads(request.POST.get('selection', '[]')):
#
#                     perm = Permission.objects.get(codename=permission['codename'])
#
#                     group.permissions.remove(perm)
#
#                 data = {'status': 'ok'}
#
#             else:
#
#                 data = {'status': 'denied'}
#
#         else:
#
#             return HttpResponseNotFound('Invalid action')
#
#         return HttpResponse(json.dumps(data), content_type='application/json')