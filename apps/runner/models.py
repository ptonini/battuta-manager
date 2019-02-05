from django.db import models
from django.core.cache import caches, cache

from main.extras.mixins import ModelSerializerMixin
from apps.inventory.extras import AnsibleInventory
from apps.iam.extras import Authorizer
from apps.iam.models import LocalUser, Credential


class AdHocTask(models.Model, ModelSerializerMixin):

    hosts = models.CharField(max_length=64, blank=True)

    module = models.CharField(max_length=32)

    arguments = models.TextField(max_length=1024, blank=True)

    become = models.BooleanField()


class PlaybookArgs(models.Model, ModelSerializerMixin):

    type = 'arguments'

    path = models.CharField(max_length=512)

    tags = models.CharField(max_length=64, blank=True, null=True)

    skip_tags = models.CharField(max_length=64, blank=True, null=True)

    subset = models.CharField(max_length=64, blank=True, null=True)

    extra_vars = models.CharField(max_length=128, blank=True, null=True)

    def serialize(self, fields, user):

        attributes = {
            'path': self.path,
            'tags': self.tags,
            'skip_tags': self.skip_tags,
            'subset': self.subset,
            'extra_vars': self.extra_vars
        }

        links = {'self': '/'.join(['runner/playbooks', self.path, 'args', str(self.id)])}

        meta = self.authorizer(user)

        data = self._serializer(fields, attributes, links, meta)

        return data

    def authorizer(self, user):

        authorizer = caches['authorizer'].get_or_set(user.username, lambda: Authorizer(user))

        readable = any([
            user.has_perm('users.execute_jobs'),
            authorizer.can_run_playbooks(cache.get_or_set('inventory', AnsibleInventory), self.path)
        ])

        editable = readable

        deletable = readable

        return {'readable': readable, 'editable': editable, 'deletable': deletable}

    class Meta:

        unique_together = ('path', 'tags', 'subset', 'skip_tags', 'extra_vars')


class Job(models.Model, ModelSerializerMixin):

    user = models.ForeignKey(LocalUser, on_delete=models.CASCADE)

    cred = models.ForeignKey(Credential, blank=True, null=True, on_delete=models.CASCADE)

    is_running = models.BooleanField(default=False)

    type = models.CharField(max_length=16, choices=(('playbook', 'playbook'),
                                                    ('adhoc', 'adhoc'),
                                                    ('gather_facts', 'gather_facts')))

    created_on = models.DateTimeField(auto_now_add=True)

    path = models.CharField(max_length=512, blank=True, null=True)

    pid = models.IntegerField(blank=True, null=True)

    status = models.CharField(max_length=32)

    message = models.CharField(max_length=1024, blank=True, null=True)

    tags = models.CharField(max_length=64, blank=True, null=True)

    skip_tags = models.CharField(max_length=64, blank=True, null=True)

    extra_vars = models.CharField(max_length=128, blank=True, null=True)

    subset = models.CharField(max_length=1024, blank=True, null=True)

    check = models.BooleanField()

    stats = models.TextField(max_length=4096, blank=True, null=True)


class Play(models.Model, ModelSerializerMixin):

    job = models.ForeignKey(Job, on_delete=models.CASCADE)

    name = models.CharField(max_length=128)

    hosts = models.CharField(max_length=64)

    become = models.BooleanField()

    gather_facts = models.BooleanField(default=False)

    message = models.CharField(max_length=1024, blank=True, null=True)


class Task(models.Model, ModelSerializerMixin):

    play = models.ForeignKey(Play, on_delete=models.CASCADE)

    name = models.CharField(max_length=128)

    module = models.CharField(max_length=64, blank=True, null=True)

    is_handler = models.BooleanField()

    is_running = models.BooleanField(default=False)


class Result(models.Model, ModelSerializerMixin):

    task = models.ForeignKey(Task, on_delete=models.CASCADE)

    host = models.CharField(max_length=64)

    status = models.CharField(max_length=32)

    message = models.TextField(max_length=32768, blank=True, null=True)

    response = models.TextField(max_length=65536, default='{}')


