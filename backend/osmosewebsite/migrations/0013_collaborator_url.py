# Generated by Django 3.2.23 on 2023-12-06 12:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("osmosewebsite", "0012_project_collaborators"),
    ]

    operations = [
        migrations.AddField(
            model_name="collaborator",
            name="url",
            field=models.URLField(blank=True, null=True),
        ),
    ]
