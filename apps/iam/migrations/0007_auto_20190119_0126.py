# Generated by Django 2.1 on 2019-01-19 01:26

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('iam', '0006_merge_20190109_0015'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='localgroup',
            options={'ordering': ['name'], 'permissions': (('edit_groups', 'Can create and edit groups'), ('edit_hosts', 'Can create and edit hosts'), ('edit_tasks', 'Can edit tasks'), ('execute_jobs', 'Can execute jobs'), ('view_job_history', 'Can view job history'), ('edit_files', 'Can create and edit files'), ('edit_playbooks', 'Can edit playbooks'), ('edit_roles', 'Can edit roles'), ('edit_users', 'Can create and edit users'), ('edit_user_groups', 'Can create and edit user groups'), ('edit_user_files', 'Can create and edit user files'), ('edit_permissions', 'Can edit user group permissions'), ('edit_preferences', 'Can edit preferences'), ('edit_projects', 'Can edit projects'))},
        ),
    ]