"""Annotation campaign DRF-Viewset file"""
import csv

from django.db import models, transaction
from django.db.models import (
    Q,
    F,
    Value,
    Case,
    When,
    Exists,
    OuterRef,
    QuerySet,
    Subquery,
    Prefetch,
)
from django.db.models.functions import Lower, Concat
from django.http import HttpResponse
from rest_framework import viewsets, status, filters, permissions, mixins
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.utils.serializer_helpers import ReturnDict

from backend.api.models import (
    AnnotationCampaign,
    AnnotationResult,
    AnnotationResultValidation,
    AnnotationTask,
    AnnotationComment,
    AnnotationFileRange,
    DatasetFile,
)
from backend.api.models.annotation.result import AnnotationResultType
from backend.api.serializers import (
    AnnotationCampaignSerializer,
)
from backend.api.serializers.annotation.campaign import (
    AnnotationCampaignPatchSerializer,
)
from backend.aplose.models import User
from backend.aplose.models.user import ExpertiseLevel
from backend.utils.filters import ModelFilter
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
    "annotator_expertise",
    "start_datetime",
    "end_datetime",
    "is_box",
    "type",
    "confidence_indicator_label",
    "confidence_indicator_level",
    "comments",
    "signal_quality",
    "signal_start_frequency",
    "signal_end_frequency",
    "signal_relative_max_frequency_count",
    "signal_relative_min_frequency_count",
    "signal_has_harmonics",
    "signal_trend",
    "signal_steps_count",
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


