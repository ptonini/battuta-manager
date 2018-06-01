# -*- coding: utf-8 -*-
# Generated by Django 1.11 on 2018-05-15 01:21
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('runner', '0009_auto_20170830_0120'),
    ]

    operations = [
        migrations.RenameField(
            model_name='playbookargs',
            old_name='playbook',
            new_name='name',
        ),
        migrations.AlterUniqueTogether(
            name='playbookargs',
            unique_together=set([('name', 'tags', 'subset', 'skip_tags', 'extra_vars')]),
        ),
    ]
