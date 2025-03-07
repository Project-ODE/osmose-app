"""Serializer for annotation file range"""

from django.db.models import OuterRef, Subquery, F, Func, Exists, QuerySet, Q
from rest_framework import serializers

from backend.api.models import (
    AnnotationFileRange,
    AnnotationTask,
    AnnotationResult,
    AnnotationCampaign,
    DatasetFile,
)
from backend.aplose.models import User
from backend.utils.serializers import EnumField
from ..data.file import DatasetFileSerializer


class AnnotationFileRangeListSerializer(serializers.ListSerializer):
    """Annotation file range list serializer"""

    def prepare_deletion(
        self,
        original_ranges: QuerySet[AnnotationFileRange],
        validated_data: list[dict],
    ) -> QuerySet[AnnotationFileRange]:
        """Check deletions and recover deleted items"""
        deleted_ranges = original_ranges.exclude(
            id__in=[data["id"] for data in validated_data if "id" in data]
        ).annotate(
            finished_tasks_count=AnnotationFileRange.get_finished_task_count_query()
        )
        if "force" in self.context and self.context["force"] is True:
            return deleted_ranges
        for file_range in deleted_ranges:
            if file_range.finished_tasks_count > 0:
                raise serializers.ValidationError(
                    "Cannot delete range with finished tasks",
                    code="invalid_deletion",
                )
        return deleted_ranges

    def prepare_updates_and_creates(
        self,
        original_ranges: QuerySet[AnnotationFileRange],
        validated_data: list[dict],
    ) -> list[serializers.ModelSerializer]:
        """Prepare updates and creates, recover each serializer and check data validity"""
        serializers_list = []
        for file_range in validated_data:
            instance = original_ranges.filter(
                Q(id=file_range["id"] if "id" in file_range else None)
                | Q(
                    annotation_campaign_id=file_range["annotation_campaign"].id,
                    annotator_id=file_range["annotator"].id,
                    first_file_index=file_range["first_file_index"],
                    last_file_index=file_range["last_file_index"],
                )
            )
            file_range_data = {
                **file_range,
                "annotator": file_range["annotator"].id,
                "annotation_campaign": file_range["annotation_campaign"].id,
            }
            if instance.exists():
                # Update
                instance = instance.first()
                serializer = AnnotationFileRangeSerializer(
                    instance, data=file_range_data
                )
                serializer.is_valid(raise_exception=True)
                serializers_list.append(serializer)
            else:
                # Create
                serializer = AnnotationFileRangeSerializer(data=file_range_data)
                serializer.is_valid(raise_exception=True)
                serializers_list.append(serializer)
        return serializers_list

    def update(
        self,
        instance: QuerySet[AnnotationFileRange],
        validated_data: list[dict],
    ):
        # Preparation
        deleted_ranges = self.prepare_deletion(instance, validated_data)
        serializers_list = self.prepare_updates_and_creates(instance, validated_data)

        # Execution
        deleted_ranges.delete()
        instances = []
        for serializer in serializers_list:
            serializer.save()
            instances.append(serializer.data)

        return AnnotationFileRange.clean_connected_ranges(instances)


class AnnotationFileRangeSerializer(serializers.ModelSerializer):
    """Serializer for annotation file range"""

    id = serializers.IntegerField(required=False)
    annotator = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    annotation_campaign = serializers.PrimaryKeyRelatedField(
        queryset=AnnotationCampaign.objects.all()
    )

    # Read only
    finished_tasks_count = serializers.IntegerField(read_only=True)
    files_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = AnnotationFileRange
        exclude = ("first_file_id", "last_file_id")
        list_serializer_class = AnnotationFileRangeListSerializer

    def check_max_value(self, data: dict):
        """Check file indexes doesn't go higher than campaign has files"""
        max_value_errors = {}
        campaign: AnnotationCampaign = data["annotation_campaign"]
        max_files = campaign.get_sorted_files().count()
        if data["first_file_index"] >= max_files:
            max_value_errors = {
                **max_value_errors,
                "first_file_index": f"This field should not exceed campaigns files count ({max_files})",
            }
        if data["last_file_index"] >= max_files:
            max_value_errors = {
                **max_value_errors,
                "last_file_index": f"This field should not exceed campaigns files count ({max_files})",
            }
        if len(max_value_errors) > 0:
            raise serializers.ValidationError(
                max_value_errors,
                code="max_value",
            )

    def check_ordered_value(self, data: dict):
        """Check first file index is lower than last file index"""
        if data["first_file_index"] > data["last_file_index"]:
            raise serializers.ValidationError(
                "'last_file_index' shoud be greater or equal to 'first_file_index'",
                code="value_order",
            )

    def validate(self, attrs):
        data = super().validate(attrs)

        self.check_max_value(attrs)
        self.check_ordered_value(attrs)

        return data


class FileRangeDatasetFileSerializer(DatasetFileSerializer):
    """Serializer for dataset file"""

    is_submitted = serializers.BooleanField(read_only=True)
    results_count = serializers.IntegerField(read_only=True)

    class Meta(DatasetFileSerializer.Meta):
        pass


class AnnotationTaskSerializer(serializers.ModelSerializer):
    """Serializer for Annotation task"""

    status = EnumField(enum=AnnotationTask.Status)
    dataset_file = FileRangeDatasetFileSerializer(read_only=True)
    results_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = AnnotationTask
        exclude = ("annotation_campaign", "annotator")


class AnnotationFileRangeFilesSerializer(AnnotationFileRangeSerializer):
    """Serializer for annotation file range with detail files"""

    files = serializers.SerializerMethodField(read_only=True)

    class Meta(AnnotationFileRangeSerializer.Meta):
        pass

    def get_files(self, file_range: AnnotationFileRange):
        """Get files within the range"""
        files = DatasetFile.objects.filter_for_file_range(file_range).annotate(
            is_submitted=Exists(
                AnnotationTask.objects.filter(
                    annotation_campaign_id=file_range.annotation_campaign_id,
                    annotator_id=file_range.annotator_id,
                    dataset_file_id=OuterRef("pk"),
                    status=AnnotationTask.Status.FINISHED,
                )
            ),
            results_count=Subquery(
                AnnotationResult.objects.filter(
                    annotation_campaign_id=file_range.annotation_campaign_id,
                    dataset_file_id=OuterRef("pk"),
                )
                .filter(
                    Q(annotator=file_range.annotator)
                    | Q(detector_configuration__isnull=False)
                )
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            ),
        )
        return FileRangeDatasetFileSerializer(files, many=True).data
