"""
DRF views module based on viewsets
"""

from backend.api.views.dataset import DatasetViewSet
from backend.api.views.user import UserViewSet
from backend.api.views.label_set import LabelSetViewSet
from backend.api.views.annotation_campaign import AnnotationCampaignViewSet
from backend.api.views.annotation_comment import AnnotationCommentViewSet
from backend.api.views.annotation_task import AnnotationTaskViewSet
from backend.api.views.confidence_indicators import ConfidenceIndicatorSetViewSet
from .annotation import DetectorViewSet
