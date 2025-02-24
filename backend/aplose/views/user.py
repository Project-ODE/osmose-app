"""User DRF-Viewset file"""

from django.contrib.auth import update_session_auth_hash
from django.db.models.functions import Lower
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import viewsets, serializers, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from backend.aplose.models import User
from backend.aplose.serializers import (
    UserSerializer,
    UserPasswordUpdateSerializer,
)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    A simple ViewSet for user-related actions
    """

    queryset = User.objects.all().order_by(Lower("email"))
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "update_password":
            return UserPasswordUpdateSerializer
        return super().get_serializer_class()

    @extend_schema(
        responses=inline_serializer(
            "is_staff_response", {"is_staff": serializers.BooleanField()}
        )
    )
    @action(detail=False, methods=["GET", "PATCH"])
    def self(self, request):
        """Informs whether current user is staff or not"""

        serializer = self.get_serializer_class()(request.user)
        if self.request.data:
            serializer = self.get_serializer_class()(
                request.user, data=self.request.data
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["POST"], url_path="update-password")
    def update_password(self, request):
        """Update current user password"""
        user = self.request.user
        serializer = UserPasswordUpdateSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        old_password = serializer.data.get("old_password")
        if not user.check_password(old_password):
            return Response(
                {"old_password": ["Wrong password."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(serializer.data.get("new_password"))
        user.save()
        update_session_auth_hash(request, user)
        if hasattr(user, "auth_token"):
            user.auth_token.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
