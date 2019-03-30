from django.db import migrations
from django.contrib.auth.hashers import make_password
from django.contrib.auth.management import create_permissions


def add_admin_user(*args):

    users = [
        {'name': 'admin', 'super': True, 'timezone': 'America/Sao_Paulo'},
    ]

    user_class = args[0].get_model('iam', 'LocalUser')

    credential_class = args[0].get_model('iam', 'Credential')

    for user_dict in users:

        user, created = user_class.objects.get_or_create(
            username=user_dict['name'],
            is_superuser=user_dict['super'],
            timezone=user_dict['timezone']
        )

        cred, created = credential_class.objects.get_or_create(title='Default', username=user_dict['name'], user=user)

        user.password = make_password(user_dict['name'])

        user.default_cred = cred

        user.save()


def add_user_groups(*args):

    groups = {
        'InventoryManager Admins': ['edit_hosts', 'edit_groups'],
        'Runner Admins': ['edit_playbooks', 'edit_tasks', 'edit_roles', 'execute_jobs', 'view_job_history'],
        'User Admins': ['edit_users', 'edit_user_groups', 'edit_user_files', 'edit_permissions'],
        'File Admins': ['edit_files'],
        'Preferences Admins': ['edit_preferences'],
        'Project Admins': ['edit_projects', 'edit_users', 'edit_user_groups'],
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
            'edit_preferences',
            'edit_projects',
            'edit_permissions'
        ]
    }

    group_class = args[0].get_model('iam', 'LocalGroup')

    permission_class = args[0].get_model('auth', 'Permission')

    for app_config in args[0].get_app_configs():
        app_config.models_module = True
        create_permissions(app_config, apps=args[0], verbosity=0)
        app_config.models_module = None

    for group_name in groups:

        group, created = group_class.objects.get_or_create(name=group_name)

        for permission in groups[group_name]:

            perm = permission_class.objects.get(codename=permission)

            group.permissions.add(perm)


class Migration(migrations.Migration):

    dependencies = [
        ('iam', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(add_admin_user),
        migrations.RunPython(add_user_groups)
    ]
