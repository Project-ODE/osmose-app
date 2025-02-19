"""Test AnnotationCampaignViewSet"""
import csv
import io

from django.http import HttpResponse

# pylint: disable=missing-class-docstring, missing-function-docstring
from django.urls import reverse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APITestCase

from backend.api.views.annotation.campaign import REPORT_HEADERS
from backend.utils.tests import AuthenticatedTestCase, empty_fixtures, all_fixtures

URL = reverse("annotation-campaign-report", kwargs={"pk": 1})
URL_check = reverse("annotation-campaign-report", kwargs={"pk": 4})
URL_status = reverse("annotation-campaign-report-status", kwargs={"pk": 1})


def check_report(test: APITestCase, response: Response):
    test.assertEqual(response.status_code, status.HTTP_200_OK)
    reader = csv.reader(io.StringIO(response.content.decode("utf-8")))
    data = list(reader)
    test.assertEqual(len(data), 10)
    test.assertEqual(data[0], REPORT_HEADERS)
    # annotationresult id=7 ; because ordered by dataset_file__start and not id
    test.assertEqual(
        data[1][:16],
        [
            "SPM Aural A 2010",
            "sound001.wav",
            "108.2",
            "224.8",
            "7520.0",
            "13696.0",
            "Odoncetes",
            "admin",
            "EXPERT",
            "2012-10-03T10:01:48.200+00:00",
            "2012-10-03T10:03:44.800+00:00",
            "1",
            "BOX",
            "confident",
            "0/1",
            "",
        ],
    )


def check_report_check(test: APITestCase, response: Response):
    test.assertEqual(response.status_code, status.HTTP_200_OK)
    reader = csv.reader(io.StringIO(response.content.decode("utf-8")))
    data = list(reader)
    test.assertEqual(len(data), 2)
    test.assertEqual(data[0], REPORT_HEADERS + ["admin", "user2"])
    test.assertEqual(
        data[1],
        [  # annotationresult id=10
            "SPM Aural A 2010",
            "sound001.wav",
            "108.2",
            "224.8",
            "7520.0",
            "13696.0",
            "Rain",
            "Detector 1",
            "",
            "2012-10-03T10:01:48.200+00:00",
            "2012-10-03T10:03:44.800+00:00",
            "1",
            "BOX",
            "no Confident",
            "1/1",
            "",
            "BAD",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "True",
            "False",
        ],
    )


def check_report_status(test: APITestCase, response: HttpResponse):
    test.assertEqual(response.status_code, status.HTTP_200_OK)
    reader = csv.reader(io.StringIO(response.content.decode("utf-8")))
    data = list(reader)
    test.assertEqual(len(data), 12)
    test.assertEqual(data[0], ["dataset", "filename", "admin", "user2"])
    test.assertEqual(
        data[1],
        ["SPM Aural A 2010", "sound001.wav", "FINISHED", "UNASSIGNED"],
    )
    test.assertEqual(
        data[2],
        ["SPM Aural A 2010", "sound002.wav", "CREATED", "UNASSIGNED"],
    )


class ReportUnauthenticatedTestCase(APITestCase):
    """Test AnnotationFileRangeViewSet when request is unauthenticated"""

    def test_report(self):
        """ViewSet returns 401 if no user is authenticated"""
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_report_status(self):
        """ViewSet returns 401 if no user is authenticated"""
        response = self.client.get(URL_status)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ReportEmptyAdminAuthenticatedTestCase(AuthenticatedTestCase):
    username = "admin"
    fixtures = empty_fixtures

    def test_report(self):
        """ViewSet returns 401 if no user is authenticated"""
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_report_status(self):
        """ViewSet returns 401 if no user is authenticated"""
        response = self.client.get(URL_status)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ReportFilledAdminAuthenticatedTestCase(AuthenticatedTestCase):
    username = "admin"
    fixtures = all_fixtures

    def test_report(self):
        response = self.client.get(URL)
        check_report(self, response)

    def test_report_check(self):
        response = self.client.get(URL_check)
        check_report_check(self, response)

    def test_report_status(self):
        response = self.client.get(URL_status)
        check_report_status(self, response)


class ReportFilledCampaignOwnerAuthenticatedTestCase(
    ReportFilledAdminAuthenticatedTestCase
):
    username = "user1"


class ReportFilledBaseUserAuthenticatedTestCase(ReportFilledAdminAuthenticatedTestCase):
    username = "user2"
    fixtures = all_fixtures


class ReportFilledBaseUserNoCampaignAuthenticatedTestCase(
    ReportEmptyAdminAuthenticatedTestCase
):
    username = "user4"
    fixtures = all_fixtures

    def test_report(self):
        response = self.client.get(URL)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_report_status(self):
        response = self.client.get(URL_status)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
