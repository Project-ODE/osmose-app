# pylint: disable=missing-module-docstring, missing-class-docstring, missing-function-docstring
from django.core.exceptions import ValidationError
from django.test import TestCase

from backend.api.models import AnnotationCampaign, LabelSet
from backend.aplose.models import User


class AnnotationCampaignModelTestCase(TestCase):
    def test_cannot_set_features_labels_outside_label_set(self):
        campaign = AnnotationCampaign.objects.create(
            name="Test",
            label_set=LabelSet.objects.create(name="Test"),
            owner=User.objects.create(username="Test"),
        )

        self.assertRaises(
            ValidationError,
            lambda: campaign.labels_with_acoustic_features.create(name="Test"),
        )
