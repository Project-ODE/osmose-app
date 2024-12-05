# Generated by Django 3.2.25 on 2024-10-01 14:33

from django.db import migrations, models
import django.db.models.deletion

from backend.api.models import AudioMetadatum


def clean_audio_metadata(apps, schema_editor):
    audio_metadatum: AudioMetadatum = apps.get_model("api", "AudioMetadatum")
    audio_metadatum.objects.filter(dataset__isnull=True).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0052_dataset_file_start_end_finalise"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="annotationtask",
            options={"ordering": ["dataset_file__start", "id"]},
        ),
        migrations.AlterField(
            model_name="dataset",
            name="audio_metadatum",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="api.audiometadatum",
            ),
        ),
        migrations.RunPython(
            clean_audio_metadata, reverse_code=migrations.RunPython.noop
        ),
    ]
