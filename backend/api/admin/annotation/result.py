"""Detector model"""
from typing import Optional

from django.contrib import admin

from backend.api.models import AnnotationResultAcousticFeatures, SignalTrend


class AnnotationResultAdmin(admin.ModelAdmin):
    """AnnotationResult presentation in DjangoAdmin"""

    list_display = (
        "id",
        "type",
        "start_time",
        "end_time",
        "start_frequency",
        "end_frequency",
        "label",
        "confidence_indicator",
        "annotation_campaign",
        "dataset_file",
        "annotator",
        "detector_configuration",
    )
    search_fields = (
        "dataset_file__filename",
        "label__name",
        "confidence_indicator__label",
        "annotator__username",
        "annotator__first_name",
        "annotator__last_name",
        "detector_configuration__detector__name",
    )
    list_filter = (
        "type",
        "annotation_campaign",
        "annotator",
    )


class AnnotationResultValidationAdmin(admin.ModelAdmin):
    """AnnotationResultValidation presentation in DjangoAdmin"""

    list_display = (
        "id",
        "is_valid",
        "annotator",
        "result",
        "get_campaign",
        "get_detector",
    )
    search_fields = (
        "annotator__username",
        "annotator__first_name",
        "annotator__last_name",
        "result__annotation_campaign__name",
        "result__detector_configuration__detector__name",
    )
    list_filter = ("is_valid",)

    @admin.display(description="Campaign")
    def get_campaign(self, result_validation):
        """Get campaign for given result validation"""
        return result_validation.result.annotation_campaign

    @admin.display(description="Detector")
    def get_detector(self, result_validation):
        """Get detector for given result validation"""
        conf = result_validation.result.detector_configuration
        if conf is None:
            return None
        return conf.detector


@admin.register(AnnotationResultAcousticFeatures)
class AnnotationResultAcousticFeaturesAdmin(admin.ModelAdmin):
    """Admin management of AnnotationResultAcousticFeatures"""

    list_display = (
        "id",
        "start_frequency",
        "end_frequency",
        "relative_min_frequency_count",
        "relative_max_frequency_count",
        "has_harmonics",
        "trend",
        "steps_count",
    )
    search_fields = ("annotation_result__annotation_campaign__name",)

    @admin.display(description="Trend")
    def get_trend(self, obj: AnnotationResultAcousticFeatures) -> Optional[str]:
        """Display expertise level"""
        if obj.trend:
            return SignalTrend(obj.trend).label
        return None
