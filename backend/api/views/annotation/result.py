"""Annotation result viewset"""
import ast
import csv
from io import StringIO

from django.db.models import QuerySet, Q
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, filters, status, mixins
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from backend.api.models import (
    AnnotationResult,
    AnnotationCampaign,
    DatasetFile,
)
from backend.api.serializers import (
    AnnotationResultSerializer,
    AnnotationResultImportListSerializer,
)
from backend.utils.filters import ModelFilter, get_boolean_query_param
from backend.utils.serializers import FileUploadSerializer


# pylint: disable=duplicate-code


class ResultAccessFilter(filters.BaseFilterBackend):
    """Filter result access base on user"""

    def filter_queryset(
        self, request: Request, queryset: QuerySet[AnnotationResult], view
    ):
        if request.user.is_staff:
            return queryset
        return queryset.filter(
            Q(annotation_campaign__owner=request.user)
            | (
                Q(annotation_campaign__archive__isnull=True)
                & (Q(annotator=request.user) | Q(annotator__isnull=True))
            )
        )


class AnnotationResultViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    A simple ViewSet for annotation result related actions
    """

    queryset = AnnotationResult.objects.select_related(
        "label",
        "confidence_indicator",
        "detector_configuration",
        "detector_configuration__detector",
    ).prefetch_related(
        "comments",
        "validations",
    )
    serializer_class = AnnotationResultSerializer
    filter_backends = (ModelFilter, ResultAccessFilter)
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset: QuerySet[AnnotationResult] = super().get_queryset()
        for_current_user = get_boolean_query_param(self.request, "for_current_user")
        if self.action in ["list", "retrieve"] and for_current_user:
            queryset = queryset.filter(
                Q(annotator_id=self.request.user.id) | Q(annotator__isnull=True)
            )
        return queryset

    @staticmethod
    def map_request_results(results: list[dict], campaign_id, file_id, user_id):
        """Map results from request with the other request information"""
        return [
            {
                **r,
                "annotation_campaign": campaign_id,
                "dataset_file": file_id,
                "annotator": user_id
                if r.get("detector_configuration") is None
                else None,
                "comments": [
                    {
                        **c,
                        "annotation_campaign": campaign_id,
                        "dataset_file": file_id,
                        "author": c["author"]
                        if "author" in c and c["author"] is not None
                        else user_id,
                    }
                    for c in (r["comments"] if "comments" in r else [])
                ],
                "validations": [
                    {
                        **v,
                        "annotator": v["annotator"]
                        if "annotator" in v and v["annotator"] is not None
                        else user_id,
                    }
                    for v in (r["validations"] if "validations" in r else [])
                ],
            }
            for r in results
        ]

    @staticmethod
    def update_results(
        new_results: list[dict],
        campaign: AnnotationCampaign,
        file: DatasetFile,
        user_id,
    ):
        """Update with given results"""
        data = AnnotationResultViewSet.map_request_results(
            new_results, campaign.id, file.id, user_id
        )
        current_results = AnnotationResultViewSet.queryset.filter(
            annotation_campaign_id=campaign.id,
            dataset_file_id=file.id,
        ).filter(Q(annotator_id=user_id) | Q(annotator__isnull=True))
        serializer = AnnotationResultViewSet.serializer_class(
            current_results,
            many=True,
            data=data,
            context={"campaign": campaign, "file": file},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return serializer.data

    @action(
        methods=["POST"],
        detail=False,
        url_path="campaign/(?P<campaign_id>[^/.]+)/import",
        url_name="campaign-import",
    )
    def import_results(self, request, campaign_id):
        """Import result from automated detection"""
        # Check permission
        campaign = get_object_or_404(AnnotationCampaign, id=campaign_id)
        if campaign.owner_id != request.user.id and not request.user.is_staff:
            return Response(status=status.HTTP_403_FORBIDDEN)

        upload_serializer = FileUploadSerializer(data=request.data)
        upload_serializer.is_valid(raise_exception=True)

        file = upload_serializer.validated_data["file"]

        force = get_boolean_query_param(self.request, "force")

        dataset_name = request.query_params.get("dataset_name")
        detectors_map = ast.literal_eval(request.query_params.get("detectors_map"))

        decoded_file = file.read().decode()
        io_string = StringIO(decoded_file)
        reader = csv.DictReader(io_string)
        data = []
        for row in reader:
            annotator = row["annotator"] if "annotator" in row else None
            if annotator not in detectors_map:
                continue
            detector_map = detectors_map[annotator] if annotator else None
            confidence_level = (
                row["confidence_indicator_level"]
                if "confidence_indicator_level" in row
                else None
            )
            detector = annotator
            if detector_map and "detector" in detector_map and detector_map["detector"]:
                detector = detector_map["detector"]
            data.append(
                {
                    "is_box": row["is_box"],
                    "dataset": dataset_name,
                    "detector": detector,
                    "detector_config": detector_map["configuration"]
                    if detector_map and "configuration" in detector_map
                    else None,
                    "start_datetime": row["start_datetime"],
                    "end_datetime": row["end_datetime"],
                    "min_frequency": row["start_frequency"],
                    "max_frequency": row["end_frequency"]
                    if row["end_frequency"] != ""
                    else None,
                    "label": row["annotation"],
                    "confidence_indicator": {
                        "label": row["confidence_indicator_label"],
                        "level": confidence_level.split("/")[0],
                    }
                    if "confidence_indicator_label" in row
                    and row["confidence_indicator_label"]
                    and confidence_level
                    else None,
                    "annotation_campaign": campaign_id,
                }
            )

        # Execute import
        serializer = AnnotationResultImportListSerializer(
            data=data,
            context={
                "campaign": campaign,
                "force": force,
            },
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        list_serializer = self.get_serializer_class()(serializer.instance, many=True)
        return Response(list_serializer.data, status=status.HTTP_201_CREATED)
