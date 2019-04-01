import json

from django.db import models
from django.core.cache import caches

from main.extras.mixins import RESTfulModelMixin
from main.extras.signals import clear_authorizer
from apps.projects.extras import ProjectAuthorizer
from apps.files.extras import FileHandler


class Project(models.Model, RESTfulModelMixin):

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
            'class': Group if relation == 'host_group' else LocalUser,
            'sort': 'name' if relation == 'host_group' else 'username'
        }

    def serialize(self, fields, user):

        attr = {
            'name': self.name,
            'description': self.description,
            'manager': self.manager.username if self.manager else None,
            'host_group': self.host_group.name if self.host_group else None,
        }

        links = {
            'self': self.link,
            'manager': '/'.join([self.link, 'manager']),
            'host_group': '/'.join([self.link, 'host_group']),
            'can_edit_variables': '/'.join([self.link, 'can_edit_variables']),
            'can_run_tasks': '/'.join([self.link, 'can_run_tasks']),
            'can_edit_tasks': '/'.join([self.link, 'can_edit_tasks']),
            'can_run_playbooks': '/'.join([self.link, 'can_run_playbooks']),
            'can_edit_playbooks': '/'.join([self.link, 'can_edit_playbooks']),
            'can_edit_roles': '/'.join([self.link, 'can_edit_roles']),
            'playbooks': '/'.join([self.link, 'playbooks']),
            'roles': '/'.join([self.link, 'roles']),
        }

        meta = self.perms(user)

        return self._serialize_data(fields, attributes=attr, links=links, meta=meta)

    def perms(self, user):

        authorizer = caches['authorizer'].get_or_set(user.username, lambda: ProjectAuthorizer(user))

        readable = any([
            user.has_perm('auth.edit_projects'),
            authorizer.is_manager(self),
            user.is_superuser
        ])

        editable = readable

        deletable = any([
            user.has_perm('auth.edit_projects'),
            user.is_superuser
        ])

        return {'editable': editable, 'deletable': deletable, 'readable': readable }

    def get_fs_obj_relations(self, relation, user, related=True):

        related_list = FileHandler.sort_path_list(json.loads(getattr(self, relation)))

        if related:

            output = list()

            for related in related_list:

                try:

                    output.append(FileHandler.factory(relation, related, user))

                except FileNotFoundError:

                    pass

            if len(related_list) != len(output):

                self.__setattr__(relation, json.dumps([f.path for f in output]))

                self.save()

                clear_authorizer.send(self)

        else:

            output = [f for f in FileHandler.get_root_class(relation).list(user) if f.path not in related_list]

        return output

    class Meta:

        ordering = ['name']



