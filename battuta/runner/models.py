from django.db import models
from django.contrib.auth.models import User


class AdHoc(models.Model):
    hosts = models.CharField(max_length=64)
    module = models.CharField(max_length=32)
    arguments = models.TextField(max_length=1024, blank=True)
    become = models.BooleanField()


class PlayArguments(models.Model):
    playbook = models.CharField(max_length=64)
    tags = models.CharField(max_length=64, blank=True, null=True)
    subset = models.CharField(max_length=64, blank=True, null=True)

    class Meta:
        unique_together = ('playbook', 'tags', 'subset')


class Runner(models.Model):
    user = models.ForeignKey(User)
    created_on = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=128)
    pid = models.IntegerField(blank=True, null=True)
    status = models.CharField(max_length=32)
    message = models.CharField(max_length=1024, blank=True, null=True)
    hosts = models.CharField(max_length=64)
    tags = models.CharField(max_length=64, blank=True, null=True)
    subset = models.CharField(max_length=64, blank=True, null=True)
    check = models.BooleanField()


class Task(models.Model):
    runner = models.ForeignKey(Runner)
    name = models.CharField(max_length=128)
    module = models.CharField(max_length=64, blank=True, null=True)


class Result(models.Model):
    task = models.ForeignKey(Task)
    host = models.CharField(max_length=64)
    status = models.CharField(max_length=32)
    message = models.CharField(max_length=32768, blank=True)
    response = models.CharField(max_length=65536, blank=True)


