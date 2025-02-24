"""User DRF-Viewset test file"""
import json

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from backend.aplose.models import User


class UserViewSetUnauthenticatedTestCase(APITestCase):
    """Test UserViewSet when request is unauthenticated"""

    def test_list_unauthenticated(self):
        """User view 'list' returns 401 if no user is authenticated"""
        url = reverse("user-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_self_unauthenticated(self):
        """User view 'is_staff' returns 401 if no user is authenticated"""
        url = reverse("user-self")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_password_unauthenticated(self):
        """User view 'is_staff' returns 401 if no user is authenticated"""
        url = reverse("user-update-password")
        response = self.client.post(
            url,
            data=json.dumps(
                {
                    "old_password": "osmose29",
                    "new_password": "abcd1234ABCD!",
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_self_patch_unauthenticated(self):
        """User view 'is_staff' returns 401 if no user is authenticated"""
        url = reverse("user-self")
        response = self.client.patch(
            url,
            data=json.dumps(
                {
                    "email": "user@osmose.abc",
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserViewSetTestCase(APITestCase):
    """Test UserViewSet when request is authenticated"""

    fixtures = ["users"]

    def setUp(self):
        self.client.login(username="user1", password="osmose29")

    def tearDown(self):
        self.client.logout()

    def test_list(self):
        """User view 'list' returns correct list of users"""
        url = reverse("user-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), User.objects.count())
        self.assertEqual(
            dict(response.data[0]),
            {
                "id": 1,
                "username": "admin",
                "email": "admin@osmose.xyz",
                "expertise_level": "Expert",
                "first_name": "",
                "last_name": "",
                "is_staff": True,
                "is_superuser": True,
            },
        )

    def test_self_for_user(self):
        """User view 'self' returns false for user"""
        url = reverse("user-self")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], 3)
        self.assertEqual(response.data["username"], "user1")
        self.assertEqual(response.data["email"], "user1@osmose.xyz")
        self.assertEqual(response.data["expertise_level"], None)
        self.assertEqual(response.data["is_staff"], False)
        self.assertEqual(response.data["is_superuser"], False)

    def test_self_for_staff(self):
        """User view 'self' returns true for staff"""
        self.client.login(username="staff", password="osmose29")
        url = reverse("user-self")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], 2)
        self.assertEqual(response.data["username"], "staff")
        self.assertEqual(response.data["email"], "staff@osmose.xyz")
        self.assertEqual(response.data["expertise_level"], None)
        self.assertEqual(response.data["is_staff"], True)
        self.assertEqual(response.data["is_superuser"], False)

    def test_self_for_admin(self):
        """User view 'self' returns true for staff"""
        self.client.login(username="admin", password="osmose29")
        url = reverse("user-self")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], 1)
        self.assertEqual(response.data["username"], "admin")
        self.assertEqual(response.data["email"], "admin@osmose.xyz")
        self.assertEqual(response.data["expertise_level"], "Expert")
        self.assertEqual(response.data["is_staff"], True)
        self.assertEqual(response.data["is_superuser"], True)

    # Update password

    def test_update_password(self):
        """User view 'self' returns false for user"""
        url = reverse("user-update-password")
        response = self.client.post(
            url,
            data=json.dumps(
                {
                    "old_password": "osmose29",
                    "new_password": "abcd1234ABCD!",
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        user: User = User.objects.get(username="user1")
        self.assertTrue(user.check_password("abcd1234ABCD!"))
        user.set_password("osmose29")

    def test_update_password_password_too_common(self):
        """User view 'self' returns false for user"""
        url = reverse("user-update-password")
        response = self.client.post(
            url,
            data=json.dumps(
                {
                    "old_password": "osmose29",
                    "new_password": "<PASSWORD>",
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["new_password"][0].code, "password_too_common")
        user: User = User.objects.get(username="user1")
        self.assertTrue(user.check_password("osmose29"))

    def test_update_password_required(self):
        """User view 'self' returns false for user"""
        url = reverse("user-update-password")
        response = self.client.post(
            url,
            data=json.dumps({}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["old_password"][0].code, "required")
        self.assertEqual(response.data["new_password"][0].code, "required")
        user: User = User.objects.get(username="user1")
        self.assertTrue(user.check_password("osmose29"))

    def test_update_password_blank(self):
        """User view 'self' returns false for user"""
        url = reverse("user-update-password")
        response = self.client.post(
            url,
            data=json.dumps(
                {
                    "old_password": "",
                    "new_password": "",
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["old_password"][0].code, "blank")
        self.assertEqual(response.data["new_password"][0].code, "blank")
        user: User = User.objects.get(username="user1")
        self.assertTrue(user.check_password("osmose29"))

    def test_update_password_null(self):
        """User view 'self' returns false for user"""
        url = reverse("user-update-password")
        response = self.client.post(
            url,
            data=json.dumps(
                {
                    "old_password": None,
                    "new_password": None,
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["old_password"][0].code, "null")
        self.assertEqual(response.data["new_password"][0].code, "null")
        user: User = User.objects.get(username="user1")
        self.assertTrue(user.check_password("osmose29"))

    # Patch self

    def test_self_patch(self):
        """User view 'is_staff' returns 401 if no user is authenticated"""
        url = reverse("user-self")
        response = self.client.patch(
            url,
            data=json.dumps(
                {
                    "email": "user1@osmose.abc",
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "user1@osmose.abc")
        self.assertEqual(response.data["id"], 3)
        self.assertEqual(response.data["username"], "user1")
        self.assertEqual(response.data["expertise_level"], None)
        self.assertEqual(response.data["is_staff"], False)
        self.assertEqual(response.data["is_superuser"], False)
        user: User = User.objects.get(username="user1")
        user.email = "user1@osmose.xyz"
        user.save()

    def test_self_patch_blank(self):
        """User view 'is_staff' returns 401 if no user is authenticated"""
        url = reverse("user-self")
        response = self.client.patch(
            url,
            data=json.dumps({"email": ""}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["email"][0].code, "blank")
        user: User = User.objects.get(username="user1")
        self.assertEqual(user.email, "user1@osmose.xyz")

    def test_self_patch_null(self):
        """User view 'is_staff' returns 401 if no user is authenticated"""
        url = reverse("user-self")
        response = self.client.patch(
            url,
            data=json.dumps({"email": None}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["email"][0].code, "null")
        user: User = User.objects.get(username="user1")
        self.assertEqual(user.email, "user1@osmose.xyz")
