# -*- coding: utf-8 -*-
# Generated by Django 1.11 on 2017-09-13 00:56
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('auth', '0008_alter_user_username_max_length'),
        ('projects', '0005_auto_20170913_0012'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='project',
            name='can_edit_variable',
        ),
        migrations.RemoveField(
            model_name='project',
            name='runner_admins',
        ),
        migrations.AddField(
            model_name='project',
            name='can_edit_variables',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='can_edit_variables', to='auth.Group'),
        ),
        migrations.AddField(
            model_name='project',
            name='can_run_tasks',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='can_run_tasks', to='auth.Group'),
        ),
    ]
