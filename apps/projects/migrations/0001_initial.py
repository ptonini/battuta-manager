# Generated by Django 2.1 on 2018-11-25 13:57

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('inventory', '0007_auto_20181102_0303'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('iam', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=64, unique=True)),
                ('description', models.TextField(blank=True, max_length=256)),
                ('playbooks', models.TextField(default='[]', max_length=65536)),
                ('roles', models.TextField(default='[]', max_length=65536)),
                ('can_edit_playbooks', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='can_edit_playbooks', to='iam.LocalGroup')),
                ('can_edit_roles', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='can_edit_roles', to='iam.LocalGroup')),
                ('can_edit_tasks', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='can_edit_tasks', to='iam.LocalGroup')),
                ('can_edit_variables', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='can_edit_variables', to='iam.LocalGroup')),
                ('can_run_playbooks', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='can_run_playbooks', to='iam.LocalGroup')),
                ('can_run_tasks', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='can_run_tasks', to='iam.LocalGroup')),
                ('host_group', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='inventory.Group')),
                ('manager', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
