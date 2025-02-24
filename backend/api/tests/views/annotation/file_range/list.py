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
