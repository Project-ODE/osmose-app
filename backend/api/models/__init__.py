"""All Django models available"""

from backend.api.models.annotation import (
    Detector,
    DetectorConfiguration,
    AnnotationResult,
    AnnotationResultValidation,
)
from backend.api.models.annotations import (
    ConfidenceIndicator,
    ConfidenceIndicatorSet,
    AnnotationCampaign,
    AnnotationCampaignArchive,
    AnnotationComment,
    AnnotationSession,
    AnnotationTask,
    AnnotationCampaignUsage,
    LabelSet,
    Label,
)
from backend.api.models.datasets import (
    DatasetType,
    Dataset,
    DatasetFile,
)
from backend.api.models.metadata import (
    AudioMetadatum,
    GeoMetadatum,
    SpectroConfig,
    WindowType,
)
from .user import User
