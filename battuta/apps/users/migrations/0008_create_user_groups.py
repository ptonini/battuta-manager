# -*- coding: utf-8 -*-
# Generated by Django 1.11 on 2017-08-28 16:15
from __future__ import unicode_literals

from django.db import migrations
from django.contrib.auth.management import create_permissions


def add_user_groups(apps, schema_editor):

    groups = {
        'Inventory Admins': [
            'edit_hosts',
            'edit_groups',
        ],
        'Runner Admins': [
            'edit_playbooks',
            'edit_tasks',
            'edit_roles',
            'execute_jobs',
            'view_job_history',
        ],
        'Users Admins': [
            'edit_users',
            'edit_user_groups',
            'edit_user_files',
        ],
        'File Admins': [
            'edit_files',
        ],
        'Preferences Admins': [
            'edit_preferences'
        ],
        'System Admins': [
            'edit_hosts',
            'edit_groups',
            'edit_playbooks',
            'edit_tasks',
            'edit_roles',
            'execute_jobs',
            'view_job_history',
            'edit_users',
            'edit_user_groups',
            'edit_user_files',
            'edit_files',
            'edit_preferences'
        ]

    }

    group_class = apps.get_model('auth', 'Group')

    groupdata_class = apps.get_model('users', 'GroupData')

    permission_class = apps.get_model('auth', 'Permission')

    for app_config in apps.get_app_configs():
        app_config.models_module = True
        create_permissions(app_config, apps=apps, verbosity=0)
        app_config.models_module = None

    for group_name in groups:

        group, created = group_class.objects.get_or_create(name=group_name)

        groupdata, created = groupdata_class.objects.get_or_create(group=group)

        groupdata.editable = False

        groupdata.save()

        for permission in groups[group_name]:

            perm = permission_class.objects.get(codename=permission)

            group.permissions.add(perm)


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0007_create_admin_user'),
    ]

    operations = [
        migrations.RunPython(add_user_groups)
    ]