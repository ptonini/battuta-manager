from django.db import models
from django.contrib.auth.models import User


class Credential(models.Model):
    user = models.ForeignKey(User)
    title = models.CharField(max_length=32)
    is_shared = models.BooleanField(default=False)
    username = models.CharField(max_length=32)
    password = models.CharField(max_length=64, blank=True)
    rsa_key = models.CharField(max_length=128, blank=True)
    sudo_user = models.CharField(max_length=32, blank=True)
    sudo_pass = models.CharField(max_length=64, blank=True)
    ask_sudo_pass = models.BooleanField(default=True)
    is_default = False

    def __str__(self):
        return self.user.username + '_' + self.title

    class Meta:
        unique_together = ('user', 'title')


class UserData(models.Model):
    user = models.OneToOneField(User, primary_key=True)
    timezone = models.CharField(max_length=64)
    default_cred = models.ForeignKey(Credential, blank=True, null=True)

    def __str__(self):
        return self.user
