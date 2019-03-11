from django.db import models
from django.contrib.auth.models import AbstractUser, Group

from main.extras.mixins import ModelSerializerMixin
from apps.preferences.extras import get_preferences
from apps.iam import builtin_groups


class LocalUser(AbstractUser, ModelSerializerMixin):

    type = 'users'

    route = '/iam/users'

    timezone = models.CharField(max_length=64)

    default_cred = models.ForeignKey('iam.Credential', blank=True, null=True, on_delete=models.CASCADE)

    def serialize(self, fields, user):

        prefs = get_preferences()

        attributes = {
            'username': self.username,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'email': self.email,
            'date_joined': self.date_joined.strftime(prefs['date_format']),
            'timezone': self.timezone if self.timezone else prefs['default_timezone'],
            'is_active': self.is_active,
            'is_superuser': self.is_superuser,
            'last_login': self.last_login.strftime(prefs['date_format']) if self.last_login else None,
        }

        links = {
            'self': '/'.join([self.route, str(self.id)]) ,
            Credential.type: '/'.join([self.route, str(self.id), Credential.type]),
            LocalGroup.type: '/'.join([self.route, str(self.id), LocalGroup.type])
        }

        meta = self.permissions(user)

        return self._serializer(fields, attributes, links, meta)

    def permissions(self, user):

        readable = any([
            user.has_perm('users.edit_users') and not self.is_superuser,
            user.is_superuser,
            user.id == self.id
        ])

        editable = readable

        deletable = all([
            user.has_perm('users.edit_users'),
            not self.is_superuser,
            user.id != self.id
        ])

        return {'readable': readable, 'editable': editable, 'deletable': deletable}

    class Meta:

            ordering = ['username']


class Credential(models.Model, ModelSerializerMixin):

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

        prefs = get_preferences()

        setattr(self, 'route', '/'.join([self.user.route, str(self.user.id), self.type]))

        attributes = {
            'user': self.user.id,
            'title': self.title,
            'is_shared': self.is_shared,
            'is_default': self == self.user.default_cred,
            'username': self.username,
            'password': prefs['password_placeholder'] if self.password else None,
            'rsa_key': prefs['password_placeholder'] if self.rsa_key else None,
            'sudo_user': self.sudo_user,
            'sudo_pass': prefs['password_placeholder'] if self.sudo_pass else None,
            'ask_pass': self.ask_pass,
            'ask_sudo_pass': self.ask_sudo_pass
        }

        links = {'self': self.link}

        meta = self.permissions(user)

        return self._serializer(fields, attributes, links, meta)

    def permissions(self, user):

        readable = user.has_perm('users.edit_users') or user.id == self.user.id

        editable = readable

        deletable = all([
            self != self.user.default_cred,
            user.has_perm('users.edit_users') or user.id == self.user.id
        ])

        return {'readable': readable, 'editable': editable, 'deletable': deletable}

    class Meta:

        unique_together = ('user', 'title')

        ordering = ['title']


class LocalGroup(Group, ModelSerializerMixin):

    type = 'usergroups'

    route = '/iam/usergroups'

    def serialize(self, fields, user):

        attributes = {'name': self.name, 'member_count': self.user_set.all().count()}

        links = {
            'self': self.link,
            LocalUser.type: '/'.join([self.link, LocalUser.type]),
            'permissions': '/'.join([self.link, 'permissions'])
        }

        meta = self.permissions(user)

        meta['builtin'] = self.name in builtin_groups

        return self._serializer(fields, attributes, links, meta)

    def permissions(self, user):

        readable = user.has_perm('users.edit_user_groups')

        editable = False if self.name in builtin_groups else user.has_perm('users.edit_user_groups')

        deletable = editable

        return {'readable': readable, 'editable': editable, 'deletable': deletable}

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
