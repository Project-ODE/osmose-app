"""Annotation result serializer"""
from datetime import datetime, timedelta
from typing import Optional

from django.db import transaction
from django.db.models import QuerySet
from rest_framework import serializers
from rest_framework.fields import empty

from backend.api.models import (
    AnnotationResult,
    Label,
    AnnotationCampaign,
    ConfidenceIndicator,
    DatasetFile,
    AnnotationComment,
    AnnotationResultValidation,
    Dataset,
    Detector,
    DetectorConfiguration,
    ConfidenceIndicatorSet,
    AnnotationCampaignUsage,
    ConfidenceIndicatorSetIndicator,
    AnnotationResultAcousticFeatures,
    SignalTrend,
)
from backend.aplose.models import User
from backend.aplose.models.user import ExpertiseLevel
from backend.utils.serializers import (
    ListSerializer,
    SlugRelatedGetOrCreateField,
    EnumField,
)
from .comment import AnnotationCommentSerializer
from ...models.annotation.result import AnnotationResultType


def to_seconds(delta: timedelta) -> float:
    """Format seconds timedelta as float"""
    return delta.seconds + delta.microseconds / 1000000


class AnnotationResultImportSerializer(serializers.Serializer):
    """Annotation result serializer for detection importation"""

    is_box = serializers.BooleanField()
    dataset = serializers.SlugRelatedField(
        queryset=Dataset.objects.all(),
        slug_field="name",
    )
    detector = serializers.CharField()
    detector_config = serializers.CharField()
    start_datetime = serializers.DateTimeField()
    end_datetime = serializers.DateTimeField()
    min_frequency = serializers.FloatField(min_value=0)
    max_frequency = serializers.FloatField(
        min_value=0,
        allow_null=True,
        required=False,
    )
    label = SlugRelatedGetOrCreateField(
        queryset=Label.objects,
        slug_field="name",
    )
    confidence_indicator = serializers.DictField(allow_null=True)

    class Meta:
        list_serializer_class = ListSerializer

    def get_fields(self):
        fields = super().get_fields()
        campaign: AnnotationCampaign = self.context["campaign"]

        fields["dataset"].queryset = campaign.datasets
        max_frequency = (
            max(d.audio_metadatum.dataset_sr for d in campaign.datasets.all()) / 2
        )
        fields["min_frequency"] = serializers.FloatField(
            required=False, min_value=0.0, max_value=max_frequency
        )
        fields["max_frequency"] = serializers.FloatField(
            required=False, min_value=0.0, max_value=max_frequency, allow_null=True
        )

        return fields

    def run_validation(self, data=empty):
        try:
            data = super().run_validation(data)
        except AssertionError as error:
            if ".validate() should return the validated data" in str(error):
                return None
            raise error
        except Exception as error:
            raise error

        return data

    def validate(self, attrs):
        attrs = super().validate(attrs)
        dataset = attrs["dataset"]
        start = attrs["start_datetime"]
        end = attrs["end_datetime"]
        dataset_files = DatasetFile.objects.filter_matches_time_range(
            start, end
        ).filter(dataset=dataset)
        if not dataset_files:
            if "force" in self.context and self.context["force"]:
                return None
            raise serializers.ValidationError(
                "This start and end datetime does not belong to any file of the dataset",
                code="invalid",
            )
        attrs["files"] = dataset_files
        return attrs

    def get_confidence_set(self, name, index=0):
        """Recover appropriate confidence set based on the campaign name"""
        real_name = name if index == 0 else f"{name} ({index})"
        if ConfidenceIndicatorSet.objects.filter(name=real_name).exists():
            return self.get_confidence_set(name, index + 1)
        return ConfidenceIndicatorSet.objects.create(name=real_name)

    def create(self, validated_data):
        return AnnotationResult.objects.bulk_create(
            self.get_create_instances(validated_data)
        )

    def get_create_instances(self, validated_data) -> list[AnnotationResult]:
        """Get instances to be created"""
        is_box: bool = validated_data["is_box"]

        files: QuerySet[DatasetFile] = validated_data["files"]
        campaign: AnnotationCampaign = self.context["campaign"]
        detector, _ = Detector.objects.get_or_create(name=validated_data["detector"])
        detector_config, _ = DetectorConfiguration.objects.get_or_create(
            detector=detector,
            configuration=validated_data["detector_config"],
        )
        label, _ = Label.objects.get_or_create(name=validated_data["label"])
        if not campaign.label_set.labels.filter(id=label.id).exists():
            campaign.label_set.labels.add(label)
        confidence_indicator = None
        if (
            "confidence_indicator" in validated_data
            and validated_data["confidence_indicator"] is not None
        ):
            if campaign.confidence_indicator_set is None:
                campaign.confidence_indicator_set = self.get_confidence_set(
                    name=f"{campaign.name} confidence set"
                )
                campaign.save()
            confidence_indicator, _ = ConfidenceIndicator.objects.get_or_create(
                label=validated_data["confidence_indicator"].get("label"),
                level=validated_data["confidence_indicator"].get("level"),
            )
            is_default = validated_data["confidence_indicator"].pop("is_default", None)
            ConfidenceIndicatorSetIndicator.objects.get_or_create(
                confidence_indicator=confidence_indicator,
                confidence_indicator_set=campaign.confidence_indicator_set,
                is_default=is_default or False,
            )

        if not is_box and files.count() == 1:
            return [
                AnnotationResult(
                    annotation_campaign=campaign,
                    detector_configuration=detector_config,
                    label=label,
                    confidence_indicator=confidence_indicator,
                    dataset_file=files.first(),
                    type=AnnotationResultType.WEAK,
                )
            ]

        instances = []
        start: datetime = validated_data["start_datetime"]
        end: datetime = validated_data["end_datetime"]
        dataset: Dataset = validated_data["dataset"]
        for file in files:
            if start < file.start:
                start_time = 0
            else:
                start_time = to_seconds(start - file.start)
            if end > file.end:
                end_time = to_seconds(file.end - file.start)
            else:
                end_time = to_seconds(end - file.start)

            start_frequency = (
                validated_data["min_frequency"]
                if "min_frequency" in validated_data and is_box
                else 0
            )
            end_frequency = (
                validated_data["max_frequency"]
                if "max_frequency" in validated_data and is_box
                else dataset.audio_metadatum.dataset_sr / 2
            )

            if (
                start_time == 0
                and end_time == to_seconds(file.end - file.start)
                and start_frequency == 0
                and end_frequency == dataset.audio_metadatum.dataset_sr / 2
            ):
                instances.append(
                    AnnotationResult(
                        annotation_campaign=campaign,
                        detector_configuration=detector_config,
                        label=label,
                        confidence_indicator=confidence_indicator,
                        dataset_file=file,
                        type=AnnotationResultType.WEAK,
                    )
                )
            elif start_time == end_time and (
                start_frequency == end_frequency
                or validated_data["max_frequency"] is None
            ):
                instances.append(
                    AnnotationResult(
                        annotation_campaign=campaign,
                        detector_configuration=detector_config,
                        label=label,
                        confidence_indicator=confidence_indicator,
                        dataset_file=file,
                        start_frequency=start_frequency,
                        end_frequency=None,
                        start_time=start_time,
                        end_time=None,
                        type=AnnotationResultType.POINT,
                    )
                )
            else:
                instances.append(
                    AnnotationResult(
                        annotation_campaign=campaign,
                        detector_configuration=detector_config,
                        label=label,
                        confidence_indicator=confidence_indicator,
                        dataset_file=file,
                        start_frequency=start_frequency,
                        end_frequency=end_frequency,
                        start_time=start_time,
                        end_time=end_time,
                        type=AnnotationResultType.BOX,
                    )
                )

        return instances

    def update(self, instance, validated_data):
        raise NotImplementedError("`update()` must be implemented.")


