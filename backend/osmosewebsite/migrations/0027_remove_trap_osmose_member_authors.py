# Generated by Django 3.2.23 on 2024-07-24 15:28

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('osmosewebsite', '0026_alter_trap_lastname'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='trap',
            name='osmose_member_authors',
        ),
    ]
