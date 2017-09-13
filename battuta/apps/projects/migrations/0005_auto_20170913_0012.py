# -*- coding: utf-8 -*-
# Generated by Django 1.11 on 2017-09-13 00:12
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('auth', '0008_alter_user_username_max_length'),
        ('projects', '0004_auto_20170906_1738'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='project',
            name='inventory_admins',
        ),
        migrations.AddField(
            model_name='project',
            name='can_edit_variable',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='can_edit_variable', to='auth.Group'),
        ),
    ]
