# -*- coding: utf-8 -*-
# Generated by Django 1.11 on 2017-08-30 14:33
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0008_alter_user_username_max_length'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('inventory', '0004_auto_20170817_1455'),
    ]

    operations = [
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=64, unique=True)),
                ('description', models.TextField(blank=True, max_length=256)),
                ('roles', models.TextField(default=b'[]', max_length=1024)),
                ('execute_jobs', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='execute_jobs', to='auth.Group')),
                ('host_group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='inventory.Group')),
                ('inventory_admins', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='inventory_admins', to='auth.Group')),
                ('manager', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('runner_admins', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='runner_admins', to='auth.Group')),
            ],
        ),
    ]