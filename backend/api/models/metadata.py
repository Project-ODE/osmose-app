"""Metadata-related models"""

from django.db import models
from backend.api.models.datasets import Dataset


class AudioMetadatum(models.Model):
    """
    This table contains the metadata to audio recordings like hydrophone readings for example.

    We follow the same dutycycle convention as Tethys: Duty cycle is represented by the recording duration and the
    interval from the start of one recording session to the next. A duration of 3 m and an interval of 5 m would
    represent a 60% duty cycle, 3 m on, 2 m off.
    """

    class Meta:
        db_table = "audio_metadata"

    start = models.DateTimeField(null=True, blank=True)
    end = models.DateTimeField(null=True, blank=True)
    channel_count = models.IntegerField(null=True, blank=True)
    dataset_sr = models.FloatField(null=True, blank=True)
    total_samples = models.IntegerField(null=True, blank=True)
    sample_bits = models.IntegerField(null=True, blank=True)
    gain_db = models.FloatField(null=True, blank=True)
    gain_rel = models.FloatField(null=True, blank=True)
    dutycycle_rdm = models.FloatField(null=True, blank=True)
    dutycycle_rim = models.FloatField(null=True, blank=True)


class GeoMetadatum(models.Model):
    """
    Table containing geographical information on the dataset. It can be either just a name with a description, a
    specific GPS location or geographical region represented by a polygon of GPS coordinates. It can also be a
    combination of those.
    """

    class Meta:
        db_table = "geo_metadata"

    def __str__(self):
        return str(self.name)

    name = models.CharField(max_length=255, unique=True)
    desc = models.TextField()
    # TODO : move to PostGIS-aware fields, see https://docs.djangoproject.com/en/3.2/ref/contrib/gis/
    location = models.TextField()
    region = models.TextField()


class WindowType(models.Model):
    """
    This table contains window_type which are in spectrogram configuration
    """

    class Meta:
        db_table = "window_type"

    def __str__(self):
        return str(self.name)

    name = models.CharField(max_length=255, unique=True)


class SpectroConfig(models.Model):
    """
    Table containing spectrogram configuration used for datasets and annotation campaigns.
    """

    class Meta:
        constraints = [
            models.UniqueConstraint(
                name="api_spectroconfig_name_dataset_unicity_constraint",
                fields=["name", "dataset_id"],
            ),
        ]

    def __str__(self):
        return f"{self.name} - {self.dataset}"

    name = models.CharField(max_length=255)
    desc = models.TextField(null=True, blank=True)
    nfft = models.IntegerField()
    window_size = models.IntegerField()
    overlap = models.FloatField()
    zoom_level = models.IntegerField()
    spectro_normalization = models.CharField(max_length=255)
    data_normalization = models.CharField(max_length=255)
    zscore_duration = models.CharField(max_length=255)
    hp_filter_min_freq = models.IntegerField()
    colormap = models.CharField(max_length=255)
    dynamic_min = models.IntegerField()
    dynamic_max = models.IntegerField()
    window_type = models.ForeignKey(
        WindowType, on_delete=models.CASCADE, blank=True, null=True
    )
    frequency_resolution = models.FloatField()
    dataset = models.ForeignKey(
        Dataset, on_delete=models.CASCADE, related_name="spectro_configs"
    )
    time_resolution_zoom_0 = models.FloatField(default=0)
    time_resolution_zoom_1 = models.FloatField(default=0)
    time_resolution_zoom_2 = models.FloatField(default=0)
    time_resolution_zoom_3 = models.FloatField(default=0)
    time_resolution_zoom_4 = models.FloatField(default=0)
    time_resolution_zoom_5 = models.FloatField(default=0)
    time_resolution_zoom_6 = models.FloatField(default=0)
    time_resolution_zoom_7 = models.FloatField(default=0)
    time_resolution_zoom_8 = models.FloatField(default=0)

    def zoom_tiles(self, tile_name):
        """Generate zoom tile filenames for SpectroConfig"""
        for zoom_power in range(0, self.zoom_level + 1):
            zoom_level = 2**zoom_power
            for zoom_tile in range(0, zoom_level):
                yield f"{tile_name}_{zoom_level}_{zoom_tile}.png"
