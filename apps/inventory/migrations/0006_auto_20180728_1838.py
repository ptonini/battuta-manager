# -*- coding: utf-8 -*-
# Generated by Django 1.11 on 2018-07-28 18:38
from __future__ import unicode_literals

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0005_auto_20170901_2319'),
    ]

    operations = [
        migrations.AlterField(
            model_name='variable',
            name='key',
            field=models.CharField(max_length=128, validators=[django.core.validators.RegexValidator(inverse_match=True, message=b'Key names cannot contain "-"', regex=b'\\-')]),
        ),
    ]