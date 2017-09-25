# -*- coding: utf-8 -*-
# Generated by Django 1.11 on 2017-09-13 01:42
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('auth', '0008_alter_user_username_max_length'),
        ('projects', '0006_auto_20170913_0056'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='project',
            name='execute_jobs',
        ),
        migrations.AddField(
            model_name='project',
            name='can_edit_playbooks',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='can_edit_playbooks', to='auth.Group'),
        ),
        migrations.AddField(
            model_name='project',
            name='can_edit_roles',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='can_edit_roles', to='auth.Group'),
        ),
        migrations.AddField(
            model_name='project',
            name='can_edit_tasks',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='can_edit_tasks', to='auth.Group'),
        ),
        migrations.AddField(
            model_name='project',
            name='can_run_playbooks',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='can_run_playbooks', to='auth.Group'),
        ),
    ]