# Generated by Django 3.2.25 on 2024-10-01 11:51

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("api", "0051_dataset_file_start_end"),
    ]

    operations = [
        migrations.AlterField(
            model_name="datasetfile",
            name="end",
            field=models.DateTimeField(),
        ),
        migrations.AlterField(
            model_name="datasetfile",
            name="start",
            field=models.DateTimeField(),
        ),
        migrations.RemoveField(
            model_name="datasetfile",
            name="audio_metadatum",
        ),
    ]
