""" Models for Annotations """
from .campaign import (
    AnnotationCampaign,
    AnnotationCampaignArchive,
    AnnotationCampaignUsage,
)
from .confidence import (
    ConfidenceIndicator,
    ConfidenceIndicatorSet,
    ConfidenceIndicatorSetIndicator,
)
from .detector import (
    Detector,
    DetectorConfiguration,
)
from .label import (
    Label,
    LabelSet,
)
from .result import (
    AnnotationResult,
    AnnotationResultValidation,
    AnnotationComment,
    AnnotationResultAcousticFeatures,
    SignalTrend,
)
from .tasks import (
    AnnotationTask,
    AnnotationFileRange,
    AnnotationSession,
)
