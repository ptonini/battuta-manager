# -*- coding: utf-8 -*-
# Generated by Django 1.11 on 2017-08-16 14:38
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0002_create_group_all'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='group',
            options={'permissions': (('edit_groups', 'Can create and edit groups'),)},
        ),
        migrations.AlterModelOptions(
            name='host',
            options={'permissions': (('edit_hosts', 'Can create and edit hosts'),)},
        ),
    ]
