"""Test AnnotationFileRangeViewSet"""
# pylint: disable=missing-class-docstring, missing-function-docstring, duplicate-code
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from backend.utils.tests import AuthenticatedTestCase, empty_fixtures, all_fixtures

URL = reverse("annotation-file-range-list")
URL_files = reverse("annotation-file-range-campaign-files", kwargs={"campaign_id": 1})


class ListUnauthenticatedTestCase(APITestCase):
    """Test AnnotationFileRangeViewSet when request is unauthenticated"""

    def test_unauthenticated(self):
        """ViewSet returns 401 if no user is authenticated"""
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ListEmpyAdminAuthenticatedTestCase(AuthenticatedTestCase):
    username = "admin"
    fixtures = empty_fixtures

    def test_list(self):
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_list_for_current_user(self):
        response = self.client.get(
            URL,
            {
                "for_current_user": True,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_list_for_current_user_with_files(self):
        response = self.client.get(
            URL_files,
            {
                "page": 1,
                "page_size": 100,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 0)


class ListFilledAdminAuthenticatedTestCase(AuthenticatedTestCase):
    username = "admin"
    fixtures = all_fixtures

    def test_list(self):
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 6)

    def test_list_for_current_user(self):
        response = self.client.get(
            URL,
            {
                "for_current_user": True,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)

    def test_list_for_current_user_with_files(self):
        response = self.client.get(
            URL_files,
            {
                "page": 1,
                "page_size": 100,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 6)

        # First file of first file range
        self.assertEqual(response.data["results"][0]["id"], 1)
        self.assertEqual(response.data["results"][0]["results_count"], 3)
        self.assertEqual(response.data["results"][0]["filename"], "sound001.wav")

    # Filters

    def test_list_for_current_user_with_files__search_empty(self):
        response = self.client.get(
            URL_files,
            {
                "page": 1,
                "page_size": 100,
                "filename__icontains": "sound010",
            },  # This file is not assigned to this user
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 0)

    def test_list_for_current_user_with_files__search_correct(self):
        response = self.client.get(
            URL_files,
            {"page": 1, "page_size": 100, "filename__icontains": "sound001"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)

    def test_list_for_current_user_with_files__is_submitted_true(self):
        response = self.client.get(
            URL_files,
            {"page": 1, "page_size": 100, "is_submitted": True},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)

    def test_list_for_current_user_with_files__is_submitted_false(self):
        response = self.client.get(
            URL_files,
            {"page": 1, "page_size": 100, "is_submitted": False},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 5)

    def test_list_for_current_user_with_files__label_empty(self):
        response = self.client.get(
            URL_files,
            {"page": 1, "page_size": 100, "annotation_results__label__name": "Boat"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 0)

    def test_list_for_current_user_with_files__label(self):
        response = self.client.get(
            URL_files,
            {
                "page": 1,
                "page_size": 100,
                "annotation_results__label__name": "Odoncetes",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)

    def test_list_for_current_user_with_files__confidence_empty(self):
        response = self.client.get(
            URL_files,
            {
                "page": 1,
                "page_size": 100,
                "annotation_results__confidence_indicator__label": "wrong",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 0)

    def test_list_for_current_user_with_files__confidence(self):
        response = self.client.get(
            URL_files,
            {
                "page": 1,
                "page_size": 100,
                "annotation_results__confidence_indicator__label": "confident",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)

    def test_list_for_current_user_with_files__acoustic_features_exists(self):
        response = self.client.get(
            URL_files,
            {
                "page": 1,
                "page_size": 100,
                "annotation_results__acoustic_features__isnull": "false",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)

    def test_list_for_current_user_with_files__acoustic_features_not_exists(self):
        response = self.client.get(
            URL_files,
            {
                "page": 1,
                "page_size": 100,
                "annotation_results__acoustic_features__isnull": "true",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 6)

    def test_list_for_current_user_with_files__with_user_annotations_true(self):
        response = self.client.get(
            URL_files,
            {"page": 1, "page_size": 100, "with_user_annotations": "true"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)

    def test_list_for_current_user_with_files__with_user_annotations_false(self):
        response = self.client.get(
            URL_files,
            {"page": 1, "page_size": 100, "with_user_annotations": "false"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 5)

    def test_list_for_current_user_with_files__detector_empty(self):
        response = self.client.get(
            reverse("annotation-file-range-campaign-files", kwargs={"campaign_id": 4}),
            {
                "page": 1,
                "page_size": 100,
                "annotation_results__detector_configuration__detector__name": "Detector 0",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 0)

    def test_list_for_current_user_with_files__detector(self):
        response = self.client.get(
            reverse("annotation-file-range-campaign-files", kwargs={"campaign_id": 4}),
            {
                "page": 1,
                "page_size": 100,
                "annotation_results__detector_configuration__detector__name": "Detector 1",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)

    def test_list_for_current_user_with_files__min_date(self):
        response = self.client.get(
            URL_files,
            {
                "page": 1,
                "page_size": 100,
                "end__gte": "2012-10-03 11:00:02+00:00",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 5)

    def test_list_for_current_user_with_files__max_date(self):
        response = self.client.get(
            URL_files,
            {
                "page": 1,
                "page_size": 100,
                "start__lte": "2012-10-03 11:00:02+00:00",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 2)


class ListFilledCampaignOwnerAuthenticatedTestCase(AuthenticatedTestCase):
    username = "user1"
    fixtures = all_fixtures

    def test_list(self):
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 6)

    def test_list_for_current_user(self):
        response = self.client.get(
            URL,
            {
                "for_current_user": True,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_list_for_current_user_with_files(self):
        response = self.client.get(
            URL_files,
            {
                "page": 1,
                "page_size": 100,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 0)


class ListFilledBaseUserAuthenticatedTestCase(AuthenticatedTestCase):
    username = "user2"
    fixtures = all_fixtures

    def test_list(self):
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 6)

    def test_list_for_current_user(self):
        response = self.client.get(
            URL,
            {
                "for_current_user": True,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)

    def test_list_for_current_user_with_files(self):
        response = self.client.get(
            URL_files,
            {
                "page": 1,
                "page_size": 100,
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 4)

        # First file of first file range
        self.assertEqual(response.data["results"][0]["id"], 7)
        self.assertEqual(response.data["results"][0]["results_count"], 3)
        self.assertEqual(response.data["results"][0]["filename"], "sound007.wav")
