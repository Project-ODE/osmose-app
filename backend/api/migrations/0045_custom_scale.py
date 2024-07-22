# Generated by Django 3.2.25 on 2024-07-02 13:23

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0044_alter_annotationcampaign_options"),
    ]

    operations = [
        migrations.CreateModel(
            name="LinearScale",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(blank=True, max_length=255, null=True)),
                ("ratio", models.FloatField(default=1)),
                ("min_value", models.FloatField()),
                ("max_value", models.FloatField()),
            ],
        ),
        migrations.CreateModel(
            name="MultiLinearScale",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(blank=True, max_length=255, null=True)),
                ("inner_scales", models.ManyToManyField(to="api.LinearScale")),
            ],
        ),
        migrations.RenameModel(
            old_name="SpectroConfig", new_name="SpectrogramConfiguration"
        ),
        migrations.AlterModelTable(
            name="windowtype",
            table=None,
        ),
        migrations.AddField(
            model_name="spectrogramconfiguration",
            name="linear_frequency_scale",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="api.linearscale",
            ),
        ),
        migrations.AddField(
            model_name="spectrogramconfiguration",
            name="multi_linear_frequency_scale",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="api.multilinearscale",
            ),
        ),
        migrations.AlterField(
            model_name="annotationcampaign",
            name="spectro_configs",
            field=models.ManyToManyField(
                related_name="annotation_campaigns", to="api.SpectrogramConfiguration"
            ),
        ),
        migrations.AddConstraint(
            model_name="spectrogramconfiguration",
            constraint=models.UniqueConstraint(
                fields=("name", "dataset_id"),
                name="api_spectrogramconfiguration_name_dataset_unicity_constraint",
            ),
        ),
        migrations.RemoveConstraint(
            model_name="spectrogramconfiguration",
            name="api_spectroconfig_name_dataset_unicity_constraint",
        ),
        migrations.AddConstraint(
            model_name="spectrogramconfiguration",
            constraint=models.CheckConstraint(
                check=models.Q(
                    models.Q(
                        ("linear_frequency_scale__isnull", True),
                        ("multi_linear_frequency_scale__isnull", False),
                    ),
                    models.Q(
                        ("linear_frequency_scale__isnull", False),
                        ("multi_linear_frequency_scale__isnull", True),
                    ),
                    models.Q(
                        ("linear_frequency_scale__isnull", True),
                        ("multi_linear_frequency_scale__isnull", True),
                    ),
                    _connector="OR",
                ),
                name="spectrogramconfiguration_max_one_scale",
            ),
        ),
    ]
