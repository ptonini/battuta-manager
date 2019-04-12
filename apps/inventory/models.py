import json

from collections import OrderedDict
from django.db import models
from django.core.validators import RegexValidator
from django.core.cache import caches

from main.extras.mixins import RESTfulModelMixin
from apps.projects.extras import ProjectAuthorizer


class Node(models.Model, RESTfulModelMixin):

    name = models.CharField(max_length=64, blank=False, unique=True)

    description = models.TextField(max_length=256, blank=True)

    def __str__(self):

        return self.name

    def get_child_instance(self):

        return getattr(self, 'host') if hasattr(self, 'host') else getattr(self, 'group')

    def get_relationships(self, relation):

        relations = {
            'parents': [getattr(self, 'group_set', None), Group],
            'children': [getattr(self, 'children', None), Group],
            'members': [getattr(self, 'members', None), Host]
        }

        return relations[relation]

    def get_ancestors(self):

        ancestors = set()

        if self.id:

            parents = getattr(self, 'group_set').all()

            while len(parents) > 0:

                step_list = list()

                for parent in parents:

                    if parent not in ancestors:

                        ancestors.add(parent)

                    for group in parent.group_set.all():

                        step_list.append(group)

                parents = step_list

            if self.name != 'all':

                ancestors.add(Group.objects.get(name='all'))

        return ancestors

    def vars_dict(self):

        vars_dict = dict()

        for var in getattr(self, 'variable_set').all():

            try:

                vars_dict[var.key] = json.loads(var.value)

            except ValueError or TypeError:

                vars_dict[var.key] = var.value

        return vars_dict

    def serialize(self, fields, user):

        attr = {'name': self.name, 'description': self.description}

        links = {
            'self': self.link,
            Variable.type: '/'.join([self.link, Variable.type]),
            'parents': '/'.join([self.link, 'parents']),
        }

        data = self._serialize_data(fields, attributes=attr, links=links, meta=self.perms(user))

        return data

    def perms(self, user):

        editable = user.has_perm('auth.edit_' + getattr(self, 'type'))

        return {'readable': True, 'editable': editable, 'deletable': editable}

    class Meta:

        ordering = ['name']


class Host(Node):

    facts = models.TextField(max_length=65353, default='{}')

    type = 'hosts'

    route = '/inventory/hosts'

    def serialize(self, fields, user):

        facts = json.loads(self.facts)

        attr = {
            'cores': facts.get('processor_cores'),
            'memory': facts.get('memtotal_mb'),
            'address': facts.get('default_ipv4', {}).get('address'),
            'disc': sum([m['size_total'] for m in facts.get('mounts', [])]),
        }

        data = self._serialize_data(fields, attributes=attr, data=super(Host, self).serialize(fields, user))

        if fields and 'facts' in fields.get('attributes', []):

            data['attributes'] = {'facts': OrderedDict(sorted(facts.items()))}

        return data


class Group(Node):

    children = models.ManyToManyField('self', blank=True, symmetrical=False)

    members = models.ManyToManyField('Host', blank=True)

    config = models.BooleanField(default=False, blank=False)

    type = 'groups'

    route = '/inventory/groups'

    def get_descendants(self):

        group_descendants = set()

        children = self.children.all()

        while len(children) > 0:

            step_list = set()

            for child in children:

                group_descendants.add(child)

                for grandchild in child.children.all():

                    step_list.add(grandchild)

            children = step_list

        members = {host for host in self.members.all()}

        return group_descendants, members.union({host for group in group_descendants for host in group.members.all()})

    def to_ansible_dict(self):

        group_dict = dict()

        if self.members.all().exists() or self.name == 'all':

            queryset = Host.objects.all() if self.name == 'all' else self.members.all()

            group_dict['hosts'] = [h.name for h in queryset]

        if self.children.all().exists() or self.name == 'all':

            queryset = Group.objects.exclude(name='all') if self.name == 'all' else self.children.all()

            group_dict['children'] = [g.name for g in queryset]

            group_dict['children'].append('ungrouped') if self.name == 'all' else None

        if self.variable_set.all().exists():

            group_dict['vars'] = self.vars_dict()

        return group_dict

    def serialize(self, fields, user):

        attr = {
            'config': self.config,
            'members': self.members.all().count() if self.id else None,
            'parents': self.group_set.all().count() if self.id else None,
            'children': self.children.all().count() if self.id else None,
            'variables': self.variable_set.all().count() if self.id else None
        }

        data = self._serialize_data(
            fields,
            attributes=attr,
            links={'children': '/'.join([self.link, 'children']), 'members': '/'.join([self.link, 'members'])},
            meta=self.perms(user),
            data=super(Group, self).serialize(fields, user)
        )

        return data

    def perms(self, user):

        editable = all([user.has_perm('auth.edit_' + self.type), not self.name == 'all'])

        return {'readable': True, 'editable': editable, 'deletable': editable}


class Variable(models.Model, RESTfulModelMixin):

    type = 'vars'

    key = models.CharField(max_length=128, blank=False, validators=[
        RegexValidator(regex='\-', message='Keys cannot contain "-"', inverse_match=True)
    ])

    value = models.CharField(max_length=1024)

    node = models.ForeignKey('Node', on_delete=models.CASCADE)

    def __str__(self):

        return self.key

    def serialize(self, fields, user):

        node_child = self.node.get_child_instance()

        setattr(self, 'route', '/'.join([node_child.link, Variable.type]))

        return self._serialize_data(
            fields,
            attributes={'key': self.key, 'value': self.value, 'node': self.node.id},
            links={'self': self.link, 'parent': node_child.link},
            relationships={'node': node_child.serialize({'attributes': False, 'meta': False}, user)},
            meta=self.perms(user)
        )

    def perms(self, user):

        authorizer = caches['authorizer'].get_or_set(user.username, lambda: ProjectAuthorizer(user))

        editable = any([
            user.has_perm('auth.edit_' + Host.type if hasattr(self.node, 'host') else Group.type),
            authorizer.can_edit_variables(self.node)
        ])

        return {'editable': editable, 'deletable': editable, 'readable': True}

    class Meta:

        ordering = ['key']

        unique_together = (('key', 'node'),)
