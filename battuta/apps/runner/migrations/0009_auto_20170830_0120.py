# -*- coding: utf-8 -*-
# Generated by Django 1.11 on 2017-08-30 01:20
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('runner', '0008_auto_20170830_0114'),
    ]

    operations = [
        migrations.AlterField(
            model_name='playbookargs',
            name='folder',
            field=models.CharField(blank=True, default=b'', max_length=256),
        ),
    ]
