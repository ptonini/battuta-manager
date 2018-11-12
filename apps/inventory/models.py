import json

from collections import OrderedDict
from django.db import models
from django.core.validators import RegexValidator



class Node(models.Model):

    name = models.CharField(max_length=64, blank=False, unique=True)

    description = models.TextField(max_length=256, blank=True)

    type = None

    group_set = None

    members = None

    children = None

    def __str__(self):

        return self.name

    def get_relationships(self, relation):

        if relation == 'parents':

            return self.group_set, Group

        elif relation == 'children':

            return self.children, Group

        elif relation == 'members':

            return self.members, Host

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

    def serialize(self, request):

        data = {
            'type': self.type,
            'id': self.id,
            'meta': {'editable': request.user.has_perm('users.edit_' + self.type + 's')}
        }

        attributes = ['name', 'description']

        links = {
            'self': request.path,
            'vars': '/'.join([request.path, Variable.type]),
            'parents': '/'.join([request.path, 'parents']),
            'view': '/'.join(['/inventory', self.type, str(self.id)])
        }

        fields = request.JSON.get('fields', False)

        if not fields or 'attributes' in fields:

            data['attributes'] = {a: getattr(self, a) for a in attributes if not fields or a in fields['attributes']}

        if not fields or 'links' in fields:

            data['links'] = {k: v for k, v in links.items() if not fields or k in fields['links']}

        if self.type == Group.type and self.name == 'all':

            data['meta']['editable'] = False

        return data

    class Meta:

        abstract = True


class Host(Node):

    facts = models.TextField(max_length=65353, default='{}')

    type = 'hosts'

    def serialize(self, request):

        data = super(Host, self).serialize(request)

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

        fields = request.JSON.get('fields', False)

        if not fields or 'attributes' in fields:

            data['attributes'].update({k: v for k, v in attributes.items() if not fields or k in fields['attributes']})

        if fields and 'facts' in fields.get('attributes', {}):

            data['attributes'] = {'facts': OrderedDict(sorted(facts.items()))}

        return data


class Group(Node):

    children = models.ManyToManyField('self', blank=True, symmetrical=False)

    members = models.ManyToManyField('Host', blank=True)

    type = 'groups'

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

    def serialize(self, request):

        data = super(Group, self).serialize(request)

        attributes = {
            'members': self.members.all().count(),
            'parents': self.group_set.all().count(),
            'children': self.children.all().count(),
            'variables': self.variable_set.all().count()
        }

        links = {
            'children': request.path + '/children',
            'members': request.path + '/members'
        }

        fields = request.JSON.get('fields', False)

        if not fields or 'attributes' in fields:

            data['attributes'].update({k: v for k, v in attributes.items() if not fields or k in fields['attributes']})

        if not fields or 'links' in fields:

            data['links'].update({k: v for k, v in links.items() if not fields or k in fields['links']})

        return data


class Variable(models.Model):

    type = 'vars'

    key = models.CharField(max_length=128, blank=False, validators=[
        RegexValidator(regex='\-', message='Key names cannot contain "-"', inverse_match=True)
    ])

    value = models.CharField(max_length=1024)

    host = models.ForeignKey('Host', blank=True, null=True, on_delete=models.CASCADE)

    group = models.ForeignKey('Group', blank=True, null=True, on_delete=models.CASCADE)

    def serialize(self, request):

        data = {
            'id': self.id,
            'type': self.type,
            'attributes': {
                'key': self.key,
                'value': self.value,
            }
        }

        if self.host:

            data['attributes']['host'] = str(self.host.id)

        else:

            data['attributes']['group'] = str(self.group.id)

        return data

    class Meta:

        unique_together = (('key', 'host'), ('key', 'group'))

    def __str__(self):

        return self.key
