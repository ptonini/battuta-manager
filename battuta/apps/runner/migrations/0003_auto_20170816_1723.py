# -*- coding: utf-8 -*-
# Generated by Django 1.11 on 2017-08-16 17:23
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('runner', '0002_play_message'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='job',
            options={'permissions': (('execute_jobs', 'Can execute jobs'),)},
        ),
    ]
