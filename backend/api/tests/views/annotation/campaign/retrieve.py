"""Test AnnotationCampaignViewSet"""
# pylint: disable=missing-class-docstring, missing-function-docstring
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from backend.utils.tests import AuthenticatedTestCase, empty_fixtures, all_fixtures

URL = reverse("annotation-campaign-detail", kwargs={"pk": 1})
URL_archived = reverse("annotation-campaign-detail", kwargs={"pk": 3})


class RetrieveUnauthenticatedTestCase(APITestCase):
    """Test AnnotationFileRangeViewSet when request is unauthenticated"""

    def test_unauthenticated(self):
        """ViewSet returns 401 if no user is authenticated"""
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class RetrieveEmpyAdminAuthenticatedTestCase(AuthenticatedTestCase):
    username = "admin"
    fixtures = empty_fixtures

    def test_unknown(self):
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class RetrieveFilledAdminAuthenticatedTestCase(AuthenticatedTestCase):
    username = "admin"
    fixtures = all_fixtures

    def test_retrieve(self):
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], 1)
        self.assertEqual(response.data["name"], "Test SPM campaign")
        self.assertEqual(len(response.data["datasets"]), 1)
        self.assertEqual(response.data["owner"], "user1")
        self.assertEqual(response.data["my_progress"], 1)
        self.assertEqual(response.data["my_total"], 6)
        self.assertEqual(response.data["archive"], None)

    def test_retrieve_archived(self):
        response = self.client.get(URL_archived)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], 3)
        self.assertEqual(response.data["name"], "Test RTF campaign")
        self.assertEqual(len(response.data["datasets"]), 1)
        self.assertEqual(response.data["owner"], "user1")
        self.assertEqual(response.data["my_progress"], 0)
        self.assertEqual(response.data["my_total"], 0)
        self.assertNotEqual(response.data["archive"], None)


class RetrieveFilledCampaignOwnerAuthenticatedTestCase(AuthenticatedTestCase):
    username = "user1"
    fixtures = all_fixtures

    def test_retrieve(self):
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], 1)
        self.assertEqual(response.data["name"], "Test SPM campaign")
        self.assertEqual(len(response.data["datasets"]), 1)
        self.assertEqual(response.data["owner"], "user1")
        self.assertEqual(response.data["my_progress"], 0)
        self.assertEqual(response.data["my_total"], 0)

    def test_retrieve_archived(self):
        response = self.client.get(URL_archived)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], 3)
        self.assertEqual(response.data["name"], "Test RTF campaign")
        self.assertEqual(len(response.data["datasets"]), 1)
        self.assertEqual(response.data["owner"], "user1")
        self.assertEqual(response.data["my_progress"], 0)
        self.assertEqual(response.data["my_total"], 0)
        self.assertNotEqual(response.data["archive"], None)


class RetrieveFilledBaseUserAuthenticatedTestCase(AuthenticatedTestCase):
    username = "user2"
    fixtures = all_fixtures

    def test_retrieve(self):
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], 1)
        self.assertEqual(response.data["name"], "Test SPM campaign")
        self.assertEqual(len(response.data["datasets"]), 1)
        self.assertEqual(response.data["owner"], "user1")
        self.assertEqual(response.data["my_progress"], 0)
        self.assertEqual(response.data["my_total"], 4)

    def test_retrieve_archived(self):
        response = self.client.get(URL_archived)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class RetrieveFilledBaseUserNoCampaignAuthenticatedTestCase(AuthenticatedTestCase):
    username = "user4"
    fixtures = all_fixtures

    def test_retrieve(self):
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_archived(self):
        response = self.client.get(URL_archived)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
