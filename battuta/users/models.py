from django.db import models
from django.contrib.auth.models import User


class UserData(models.Model):
    user = models.OneToOneField(User, primary_key=True)
    timezone = models.CharField(max_length=32)
    ansible_username = models.CharField(max_length=32)
    rsa_key = models.TextField(max_length=2048, blank=True)

    def __str__(self):
        return self.user.username
