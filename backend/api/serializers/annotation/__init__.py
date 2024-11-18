"""
DRF serializers module to be used in viewsets
"""
from .campaign import AnnotationCampaignSerializer
from .comment import AnnotationCommentSerializer
from .detector import (
    DetectorSerializer,
    DetectorConfigurationSerializer,
)
from .file_range import (
    AnnotationFileRangeSerializer,
    AnnotationFileRangeFilesSerializer,
)
from .result import (
    AnnotationResultSerializer,
    AnnotationResultImportListSerializer,
    AnnotationResultAcousticFeaturesSerializer,
)
from .session import AnnotationSessionSerializer
