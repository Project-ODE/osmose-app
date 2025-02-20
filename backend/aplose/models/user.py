"""User-related models"""
from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class ExpertiseLevel(models.TextChoices):
    """Expertise level of the user. Multiple choices are offered : expert, average, novice."""

    EXPERT = ("E", "Expert")
    AVERAGE = ("A", "Average")
    NOVICE = ("N", "Novice")


class Datawork(models.Model):
    """Datawork model"""

    name = models.CharField(unique=True, max_length=100)
    folder_name = models.CharField(unique=True, max_length=100)


class AploseUser(models.Model):
    """Override of default Django User model"""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="aplose")

    expertise_level = models.TextField(
        choices=ExpertiseLevel.choices,
        blank=True,
        null=True,
        default=ExpertiseLevel.NOVICE,
        help_text="Expertise level of the user.",
    )

    allowed_datawork = models.ManyToManyField(Datawork, related_name="allowed_users")
