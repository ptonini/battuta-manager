from django.db import models


# Create your models here.

class ItemGroup(models.Model):
    name = models.CharField(max_length=64, blank=False, unique=True)
    description = models.CharField(max_length=256, blank=True)


class Item(models.Model):
    DATA_TYPES = (
        ('str', 'String'),
        ('number', 'Number'),
        ('bool', 'Boolean')
    )
    name = models.CharField(max_length=64, blank=False, unique=True)
    description = models.CharField(max_length=256, blank=True)
    value = models.CharField(max_length=64, blank=True, null=True)
    data_type = models.CharField(max_length=8, choices=DATA_TYPES, default='str')
    item_group = models.ForeignKey(ItemGroup)

    def __str__(self):
        return self.name



