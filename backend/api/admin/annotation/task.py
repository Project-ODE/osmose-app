"""Admin classes for annotation task"""
from django.contrib import admin

from backend.api.models import AnnotationTask, AnnotationFileRange


@admin.register(AnnotationFileRange)
class AnnotationFileRangeAdmin(admin.ModelAdmin):
    """AnnotationFileRange Admin"""

    list_display = (
        "first_file_index",
        "last_file_index",
        "annotator",
        "annotation_campaign",
        "files_count",
    )
    search_fields = (
        "annotation_campaign__name",
        "annotator__username",
        "annotator__first_name",
        "annotator__last_name",
    )
    list_filter = ("annotation_campaign", "annotator")


@admin.register(AnnotationTask)
class AnnotationTaskAdmin(admin.ModelAdmin):
    """AnnotationTask presentation in DjangoAdmin"""

    list_display = (
        "status",
        "annotation_campaign",
        "dataset_file",
        "annotator",
    )
    search_fields = ("dataset_file__filename",)
    list_filter = ("status", "annotation_campaign", "annotator")
