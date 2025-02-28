"""Viewset for annotation file range"""
from typing import Optional

from django.db.models import (
    QuerySet,
    Q,
    Exists,
    OuterRef,
    Count,
)
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.request import Request
from rest_framework.response import Response

from backend.api.models import (
    AnnotationFileRange,
    AnnotationCampaign,
    AnnotationTask,
    DatasetFile,
)
from backend.api.serializers import (
    AnnotationFileRangeSerializer,
)
from backend.api.serializers.annotation.file_range import FileRangeDatasetFileSerializer
from backend.utils.filters import ModelFilter, get_boolean_query_param


class AnnotationFileRangeFilesFilter(filters.BaseFilterBackend):
    """Filter dataset files from file ranges"""

    def filter_queryset(
        self, request: Request, queryset: QuerySet[AnnotationFileRange], view
    ) -> QuerySet[DatasetFile]:
        """Get filtered dataset files"""
        if not queryset.exists():
            return DatasetFile.objects.none()
        campaign_ids = queryset.values_list("annotation_campaign", flat=True)

        files = (
            DatasetFile.objects.select_related("dataset")
            .prefetch_related("dataset__annotation_campaigns")
            .filter(
                dataset__annotation_campaigns__in=campaign_ids,
                id__gte=min(queryset.values_list("first_file_id", flat=True) or []),
                id__lte=min(queryset.values_list("last_file_id", flat=True)),
            )
        )

        files: QuerySet[DatasetFile] = ModelFilter().filter_queryset(
            request, files, view
        )

        with_user_annotations = get_boolean_query_param(
            request, "with_user_annotations"
        )
        if with_user_annotations is not None:
            with_user_annotations_filter = Q(
                annotation_results__annotator=request.user
            ) | Q(annotation_results__detector_configuration__isnull=False)
            if with_user_annotations:
                files = files.filter(with_user_annotations_filter)
            else:
                files = files.filter(~with_user_annotations_filter)

        is_submitted = get_boolean_query_param(request, "is_submitted")
        if is_submitted is not None:
            is_submitted_filter = Exists(
                AnnotationTask.objects.filter(
                    dataset_file_id=OuterRef("id"),
                    status=AnnotationTask.Status.FINISHED,
                    annotator=request.user,
                )
            )
            if is_submitted:
                files = files.filter(is_submitted_filter)
            else:
                files = files.filter(~is_submitted_filter)

        return files.order_by("start", "id")


class AnnotationFilePagination(PageNumberPagination):
    """Custom pagination to allow the front to select the page size"""

    page_size_query_param = "page_size"

    def get_paginated_response(self, data, next_file: Optional[int] = None):
        try:
            count = self.page.paginator.count
        except AttributeError:
            return Response(data)
        response = {
            "count": count,
            "next": self.get_next_link(),
            "previous": self.get_previous_link(),
            "results": data,
        }
        if next_file:
            response["resume"] = next_file
        return Response(response)


class AnnotationFileRangeFilter(filters.BaseFilterBackend):
    """Filter comment access base on user"""

    def filter_queryset(
        self, request: Request, queryset: QuerySet[AnnotationFileRange], view
    ):
        if request.user.is_staff:
            return queryset
        # When testing with campaign owner which is not an annotators, all items are doubled
        # (don't understand why, the result query is correct when executed directly in SQL console)
        # The .distinct() is necessary to assure the items are not doubled
        return queryset.filter(
            Q(annotation_campaign__owner=request.user)
            | (
                Q(annotation_campaign__archive__isnull=True)
                & Q(annotation_campaign__annotators__id=request.user.id)
            )
        ).distinct()


class AnnotationFileRangeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    A simple ViewSet for annotation file range related actions
    """

    queryset = AnnotationFileRange.objects.select_related(
        "annotator",
        "annotator__aplose",
        "annotation_campaign",
    ).prefetch_related(
        "annotation_campaign__datasets",
    )
    serializer_class = AnnotationFileRangeSerializer
    filter_backends = (ModelFilter, AnnotationFileRangeFilter)
    permission_classes = (permissions.IsAuthenticated,)
    pagination_class = AnnotationFilePagination

    def get_queryset(self):
        queryset: QuerySet[AnnotationFileRange] = super().get_queryset()
        for_current_user = get_boolean_query_param(self.request, "for_current_user")
        if self.action in ["list", "retrieve"]:
            if for_current_user:
                queryset = queryset.filter(annotator_id=self.request.user.id)
            queryset = queryset.annotate(
                finished_tasks_count=AnnotationFileRange.get_finished_task_count_query()
            )
        return queryset

    def can_user_post_data(self, request_data: list[dict]) -> bool:
        """Check permission to post data for user"""
        if self.request.user.is_staff:
            return True
        required_campaigns = AnnotationCampaign.objects.filter(
            id__in=[data["annotation_campaign"] for data in request_data],
        )
        required_owned_campaigns = required_campaigns.filter(owner=self.request.user)
        # Check if non-staff user is owner of all campaigns where changes are requested
        return required_campaigns.count() == required_owned_campaigns.count()

    @action(
        methods=["GET"],
        detail=False,
        url_path="campaign/(?P<campaign_id>[^/.]+)/files",
        url_name="campaign-files",
    )
    def list_files(self, request, campaign_id: int = None):
        """List files of an annotator within a campaign through its file ranges"""
        queryset: QuerySet[AnnotationFileRange] = self.filter_queryset(
            self.get_queryset()
        ).filter(annotator_id=self.request.user.id, annotation_campaign_id=campaign_id)

        files: QuerySet[DatasetFile] = AnnotationFileRangeFilesFilter().filter_queryset(
            request, queryset, self
        )
        paginated_files = self.paginate_queryset(files)
        if paginated_files is not None:
            files = files.filter(id__in=[file.id for file in paginated_files])
        files = files.select_related("dataset", "dataset__audio_metadatum").annotate(
            is_submitted=Exists(
                AnnotationTask.objects.filter(
                    dataset_file_id=OuterRef("pk"),
                    annotation_campaign_id=campaign_id,
                    annotator_id=self.request.user.id,
                    status=AnnotationTask.Status.FINISHED,
                )
            ),
            results_count=Count(
                "annotation_results",
                filter=Q(
                    annotation_results__annotator_id=self.request.user.id,
                    annotation_results__annotation_campaign_id=campaign_id,
                ),
            ),
        )
        next_file = files.filter(is_submitted=False).first()
        serializer = FileRangeDatasetFileSerializer(files, many=True)
        return self.paginator.get_paginated_response(
            serializer.data, next_file=next_file.id if next_file is not None else None
        )

    @action(
        methods=["POST"],
        detail=False,
        url_path="campaign/(?P<campaign_id>[^/.]+)",
        url_name="campaign",
    )
    def update_for_campaign(
        self,
        request,
        campaign_id: int = None,
    ):
        """POST an array of annotation file ranges, handle both update and create"""

        campaign: AnnotationCampaign = get_object_or_404(
            AnnotationCampaign,
            id=campaign_id,
        )

        data = [
            {
                **d,
                "annotation_campaign": campaign.id,
            }
            for d in request.data["data"]
        ]

        if not self.can_user_post_data(data):
            return Response(status=status.HTTP_403_FORBIDDEN)

        serializer = AnnotationFileRangeSerializer(
            campaign.annotation_file_ranges,
            data=data,
            context={
                "force": request.data["force"] if "force" in request.data else False
            },
            many=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            AnnotationFileRangeSerializer(
                campaign.annotation_file_ranges,
                many=True,
            ).data,
            status=status.HTTP_200_OK,
        )
