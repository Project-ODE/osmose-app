"""Annotator viewset"""

from django.db import transaction

# pylint: disable=protected-access
from django.db.models import Q, Count, Exists, OuterRef
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from backend.api.models import (
    AnnotationCampaign,
    DatasetFile,
    AnnotationTask,
    AnnotationFileRange,
    AnnotationResult,
)
from backend.api.serializers import (
    AnnotationSessionSerializer,
)
from backend.api.views import (
    AnnotationCommentViewSet,
    AnnotationResultViewSet,
    DatasetFileViewSet,
    SpectrogramConfigurationViewSet,
)
from backend.utils.filters import get_boolean_query_param


# TODO: test !!!! and update result post ones
class AnnotatorViewSet(viewsets.ViewSet):
    """Annotator viewset"""

    @action(
        methods=["GET"],
        detail=False,
        url_path="campaign/(?P<campaign_id>[^/.]+)/file/(?P<file_id>[^/.]+)",
        url_name="campaign-file",
    )
    def get_file(self, request: Request, campaign_id: int, file_id: int):
        # pylint: disable=too-many-locals
        """Get all data for annotator"""

        file_ranges = AnnotationFileRange.objects.filter(
            annotation_campaign_id=campaign_id,
            annotator_id=request.user.id,
        )
        file_ranges_files = []
        for file_range in file_ranges:
            file_ranges_files.extend(
                file_range.get_files().values_list("id", flat=True)
            )

        is_assigned = int(file_id) in file_ranges_files

        search = self.request.query_params.get("search")
        label_filter = self.request.query_params.get("label")
        is_submitted = get_boolean_query_param(self.request, "is_submitted")
        with_user_annotations = get_boolean_query_param(
            self.request, "with_user_annotations"
        )

        file = DatasetFileViewSet.as_view({"get": "retrieve"})(
            request._request,
            pk=file_id,
        ).data

        results = []
        task_comments = []
        if is_assigned:
            request._request.GET = {
                "annotation_campaign_id": campaign_id,
                "dataset_file_id": file_id,
                "for_current_user": True,
            }
            results = AnnotationResultViewSet.as_view({"get": "list"})(
                request._request
            ).data
            request._request.GET = {
                "annotation_campaign_id": campaign_id,
                "dataset_file_id": file_id,
                "annotation_result__isnull": True,
                "for_current_user": True,
            }
            task_comments = AnnotationCommentViewSet.as_view({"get": "list"})(
                request._request
            ).data

        request._request.GET = {
            "annotation_campaigns__id": campaign_id,
        }
        spectrogram_configurations = SpectrogramConfigurationViewSet.as_view(
            {"get": "list"}
        )(request._request).data

        current_file = DatasetFile.objects.get(pk=file_id)
        file_ranges = AnnotationFileRange.objects.filter(
            annotation_campaign_id=campaign_id,
            annotator_id=request.user.id,
        )
        file_ids = []
        for f_range in file_ranges:
            file_ids.extend(f_range.get_files().values_list("id", flat=True))

        all_files = DatasetFile.objects.filter(id__in=file_ids)
        filtered_files = DatasetFile.objects.filter(id__in=file_ids)
        if search is not None:
            filtered_files = filtered_files.filter(filename__icontains=search)
        if with_user_annotations is not None:
            filtered_files = filtered_files.annotate(
                results=Count(
                    "annotation_results",
                    filter=Q(annotation_results__annotator_id=request.user.id)
                    | Q(annotation_results__detector_configuration__isnull=False),
                )
            ).filter(results__gt=0)
        if is_submitted is not None:
            if is_submitted:
                filtered_files = filtered_files.filter(
                    Exists(
                        AnnotationTask.objects.filter(
                            annotation_campaign_id=campaign_id,
                            annotator_id=request.user.id,
                            dataset_file_id=OuterRef("pk"),
                            status=AnnotationTask.Status.FINISHED,
                        )
                    )
                )
            else:
                filtered_files = filtered_files.filter(
                    Exists(
                        AnnotationTask.objects.filter(
                            annotation_campaign_id=campaign_id,
                            annotator_id=request.user.id,
                            dataset_file_id=OuterRef("pk"),
                        ).filter(~Q(status=AnnotationTask.Status.FINISHED))
                    )
                )
        if label_filter is not None:
            filtered_files = filtered_files.filter(
                Exists(
                    AnnotationResult.objects.filter(
                        annotation_campaign_id=campaign_id,
                        dataset_file_id=OuterRef("pk"),
                        label__name=label_filter,
                    ).filter(
                        Q(annotator_id=request.user.id) | Q(annotator__isnull=True)
                    )
                )
            )

        previous_file: DatasetFile = filtered_files.filter(
            Q(start__lt=current_file.start)
            | Q(start=current_file.start, id__lt=current_file.id)
        ).last()
        next_file = filtered_files.filter(
            Q(start__gt=current_file.start)
            | Q(start=current_file.start, id__gt=current_file.id)
        ).first()

        index_filter = Q(start__lt=current_file.start) | Q(
            start=current_file.start, id__lt=current_file.id
        )

        current_task_index_in_filter = filtered_files.filter(index_filter).count()
        current_task_index = all_files.filter(index_filter).count()

        return Response(
            {
                "current_task_index_in_filter": current_task_index_in_filter,
                "total_tasks_in_filter": filtered_files.count(),
                "current_task_index": current_task_index,
                "total_tasks": all_files.count(),
                "is_submitted": AnnotationTask.objects.filter(
                    annotation_campaign_id=campaign_id,
                    dataset_file_id=file_id,
                    annotator_id=request.user.id,
                    status=AnnotationTask.Status.FINISHED,
                ).exists(),
                "file": file,
                "results": results,
                "task_comments": task_comments,
                "spectrogram_configurations": spectrogram_configurations,
                "previous_file_id": previous_file.id
                if previous_file is not None
                else None,
                "next_file_id": next_file.id if next_file is not None else None,
                "is_assigned": int(file_id) in file_ranges_files,
            },
            status=status.HTTP_200_OK,
        )

    @action(
        methods=["POST"],
        detail=False,
        url_path="campaign/(?P<campaign_id>[^/.]+)/file/(?P<file_id>[^/.]+)",
        url_name="campaign-file-post",
    )
    @transaction.atomic()
    def post(self, request: Request, campaign_id: int, file_id: int):
        """Post all data for annotator"""

        # Check permission
        campaign = get_object_or_404(AnnotationCampaign, id=campaign_id)
        file = get_object_or_404(DatasetFile, id=file_id)
        file_ranges = campaign.annotation_file_ranges.filter(
            annotator_id=request.user.id
        )
        if not file_ranges.exists():
            return Response(status=status.HTTP_403_FORBIDDEN)
        all_files = []
        for file_range in file_ranges:
            all_files += list(file_range.get_files())
        if file not in all_files:
            return Response(status=status.HTTP_403_FORBIDDEN)

        # Update
        results = AnnotationResultViewSet.update_results(
            request.data.get("results") or [], campaign, file, request.user.id
        )
        comments = AnnotationCommentViewSet.update_comments(
            request.data.get("task_comments") or [],
            campaign,
            file,
            request.user.id,
        )

        task, _ = AnnotationTask.objects.get_or_create(
            annotator=request.user,
            annotation_campaign_id=campaign_id,
            dataset_file_id=file_id,
        )
        task.status = AnnotationTask.Status.FINISHED
        task.save()
        session_serializer = AnnotationSessionSerializer(
            data={
                **request.data["session"],
                "annotation_task": task.id,
                "session_output": {
                    "results": request.data.get("results"),
                    "task_comments": request.data.get("task_comments"),
                },
            }
        )
        session_serializer.is_valid(raise_exception=True)
        session_serializer.save()

        return Response(
            {
                "results": results,
                "task_comments": comments,
            },
            status=status.HTTP_200_OK,
        )
