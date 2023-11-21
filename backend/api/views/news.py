""" News DRF-Viewset file"""
# pylint: disable=C0301,line-too-long
from django.shortcuts import get_object_or_404

from rest_framework import viewsets
from rest_framework.response import Response

from backend.api.models import News
from backend.api.serializers import NewsSerializer

from datetime import datetime


class NewsViewSet(viewsets.ViewSet):
    """
    A simple ViewSet for news related actions
    """

    authentication_classes = []
    permission_classes = []

    queryset = News.objects.all()
    serializer_class = NewsSerializer

    def list(self, request):
        """List news"""
        serializer = self.serializer_class(self.queryset, many=True)
        response = sorted(serializer.data, key=lambda item: datetime.strptime(item["date"], "%Y-%m-%d"), reverse=True)
        return Response(response)

    def retrieve(self, request, pk=None):
        """Show a specific news"""
        one_news = get_object_or_404(self.queryset, pk=pk)
        serializer = self.serializer_class(one_news)
        return Response(serializer.data)
