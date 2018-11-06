from django.db import models
from django.contrib.auth.models import User, Group


class Credential(models.Model):

    user = models.ForeignKey(User, on_delete=models.CASCADE)

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

    class Meta:

        unique_together = ('user', 'title')


class UserData(models.Model):

    user = models.OneToOneField(User, primary_key=True, on_delete=models.CASCADE)

    timezone = models.CharField(max_length=64)

    default_cred = models.ForeignKey(Credential, blank=True, null=True, on_delete=models.CASCADE)

    def __str__(self):

        return self.user


class GroupData(models.Model):

    group = models.OneToOneField(Group, primary_key=True, on_delete=models.CASCADE)

    description = models.CharField(max_length=256, default='')

    editable = models.BooleanField(default=True)

    class Meta:

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

    def __str__(self):

        return self.group
