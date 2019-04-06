import json

from django.db import models
from django.core.cache import caches, cache

from main.extras.mixins import RESTfulModelMixin
from apps.inventory.extras import AnsibleInventory
from apps.preferences.extras import get_prefs
from apps.projects.extras import ProjectAuthorizer
from apps.iam.models import LocalUser, Credential


class PlaybookArgs(models.Model, RESTfulModelMixin):

    type = 'arguments'

    path = models.CharField(max_length=512)

    tags = models.CharField(max_length=64, blank=True, null=True)

    skip_tags = models.CharField(max_length=64, blank=True, null=True)

    subset = models.CharField(max_length=64, blank=True, null=True)

    extra_vars = models.CharField(max_length=128, blank=True, null=True)

    def serialize(self, fields, user):

        attr = {
            'path': self.path,
            'tags': self.tags,
            'skip_tags': self.skip_tags,
            'subset': self.subset,
            'extra_vars': self.extra_vars
        }

        links = {'self': '/'.join(['runner/playbooks', self.path, 'args', str(self.id)])}

        meta = self.perms(user)

        data = self._serialize_data(fields, attributes=attr, links=links, meta=meta)

        return data

    def perms(self, user):

        authorizer = caches['authorizer'].get_or_set(user.username, lambda: ProjectAuthorizer(user))

        readable = any([
            user.has_perm('auth.execute_jobs'),
            authorizer.can_run_playbooks(cache.get_or_set('inventory', AnsibleInventory), self.path)
        ])

        editable = readable

        deletable = readable

        return {'readable': readable, 'editable': editable, 'deletable': deletable}

    class Meta:

        unique_together = ('path', 'tags', 'subset', 'skip_tags', 'extra_vars')


class AdHocTask(models.Model, RESTfulModelMixin):

    type = 'adhoctasks'

    route = '/runner/adhoctasks'

    name = models.CharField(max_length=64, unique=True)

    hosts = models.CharField(max_length=64)

    module = models.CharField(max_length=32)

    arguments = models.TextField(max_length=1024, blank=True)

    become = models.BooleanField()

    def serialize(self, fields, user):

        attr = {
            'name': self.name,
            'hosts': self.hosts,
            'module': self.module,
            'arguments': json.loads(self.arguments if self.arguments else '{}'),
            'become': self.become,
        }

        links = {'self': '/'.join([self.route, str(self.id)])}

        meta = self.perms(user)

        data = self._serialize_data(fields, attributes=attr, links=links, meta=meta)

        return data

    def perms(self, user):

        authorizer = caches['authorizer'].get_or_set(user.username, lambda: ProjectAuthorizer(user))

        readable = any([
            user.has_perm('auth.execute_jobs'),
            authorizer.can_edit_tasks(cache.get_or_set('inventory', AnsibleInventory), self.hosts)
        ])

        editable = readable

        deletable = readable

        return {'readable': readable, 'editable': editable, 'deletable': deletable}


class Job(models.Model, RESTfulModelMixin):

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

    statistics = models.TextField(max_length=4096, default='{}')

    def serialize(self, fields, user):

        attr = {
            'name': self.name,
            'job_type': self.job_type,
            'subset': self.subset,
            'parameters': json.loads(self.parameters),
            'check': self.check,
            'user': self.user.username,
            'status': self.status,
            'message': self.message,
            'statistics': json.loads(getattr(self, 'statistics', '')),
            'created': self.created.strftime(get_prefs('date_format'))
        }

        links = {'self': self.link}

        meta = self.perms(user)

        rel = {'plays': [p.serialize(None, user) for p in self.play_set.all()]}

        data = self._serialize_data(fields, attributes=attr, links=links, meta=meta, relationships=rel)

        return data

    def perms(self, user):

        authorizer = caches['authorizer'].get_or_set(user.username, lambda: ProjectAuthorizer(user))

        inventory = cache.get_or_set('inventory', AnsibleInventory)

        readable = any([user.has_perm('auth.view_job_history'), authorizer.can_view_job(inventory, self)])

        editable = any([user.has_perm('auth.execute_jobs'), authorizer.can_run_job(inventory, self)])

        return {'readable': readable, 'editable': editable, 'deletable': False}


class Play(models.Model, RESTfulModelMixin):

    type = 'plays'

    job = models.ForeignKey(Job, on_delete=models.CASCADE)

    name = models.CharField(max_length=128)

    hosts = models.CharField(max_length=64)

    become = models.BooleanField()

    gather_facts = models.BooleanField(default=False)

    message = models.CharField(max_length=1024, blank=True, null=True)

    def serialize(self, fields, user):

        attr = {
            'job': self.job.id,
            'name': self.name,
            'hosts': self.hosts,
            'become': self.become,
            'gather_facts': self.gather_facts,
            'message': self.message
        }

        rel_fields = {'attributes': ['name', 'is_running'], 'meta': False}

        rel = {'tasks': [t.serialize(rel_fields, user) for t in self.task_set.all()]}

        data = self._serialize_data(fields, attributes=attr, relationships=rel)

        return data

    def perms(self, user):

        return self.job.perms(user)


class Task(models.Model, RESTfulModelMixin):

    type = 'tasks'

    route = '/runner/tasks'

    play = models.ForeignKey(Play, on_delete=models.CASCADE)

    name = models.CharField(max_length=128)

    module = models.CharField(max_length=64, blank=True, null=True)

    is_handler = models.BooleanField()

    is_running = models.BooleanField(default=False)

    def serialize(self, fields, user):

        attr = {
            'play': self.play.id,
            'name': self.name,
            'module': self.module,
            'is_handler': self.is_handler,
            'is_running': self.is_running,
        }

        links = {'self': self.link, 'results': '/'.join([self.link, 'results'])}

        meta = self.perms(user)

        return self._serialize_data(fields, attributes=attr, links=links, meta=meta)

    def perms(self, user):

        return self.play.job.perms(user)


class Result(models.Model, RESTfulModelMixin):

    type = 'results'

    route = '/runner/results'

    task = models.ForeignKey(Task, on_delete=models.CASCADE)

    host = models.CharField(max_length=64)

    status = models.CharField(max_length=32)

    message = models.TextField(max_length=32768, blank=True, null=True)

    response = models.TextField(max_length=65536, default='{}')

    def serialize(self, fields, user):

        attr = {
            'task': self.task.id,
            'host': self.host,
            'status': self.status,
            'message': self.message,
            'response': self.response,
        }

        links = {'self': self.link}

        meta = self.perms(user)

        data = self._serialize_data(fields, attributes=attr, links=links, meta=meta)

        return data

    def perms(self, user):

        return self.task.play.job.perms(user)
