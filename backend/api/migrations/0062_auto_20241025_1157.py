# Generated by Django 3.2.25 on 2024-10-25 09:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0061_auto_20241016_1458"),
    ]

    operations = [
        migrations.AlterField(
            model_name="annotationcampaign",
            name="annotation_scope",
            field=models.IntegerField(
                choices=[(1, "Rectangle"), (2, "Whole")], default=2
            ),
        ),
        migrations.AlterField(
            model_name="annotationcampaign",
            name="deadline",
            field=models.DateField(blank=True, null=True),
        ),
    ]
