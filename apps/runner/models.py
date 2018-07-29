from django.db import models
from django.contrib.auth.models import User
from apps.users.models import Credential


class AdHocTask(models.Model):

    hosts = models.CharField(max_length=64, blank=True)

    module = models.CharField(max_length=32)

    arguments = models.TextField(max_length=1024, blank=True)

    become = models.BooleanField()


class PlaybookArgs(models.Model):

    name = models.CharField(max_length=64)

    folder = models.CharField(max_length=256, default='', blank=True)

    tags = models.CharField(max_length=64, blank=True, null=True)

    skip_tags = models.CharField(max_length=64, blank=True, null=True)

    subset = models.CharField(max_length=64, blank=True, null=True)

    extra_vars = models.CharField(max_length=128, blank=True, null=True)

    class Meta:

        unique_together = ('name', 'tags', 'subset', 'skip_tags', 'extra_vars')


class Job(models.Model):

    user = models.ForeignKey(User)

    cred = models.ForeignKey(Credential, blank=True, null=True)

    is_running = models.BooleanField(default=False)

    type = models.CharField(max_length=16, choices=(('playbook', 'playbook'),
                                                    ('adhoc', 'adhoc'),
                                                    ('gather_facts', 'gather_facts')))

    created_on = models.DateTimeField(auto_now_add=True)

    name = models.CharField(max_length=128)

    folder = models.CharField(max_length=256, blank=True, null=True)

    pid = models.IntegerField(blank=True, null=True)

    status = models.CharField(max_length=32)

    message = models.CharField(max_length=1024, blank=True, null=True)

    tags = models.CharField(max_length=64, blank=True, null=True)

    skip_tags = models.CharField(max_length=64, blank=True, null=True)

    extra_vars = models.CharField(max_length=128, blank=True, null=True)

    subset = models.CharField(max_length=1024, blank=True, null=True)

    check = models.BooleanField()

    stats = models.TextField(max_length=4096, blank=True, null=True)


class Play(models.Model):

    job = models.ForeignKey(Job)

    name = models.CharField(max_length=128)

    hosts = models.CharField(max_length=64)

    become = models.BooleanField()

    gather_facts = models.BooleanField(default=False)

    message = models.CharField(max_length=1024, blank=True, null=True)


class Task(models.Model):

    play = models.ForeignKey(Play)

    name = models.CharField(max_length=128)

    module = models.CharField(max_length=64, blank=True, null=True)

    is_handler = models.BooleanField()

    is_running = models.BooleanField(default=False)


class Result(models.Model):

    task = models.ForeignKey(Task)

    host = models.CharField(max_length=64)

    status = models.CharField(max_length=32)

    message = models.TextField(max_length=32768, blank=True, null=True)

    response = models.TextField(max_length=65536, default='{}')

