# Generated by Django 3.2 on 2021-11-17 12:45

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0006_switch_dataset_spectro_ownership"),
    ]

    operations = [
        migrations.AlterField(
            model_name="annotationcampaign",
            name="desc",
            field=models.TextField(null=True),
        ),
        migrations.AlterField(
            model_name="annotationcampaign",
            name="end",
            field=models.DateTimeField(null=True),
        ),
        migrations.AlterField(
            model_name="annotationcampaign",
            name="instructions_url",
            field=models.TextField(null=True),
        ),
        migrations.AlterField(
            model_name="annotationcampaign",
            name="start",
            field=models.DateTimeField(null=True),
        ),
    ]
