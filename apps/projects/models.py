from django.db import models

from apps.inventory.models import Group as HostGroup
from django.contrib.auth.models import User, Group as UserGroup


class Project(models.Model):

    name = models.CharField(max_length=64, blank=False, unique=True)

    description = models.TextField(max_length=256, blank=True)

    manager = models.ForeignKey(User, null=True, blank=True)

    host_group = models.ForeignKey(HostGroup, null=True, blank=True)

    playbooks = models.TextField(max_length=65536, default='[]')

    roles = models.TextField(max_length=65536, default='[]')

    can_edit_variables = models.ForeignKey(UserGroup, related_name='can_edit_variables', null=True, blank=True)

    can_run_tasks = models.ForeignKey(UserGroup, related_name='can_run_tasks', null=True, blank=True)

    can_edit_tasks = models.ForeignKey(UserGroup, related_name='can_edit_tasks', null=True, blank=True)

    can_run_playbooks = models.ForeignKey(UserGroup, related_name='can_run_playbooks', null=True, blank=True)

    can_edit_playbooks = models.ForeignKey(UserGroup, related_name='can_edit_playbooks', null=True, blank=True)

    can_edit_roles = models.ForeignKey(UserGroup, related_name='can_edit_roles', null=True, blank=True)

    def __str__(self):

        return self.name

