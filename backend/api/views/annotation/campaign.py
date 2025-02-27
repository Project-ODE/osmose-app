"""Annotation campaign DRF-Viewset file"""
import csv
from datetime import timedelta

from django.db import models
from django.db.models import (
    Q,
    F,
    BooleanField,
    ExpressionWrapper,
    Value,
    FloatField,
    DurationField,
    Sum,
    IntegerField,
    Case,
    When,
    Exists,
    OuterRef,
    QuerySet,
    Subquery,
)
from django.db.models.functions import Lower, Cast, Extract, Coalesce
from django.http import HttpResponse
from rest_framework import viewsets, status, filters, permissions, mixins
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from backend.api.models import (
    AnnotationCampaign,
    AnnotationResult,
    AnnotationResultValidation,
    AnnotationTask,
    AnnotationComment,
    AnnotationCampaignUsage,
    AnnotationFileRange,
    DatasetFile,
)
from backend.api.serializers import (
    AnnotationCampaignBasicSerializer,
)
from backend.utils.renderers import CSVRenderer

REPORT_HEADERS = [  # headers
    "dataset",
    "filename",
    "start_time",
    "end_time",
    "start_frequency",
    "end_frequency",
    "annotation",
    "annotator",
    "start_datetime",
    "end_datetime",
    "is_box",
    "confidence_indicator_label",
    "confidence_indicator_level",
    "comments",
]


class CampaignAccessFilter(filters.BaseFilterBackend):
    """Filter campaign access base on user"""

    def filter_queryset(self, request: Request, queryset, view):
        if request.user.is_staff:
            return queryset
        return queryset.filter(
            Q(owner_id=request.user.id)
            | (
                Q(archive__isnull=True)
                & Exists(
                    AnnotationFileRange.objects.filter(
                        annotation_campaign_id=OuterRef("pk"),
                        annotator_id=request.user.id,
                    )
                )
            )
        )


