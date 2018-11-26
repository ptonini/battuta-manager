from django.db import models
from django.contrib.auth.models import AbstractUser, Group

from main.extras.models import SerializerModelMixin
from apps.preferences.extras import get_preferences



class LocalUser(AbstractUser, SerializerModelMixin):

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

        meta = self.authorizer(user)

        return self.serializer(fields, attributes, links, meta)

    def authorizer(self, user):

        return {
            'editable': user.has_perm('users.edit_users') and not self.is_superuser or user.is_superuser,
            'deletable': user.has_perm('users.edit_users') and not self.is_superuser and user is not self
        }


class LocalGroup(Group, SerializerModelMixin):

    type = 'usergroups'

    route = '/iam/usergroups'

    def serialize(self, fields, user):

        attributes = {'name': self.name, 'member_count': len(LocalUser.objects.filter(groups__name=self.name))}

        links = {
            'self': '/'.join([self.route, str(self.id)]),
            LocalUser.type: '/'.join([self.route, str(self.id), LocalUser.type]),
            'permissions': '/'.join([self.route, str(self.id), 'permissions'])
        }

        meta = self.authorizer(user)

        return self.serializer(fields, attributes, links, meta)

    def authorizer(self, user):

        builtin_groups = [
            'Inventory Admins',
            'Runner Admins',
            'User Admins',
            'File Admins',
            'Preferences Admins',
            'System Admins',
            'Project Admins'
        ]

        return {
            'editable': False if self.name in builtin_groups else user.has_perm('users.edit_user_groups'),
            'deletable': False if self.name in builtin_groups else user.has_perm('users.edit_user_groups')
        }

    class Meta:

        proxy = True

        permissions = (
            ('edit_groups', 'Can create and edit groups'),
            ('edit_hosts', 'Can create and edit hosts'),
            ('edit_playbooks', 'Can edit playbooks'),
            ('edit_tasks', 'Can edit tasks'),
            ('edit_roles', 'Can edit roles'),
            ('execute_jobs', 'Can execute jobs'),
            ('view_job_history', 'Can view job history'),
            ('edit_files', 'Can create and edit files'),
            ('edit_users', 'Can create and edit users'),
            ('edit_user_groups', 'Can create and edit user groups'),
            ('edit_user_files', 'Can create and edit user files'),
            ('edit_permissions', 'Can edit user group permissions'),
            ('edit_preferences', 'Can edit preferences'),
            ('edit_projects', 'Can edit projects'),
        )


class Credential(models.Model, SerializerModelMixin):

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

        links = {'self': '/'.join([self.user.route, str(self.user.id), Credential.type, str(self.id)])}

        meta = self.authorizer(user)

        return self.serializer(fields, attributes, links, meta)

    def authorizer(self, user):

        deletable_conditions = [
            self != self.user.default_cred,
            user.has_perm('users.edit_users') and not self.user.is_superuser or user.is_superuser
        ]

        return {
            'editable': user.has_perm('users.edit_users') and not self.user.is_superuser or user.is_superuser,
            'deletable': False if False in deletable_conditions else True
        }

    class Meta:

        unique_together = ('user', 'title')