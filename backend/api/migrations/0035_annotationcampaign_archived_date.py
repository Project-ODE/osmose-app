# Generated by Django 3.2.23 on 2024-04-04 15:35

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0034_alter_annotationresult_dataset_file'),
    ]

    operations = [
        migrations.AddField(
            model_name='annotationcampaign',
            name='archived_date',
            field=models.DateField(blank=True, null=True),
        ),
    ]
