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
            'attributes': {},
            'links': {
                'self': '/'.join([request._current_scheme_host + request.path, str(self.id)]),
                'parents': '/'.join([request._current_scheme_host + request.path, str(self.id), 'parents']),
                'vars': '/'.join([request._current_scheme_host + request.path, str(self.id), 'vars']),
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

    class Meta:

        abstract = True


class Host(Node):

    facts = models.TextField(max_length=65353, default='{}')

    type = 'host'

    def serialize(self, request):

        data = super(Host, self).serialize(request)

        facts = json.loads(self.facts)

        data['links']['facts'] = data['links']['self'] + '/facts'

        data['attributes']['public_address'] = facts.get('ec2_public_ipv4')

        data['attributes']['instance_type'] = facts.get('ec2_instance_type')

        data['attributes']['cores'] = facts.get('processor_count')

        data['attributes']['memory'] = facts.get('memtotal_mb')

        data['attributes']['address'] = facts.get('default_ipv4', {}).get('address')

        data['attributes']['disc'] = sum([m['size_total'] for m in facts.get('mounts', [])])

        data['attributes']['instance_id'] = facts.get('ec2_instance_id')


        return data


class Group(Node):

    children = models.ManyToManyField('self', blank=True, symmetrical=False)

    members = models.ManyToManyField('Host', blank=True)

    type = 'group'

    def serialize(self, request):

        data = super(Group, self).serialize(request)

        data['links']['children'] =  data['links']['self'] + '/children'

        data['links']['members'] =  data['links']['self'] + '/members'

        data['attributes']['members'] = self.members.all().count()

        data['attributes']['parents'] = self.group_set.all().count()

        data['attributes']['children'] =  self.children.all().count()

        data['attributes']['variables'] =  self.variable_set.all().count()

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
