from django.db import models
from django.contrib.auth.models import User


class AdHoc(models.Model):
    pattern = models.CharField(max_length=64)
    module = models.CharField(max_length=32)
    arguments = models.TextField(max_length=256, blank=True)
    sudo = models.BooleanField()


class Task(models.Model):
    created_on = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(User)
    pattern = models.CharField(max_length=64)
    module = models.CharField(max_length=32)
    job_id = models.CharField(max_length=128)
    status = models.CharField(max_length=32)


class TaskResult(models.Model):
    task = models.ForeignKey(Task)
    host = models.CharField(max_length=64)
    status = models.CharField(max_length=32)
    message = models.CharField(max_length=32768, blank=True)
    response = models.CharField(max_length=65536, blank=True)


