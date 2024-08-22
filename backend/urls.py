"""backend URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
from django.contrib import admin
from django.urls import path

urlpatterns = [
    path('admin/', admin.site.urls),
]

Also using DRF routers, see:
https://www.django-rest-framework.org/api-guide/routers/
"""

from django.conf import settings
from django.contrib import admin
from django.urls import path, include
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from backend.api.urls import api_router
from backend.osmosewebsite.urls import website_router

SchemaView = get_schema_view(
    openapi.Info(
        title="Snippets API",
        default_version="v1",
        description="Test description",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="contact@snippets.local"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=[
        permissions.IsAuthenticated,
    ],
)

# Backend urls are for admin & api documentation
backend_urlpatterns = [
    path("admin/", admin.site.urls),
    path("api-auth/", include("rest_framework.urls", namespace="rest_framework")),
    path(
        "doc/swagger<format>/",
        SchemaView.without_ui(cache_timeout=0),
        name="schema-json",
    ),
    path(
        "doc/swagger/",
        SchemaView.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
    path(
        "doc/redoc/", SchemaView.with_ui("redoc", cache_timeout=0), name="schema-redoc"
    ),
]
if settings.DEBUG:
    backend_urlpatterns += [path("__debug__/", include("debug_toolbar.urls"))]

# API urls are meant to be used by our React frontend
api_urlpatterns = [
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("", include(api_router.urls)),
    path("", include(website_router.urls)),
]

# All paths are prefixed with backend or api for easier proxy use
urlpatterns = [
    path("backend/", include(backend_urlpatterns)),
    path("api/", include(api_urlpatterns)),
    path("tinymce/", include("tinymce.urls")),
]
