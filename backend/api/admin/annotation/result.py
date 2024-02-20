"""Detector model"""
from django.contrib import admin


class AnnotationResultAdmin(admin.ModelAdmin):
    """AnnotationResult presentation in DjangoAdmin"""

    list_display = (
        "id",
        "start_time",
        "end_time",
        "start_frequency",
        "end_frequency",
        "annotation_tag",
        "confidence_indicator",
        "annotation_campaign",
        "dataset_file",
        "annotator",
        "detector_configuration",
    )
    search_fields = (
        "annotation_tag__name",
        "confidence_indicator__label",
        "annotator__username",
        "annotator__first_name",
        "annotator__last_name",
        "detector_configuration__detector__name",
    )
    list_filter = (
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
        return result_validation.result.annotation_campaign

    @admin.display(description="Detector")
    def get_detector(self, result_validation):
        conf = result_validation.result.detector_configuration
        if conf is None:
            return None
        return conf.detector
