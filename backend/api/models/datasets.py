"""Dataset-related models"""
from datetime import datetime

from django.conf import settings
from django.db import models
from django.db.models import QuerySet, Q
from django.utils import timezone
from metadatax.models import ChannelConfiguration


class DatasetType(models.Model):
    """
    Table containing the possible data types for dataset’s. These data types are not about the technical storage of the
    data (csv or wav for example) but more about the domain applications (sea currents, weather data, etc…).
    """

    class Meta:
        db_table = "dataset_types"

    def __str__(self):
        return str(self.name)

    name = models.CharField(max_length=255, unique=True)
    desc = models.TextField()


class Dataset(models.Model):
    # pylint: disable=duplicate-code
    """
    This table contains general metadata of the dataset as well as links to other metadata tables with more specific
    scopes.

    Specific metadata like audio_metadata can be specified either at dataset level or at dataset_file level.
    It can be specified in both with parameters (or other information) common to all files written at dataset level
    and changing parameters at file level.
    """

    class Meta:
        db_table = "datasets"
        ordering = ["name", "created_at"]

    def __str__(self):
        return str(self.name)

    created_at = models.DateTimeField(default=timezone.now, editable=False)
    name = models.CharField(max_length=255, unique=True)
    desc = models.TextField(null=True, blank=True)
    dataset_path = models.CharField(max_length=255)
    dataset_conf = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Specific configuration folder used for this dataset",
    )
    status = models.IntegerField()
    files_type = models.CharField(max_length=255)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    audio_metadatum = models.ForeignKey(
        "AudioMetadatum", on_delete=models.SET_NULL, null=True, blank=True
    )
    dataset_type = models.ForeignKey(
        DatasetType, on_delete=models.CASCADE, null=True, blank=True
    )
    geo_metadatum = models.ForeignKey(
        "GeoMetadatum", on_delete=models.CASCADE, null=True, blank=True
    )
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    related_channel_configuration = models.ManyToManyField(
        ChannelConfiguration, related_name="aplose_datasets"
    )


class DatasetFileManage(models.Manager):
    def filter_matches_time_range(
        self, start: datetime, end: datetime
    ) -> QuerySet["DatasetFile"]:
        """Get files from absolute start and ends"""
        dataset_files_start = Q(start__lte=start, end__gte=start)
        dataset_files_while = Q(start__gt=start, end__lt=end)
        dataset_files_end = Q(start__lte=end, end__gte=end)
        return self.filter(
            dataset_files_start | dataset_files_while | dataset_files_end
        ).order_by("start", "id")

    def filter_for_file_range(self, file_range: "AnnotationFileRange"):
        """Get files for a given file range"""
        return self.filter(
            dataset__in=file_range.annotation_campaign.datasets.all(),
            id__gte=file_range.first_file_id,
            id__lte=file_range.last_file_id,
        )


class DatasetFile(models.Model):
    """
    This table contains the metadata and link to metadata of the different files composing a dataset.

    Specific metadata like audio_metadata can be specified either at dataset level or at dataset_file level.
    It can be specified in both with parameters (or other information) common to all files written at dataset level
    and changing parameters at file level.
    """

    # TODO: add constraint to disallow identical filenames/filepath within the same dataset

    class Meta:
        db_table = "dataset_files"
        ordering = ("start", "id")

    def __str__(self):
        return str(self.filename)

    objects = DatasetFileManage()

    filename = models.CharField(max_length=255)
    filepath = models.CharField(max_length=255)
    size = models.BigIntegerField()

    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE, related_name="files")
    start = models.DateTimeField()
    end = models.DateTimeField()

    @property
    def dataset_sr(self):
        """Returns data from file audio_metadatum if there, else from dataset audio_metadatum"""
        # Pylint can't follow foreign keys when using string identifiers instead of model
        # pylint: disable=no-member
        return self.dataset.audio_metadatum.dataset_sr
