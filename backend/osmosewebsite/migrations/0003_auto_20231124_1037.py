# Generated by Django 3.2.23 on 2023-11-24 09:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('osmosewebsite', '0002_auto_20231124_1025'),
    ]

    operations = [
        migrations.AlterField(
            model_name='teammember',
            name='githubURL',
            field=models.URLField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='teammember',
            name='linkedinURL',
            field=models.URLField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='teammember',
            name='personalWebsiteURL',
            field=models.URLField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='teammember',
            name='researchGateURL',
            field=models.URLField(blank=True, null=True),
        ),
    ]
