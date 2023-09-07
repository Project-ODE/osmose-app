# Generated by Django 3.2.16 on 2023-09-05 13:39

from math import log

from django.db import migrations

# See https://docs.djangoproject.com/en/3.2/topics/migrations/#data-migrations
def change_zoom_level(apps, schema_editor):
    SpectroConfig = apps.get_model("api", "SpectroConfig")
    for spectro in SpectroConfig.objects.all():
        spectro.zoom_level = int(log(spectro.zoom_level, 2))
        spectro.save()


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0020_alter_annotationtask_status"),
    ]

    operations = [migrations.RunPython(change_zoom_level)]