class AnnotationResultImportListSerializer(ListSerializer):
    """Annotation result list serializer for detection importation"""

    child = AnnotationResultImportSerializer()

    def is_valid(self, *, raise_exception=False):
        data = super().is_valid(raise_exception=raise_exception)
        # pylint: disable=attribute-defined-outside-init
        self._validated_data = [
            data for data in self._validated_data if data is not None
        ]
        return data

    def create(self, validated_data: list[dict]):
        instances = [
            instance
            for attrs in validated_data
            for instance in self.child.get_create_instances(attrs)
        ]
        return AnnotationResult.objects.bulk_create(instances)


class AnnotationResultValidationSerializer(serializers.ModelSerializer):
    """Annotation result validation serializer for annotator"""

    id = serializers.IntegerField(required=False)
    annotator = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    result = serializers.PrimaryKeyRelatedField(
        queryset=AnnotationResult.objects.all(), required=False
    )

    class Meta:
        model = AnnotationResultValidation
        fields = "__all__"
        list_serializer_class = ListSerializer


class DetectorConfigurationSerializer(serializers.ModelSerializer):
    """Annotation result detector serializer for annotator"""

    detector = serializers.SlugRelatedField(
        queryset=Detector.objects.all(),
        slug_field="name",
    )

    class Meta:
        model = DetectorConfiguration
        fields = "__all__"


