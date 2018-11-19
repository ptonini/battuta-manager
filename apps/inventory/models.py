import json

from collections import OrderedDict
from django.db import models
from django.core.validators import RegexValidator
from django.conf import settings
from django.core.cache import cache

from main.extras.models import SerializerModelMixin
from apps.projects.extras import ProjectAuthorizer



class Node(models.Model, SerializerModelMixin):

    name = models.CharField(max_length=64, blank=False, unique=True)

    description = models.TextField(max_length=256, blank=True)

    type = None

    route = None

    group_set = None

    members = None

    children = None

    def __str__(self):

        return self.name

    def get_relationships(self, relation):

        relations = {
            'parents': [self.group_set, Group],
            'children': [self.children, Group],
            'members': [self.members, Host]
        }

        return relations[relation]

    def get_ancestors(self):

        ancestors = set()

        if self.id:

            parents = self.group_set.all()

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

    def serialize(self, fields, user):

        attributes = {'name': self.name, 'description': self.description}

        links = {
            'self': '/'.join([self.route, str(self.id)]) ,
            Variable.type: '/'.join([self.route, str(self.id), Variable.type]),
            'parents': '/'.join([self.route, str(self.id), 'parents']),
        }

        meta = self.authorizer(user)

        data = self.serializer(fields, attributes, links, meta)

        return data

    def authorizer(self, user):

        return {
            'editable': user.has_perm('users.edit_' + self.type),
            'deletable': user.has_perm('users.edit_' + self.type)
        }


    class Meta:

        abstract = True


class Host(Node):

    facts = models.TextField(max_length=65353, default='{}')

    type = 'hosts'

    route = '/inventory/hosts'

    def serialize(self, fields, user):

        facts = json.loads(self.facts)

        attributes = {
            'public_address': facts.get('ec2_public_ipv4'),
            'instance_type': facts.get('ec2_instance_type'),
            'cores': facts.get('processor_count'),
            'memory': facts.get('memtotal_mb'),
            'address': facts.get('default_ipv4', {}).get('address'),
            'disc': sum([m['size_total'] for m in facts.get('mounts', [])]),
            'instance_id': facts.get('ec2_instance_id'),
        }

        data = self.serializer(fields, attributes, {}, {}, super(Host, self).serialize(fields, user))

        if fields and 'facts' in fields.get('attributes', {}):

            data['attributes'] = {'facts': OrderedDict(sorted(facts.items()))}

        return data


class Group(Node):

    children = models.ManyToManyField('self', blank=True, symmetrical=False)

    members = models.ManyToManyField('Host', blank=True)

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

    def serialize(self, fields, user):

        attributes = {
            'members': self.members.all().count(),
            'parents': self.group_set.all().count(),
            'children': self.children.all().count(),
            'variables': self.variable_set.all().count()
        }

        links = {
            'children': '/'.join([self.route, str(self.id), 'children']),
            'members': '/'.join([self.route, str(self.id), 'members'])
        }

        meta = self.authorizer(user)

        data = self.serializer(fields, attributes, links, meta, super(Group, self).serialize(fields, user))

        return data

    def authorizer(self, user):

        return {
            'editable': user.has_perm('users.edit_' + self.type) and not self.name =='all',
            'deletable': user.has_perm('users.edit_' + self.type) and not self.name =='all'
        }


class Variable(models.Model, SerializerModelMixin):

    type = 'vars'

    key = models.CharField(max_length=128, blank=False, validators=[
        RegexValidator(regex='\-', message='Key names cannot contain "-"', inverse_match=True)
    ])

    value = models.CharField(max_length=1024)

    host = models.ForeignKey('Host', blank=True, null=True, on_delete=models.CASCADE)

    group = models.ForeignKey('Group', blank=True, null=True, on_delete=models.CASCADE)

    def __str__(self):

        return self.key

    def serialize(self, fields, user):

        attributes = {'key': self.key, 'value': self.value}

        if self.host:

            links = {'self': '/'.join([Host.route, str(self.host.id), Variable.type, str(self.id)])}

            attributes['host'] = str(self.host.id)

        else:

            links = {'self': '/'.join([Group.route, str(self.group.id), Variable.type, str(self.id)])}

            attributes['group'] = str(self.group.id)

        meta = self.authorizer(user)

        return self.serializer(fields, attributes, links, meta)

    def authorizer(self, user):

        project_authorizer = cache.get_or_set(user.username + '_auth', ProjectAuthorizer(user), settings.CACHE_TIMEOUT)

        node = Host.objects.get(pk=self.host.id) if self.host else Group.objects.get(pk=self.group.id)

        return {
            'editable': user.has_perm('users.edit_' + node.type) or project_authorizer.can_edit_variables(node),
            'deletable': user.has_perm('users.edit_' + node.type) or project_authorizer.can_edit_variables(node),
        }

    class Meta:

        unique_together = (('key', 'host'), ('key', 'group'))


