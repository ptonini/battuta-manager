from django.db import models
from django.contrib.auth.models import User


class AdHocTask(models.Model):
    hosts = models.CharField(max_length=64)
    module = models.CharField(max_length=32)
    arguments = models.TextField(max_length=1024, blank=True)
    become = models.BooleanField()


class PlaybookArgs(models.Model):
    playbook = models.CharField(max_length=64)
    tags = models.CharField(max_length=64, blank=True, null=True)
    skip_tags = models.CharField(max_length=64, blank=True, null=True)
    subset = models.CharField(max_length=64, blank=True, null=True)
    extra_vars = models.CharField(max_length=128, blank=True, null=True)

    class Meta:
        unique_together = ('playbook', 'tags', 'subset', 'skip_tags', 'extra_vars')


class Runner(models.Model):
    user = models.ForeignKey(User)
    type = models.CharField(max_length=8, choices=(('playbook', 'playbook'), ('adhoc', 'adhoc')))
    created_on = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=128)
    pid = models.IntegerField(blank=True, null=True)
    status = models.CharField(max_length=32)
    message = models.CharField(max_length=1024, blank=True, null=True)
    tags = models.CharField(max_length=64, blank=True, null=True)
    skip_tags = models.CharField(max_length=64, blank=True, null=True)
    extra_vars = models.CharField(max_length=128, blank=True, null=True)
    subset = models.CharField(max_length=64, blank=True, null=True)
    check = models.BooleanField()
    stats = models.TextField(max_length=4096, blank=True, null=True)
    data = dict()


class RunnerPlay(models.Model):
    runner = models.ForeignKey(Runner)
    name = models.CharField(max_length=128)
    hosts = models.CharField(max_length=64)
    become = models.BooleanField()
    gather_facts = models.BooleanField(default=False)


class RunnerTask(models.Model):
    runner_play = models.ForeignKey(RunnerPlay)
    name = models.CharField(max_length=128)
    module = models.CharField(max_length=64, blank=True, null=True)


class RunnerResult(models.Model):
    runner_task = models.ForeignKey(RunnerTask)
    host = models.CharField(max_length=64)
    status = models.CharField(max_length=32)
    message = models.TextField(max_length=32768, blank=True, null=True)
    response = models.TextField(max_length=65536, blank=True, null=True)


