import json

from collections import OrderedDict
from django.db import models
from django.core.validators import RegexValidator
from django.core.cache import caches

from main.extras.mixins import ModelSerializerMixin
from apps.iam.extras import Authorizer


class Node(models.Model, ModelSerializerMixin):

    name = models.CharField(max_length=64, blank=False, unique=True)

    description = models.TextField(max_length=256, blank=True)

    def __str__(self):

        return self.name

    def get_relationships(self, relation):

        relations = {
            'parents': [getattr(self, 'group_set'), Group],
            'children': [getattr(self, 'children'), Group],
            'members': [getattr(self, 'members'), Host]
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

        attributes = {'name': self.name, 'description': self.description}

        links = {
            'self': '/'.join([getattr(self, 'route'), str(self.id)]) ,
            Variable.type: '/'.join([getattr(self, 'route'), str(self.id), Variable.type]),
            'parents': '/'.join([getattr(self, 'route'), str(self.id), 'parents']),
        }

        meta = self.authorizer(user)

        data = self._serializer(fields, attributes, links, meta)

        return data

    def authorizer(self, user):

        editable = user.has_perm('users.edit_' + getattr(self, 'type'))

        deletable = editable

        return { 'readable': True, 'editable': editable, 'deletable': deletable}

    class Meta:

        ordering = ['name']

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

        data = self._serializer(fields, attributes, {}, {}, super(Host, self).serialize(fields, user))

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

    def to_ansible_dict(self):

        group_dict = dict()

        if self.members.all().exists():

            group_dict['hosts'] = [host.name for host in self.members.all()]

        if self.children.all().exists():

            group_dict['children'] = [child.name for child in self.children.all()]

        if self.variable_set.all().exists():

            group_dict['vars'] = self.vars_dict()

        return group_dict

    def serialize(self, fields, user):

        attributes = {
            'members': self.members.all().count() if self.id else None,
            'parents': self.group_set.all().count() if self.id else None,
            'children': self.children.all().count() if self.id else None,
            'variables': self.variable_set.all().count() if self.id else None
        }

        links = {
            'children': '/'.join([self.route, str(self.id), 'children']),
            'members': '/'.join([self.route, str(self.id), 'members'])
        }

        meta = self.authorizer(user)

        data = self._serializer(fields, attributes, links, meta, super(Group, self).serialize(fields, user))

        return data

    def authorizer(self, user):

        editable = all([
            user.has_perm('users.edit_' + self.type),
            not self.name =='all',
        ])

        deletable = editable

        return { 'readable': True, 'editable': editable, 'deletable': deletable}


class Variable(models.Model, ModelSerializerMixin):

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

            host_id_str = str(getattr(self.host, 'id'))

            links = {'self': '/'.join([Host.route, host_id_str, Variable.type, str(self.id)])}

            attributes['host'] = host_id_str

        else:

            group_id_str = str(getattr(self.group, 'id'))

            links = {'self': '/'.join([Group.route, group_id_str, Variable.type, str(self.id)])}

            attributes['group'] = group_id_str

        meta = self.authorizer(user)

        return self._serializer(fields, attributes, links, meta)

    def authorizer(self, user):

        authorizer = caches['authorizer'].get_or_set(user.username, Authorizer(user))

        node = Host.objects.get(pk=getattr(self.host, 'id')) if self.host else Group.objects.get(pk=getattr(self.group, 'id'))

        return {
            'editable': user.has_perm('users.edit_' + node.type) or authorizer.can_edit_variables(node),
            'deletable': user.has_perm('users.edit_' + node.type) or authorizer.can_edit_variables(node),
            'readable': True
        }

    class Meta:

        ordering = ['key']

        unique_together = (('key', 'host'), ('key', 'group'))


