# -*- coding: utf-8 -*-
# Generated by Django 1.11 on 2017-08-28 15:09
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_auto_20170818_1916'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='groupdata',
            options={
                'permissions': (
                    ('edit_groups', 'Can create and edit groups'),
                    ('edit_hosts', 'Can create and edit hosts'),
                    ('edit_playbooks', 'Can edit playbooks'),
                    ('edit_tasks', 'Can edit tasks'),
                    ('edit_roles', 'Can edit roles'),
                    ('execute_jobs', 'Can execute jobs'),
                    ('view_job_history', 'Can view job history'),
                    ('edit_files', 'Can create and edit files'),
                    ('edit_users', 'Can create and edit users'),
                    ('edit_user_groups', 'Can create and edit user groups'),
                    ('edit_user_files', 'Can create and edit user files'),
                    ('edit_preferences', 'Can edit preferences'))
            },
        ),
    ]