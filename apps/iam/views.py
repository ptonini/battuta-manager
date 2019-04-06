from django.shortcuts import get_object_or_404
from django.http import HttpResponse, HttpResponseForbidden, HttpResponseNotAllowed
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.views.generic import View

from apps.iam.models import LocalUser,  Credential, LocalGroup
from apps.iam.forms import LocalUserForm, CredentialForm, LocalGroupForm
from apps.iam.extras import build_default_cred
from apps.preferences.extras import get_prefs
from main.extras.mixins import RESTfulViewMixin


class UserView(View, RESTfulViewMixin):

    model = LocalUser

    form = LocalUserForm

    @staticmethod
    def _set_password(request, user):

        password = request.JSON.get('data', {}).get('attributes', {}).get('password')

        if password:

            user.set_password(password)

        return user

    def post(self, request, **kwargs):

        user = self._set_password(request, LocalUser())

        if not request.JSON.get('data', {}).get('attributes', {}).get('timezone'):

            request.JSON['data']['attributes']['timezone'] = get_prefs('default_timezone')

        if user.perms(request.user)['editable']:

            response = self._save_instance(request, user)

            build_default_cred(user) if 'data' in response else None

            return self._api_response(response)

        else:

            return HttpResponseForbidden()

    def patch(self, request, **kwargs):

        user = get_object_or_404(LocalUser, pk=kwargs['obj_id'])

        if user.perms(request.user)['editable']:

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


class CredentialView(View, RESTfulViewMixin):

    model = Credential

    form = CredentialForm

    def _get_queryset(self, request, kwargs):

        return get_object_or_404(LocalUser, pk=kwargs['user_id']).credential_set.all()

    @staticmethod
    def _set_default_cred(cred, request, response):

        if 'data' in response and request.JSON.get('data', {}).get('attributes', {}).get('is_default'):

            cred.user.default_cred = cred

            cred.user.save()

    def post(self, request, **kwargs):

        cred = Credential(user=LocalUser.objects.get(pk=kwargs['user_id']))

        if cred.perms(request.user)['editable']:

            response = self._save_instance(request, cred)

            self._set_default_cred(cred, request, response)

            return self._api_response(response)

        else:

            return HttpResponseForbidden()

    def patch(self, request, **kwargs):

        cred = get_object_or_404(Credential, pk=kwargs['obj_id'])

        placeholder = get_prefs('password_placeholder')

        if cred.perms(request.user)['editable']:

            attr = request.JSON.get('data', {}).get('attributes', {})

            if attr.get('password') == placeholder:

                request.JSON['data']['attributes']['password'] = cred.password

            if attr.get('sudo_pass') == placeholder:

                request.JSON['data']['attributes']['sudo_pass'] = cred.sudo_pass

            if attr.get('rsa_key') == placeholder:

                request.JSON['data']['attributes']['rsa_key'] = cred.rsa_key

            if attr.get('password') or attr.get('rsa_key'):

                request.JSON['data']['attributes']['ask_pass'] = False

            if attr.get('sudo_pass'):

                request.JSON['data']['attributes']['ask_sudo_pass'] = False

            response = self._save_instance(request, cred)

            self._set_default_cred(cred, request, response)

            return self._api_response(response)

        else:

            return HttpResponseForbidden()


class UserGroupView(View, RESTfulViewMixin):

    model = LocalGroup

    form = LocalGroupForm


class RelationsView(View, RESTfulViewMixin):

    methods = ['GET', 'POST', 'DELETE']

    @staticmethod
    def _build_data(kwargs):

        types = {
            'users': {
                'class': LocalUser,
                'manager': 'user_set',
                'sort': 'username'
            },
            'usergroups': {
                'class': LocalGroup,
                'manager': 'groups',
                'sort': 'name'
            }
        }

        obj = get_object_or_404(types[kwargs['obj_type']]['class'], pk=kwargs['obj_id'])

        r_class = types[kwargs['relation']]['class']

        r_manager = getattr(obj, types[kwargs['relation']]['manager'])

        return obj, r_class, r_manager

    def post(self, request, **kwargs):

        obj, r_class, r_manager = self._build_data(kwargs)

        if obj.perms(request.user)['editable'] and r_class().perms(request.user)['editable']:

            for selected in request.JSON.get('data', []):

                new_relation = get_object_or_404(r_class, pk=selected['id'])

                if not getattr(new_relation, 'is_superuser', False):

                    r_manager.add(new_relation)

            return HttpResponse(status=204)

        else:

            return HttpResponseForbidden()

    def get(self, request, **kwargs):

        obj, r_class, r_manager = self._build_data(kwargs)

        if request.JSON.get('related', True):

            data = list()

            if obj.perms(request.user)['readable']:

                for r in r_manager.all():

                    if not getattr(r, 'is_superuser', False):

                        data.append(r_class.objects.get(pk=r.id).serialize(request.JSON.get('fields'), request.user))

            else:

                return HttpResponseForbidden()

        else:

            data = list()

            for r in r_class.objects.exclude(pk__in=[related.id for related in r_manager.all()]):

                if r_class().perms(request.user)['readable'] and not getattr(r, 'is_superuser', False):

                    data.append(r.serialize(request.JSON.get('fields'), request.user))

        return self._api_response({'data': data})

    def delete(self, request, **kwargs):

        obj, related_class, related_manager = self._build_data(kwargs)

        if obj.perms(request.user)['editable']:

            for selected in request.JSON.get('data', []):

                related_manager.remove(get_object_or_404(related_class, pk=selected['id']))

            return HttpResponse(status=204)

        else:

            return HttpResponseForbidden()


class PermissionView(View, RESTfulViewMixin):

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
    def post(request, **kwargs):

        group = get_object_or_404(LocalGroup, pk=kwargs['group_id'])

        if group.perms(request.user)['editable']:

            for selected in request.JSON.get('data', []):

                group.permissions.add(Permission.objects.get(codename=selected['id']))

            return HttpResponse(status=204)

        else:

            return HttpResponseForbidden()

    def get(self, request, **kwargs):

        group = get_object_or_404(LocalGroup, pk=kwargs['group_id'])

        if group.perms(request.user)['readable']:

            response = {'data': list()}

            if request.JSON.get('related', True):

                return self._api_response({'data': [self._serialize(p) for p in group.permissions.all()]})

            else:

                for permission in Permission.objects.filter(content_type=ContentType.objects.get_for_model(LocalGroup)):

                    if permission not in group.permissions.all() and permission.codename not in self._excluded_perms:

                        response['data'].append(self._serialize(permission))

                return self._api_response(response)

        else:

            return HttpResponseForbidden()

    def patch(self, request, **kwargs):

        return HttpResponseNotAllowed(['GET', 'POST', 'DELETE'])

    @staticmethod
    def delete(request, **kwargs):

        group = get_object_or_404(LocalGroup, pk=kwargs['group_id'])

        if group.perms(request.user)['editable']:

            for selected in request.JSON.get('data', []):

                group.permissions.remove(Permission.objects.get(codename=selected['id']))

            return HttpResponse(status=204)

        else:

            return HttpResponseForbidden()
