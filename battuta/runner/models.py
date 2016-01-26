from django.db import models
from django.contrib.auth.models import User


class AdHoc(models.Model):
    pattern = models.CharField(max_length=64)
    module = models.CharField(max_length=32)
    arguments = models.TextField(max_length=1024, blank=True)
    sudo = models.BooleanField()


class Runner(models.Model):
    user = models.ForeignKey(User)
    created_on = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=128)
    pattern = models.CharField(max_length=64)
    sudo = models.BooleanField()
    job_id = models.CharField(max_length=128)
    status = models.CharField(max_length=32)
    message = models.CharField(max_length=1024, blank=True, null=True)


class Task(models.Model):
    runner = models.ForeignKey(Runner)
    name = models.CharField(max_length=128)


class Result(models.Model):
    task = models.ForeignKey(Task)
    host = models.CharField(max_length=64)
    status = models.CharField(max_length=32)
    changed = models.BooleanField()
    message = models.CharField(max_length=32768, blank=True)
    response = models.CharField(max_length=65536, blank=True)


