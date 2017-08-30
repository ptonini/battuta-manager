from django.db import models

from apps.inventory.models import Group as HostGroup
from django.contrib.auth.models import User, Group as UserGroup


class Project(models.Model):

    name = models.CharField(max_length=64, blank=False, unique=True)

    description = models.TextField(max_length=256, blank=True)

    manager = models.ForeignKey(User)

    host_group = models.ForeignKey(HostGroup)

    inventory_admins = models.ForeignKey(UserGroup, related_name='inventory_admins')

    runner_admins = models.ForeignKey(UserGroup, related_name='runner_admins')

    execute_jobs = models.ForeignKey(UserGroup, related_name='execute_jobs')

    roles = models.TextField(max_length=1024, default='[]')

    def __str__(self):

        return self.name
