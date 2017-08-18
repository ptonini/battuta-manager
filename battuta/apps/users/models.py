from django.db import models
from django.contrib.auth.models import User, Group


class Credential(models.Model):

    user = models.ForeignKey(User)

    title = models.CharField(max_length=32)

    is_shared = models.BooleanField(default=False)

    username = models.CharField(max_length=32)

    password = models.CharField(max_length=64, blank=True)

    rsa_key = models.CharField(max_length=128, blank=True)

    sudo_user = models.CharField(max_length=32, blank=True)

    sudo_pass = models.CharField(max_length=64, blank=True)

    ask_pass = models.BooleanField(default=True)

    ask_sudo_pass = models.BooleanField(default=True)

    def __str__(self):

        return self.user.username + '_' + self.title

    class Meta:

        unique_together = ('user', 'title')


class UserData(models.Model):

    user = models.OneToOneField(User, primary_key=True)

    timezone = models.CharField(max_length=64)

    default_cred = models.ForeignKey(Credential, blank=True, null=True)

    def __str__(self):

        return self.user


class GroupData(models.Model):

    group = models.OneToOneField(Group, primary_key=True)

    description = models.CharField(max_length=256, default='')

    editable = models.BooleanField(default=True)

    class Meta:

        permissions = (
            ('edit_groups', 'Can create and edit groups'),
            ('edit_hosts', 'Can create and edit hosts'),
            ('edit_playbooks', 'Can edit playbooks'),
            ('edit_tasks', 'Can edit tasks'),
            ('execute_jobs', 'Can execute jobs'),
            ('edit_files', 'Can create and edit files'),
            ('edit_users', 'Can create and edit users'),
            ('edit_user_groups', 'Can create and edit user groups'),
            ('edit_preferences', 'Can edit preferences'),
        )

    def __str__(self):

        return self.group