class AnnotationCampaignViewSet(viewsets.ReadOnlyModelViewSet, mixins.CreateModelMixin):
    """Model viewset for Annotation campaign"""

    queryset = AnnotationCampaign.objects.all()
    serializer_class = AnnotationCampaignBasicSerializer
    filter_backends = (CampaignAccessFilter,)
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset = (
            super()
            .get_queryset()
            .annotate(
                total=Coalesce(
                    Sum(
                        "annotation_file_ranges__files_count",
                        output_field=IntegerField(default=0),
                    ),
                    0,
                ),
                my_total=Sum(
                    Case(
                        When(
                            annotation_file_ranges__annotator_id=self.request.user.id,
                            then=F("annotation_file_ranges__files_count"),
                        ),
                        default=0,
                        output_field=IntegerField(),
                    )
                ),
            )
            .order_by("name")
        )
        return queryset

    @action(
        detail=True,
        url_path="report",
        url_name="report",
        renderer_classes=[CSVRenderer],
    )
    def report(self, request, pk: int = None):
        """Download annotation results report csv"""
        # pylint: disable=too-many-locals
        campaign: AnnotationCampaign = self.get_object()
        max_confidence = (
            max(
                campaign.confidence_indicator_set.confidence_indicators.values_list(
                    "level", flat=True
                )
            )
            if campaign.confidence_indicator_set
            else 0
        )

        file_duration = Cast(
            Extract(
                ExpressionWrapper(
                    F("dataset_file__end") - F("dataset_file__start"),
                    output_field=DurationField(),
                ),
                "epoch",
            ),
            FloatField(),
        )
        file_max_frequency = ExpressionWrapper(
            F("dataset_file__dataset__audio_metadatum__dataset_sr") / 2,
            output_field=FloatField(),
        )
        results = (
            AnnotationResult.objects.filter(annotation_campaign_id=pk)
            .select_related(
                "dataset_file",
                "dataset_file__dataset",
                "dataset_file__dataset__audio_metadatum",
                "label",
                "confidence_indicator",
                "annotator",
                "detector_configuration__detector",
            )
            .annotate(
                file_duration=file_duration,
                file_max_frequency=file_max_frequency,
                file_name=F("dataset_file__filename"),
                dataset_name=F("dataset_file__dataset__name"),
                file_start=F("dataset_file__start"),
                file_end=F("dataset_file__end"),
                label_name=F("label__name"),
                annotator_name=F("annotator__username"),
                detector_name=F("detector_configuration__detector__name"),
                comment_content=F("comments__comment"),
                comment_author=F("comments__author__username"),
                confidence_label=F("confidence_indicator__label"),
                confidence_level=F("confidence_indicator__level"),
                is_weak=ExpressionWrapper(
                    (Q(start_time__isnull=True) | Q(start_time=0))
                    & (Q(end_time__isnull=True) | Q(end_time=file_duration))
                    & (Q(start_frequency__isnull=True) | Q(start_frequency=0))
                    & (
                        Q(end_frequency__isnull=True)
                        | Q(end_frequency=file_max_frequency)
                    ),
                    output_field=BooleanField(),
                ),
            )
            .order_by("dataset_file__start", "id")
        )
        comments = (
            AnnotationComment.objects.filter(
                annotation_campaign_id=pk,
                annotation_result__isnull=True,
            )
            .select_related(
                "dataset_file",
                "dataset_file__dataset",
                "author",
            )
            .annotate(
                file_name=F("dataset_file__filename"),
                dataset_name=F("dataset_file__dataset__name"),
                annotator_name=F("author__username"),
                comment_content=F("comment"),
                comment_author=F("author__username"),
                start_time=Value(""),
                end_time=Value(""),
                start_frequency=Value(""),
                end_frequency=Value(""),
                label_name=Value(""),
                confidence_label=Value(""),
                confidence_level=Value(""),
                is_weak=Value(""),
                file_start=F("dataset_file__start"),
                file_end=F("dataset_file__end"),
                file_max_frequency=ExpressionWrapper(
                    F("dataset_file__dataset__audio_metadatum__dataset_sr") / 2,
                    output_field=FloatField(),
                ),
            )
            .extra(
                select={
                    "file_duration": 'SELECT EXTRACT(EPOCH FROM ("end" - start)) '
                    "FROM dataset_files f "
                    "WHERE f.id = annotation_comment.dataset_file_id"
                },
            )
        )
        validations = (
            AnnotationResultValidation.objects.filter(
                result__annotation_campaign=campaign
            )
            .prefetch_related("annotator")
            .order_by("annotator__username")
        )
        validate_users = list(
            validations.values_list("annotator__username", flat=True).distinct()
        )

        data = [REPORT_HEADERS]

        def map_result(row):
            return [
                row.dataset_name,
                row.file_name,
                str(row.start_time) if row.start_time else "0",
                str(row.end_time) if row.end_time else str(row.file_duration),
                str(row.start_frequency) if row.start_frequency else "0",
                str(row.end_frequency)
                if row.end_frequency
                else str(row.file_max_frequency),
                row.label_name,
                row.annotator_name if row.annotator_name else row.detector_name,
                (row.file_start + timedelta(seconds=row.start_time or 0)).isoformat(
                    timespec="milliseconds"
                ),
                (row.file_start + timedelta(seconds=row.end_time)).isoformat(
                    timespec="milliseconds"
                )
                if row.end_time
                else row.file_end.isoformat(timespec="milliseconds"),
                str(1 if campaign.annotation_scope == 1 or not row.is_weak else 0)
                if isinstance(row.is_weak, bool)
                else "",
                row.confidence_label if row.confidence_label else "",
                f"{row.confidence_level}/{max_confidence}"
                if isinstance(row.confidence_level, int)
                else "",
                f"{row.comment_content} |- {row.comment_author}"
                if row.comment_content
                else "",
            ]

        def map_result_check(row):
            check_data = map_result(row)
            for user in validate_users:
                validation = validations.filter(
                    result__id=row.id, annotator__username=user
                )
                check_data.append(
                    str(validation.first().is_valid) if validation.count() > 0 else ""
                )
            return check_data

        if campaign.usage == AnnotationCampaignUsage.CREATE:
            data.extend(map(map_result, list(results) + list(comments)))

        if campaign.usage == AnnotationCampaignUsage.CHECK:
            data[0] = data[0] + validate_users
            data.extend(map(map_result_check, list(results) + list(comments)))

        response = Response(data)
        response[
            "Content-Disposition"
        ] = f'attachment; filename="{campaign.name.replace(" ", "_")}.csv"'
        return response

    @action(
        detail=True,
        url_path="report-status",
        url_name="report-status",
        renderer_classes=[CSVRenderer],
    )
    def report_status(self, request, pk: int = None):
        """Returns the CSV report on tasks status for the given campaign"""
        # pylint: disable=unused-argument
        campaign: AnnotationCampaign = self.get_object()

        response = HttpResponse(content_type="text/csv")
        filename = f"{campaign.name.replace(' ', '_')}_status.csv"
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        # Headers
        header = ["dataset", "filename"]
        file_ranges: QuerySet[AnnotationFileRange] = campaign.annotation_file_ranges
        annotators = (
            file_ranges.values("annotator__username")
            .distinct()
            .order_by(Lower("annotator__username"))
            .values_list("annotator__username", flat=True)
        )
        header += annotators
        writer = csv.DictWriter(response, fieldnames=header)
        writer.writeheader()

        # Content
        all_files: QuerySet[DatasetFile] = campaign.get_sorted_files().select_related(
            "dataset"
        )
        finished_tasks: QuerySet[AnnotationTask] = campaign.tasks.filter(
            status=AnnotationTask.Status.FINISHED,
        )

        def map_annotators(user: str) -> [str, Case]:
            task_sub = Subquery(
                finished_tasks.filter(
                    dataset_file_id=OuterRef("pk"), annotator__username=user
                )
            )
            range_sub = Subquery(
                file_ranges.filter(
                    first_file_id__lte=OuterRef("pk"),
                    last_file_id__gte=OuterRef("pk"),
                    annotator__username=user,
                )
            )
            query = Case(
                When(Exists(Subquery(task_sub)), then=models.Value("FINISHED")),
                When(Exists(Subquery(range_sub)), then=models.Value("CREATED")),
                default=models.Value("UNASSIGNED"),
                output_field=models.CharField(),
            )
            return [user, query]

        data = dict(map(map_annotators, annotators))

        writer.writerows(
            list(
                all_files.values("dataset__name", "filename", "pk")
                .annotate(dataset=F("dataset__name"), **data)
                .values(*header)
            )
        )
        return response

    @action(
        detail=True,
        methods=["post"],
        url_path="archive",
        url_name="archive",
    )
    def archive(self, request, pk: int = None):
        """Archive campaign"""
        # pylint: disable=unused-argument
        campaign: AnnotationCampaign = self.get_object()
        if campaign.owner_id != request.user.id and not request.user.is_staff:
            return Response(status=status.HTTP_403_FORBIDDEN)

        campaign.do_archive(request.user)
        return Response(
            self.get_serializer_class()(
                campaign, context=self.get_serializer_context()
            ).data,
            status=status.HTTP_200_OK,
        )
