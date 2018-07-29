import json

from django.db import models
from django.core.validators import RegexValidator


class Node(models.Model):

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

    def to_dict(self):

        default_fields = {
            'name': self.name,
            'type': self.type,
            'description': self.description,
            'id': self.id,
        }

        if hasattr(self, 'editable'):

            default_fields['editable'] = self.editable

        node_dict = default_fields.copy()

        if self.type == 'host':

            facts = json.loads(self.facts)

            host_fields = {
                'public_address': facts.get('ec2_public_ipv4'),
                'instance_type': facts.get('ec2_instance_type'),
                'cores': facts.get('processor_count'),
                'memory': facts.get('memtotal_mb'),
                'address': facts.get('default_ipv4', {}).get('address'),
                'disc': sum([m['size_total'] for m in facts.get('mounts', [])]),
                'instance_id': facts.get('ec2_instance_id')
            }

            node_dict.update(host_fields)

        else:

            group_fields = {
                'members': self.members.all().count(),
                'parents': self.group_set.all().count(),
                'children': self.children.all().count(),
                'variables': self.variable_set.all().count(),
            }

            node_dict.update(group_fields)

        return node_dict

    class Meta:

        abstract = True


class Host(Node):

    name = models.CharField(max_length=64, blank=False, unique=True)

    description = models.TextField(max_length=256, blank=True)

    facts = models.TextField(max_length=65353, default='{}')

    type = 'host'

    def __str__(self):

        return self.name


class Group(Node):

    name = models.CharField(max_length=64, blank=False, unique=True)

    description = models.TextField(max_length=256, blank=True)

    children = models.ManyToManyField('self', blank=True, symmetrical=False)

    members = models.ManyToManyField('Host', blank=True)

    type = 'group'

    def __str__(self):

        return self.name


class Variable(models.Model):

    key = models.CharField(max_length=128, blank=False, validators=[
        RegexValidator(regex='\-', message='Key names cannot contain "-"', inverse_match=True)
    ])

    value = models.CharField(max_length=1024)

    host = models.ForeignKey('Host', blank=True, null=True)

    group = models.ForeignKey('Group', blank=True, null=True)

    class Meta:

        unique_together = (('key', 'host'), ('key', 'group'))

    def __str__(self):

        return self.key