from django.db import models
from django.core.validators import RegexValidator


class Host(models.Model):

    name = models.CharField(max_length=64, blank=False, unique=True)

    description = models.TextField(max_length=256, blank=True)

    facts = models.TextField(max_length=65353, default='{}')

    type = 'host'

    relations = ['parents']

    def __str__(self):

        return self.name


class Group(models.Model):

    name = models.CharField(max_length=64, blank=False, unique=True)

    description = models.TextField(max_length=256, blank=True)

    children = models.ManyToManyField('self', blank=True, symmetrical=False)

    members = models.ManyToManyField('Host', blank=True)

    type = 'group'

    relations = ['parents', 'children', 'members']

    def __str__(self):

        return self.name


class Variable(models.Model):

    key = models.CharField(max_length=32, blank=False, validators=[
        RegexValidator(regex='\-', message='Key names cannot contain "-"', inverse_match=True)
    ])

    value = models.CharField(max_length=1024)

    host = models.ForeignKey('Host', blank=True, null=True)

    group = models.ForeignKey('Group', blank=True, null=True)

    class Meta:

        unique_together = (('key', 'host'), ('key', 'group'))

    def __str__(self):

        return self.key
