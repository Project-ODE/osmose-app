# Generated by Django 3.2.23 on 2024-07-25 09:50

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("osmosewebsite", "0028_auto_20240725_1139"),
    ]

    operations = [
        migrations.RenameField(
            model_name="trap",
            old_name="firstname_presenter",
            new_name="presenter_firstname",
        ),
        migrations.RenameField(
            model_name="trap",
            old_name="lastname_presenter",
            new_name="presenter_lastname",
        ),
        migrations.RenameField(
            model_name="trap",
            old_name="linkedin_url_presenter",
            new_name="presenter_linkedin_url",
        ),
    ]
