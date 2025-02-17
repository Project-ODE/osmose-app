"""Annotation task related models"""

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import QuerySet, Q

from ..datasets import DatasetFile


class AnnotationTask(models.Model):
    """
    This table represents the need to annotate a specific dataset_file by a specific user in the course of an annotation
    campaign and is linked to by the resulting annotation results.
    """

    class Status(models.TextChoices):
        """Status of the annotation task. Multiple choices are offered : created, started, finished."""

        CREATED = ("C", "Created")
        STARTED = ("S", "Started")
        FINISHED = ("F", "Finished")

    class Meta:
        ordering = ["dataset_file__start", "id"]
        unique_together = (("dataset_file", "annotation_campaign", "annotator"),)

    status = models.TextField(choices=Status.choices, default=Status.CREATED)

    annotation_campaign = models.ForeignKey(
        "AnnotationCampaign", on_delete=models.CASCADE, related_name="tasks"
    )
    annotator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="annotation_tasks",
    )
    dataset_file = models.ForeignKey(
        "DatasetFile", on_delete=models.CASCADE, related_name="annotation_tasks"
    )


class AnnotationFileRange(models.Model):
    """Gives a range of files to annotate by an annotator within a campaign"""

    class Meta:
        ordering = ["first_file_index"]
        # TODO: find a way to get this constraints back without crash the serializer
        #  unique_together = (
        #      (
        #          "first_file_index",
        #          "last_file_index",
        #          "annotation_campaign",
        #          "annotator",
        #      ),
        #  )

    first_file_index = models.PositiveIntegerField(validators=[MinValueValidator(0)])
    last_file_index = models.PositiveIntegerField(validators=[MinValueValidator(0)])
    first_file_id = models.PositiveIntegerField(validators=[MinValueValidator(0)])
    last_file_id = models.PositiveIntegerField(validators=[MinValueValidator(0)])
    files_count = models.PositiveIntegerField()
    annotator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="annotation_file_ranges",
    )
    annotation_campaign = models.ForeignKey(
        "AnnotationCampaign",
        on_delete=models.CASCADE,
        related_name="annotation_file_ranges",
    )

    def save(self, *args, **kwargs):
        self.files_count = self.last_file_index - self.first_file_index + 1
        files = DatasetFile.objects.filter(
            dataset_id__in=self.annotation_campaign.datasets.values_list(
                "id", flat=True
            )
        )
        self.first_file_id = files[self.first_file_index].id
        self.last_file_id = files[self.last_file_index].id
        super().save(*args, **kwargs)

    def get_files(self) -> QuerySet[DatasetFile]:
        """Get corresponding dataset files"""
        # pylint: disable=no-member
        return DatasetFile.objects.filter(
            dataset__in=self.annotation_campaign.datasets.values_list("id", flat=True),
            id__gte=self.first_file_id,
            id__lte=self.last_file_id,
        )

    def get_finished_tasks(self) -> QuerySet[AnnotationTask]:
        """Finished tasks within this file range"""
        dataset_files_id = self.get_files().values_list("id", flat=True)
        return AnnotationTask.objects.filter(
            annotator_id=self.annotator_id,
            annotation_campaign_id=self.annotation_campaign_id,
            dataset_file_id__in=dataset_files_id,
            status=AnnotationTask.Status.FINISHED,
        )

    @staticmethod
    def get_connected_ranges(data):
        """Recover connected ranges"""
        return (
            AnnotationFileRange.objects.filter(
                annotator_id=data.annotator,
                annotation_campaign_id=data.annotation_campaign,
            )
            .exclude(id=data.id)
            .filter(
                # get bigger
                Q(
                    first_file_index__lte=data.first_file_index,
                    last_file_index__gte=data.last_file_index,
                )
                # get littler
                | Q(
                    first_file_index__gte=data.first_file_index,
                    last_file_index__lte=data.last_file_index,
                )
                # get mixted
                | Q(
                    first_file_index__lte=data.first_file_index,
                    last_file_index__gte=data.first_file_index,
                    last_file_index__lte=data.last_file_index,
                )
                | Q(
                    first_file_index__gte=data.first_file_index,
                    first_file_index__lte=data.last_file_index,
                    last_file_index__gte=data.last_file_index,
                )
                # get siblings
                | Q(first_file_index=data.last_file_index + 1)
                | Q(last_file_index=data.first_file_index - 1)
            )
        )

    @staticmethod
    def clean_connected_ranges(data: list[dict]):
        """Clean connected ranges to limit the number of different items"""
        ids = [file_range["id"] for file_range in data]
        return_ids = []
        for range_id in ids:
            queryset = AnnotationFileRange.objects.filter(id=range_id)
            if not queryset.exists():
                continue
            item = queryset.first()
            connected_ranges = AnnotationFileRange.get_connected_ranges(item)
            if connected_ranges.exists():
                # update connected
                min_first_index = min(
                    connected_ranges.order_by("first_file_index")
                    .first()
                    .first_file_index,
                    item.first_file_index,
                )
                max_last_index = max(
                    connected_ranges.order_by("-last_file_index")
                    .first()
                    .last_file_index,
                    item.last_file_index,
                )
                instance = connected_ranges.order_by("id").first()
                duplicates = AnnotationFileRange.objects.filter(
                    annotator_id=instance.annotator_id,
                    annotation_campaign_id=instance.annotation_campaign,
                    first_file_index=min_first_index,
                    last_file_index=max_last_index,
                )
                if duplicates.exists():
                    instance = duplicates.first()
                else:
                    instance.first_file_index = min_first_index
                    instance.last_file_index = max_last_index
                    instance.save()
                return_ids.append(instance.id)
                connected_ranges.exclude(id=instance.id).delete()
        return AnnotationFileRange.objects.filter(id__in=return_ids)
