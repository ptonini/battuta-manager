from django.db import models
from django.contrib.auth.models import AbstractUser, Group

from main.extras.mixins import RESTfulModelMixin
from apps.preferences.extras import get_prefs
from apps.iam import builtin_groups


class LocalUser(AbstractUser, RESTfulModelMixin):

    type = 'users'

    route = '/iam/users'

    timezone = models.CharField(max_length=64)

    default_cred = models.ForeignKey('Credential', blank=True, null=True, on_delete=models.CASCADE)

    def serialize(self, fields, user):

        attr = {
            'username': self.username,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'email': self.email,
            'date_joined': self.date_joined.strftime(get_prefs('date_format')),
            'timezone': self.timezone if self.timezone else get_prefs('default_timezone'),
            'is_active': self.is_active,
            'is_superuser': self.is_superuser,
            'last_login': self.last_login.strftime(get_prefs('date_format')) if self.last_login else None,
        }

        links = {
            'self': self.link,
            Credential.type: '/'.join([self.link, Credential.type]),
            LocalGroup.type: '/'.join([self.link, LocalGroup.type])
        }

        return self._serialize_data(fields, attributes=attr, links=links, meta=self.perms(user))

    def perms(self, user):

        readable = any([
            user.has_perm('auth.edit_users') and not self.is_superuser,
            user.is_superuser,
            user.id == self.id
        ])

        deletable = all([
            user.has_perm('auth.edit_users'),
            not self.is_superuser,
            user.id != self.id
        ])

        return {'readable': readable, 'editable': readable, 'deletable': deletable}

    class Meta:

            ordering = ['username']


class Credential(models.Model, RESTfulModelMixin):

    type = 'creds'

    user = models.ForeignKey(LocalUser, on_delete=models.CASCADE)

    title = models.CharField(max_length=32)

    is_shared = models.BooleanField(default=False)

    username = models.CharField(max_length=32)

    password = models.CharField(max_length=64, blank=True)

    rsa_key = models.TextField(max_length=2048, blank=True)

    sudo_user = models.CharField(max_length=32, blank=True)

    sudo_pass = models.CharField(max_length=64, blank=True)

    ask_pass = models.BooleanField(default=True)

    ask_sudo_pass = models.BooleanField(default=True)

    def __str__(self):

        return self.user.username + '_' + self.title

    def serialize(self, fields, user):

        placeholder = get_prefs('password_placeholder')

        setattr(self, 'route', '/'.join([self.user.route, str(self.user.id), self.type]))

        attr = {
            'user': self.user.id,
            'title': self.title,
            'is_shared': self.is_shared,
            'is_default': self == self.user.default_cred,
            'username': self.username,
            'password': placeholder if self.password else None,
            'rsa_key': placeholder if self.rsa_key else None,
            'sudo_user': self.sudo_user,
            'sudo_pass': placeholder if self.sudo_pass else None,
            'ask_pass': self.ask_pass,
            'ask_sudo_pass': self.ask_sudo_pass
        }

        return self._serialize_data(fields, attributes=attr, links={'self': self.link}, meta=self.perms(user))

    def perms(self, user):

        readable = user.has_perm('auth.edit_users') or user.id == self.user.id

        deletable = all([
            self != self.user.default_cred,
            user.has_perm('auth.edit_users') or user.id == self.user.id
        ])

        return {'readable': readable, 'editable': readable, 'deletable': deletable}

    class Meta:

        unique_together = ('user', 'title')

        ordering = ['title']


class LocalGroup(Group, RESTfulModelMixin):

    type = 'usergroups'

    route = '/iam/usergroups'

    def serialize(self, fields, user):

        attr = {'name': self.name, 'member_count': self.user_set.all().count()}

        links = {
            'self': self.link,
            LocalUser.type: '/'.join([self.link, LocalUser.type]),
            'permissions': '/'.join([self.link, 'permissions'])
        }

        meta = self.perms(user)

        meta['builtin'] = self.name in builtin_groups

        return self._serialize_data(fields, attributes=attr, links=links, meta=meta)

    def perms(self, user):

        readable = user.has_perm('auth.edit_user_groups')

        editable = False if self.name in builtin_groups else user.has_perm('auth.edit_user_groups')

        return {'readable': readable, 'editable': editable, 'deletable': editable}

    class Meta:

        proxy = True

        ordering = ['name']

        permissions = (
            ('edit_groups', 'Can create and edit groups'),
            ('edit_hosts', 'Can create and edit hosts'),
            ('edit_tasks', 'Can edit tasks'),
            ('execute_jobs', 'Can execute jobs'),
            ('view_job_history', 'Can view job history'),
            ('edit_files', 'Can create and edit files'),
            ('edit_playbooks', 'Can edit playbooks'),
            ('edit_roles', 'Can edit roles'),
            ('edit_users', 'Can create and edit users'),
            ('edit_user_groups', 'Can create and edit user groups'),
            ('edit_user_files', 'Can create and edit user files'),
            ('edit_permissions', 'Can edit user group permissions'),
            ('edit_preferences', 'Can edit preferences'),
            ('edit_projects', 'Can edit projects'),
        )
