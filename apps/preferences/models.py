from django.db import models


class Item(models.Model):

    name = models.CharField(max_length=64, blank=False, unique=True)

    value = models.CharField(max_length=64, blank=True, null=False)

    def __str__(self):

        return self.name





