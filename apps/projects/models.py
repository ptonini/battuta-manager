import json

from django.db import models
from django.apps import apps

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

    can_edit_variables = models.ForeignKey('iam.LocalGroup', related_name='can_edit_variables', null=True, blank=True, on_delete=models.CASCADE)

    can_run_tasks = models.ForeignKey('iam.LocalGroup', related_name='can_run_tasks', null=True, blank=True, on_delete=models.CASCADE)

    can_edit_tasks = models.ForeignKey('iam.LocalGroup', related_name='can_edit_tasks', null=True, blank=True, on_delete=models.CASCADE)

    can_run_playbooks = models.ForeignKey('iam.LocalGroup', related_name='can_run_playbooks', null=True, blank=True, on_delete=models.CASCADE)

    can_edit_playbooks = models.ForeignKey('iam.LocalGroup', related_name='can_edit_playbooks', null=True, blank=True, on_delete=models.CASCADE)

    can_edit_roles = models.ForeignKey('iam.LocalGroup', related_name='can_edit_roles', null=True, blank=True, on_delete=models.CASCADE)

    def __str__(self):

        return self.name

    def serialize(self, fields, user):

        group_class = apps.get_model('inventory', 'Group')

        user_class = apps.get_model('iam', 'LocalUser')

        #usergroup_class = apps.get_model('iam', 'LocalGroup')

        attributes = {
            'name': self.name,
            'description': self.description,
            'manager': self.manager.username if self.manager else None,
            'host_group': self.host_group.name if self.host_group else None,
            'can_edit_variables': self.can_edit_variables.name if self.can_edit_variables else None,
            'can_run_tasks': self.can_run_tasks.name if self.can_run_tasks else None,
            'can_edit_tasks': self.can_edit_tasks.name if self.can_edit_tasks else None,
            'can_run_playbooks': self.can_run_playbooks.name if self.can_run_playbooks else None,
            'can_edit_playbooks': self.can_edit_playbooks.name if self.can_edit_playbooks else None,
            'can_edit_roles':self.can_edit_roles.name if self.can_edit_roles else None,
            # 'playbooks': [{'name': f['name'], 'folder': f['folder']} for f in json.loads(self.playbooks)],
            # 'roles': [{'name': f['name'], 'folder': f['folder']} for f in json.loads(self.roles)],
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
        }

        relationships = {
            'manager': self.manager.serialize(None, user) if self.manager else None,
            'host_group': self.host_group.serialize(None, user) if self.host_group else None
        }

        meta = self.authorizer(user)

        return self._serializer(fields, attributes, links, meta, relationships)

    @staticmethod
    def authorizer(user):

        return {
            'editable': True,
            'deletable': True,
        }

    class Meta:

        ordering = ['name']



