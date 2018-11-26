import json
from pytz import timezone

from django.shortcuts import get_object_or_404, render
from django.views.generic import View
from django.forms import model_to_dict
from django.http import HttpResponse, HttpResponseForbidden, HttpResponseBadRequest, Http404, HttpResponseNotFound
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.core.cache import cache
from django.conf import settings
from django.contrib.auth.models import Group

from apps.iam.models import LocalUser,  Credential, LocalGroup
from apps.iam.forms import LocalUserForm, CredentialForm, LocalGroupForm

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

        if not request.JSON.get('data', {}).get('attributes', {}).get('timezone'):

            request.JSON['data']['attributes']['timezone'] = get_preferences()['default_timezone']

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
        else:

            return HttpResponseBadRequest()


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

            if request.JSON.get('data', {}).get('attributes', {}).get('password') == placeholder:

                request.JSON['data']['attributes']['password'] = cred.password

            if request.JSON.get('data', {}).get('attributes', {}).get('sudo_pass') == placeholder:

                request.JSON['data']['attributes']['sudo_pass'] = cred.sudo_pass

            if request.JSON.get('data', {}).get('attributes', {}).get('rsa_key') == placeholder:

                request.JSON['data']['attributes']['rsa_key'] = cred.rsa_key

            if request.JSON.get('data', {}).get('attributes', {}).get('password') or request.JSON.get('data', {}).get('attributes',{}).get('rsa_key'):

                request.JSON['data']['attributes']['ask_pass'] = False

            if request.JSON.get('data', {}).get('attributes', {}).get('sudo_pass'):

                request.JSON['data']['attributes']['ask_sudo_pass'] = False

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


class UserGroupView(ApiView):

    form_class = LocalGroupForm

    def post(self, request, group_id):

        group = LocalGroup()

        if group.authorizer(request.user)['editable']:

            return self._api_response(self._save_instance(request, group))

        else:

            return HttpResponseForbidden()

    def get(self, request, group_id):

        if request.user.has_perm('users.edit_users'):

            if group_id:

                group = get_object_or_404(LocalGroup, pk=group_id)

                response = {'data': (group.serialize(request.JSON.get('fields'), request.user))}

            else:

                data = list()

                for group in LocalGroup.objects.order_by('name').all():

                    data.append(group.serialize(request.JSON.get('fields'), request.user))

                response = {'data': data}

            return self._api_response(response)

        else:

            return HttpResponseForbidden()

    def patch(self, request, group_id):

        group = get_object_or_404(LocalGroup, pk=group_id)

        if group.authorizer(request.user)['editable']:

            return self._api_response(self._save_instance(request, group))

        else:

            return HttpResponseForbidden()

    @staticmethod
    def delete(request, group_id):

        if group_id:

            group = get_object_or_404(LocalGroup, pk=group_id)

            if group.authorizer(request.user)['deletable']:

                group.delete()

                return HttpResponse(status=204)

            else:

                return HttpResponseForbidden()

        else:

            return HttpResponseBadRequest()


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


class RelationsView(ApiView):

    @staticmethod
    def _get_relations(relation, obj_id, obj_type):

        obj = get_object_or_404(LocalUser if obj_type == LocalUser.type else LocalGroup, pk=obj_id)

        if relation == LocalUser.type:

            related_set_out = obj.user_set

            related_set_in = obj.user_set

            related_class = LocalUser

        elif relation == LocalGroup.type:

            related_set_out = LocalGroup.objects.filter(user=obj)

            related_set_in= obj.groups

            related_class = LocalGroup

        return obj, related_set_out, related_set_in, related_class

    def post(self, request, relation, obj_id, obj_type):

        obj, related_set_out, related_set_in, related_class = self._get_relations(relation, obj_id, obj_type)

        if obj.authorizer(request.user)['editable']:

            for selected in request.JSON.get('data', []):

                related_set_in.add(get_object_or_404(related_class, pk=selected['id']))

            return HttpResponse(status=204)

        else:

            return HttpResponseForbidden()

    def get(self, request, relation, obj_id, obj_type):

        obj, related_set_out, related_set_in, related_class = self._get_relations(relation, obj_id, obj_type)

        if request.JSON.get('related', True):

            data = [o.serialize(request.JSON.get('fields'), request.user) for o in related_set_out.all()]

        else:

            data = list()

            for o in related_class.objects.exclude(pk__in=[related.id for related in related_set_out.all()]):

                data.append(o.serialize(request.JSON.get('fields'), request.user))

        return self._api_response({'data': data})

    def delete(self, request, relation, obj_id, obj_type):

        obj, related_set_out, related_set_in, related_class = self._get_relations(relation, obj_id, obj_type)

        if obj.authorizer(request.user)['editable']:

            for selected in request.JSON.get('data', []):

                related_set_in.remove(get_object_or_404(related_class, pk=selected['id']))

            return HttpResponse(status=204)

        else:

            return HttpResponseForbidden()


class PermissionView(ApiView):

    _excluded_perms = [
        'add_group',
        'change_group',
        'delete_group',
        'view_group',
        'add_localgroup',
        'change_localgroup',
        'delete_localgroup',
        'view_localgroup'
    ]

    @staticmethod
    def _serialize(permission):

        return {
            'id': permission.codename,
            'type': 'permissions',
            'attributes': {'name': permission.name}
        }

    @staticmethod
    def post(request, group_id):

        group = get_object_or_404(LocalGroup, pk=group_id)

        if group.authorizer(request.user)['editable']:

            for selected in request.JSON.get('data', []):

                group.permissions.add(Permission.objects.get(codename=selected['id']))

            return HttpResponse(status=204)

        else:

            return HttpResponseForbidden()

    def get(self, request, group_id):

        group = get_object_or_404(LocalGroup, pk=group_id)

        response = {'data': list()}

        if request.JSON.get('related', True):

            return self._api_response({'data': [self._serialize(p) for p in group.permissions.all()]})

        else:

            for permission in Permission.objects.filter(content_type=ContentType.objects.get_for_model(LocalGroup)):

                if permission not in group.permissions.all() and permission.codename not in self._excluded_perms:

                    response['data'].append(self._serialize(permission))

            return self._api_response(response)

    @staticmethod
    def delete(request, group_id):

        group = get_object_or_404(LocalGroup, pk=group_id)

        if group.authorizer(request.user)['editable']:

            for selected in request.JSON.get('data', []):

                group.permissions.remove(Permission.objects.get(codename=selected['id']))

            return HttpResponse(status=204)

        else:

            return HttpResponseForbidden()