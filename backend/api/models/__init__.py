"""All Django models available"""

from django.contrib.auth import get_user_model

from backend.api.models.datasets import Collection, DatasetType, Dataset, DatasetFile
from backend.api.models.metadata import (
    AudioMetadatum,
    GeoMetadatum,
    SpectroConfig,
    TabularMetadatum,
    TabularMetadataVariable,
    TabularMetadataShape,
    WindowType,
)
from backend.api.models.annotations import (
    ConfidenceIndicator,
    ConfidenceIndicatorSet,
    AnnotationTag,
    AnnotationSet,
    AnnotationCampaign,
    AnnotationComment,
    AnnotationResult,
    AnnotationSession,
    AnnotationTask,
)
from backend.api.models.annotation import Detector

User = get_user_model()