class AnnotationResultAcousticFeaturesSerializer(serializers.ModelSerializer):
    """AnnotationResultAcousticFeatures serializer"""

    trend = EnumField(enum=SignalTrend, allow_null=True, allow_blank=True)

    class Meta:
        model = AnnotationResultAcousticFeatures
        fields = "__all__"


class AnnotationResultSerializer(serializers.ModelSerializer):
    """Annotation result serializer for annotator"""

    id = serializers.IntegerField(required=False, allow_null=True)
    annotation_campaign = serializers.PrimaryKeyRelatedField(
        queryset=AnnotationCampaign.objects.all()
    )
    label = serializers.SlugRelatedField(
        queryset=Label.objects.all(),
        slug_field="name",
    )
    confidence_indicator = serializers.SlugRelatedField(
        queryset=ConfidenceIndicator.objects.all(),
        slug_field="label",
        required=False,
        allow_null=True,
    )
    annotator = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), required=False, allow_null=True
    )
    annotator_expertise_level = EnumField(
        enum=ExpertiseLevel,
        required=False,
        allow_null=True,
        read_only=True,
    )
    dataset_file = serializers.PrimaryKeyRelatedField(
        queryset=DatasetFile.objects.all(),
    )
    detector_configuration = DetectorConfigurationSerializer(
        required=False, allow_null=True
    )
    start_time = serializers.FloatField(
        required=False,
        allow_null=True,
        min_value=0.0,
    )
    end_time = serializers.FloatField(
        required=False,
        allow_null=True,
        min_value=0.0,
    )
    start_frequency = serializers.FloatField(
        required=False,
        allow_null=True,
        min_value=0.0,
    )
    end_frequency = serializers.FloatField(
        required=False,
        allow_null=True,
        min_value=0.0,
    )
    comments = AnnotationCommentSerializer(many=True, required=False)
    validations = AnnotationResultValidationSerializer(many=True, required=False)
    acoustic_features = AnnotationResultAcousticFeaturesSerializer(
        allow_null=True, required=False
    )
    type = EnumField(enum=AnnotationResultType, read_only=True)

    class Meta:
        model = AnnotationResult
        fields = "__all__"
        list_serializer_class = ListSerializer

    def get_fields(self):
        fields = super().get_fields()
        campaign: Optional[AnnotationCampaign] = (
            self.context["campaign"] if "campaign" in self.context else None
        )
        file: Optional[DatasetFile] = (
            self.context["file"] if "file" in self.context else None
        )

        if campaign is not None:
            fields["label"].queryset = campaign.label_set.labels
            fields["dataset_file"].queryset = DatasetFile.objects.filter(
                dataset__annotation_campaigns__id=campaign.id
            )
            if campaign.confidence_indicator_set is not None:
                fields["confidence_indicator"] = serializers.SlugRelatedField(
                    queryset=campaign.confidence_indicator_set.confidence_indicators.all(),
                    slug_field="label",
                    required=True,
                    allow_null=False,
                )

        if file is not None:
            fields["start_time"] = serializers.FloatField(
                required=False,
                allow_null=True,
                min_value=0.0,
                max_value=(file.end - file.start).seconds,
            )
            fields["end_time"] = serializers.FloatField(
                required=False,
                allow_null=True,
                min_value=0.0,
                max_value=(file.end - file.start).seconds,
            )
            fields["start_frequency"] = serializers.FloatField(
                required=False,
                allow_null=True,
                min_value=0.0,
                max_value=file.dataset.audio_metadatum.dataset_sr / 2,
            )
            fields["end_frequency"] = serializers.FloatField(
                required=False,
                allow_null=True,
                min_value=0.0,
                max_value=file.dataset.audio_metadatum.dataset_sr / 2,
            )

        return fields

    def validate(self, attrs: dict):
        # Reorder start/end
        start_time = attrs.get("start_time")
        end_time = attrs.get("end_time")
        if end_time is not None and (start_time is None or start_time > end_time):
            attrs["start_time"] = end_time
            attrs["end_time"] = start_time
        start_frequency = attrs.get("start_frequency")
        end_frequency = attrs.get("end_frequency")
        if end_frequency is not None and (
            start_frequency is None or start_frequency > end_frequency
        ):
            attrs["start_frequency"] = end_frequency
            attrs["end_frequency"] = start_frequency
        campaign: Optional[AnnotationCampaign] = (
            self.context["campaign"] if "campaign" in self.context else None
        )
        if (
            campaign is not None
            and campaign.usage == AnnotationCampaignUsage.CHECK
            and "annotator" in attrs
        ):
            attrs.pop("annotator")
        detector_configuration = attrs.get("detector_configuration")
        if detector_configuration is not None:
            (
                attrs["detector_configuration"],
                _,
            ) = DetectorConfiguration.objects.get_or_create(
                detector_id=detector_configuration["detector"].id,
                configuration=detector_configuration["configuration"],
            )
        return super().validate(attrs)

    @transaction.atomic
    def create(self, validated_data):
        comments = AnnotationCommentSerializer(
            validated_data.pop("comments", []), many=True
        ).data
        validations = AnnotationResultValidationSerializer(
            validated_data.pop("validations", []), many=True
        ).data
        initial_acoustic_features = validated_data.pop("acoustic_features", None)
        instance: AnnotationResult = super().create(validated_data)

        # Comments
        comments_serializer = AnnotationCommentSerializer(
            data=[{**c, "annotation_result": instance.id} for c in comments], many=True
        )
        comments_serializer.is_valid(raise_exception=True)
        comments_serializer.save()

        # Validations
        validations_serializer = AnnotationResultValidationSerializer(
            data=[{**v, "result": instance.id} for v in validations],
            many=True,
        )
        validations_serializer.is_valid(raise_exception=True)
        validations_serializer.save()

        # Acoustic features
        if initial_acoustic_features is not None:
            acoustic_features = AnnotationResultAcousticFeaturesSerializer(
                initial_acoustic_features
            ).data
            acoustic_features_serializer = AnnotationResultAcousticFeaturesSerializer(
                data={**acoustic_features, "annotation_result": instance.id},
            )
            acoustic_features_serializer.is_valid(raise_exception=True)
            acoustic_features_serializer.save()
            instance.acoustic_features = acoustic_features_serializer.instance
            instance.save()

        return instance

    @transaction.atomic
    def update(self, instance: AnnotationResult, validated_data):
        comments = AnnotationCommentSerializer(
            validated_data.pop("comments", []), many=True
        ).data
        validations = AnnotationResultValidationSerializer(
            validated_data.pop("validations", []), many=True
        ).data
        initial_acoustic_features = validated_data.pop("acoustic_features", None)

        if hasattr(instance, "first") and callable(getattr(instance, "first")):
            instance = instance.first()

        instance = super().update(instance, validated_data)

        # Comments
        instance_comments = AnnotationComment.objects.filter(
            annotation_result__id=instance.id
        )
        comments_serializer = AnnotationCommentSerializer(
            instance_comments,
            data=[
                {
                    **c,
                    "annotation_result": instance.id,
                }
                for c in comments
            ],
            many=True,
        )
        comments_serializer.is_valid(raise_exception=True)
        comments_serializer.save()

        # Validations
        instance_validations = AnnotationResultValidation.objects.filter(
            result__id=instance.id
        )
        validations_serializer = AnnotationResultValidationSerializer(
            instance_validations,
            data=[{**v, "result": instance.id} for v in validations],
            many=True,
        )
        validations_serializer.is_valid(raise_exception=True)
        validations_serializer.save()

        # acoustic_features
        if initial_acoustic_features is None:
            if instance.acoustic_features is not None:
                instance.acoustic_features.delete()
        else:
            acoustic_features = AnnotationResultAcousticFeaturesSerializer(
                initial_acoustic_features
            ).data
            acoustic_features_serializer = AnnotationResultAcousticFeaturesSerializer(
                instance.acoustic_features,
                data={**acoustic_features, "annotation_result": instance.id},
            )
            acoustic_features_serializer.is_valid(raise_exception=True)
            acoustic_features_serializer.save()
            instance.acoustic_features = acoustic_features_serializer.instance
            instance.save()

        return self.Meta.model.objects.get(pk=instance.id)
