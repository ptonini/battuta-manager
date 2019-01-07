import json

from django.db import models

from main.extras.models import SerializerModelMixin


class Project(models.Model, SerializerModelMixin):

    type = 'projects'

    route = '/projects'

    name = models.CharField(max_length=64, blank=False, unique=True)

    description = models.TextField(max_length=256, blank=True)

    manager = models.ForeignKey('iam.LocalUser', null=True, blank=True, on_delete=models.CASCADE)

    host_group = models.ForeignKey('inventory.Group', null=True, blank=True, on_delete=models.CASCADE)

    playbooks = models.TextField(max_length=65536, default='[]')

    roles = models.TextField(max_length=65536, default='[]')

    can_edit_variables = models.ManyToManyField('iam.LocalUser', related_name='can_edit_variables')

    can_run_tasks = models.ManyToManyField('iam.LocalUser', related_name='can_run_tasks')

    can_edit_tasks = models.ManyToManyField('iam.LocalUser', related_name='can_edit_tasks')

    can_run_playbooks = models.ManyToManyField('iam.LocalUser', related_name='can_run_playbooks')

    can_edit_playbooks = models.ManyToManyField('iam.LocalUser', related_name='can_edit_playbooks')

    can_edit_roles = models.ManyToManyField('iam.LocalUser', related_name='can_edit_roles')

    def __str__(self):

        return self.name

    @staticmethod
    def get_relationships(relation):

        from apps.iam.models import LocalUser
        from apps.inventory.models import Group

        return {
            'many': False if relation in ['manager', 'host_group'] else True,
            'class': Group if relation == 'host_group' else LocalUser
        }

    def serialize(self, fields, user):

        attributes = {
            'name': self.name,
            'description': self.description,
            'manager': self.manager.username if self.manager else None,
            'host_group': self.host_group.name if self.host_group else None,
        }

        links = {
            'self': '/'.join([self.route, str(self.id)]),
            'manager': '/'.join([self.route, str(self.id), 'manager']),
            'host_group': '/'.join([self.route, str(self.id), 'host_group']),
            'can_edit_variables': '/'.join([self.route, str(self.id), 'can_edit_variables']),
            'can_run_tasks': '/'.join([self.route, str(self.id), 'can_run_tasks']),
            'can_edit_tasks': '/'.join([self.route, str(self.id), 'can_edit_tasks']),
            'can_run_playbooks': '/'.join([self.route, str(self.id), 'can_run_playbooks']),
            'can_edit_playbooks': '/'.join([self.route, str(self.id), 'can_edit_playbooks']),
            'can_edit_roles': '/'.join([self.route, str(self.id), 'can_edit_roles']),
            'playbooks': '/'.join([self.route, str(self.id), 'playbooks']),
            'roles': '/'.join([self.route, str(self.id), 'roles']),
        }

        meta = self.authorizer(user)

        return self._serializer(fields, attributes, links, meta, None)

    @staticmethod
    def authorizer(user):

        return {
            'editable': True,
            'deletable': True,
            'readable': True
        }

    class Meta:

        ordering = ['name']



