# Generated by Django 3.2.25 on 2025-02-19 09:47

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0071_merge_20250218_1502"),
    ]

    operations = [
        migrations.AddField(
            model_name="annotationresult",
            name="annotator_expertise_level",
            field=models.TextField(
                blank=True,
                choices=[("E", "Expert"), ("A", "Average"), ("N", "Novice")],
                help_text="Expertise level of the annotator.",
                null=True,
            ),
        ),
        migrations.RunSQL(
            """
                UPDATE annotation_results r
                SET annotator_expertise_level=u.expertise_level
                FROM aplose_aploseuser u
                WHERE r.annotator_id = u.user_id;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
