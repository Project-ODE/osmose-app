"""Results model"""
from typing import Optional

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from backend.aplose.models import User, AploseUser
from backend.aplose.models.user import ExpertiseLevel
from .campaign import AnnotationCampaign
from .confidence import ConfidenceIndicator
from .detector import DetectorConfiguration
from .label import Label
from ..datasets import DatasetFile


class SignalTrend(models.TextChoices):
    """General trend of a call"""

    FLAT = ("FLAT", "Flat")
    ASCENDING = ("ASC", "Ascending")
    DESCENDING = ("DESC", "Descending")
    MODULATED = ("MOD", "Modulated")


class AnnotationResultAcousticFeatures(models.Model):
    """Precise signal properties to annotate on the signal of interest"""

    start_frequency = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="[Hz] Frequency at the beginning of the signal",
    )
    end_frequency = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="[Hz] Frequency at the end of the signal",
    )

    relative_max_frequency_count = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Number of relative maximum frequency in the signal",
    )
    relative_min_frequency_count = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Number of relative minimum frequency in the signal",
    )

    has_harmonics = models.BooleanField(
        null=True, blank=True, help_text="If the signal has harmonics"
    )
    trend = models.CharField(
        choices=SignalTrend.choices, null=True, blank=True, max_length=10
    )
    steps_count = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Number of steps (flat segment) in the signal",
    )


class AnnotationResult(models.Model):
    """
    This table contains the resulting label associations for specific annotation_tasks
    """

    class Meta:
        db_table = "annotation_results"
        constraints = [
            models.CheckConstraint(
                name="require_user_or_detector",
                check=(
                    models.Q(
                        annotator__isnull=True, detector_configuration__isnull=False
                    )
                    | models.Q(
                        annotator__isnull=False, detector_configuration__isnull=True
                    )
                ),
            )
        ]

    start_time = models.FloatField(null=True, blank=True)
    end_time = models.FloatField(null=True, blank=True)
    start_frequency = models.FloatField(null=True, blank=True)
    end_frequency = models.FloatField(null=True, blank=True)

    label = models.ForeignKey(Label, on_delete=models.CASCADE)
    confidence_indicator = models.ForeignKey(
        ConfidenceIndicator, on_delete=models.SET_NULL, null=True, blank=True
    )
    annotation_campaign = models.ForeignKey(
        AnnotationCampaign,
        on_delete=models.CASCADE,
        related_name="results",
    )
    annotator = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="annotation_results",
        null=True,
        blank=True,
    )
    annotator_expertise_level = models.TextField(
        choices=ExpertiseLevel.choices,
        blank=True,
        null=True,
        help_text="Expertise level of the annotator.",
    )

    dataset_file = models.ForeignKey(
        "DatasetFile",
        on_delete=models.CASCADE,
        related_name="annotation_results",
        null=True,
        blank=True,
    )
    detector_configuration = models.ForeignKey(
        DetectorConfiguration,
        on_delete=models.CASCADE,
        related_name="annotation_results",
        null=True,
        blank=True,
    )
    acoustic_features = models.OneToOneField(
        AnnotationResultAcousticFeatures,
        on_delete=models.SET_NULL,
        related_name="annotation_result",
        blank=True,
        null=True,
        help_text="Acoustic features add a better description to the signal",
    )

    def save(self, *args, **kwargs):
        if self.annotator:
            aplose_user: Optional[AploseUser] = AploseUser.objects.filter(
                user_id=self.annotator.id, expertise_level__isnull=False
            ).first()
            if aplose_user is not None:
                self.annotator_expertise_level = aplose_user.expertise_level
            else:
                self.annotator_expertise_level = None
        else:
            self.annotator_expertise_level = None
        super().save(*args, **kwargs)


class AnnotationResultValidation(models.Model):
    """
    This table contains the resulting label associations for specific annotation_tasks
    """

    is_valid = models.BooleanField(null=True, blank=True)
    annotator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="annotation_results_validation",
    )
    result = models.ForeignKey(
        AnnotationResult, on_delete=models.CASCADE, related_name="validations"
    )


class AnnotationComment(models.Model):
    """
    This table contains comment of annotation result and task.
    """

    class Meta:
        db_table = "annotation_comment"

    comment = models.CharField(max_length=255)
    annotation_result = models.ForeignKey(
        AnnotationResult,
        on_delete=models.CASCADE,
        related_name="comments",
        null=True,
        blank=True,
        default=None,
    )
    annotation_campaign = models.ForeignKey(
        AnnotationCampaign, on_delete=models.CASCADE, related_name="comments"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="comments"
    )
    dataset_file = models.ForeignKey(
        DatasetFile, on_delete=models.CASCADE, related_name="comments"
    )
