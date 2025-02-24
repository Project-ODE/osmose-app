"""Test AnnotationCampaignViewSet"""
# pylint: disable=missing-class-docstring, missing-function-docstring
from django.urls import reverse
from freezegun import freeze_time
from rest_framework import status
from rest_framework.test import APITestCase

from backend.api.models import (
    AnnotationCampaign,
)
from backend.utils.tests import AuthenticatedTestCase, all_fixtures

URL = reverse("annotation-campaign-list")

creation_data = {
    "name": "string",
    "desc": "string",
    "instructions_url": "string",
    "deadline": "2022-01-30",
    "label_set": 1,
    "confidence_indicator_set": 1,
    "datasets": ["SPM Aural A 2010"],
    "spectro_configs": [1],
    "created_at": "2012-01-14T00:00:00Z",
    "usage": "Create",
}
check_creation_data = {
    "name": "string",
    "desc": "string",
    "instructions_url": "string",
    "deadline": "2022-01-30",
    "datasets": ["SPM Aural A 2010"],
    "spectro_configs": [1],
    "created_at": "2012-01-14T00:00:00Z",
    "usage": "Check",
}


class CreateUnauthenticatedTestCase(APITestCase):
    """Test AnnotationFileRangeViewSet when request is unauthenticated"""

    def test_create_create_usage(self):
        """ViewSet returns 401 if no user is authenticated"""
        response = self.client.post(URL, creation_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_check_usage(self):
        """AnnotationCampaign view 'create' adds new campaign to DB and returns campaign info"""
        response = self.client.post(URL, check_creation_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


@freeze_time("2012-01-14 00:00:00", tz_offset=-4)
class CreateAdminAuthenticatedTestCase(AuthenticatedTestCase):
    username = "admin"
    fixtures = all_fixtures

    def test_create_create_usage(self):
        old_count = AnnotationCampaign.objects.count()
        response = self.client.post(URL, creation_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(AnnotationCampaign.objects.count(), old_count + 1)
        campaign = AnnotationCampaign.objects.latest("id")

        self.assertEqual(response.data["id"], campaign.id)
        self.assertEqual(response.data["confidence_indicator_set"], 1)
        self.assertEqual(response.data["label_set"], 1)
        self.assertEqual(response.data["usage"], "Create")
        self.assertEqual(
            response.data["annotation_scope"], AnnotationCampaign.AnnotationScope.WHOLE
        )
        self.assertEqual(response.data["datasets"], ["SPM Aural A 2010"])
        self.assertEqual(response.data["archive"], None)
        self.assertEqual(
            list(campaign.spectro_configs.values_list("id", flat=True)), [1]
        )

    def test_create_create_without_confidence(self):
        old_count = AnnotationCampaign.objects.count()
        response = self.client.post(
            URL, {**creation_data, "confidence_indicator_set": None}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(AnnotationCampaign.objects.count(), old_count + 1)
        campaign = AnnotationCampaign.objects.latest("id")

        self.assertEqual(response.data["id"], campaign.id)
        self.assertEqual(response.data["confidence_indicator_set"], None)
        self.assertEqual(response.data["label_set"], 1)
        self.assertEqual(response.data["usage"], "Create")
        self.assertEqual(
            response.data["annotation_scope"], AnnotationCampaign.AnnotationScope.WHOLE
        )
        self.assertEqual(response.data["datasets"], ["SPM Aural A 2010"])
        self.assertEqual(response.data["archive"], None)
        self.assertEqual(
            list(campaign.spectro_configs.values_list("id", flat=True)), [1]
        )

    def test_create_create_usage_with_empty_acoustic_features(self):
        old_count = AnnotationCampaign.objects.count()
        response = self.client.post(
            URL, {**creation_data, "labels_with_acoustic_features": []}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(AnnotationCampaign.objects.count(), old_count + 1)
        self.assertEqual(len(response.data["labels_with_acoustic_features"]), 0)

    def test_create_create_usage_with_filled_valid_acoustic_features(self):
        old_count = AnnotationCampaign.objects.count()
        response = self.client.post(
            URL,
            {**creation_data, "labels_with_acoustic_features": ["Mysticetes"]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(AnnotationCampaign.objects.count(), old_count + 1)
        self.assertEqual(len(response.data["labels_with_acoustic_features"]), 1)
        self.assertEqual(
            response.data["labels_with_acoustic_features"][0], "Mysticetes"
        )

    def test_create_create_usage_with_filled_invalid_acoustic_features(self):
        old_count = AnnotationCampaign.objects.count()
        response = self.client.post(
            URL,
            {**creation_data, "labels_with_acoustic_features": ["Invalid"]},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(AnnotationCampaign.objects.count(), old_count)
        self.assertEqual(
            response.data["labels_with_acoustic_features"][0].code, "invalid"
        )

    def test_create_create_usage_with_filled_invalid_in_set_acoustic_features(self):
        old_count = AnnotationCampaign.objects.count()
        response = self.client.post(
            URL,
            {**creation_data, "labels_with_acoustic_features": ["Dcall"]},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(AnnotationCampaign.objects.count(), old_count)
        self.assertEqual(
            response.data["labels_with_acoustic_features"][0].code, "invalid"
        )

    def test_double_create_create_usage(self):
        old_count = AnnotationCampaign.objects.count()
        response_1 = self.client.post(URL, creation_data, format="json")
        self.assertEqual(response_1.status_code, status.HTTP_201_CREATED)

        response_2 = self.client.post(URL, creation_data, format="json")
        self.assertEqual(response_2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response_2.data.get("name")[0].code, "unique")

        self.assertEqual(AnnotationCampaign.objects.count(), old_count + 1)

    def test_create_check_usage(self):
        """AnnotationCampaign view 'create' adds new campaign to DB and returns campaign info"""
        old_count = AnnotationCampaign.objects.count()
        response = self.client.post(URL, check_creation_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(AnnotationCampaign.objects.count(), old_count + 1)
        campaign = AnnotationCampaign.objects.latest("id")

        self.assertEqual(response.data["id"], campaign.id)
        self.assertEqual(response.data["usage"], "Check")
        self.assertEqual(
            response.data["annotation_scope"], AnnotationCampaign.AnnotationScope.WHOLE
        )


@freeze_time("2012-01-14 00:00:00", tz_offset=-4)
class CreateBaseUserAuthenticatedTestCase(CreateAdminAuthenticatedTestCase):
    username = "user1"
