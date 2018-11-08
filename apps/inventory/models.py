import json

from django.db import models
from django.core.validators import RegexValidator



class Node(models.Model):

    name = models.CharField(max_length=64, blank=False, unique=True)

    description = models.TextField(max_length=256, blank=True)

    type = None

    group_set = None

    def __str__(self):

        return self.name

    def get_descendants(self):

        if self.type == 'group' and self.id:

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

        else:

            return set(), set()

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
            'attributes': self.attributes(),
            'links': {
                'self': '/'.join([request._current_scheme_host + request.path, str(self.id)]),
                'facts': '/'.join([request._current_scheme_host + request.path, str(self.id), 'facts']),
                'view': '/'.join([request._current_scheme_host, 'inventory', self.type, str(self.id)])
            }
        }

        data['attributes']['name'] = self.name

        data['attributes']['description'] = self.description

        if self.type == 'group' and self.name == 'all':

            data['attributes']['editable'] = False

        else:

            data['attributes']['editable'] = request.user.has_perm('users.edit_' + self.type + 's')

        return data

    def attributes(self):

        return {}

    class Meta:

        abstract = True


class Host(Node):

    facts = models.TextField(max_length=65353, default='{}')

    type = 'host'

    def attributes(self):

        facts = json.loads(self.facts)

        return {
            'public_address': facts.get('ec2_public_ipv4'),
            'instance_type': facts.get('ec2_instance_type'),
            'cores': facts.get('processor_count'),
            'memory': facts.get('memtotal_mb'),
            'address': facts.get('default_ipv4', {}).get('address'),
            'disc': sum([m['size_total'] for m in facts.get('mounts', [])]),
            'instance_id': facts.get('ec2_instance_id'),
        }

    def serialize(self, request):

        data = super(Host, self).serialize(request)

        data['links']['facts'] = {}

        data['links']['parents'] = {}

        return data


class Group(Node):

    children = models.ManyToManyField('self', blank=True, symmetrical=False)

    members = models.ManyToManyField('Host', blank=True)

    type = 'group'

    def attributes(self):

        return {
            'members': self.members.all().count(),
            'parents': self.group_set.all().count(),
            'children': self.children.all().count(),
            'variables': self.variable_set.all().count(),
        }

    def serialize(self, request):

        data = super(Group, self).serialize(request)

        data['links']['children'] = {}

        data['links']['members'] = {}

        data['links']['parents'] = {}

        return data


class Variable(models.Model):

    key = models.CharField(max_length=128, blank=False, validators=[
        RegexValidator(regex='\-', message='Key names cannot contain "-"', inverse_match=True)
    ])

    value = models.CharField(max_length=1024)

    host = models.ForeignKey('Host', blank=True, null=True, on_delete=models.CASCADE)

    group = models.ForeignKey('Group', blank=True, null=True, on_delete=models.CASCADE)

    class Meta:

        unique_together = (('key', 'host'), ('key', 'group'))

    def __str__(self):

        return self.key