class AnnotationCampaignViewSet(
    viewsets.ReadOnlyModelViewSet, mixins.CreateModelMixin, mixins.UpdateModelMixin
):
    """Model viewset for Annotation campaign"""

    queryset = AnnotationCampaign.objects.select_related(
        "owner",
        "archive",
        "archive__by_user",
        "archive__by_user__aplose",
    ).prefetch_related(
        "datasets",
        "labels_with_acoustic_features",
        "spectro_configs",
        Prefetch("annotators", queryset=User.objects.distinct()),
    )
    serializer_class = AnnotationCampaignSerializer
    filter_backends = (ModelFilter, CampaignAccessFilter, filters.SearchFilter)
    search_fields = ("name",)
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset = (
            super()
            .get_queryset()
            .extra(
                select={
                    "files_count": """
                        SELECT count(*) FROM dataset_files f
                        LEFT JOIN annotation_campaigns_datasets d on d.dataset_id = f.dataset_id
                        WHERE d.annotationcampaign_id = annotation_campaigns.id
                    """,
                    "my_progress": """
                        SELECT count(*) FROM api_annotationtask t
                        WHERE t.annotation_campaign_id = annotation_campaigns.id AND t.annotator_id = %s AND t.status = 'F'
                    """,
                    "my_total": """
                        SELECT case when total notnull then total else 0 end as data FROM 
                            (SELECT sum(files_count) as total FROM api_annotationfilerange r
                            WHERE r.annotation_campaign_id = annotation_campaigns.id AND r.annotator_id = %s) as info
                    """,
                    "progress": """
                        SELECT count(*) FROM api_annotationtask t
                        WHERE t.annotation_campaign_id = annotation_campaigns.id AND t.status = 'F'
                    """,
                    "total": """
                        SELECT case when total notnull then total else 0 end as data FROM 
                            (SELECT sum(files_count) as total FROM api_annotationfilerange r
                            WHERE r.annotation_campaign_id = annotation_campaigns.id) as info
                    """,
                },
                select_params=(
                    self.request.user.id,
                    self.request.user.id,
                ),
            )
            .order_by("name")
        )
        return queryset

    def get_serializer_class(self):
        if self.request.method == "PATCH":
            return AnnotationCampaignPatchSerializer
        return super().get_serializer_class()

    @transaction.atomic()
    def create(self, request, *args, **kwargs):
        response: Response = super().create(request, *args, **kwargs)
        if response.status_code != status.HTTP_201_CREATED:
            return response

        response_data: ReturnDict = response.data
        queryset = self.filter_queryset(self.get_queryset())
        data = self.serializer_class(queryset.get(pk=response_data.get("id"))).data
        return Response(
            data,
            status=status.HTTP_201_CREATED,
            headers=self.get_success_headers(data),
        )

    def _report_get_results(self) -> QuerySet[AnnotationResult]:
        campaign: AnnotationCampaign = self.get_object()
        is_box = Case(
            When(type=AnnotationResultType.WEAK, then=0),
            default=1,
            output_field=models.IntegerField(),
        )
        result_type = Case(
            When(type=AnnotationResultType.WEAK, then=Value("WEAK")),
            When(type=AnnotationResultType.POINT, then=Value("POINT")),
            When(type=AnnotationResultType.BOX, then=Value("BOX")),
            default=None,
            output_field=models.CharField(),
        )
        max_confidence = (
            max(
                campaign.confidence_indicator_set.confidence_indicators.values_list(
                    "level", flat=True
                )
            )
            if campaign.confidence_indicator_set
            else 0
        )
        comments = Subquery(
            AnnotationComment.objects.select_related("author")
            .filter(annotation_result_id=OuterRef("id"))
            .annotate(data=Concat(F("comment"), Value(" |- "), F("author__username")))
            .values_list("data", flat=True)
        )
        return (
            AnnotationResult.objects.filter(annotation_campaign_id=campaign.id)
            .select_related(
                "dataset_file",
                "dataset_file__dataset",
                "annotator",
                "annotator__aplose",
                "label",
                "confidence_indicator",
                "acoustic_features",
                "detector_configuration__detector",
            )
            .prefetch_related(
                "comments",
                "comments__author",
            )
            .order_by("dataset_file__start", "dataset_file__id", "id")
            .distinct()
            .annotate(
                dataset=F("dataset_file__dataset__name"),
                filename=F("dataset_file__filename"),
                annotation=F("label__name"),
                annotator_expertise=Case(
                    When(
                        annotator__aplose__expertise_level=ExpertiseLevel.NOVICE,
                        then=Value("NOVICE"),
                    ),
                    When(
                        annotator__aplose__expertise_level=ExpertiseLevel.AVERAGE,
                        then=Value("AVERAGE"),
                    ),
                    When(
                        annotator__aplose__expertise_level=ExpertiseLevel.EXPERT,
                        then=Value("EXPERT"),
                    ),
                    default=F("annotator__aplose__expertise_level"),
                    output_field=models.CharField(),
                ),
                is_box=is_box,
                type_label=result_type,
                confidence_indicator_label=F("confidence_indicator__label"),
                confidence_indicator_level=Concat(
                    F("confidence_indicator__level"),
                    Value("/"),
                    max_confidence,
                    output_field=models.CharField(),
                ),
                comments_data=comments,
                signal_quality=Case(
                    When(acoustic_features__isnull=False, then=Value("GOOD")),
                    default=Value("BAD"),
                    output_field=models.CharField(),
                ),
                signal_start_frequency=F("acoustic_features__start_frequency"),
                signal_end_frequency=F("acoustic_features__end_frequency"),
                signal_relative_max_frequency_count=F(
                    "acoustic_features__relative_max_frequency_count"
                ),
                signal_relative_min_frequency_count=F(
                    "acoustic_features__relative_min_frequency_count"
                ),
                signal_has_harmonics=F("acoustic_features__has_harmonics"),
                signal_trend=F("acoustic_features__trend"),
                signal_steps_count=F("acoustic_features__steps_count"),
            )
            .extra(
                select={
                    "start_datetime": """
                    SELECT 
                        CASE 
                            WHEN annotation_results.start_time isnull  THEN to_char((f.start)::timestamp at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MSOF":00"')
                            ELSE to_char((f.start + annotation_results.start_time * interval '1 second')::timestamp at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MSOF":00"')
                        END
                    FROM dataset_files f
                    WHERE annotation_results.dataset_file_id = f.id
                    """,
                    "end_datetime": """
                    SELECT 
                        CASE 
                            WHEN annotation_results.end_time isnull  THEN to_char((f."end")::timestamp at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MSOF":00"')
                            ELSE to_char((f.start + annotation_results.end_time * interval '1 second')::timestamp at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MSOF":00"')
                        END
                    FROM dataset_files f
                    WHERE annotation_results.dataset_file_id = f.id
                    """,
                },
            )
            .values(
                *[
                    i
                    for i in REPORT_HEADERS
                    if i not in ("annotator", "comments", "type")
                ],
                "annotator__username",
                "comments_data",
                "validations",
                "type_label",
            )
            .annotate(
                annotator=Case(
                    When(annotator__isnull=False, then=F("annotator__username")),
                    When(
                        detector_configuration__detector__isnull=False,
                        then=F("detector_configuration__detector__name"),
                    ),
                    default=Value(""),
                    output_field=models.CharField(),
                ),
                comments=F("comments_data"),
                type=F("type_label"),
            )
        )

    def _report_get_task_comments(self) -> QuerySet[AnnotationComment]:
        campaign: AnnotationCampaign = self.get_object()
        return (
            AnnotationComment.objects.filter(
                annotation_campaign_id=campaign.id,
                annotation_result__isnull=True,
            )
            .select_related("dataset_file", "dataset_file__dataset", "author")
            .annotate(
                dataset=F("dataset_file__dataset__name"),
                filename=F("dataset_file__filename"),
                annotator=F("author__username"),
                start_datetime=F("dataset_file__start"),
                end_datetime=F("dataset_file__end"),
                comments=Concat(F("comment"), Value(" |- "), F("author__username")),
            )
        )

    @action(
        detail=True,
        url_path="report",
        url_name="report",
        renderer_classes=[CSVRenderer],
    )
    def report(self, request, pk: int = None):
        """Download annotation results report csv"""
        # pylint: disable=unused-argument
        campaign: AnnotationCampaign = self.get_object()

        response = HttpResponse(content_type="text/csv")
        filename = f"{campaign.name.replace(' ', '_')}_status.csv"
        response["Content-Disposition"] = f'attachment; filename="{filename}"'

        validate_users = list(
            AnnotationResultValidation.objects.filter(
                result__annotation_campaign=campaign
            )
            .select_related("annotator")
            .order_by("annotator__username")
            .values_list("annotator__username", flat=True)
            .distinct()
        )

        # CSV
        headers = REPORT_HEADERS + validate_users
        writer = csv.DictWriter(response, fieldnames=headers)
        writer.writeheader()

        def map_validations(user: str) -> [str, Case]:
            validation_sub = AnnotationResultValidation.objects.filter(
                annotator__username=user,
                result_id=OuterRef("id"),
            )

            query = Case(
                When(Exists(Subquery(validation_sub.filter(is_valid=True))), then=True),
                When(
                    Exists(Subquery(validation_sub.filter(is_valid=False))), then=False
                ),
                default=None,
                output_field=models.BooleanField(null=True),
            )
            return [user, query]

        results = (
            self._report_get_results()
            .annotate(**dict(map(map_validations, validate_users)))
            .values(*headers)
        )
        comments = self._report_get_task_comments().values(
            "dataset",
            "filename",
            "annotator",
            "start_datetime",
            "end_datetime",
            "comments",
        )

        # TODO: check mode
        writer.writerows(list(results) + list(comments))

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
            task_sub = finished_tasks.filter(
                dataset_file_id=OuterRef("pk"), annotator__username=user
            )
            range_sub = file_ranges.filter(
                first_file_id__lte=OuterRef("pk"),
                last_file_id__gte=OuterRef("pk"),
                annotator__username=user,
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
