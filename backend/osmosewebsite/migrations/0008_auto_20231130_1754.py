# Generated by Django 3.2.23 on 2023-11-30 16:54

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('osmosewebsite', '0007_news'),
    ]

    operations = [
        migrations.AddField(
            model_name='news',
            name='osmose_member_authors',
            field=models.ManyToManyField(blank=True, null=True, to='osmosewebsite.TeamMember'),
        ),
        migrations.AddField(
            model_name='news',
            name='other_authors',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(blank=True, max_length=255), blank=True, null=True, size=None),
        ),
    ]
