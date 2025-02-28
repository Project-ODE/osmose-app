"""Test AnnotationCampaignViewSet"""
# pylint: disable=missing-class-docstring, missing-function-docstring, duplicate-code
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from backend.utils.tests import AuthenticatedTestCase, all_fixtures, empty_fixtures

URL = reverse("annotation-campaign-list")


class ListUnauthenticatedTestCase(APITestCase):
    """Test AnnotationFileRangeViewSet when request is unauthenticated"""

    fixtures = all_fixtures

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


class ListFilledAdminAuthenticatedTestCase(AuthenticatedTestCase):
    username = "admin"
    fixtures = all_fixtures

    def test_list(self):
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 4)
        self.assertEqual(response.data[0]["name"], "Test DCLDE LF campaign")
        self.assertEqual(response.data[1]["name"], "Test RTF campaign")
        self.assertEqual(response.data[1]["my_total"], 0)


class ListFilledCampaignOwnerAuthenticatedTestCase(AuthenticatedTestCase):
    username = "user1"
    fixtures = all_fixtures

    def test_list(self):
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 4)
        self.assertEqual(response.data[0]["name"], "Test DCLDE LF campaign")
        self.assertEqual(response.data[2]["name"], "Test SPM campaign")
        self.assertEqual(response.data[2]["my_total"], 0)


class ListFilledBaseUserAuthenticatedTestCase(AuthenticatedTestCase):
    username = "user2"
    fixtures = all_fixtures

    def test_list(self):
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)
        self.assertEqual(response.data[0]["name"], "Test DCLDE LF campaign")
        self.assertEqual(response.data[1]["name"], "Test SPM campaign")
        self.assertEqual(response.data[1]["my_total"], 4)


class ListFilledBaseUserNoCampaignAuthenticatedTestCase(AuthenticatedTestCase):
    username = "user4"
    fixtures = all_fixtures

    def test_list(self):
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
