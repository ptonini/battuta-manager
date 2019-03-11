import json

from django.db import models
from django.core.cache import caches, cache

from main.extras.mixins import ModelSerializerMixin
from apps.inventory.extras import AnsibleInventory
from apps.preferences.extras import get_preferences
from apps.iam.extras import Authorizer
from apps.iam.models import LocalUser, Credential


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

        meta = self.permissions(user)

        data = self._serializer(fields, attributes, links, meta)

        return data

    def permissions(self, user):

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


class AdHocTask(models.Model, ModelSerializerMixin):

    type = 'adhoctasks'

    route = '/runner/adhoctasks'

    name = models.CharField(max_length=64, unique=True)

    hosts = models.CharField(max_length=64)

    module = models.CharField(max_length=32)

    arguments = models.TextField(max_length=1024, blank=True)

    become = models.BooleanField()

    def serialize(self, fields, user):

        attributes = {
            'name': self.name,
            'hosts': self.hosts,
            'module': self.module,
            'arguments': json.loads(self.arguments if self.arguments else '{}'),
            'become': self.become,
        }

        links = {'self': '/'.join([self.route, str(self.id)])}

        meta = self.permissions(user)

        data = self._serializer(fields, attributes, links, meta)

        return data

    def permissions(self, user):

        authorizer = caches['authorizer'].get_or_set(user.username, lambda: Authorizer(user))

        readable = any([
            user.has_perm('users.execute_jobs'),
            authorizer.can_edit_tasks(cache.get_or_set('inventory', AnsibleInventory), self.hosts)
        ])

        editable = readable

        deletable = readable

        return {'readable': readable, 'editable': editable, 'deletable': deletable}


class Job(models.Model, ModelSerializerMixin):

    type = 'jobs'

    route = '/runner/jobs'

    name = models.CharField(max_length=512, blank=True, null=True)

    job_type = models.CharField(max_length=16, choices=(('playbook', 'playbook'), ('task', 'task'), ('facts', 'facts')))

    subset = models.CharField(max_length=128, blank=True, null=True)

    parameters = models.CharField(max_length=2048, blank=True, null=True)

    check = models.BooleanField()

    user = models.ForeignKey(LocalUser, on_delete=models.CASCADE)

    cred = models.ForeignKey(Credential, blank=True, null=True, on_delete=models.CASCADE)

    created = models.DateTimeField(auto_now_add=True)

    pid = models.IntegerField(blank=True, null=True)

    status = models.CharField(max_length=32)

    message = models.CharField(max_length=1024, blank=True, null=True)

    statistics = models.TextField(max_length=4096, blank=True, null=True)

    def serialize(self, fields, user):

        attributes = {
            'name': self.name,
            'job_type': self.job_type,
            'subset': self.subset,
            'parameters': json.loads(self.parameters),
            'check': self.check,
            'user': self.user.username,
            'cred': self.cred.id,
            'created': self.created.strftime(get_preferences()['date_format']),
            'pid': self.pid,
            'status': self.status,
            'message': self.message,
            'statistics': self.statistics
        }

        links = {'self': self.link}

        meta = self.permissions(user)

        data = self._serializer(fields, attributes, links, meta)

        data['relationships'] = {'plays': [p.serialize(None, user) for p in self.play_set.all()]}

        return data

    @staticmethod
    def permissions(user):

        authorizer = caches['authorizer'].get_or_set(user.username, lambda: Authorizer(user))

        readable = True

        editable = readable

        deletable = readable

        return {'readable': readable, 'editable': editable, 'deletable': deletable}


class Play(models.Model, ModelSerializerMixin):

    type = 'plays'

    job = models.ForeignKey(Job, on_delete=models.CASCADE)

    name = models.CharField(max_length=128)

    hosts = models.CharField(max_length=64)

    become = models.BooleanField()

    gather_facts = models.BooleanField(default=False)

    message = models.CharField(max_length=1024, blank=True, null=True)

    def serialize(self, fields, user):

        attributes = {
            'job': self.job.id,
            'name': self.name,
            'hosts': self.hosts,
            'become': self.become,
            'gather_facts': self.gather_facts,
            'message': self.message
        }

        data = self._serializer(fields, attributes, {}, {})

        data['relationships'] = {'tasks': [t.serialize({'attributes': ['name'], 'meta': list()}, user) for t in self.task_set.all()]}

        return data

    def permissions(self, user):

        return self.job.permissions(user)


class Task(models.Model, ModelSerializerMixin):

    type = 'tasks'

    route = '/runner/tasks'

    play = models.ForeignKey(Play, on_delete=models.CASCADE)

    name = models.CharField(max_length=128)

    module = models.CharField(max_length=64, blank=True, null=True)

    is_handler = models.BooleanField()

    is_running = models.BooleanField(default=False)

    def serialize(self, fields, user):

        attributes = {
            'play': self.play.id,
            'name': self.name,
            'module': self.module,
            'is_handler': self.is_handler,
            'is_running': self.is_running,
        }

        links = {'self': self.link, 'results': '/'.join([self.link, 'results'])}

        data = self._serializer(fields, attributes, links, {})

        return data

    def permissions(self, user):

        return self.play.job.permissions(user)

class Result(models.Model, ModelSerializerMixin):

    type = 'results'

    route = '/runner/results'

    task = models.ForeignKey(Task, on_delete=models.CASCADE)

    host = models.CharField(max_length=64)

    status = models.CharField(max_length=32)

    message = models.TextField(max_length=32768, blank=True, null=True)

    response = models.TextField(max_length=65536, default='{}')

    def serialize(self, fields, user):

        attributes = {
            'task': self.task.id,
            'host': self.host,
            'status': self.status,
            'message': self.message,
            'response': self.response,
        }

        links = {'self': self.link}

        data = self._serializer(fields, attributes, links, {})

        return data

    def permissions(self, user):

        return self.task.play.job.permissions(user)