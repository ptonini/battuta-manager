# Generated by Django 2.1 on 2019-03-03 02:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('runner', '0007_auto_20190301_1703'),
    ]

    operations = [
        migrations.AlterField(
            model_name='adhoctask',
            name='hosts',
            field=models.CharField(max_length=64),
        ),
    ]