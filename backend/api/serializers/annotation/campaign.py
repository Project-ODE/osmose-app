"""Annotation campaign list/retrieve serializer"""
from datetime import datetime

import pytz
from rest_framework import serializers

from backend.api.models import (
    AnnotationCampaign,
    AnnotationCampaignUsage,
    SpectrogramConfiguration,
    Dataset,
    LabelSet,
    AnnotationCampaignArchive,
    Label,
    ConfidenceIndicatorSet,
)
from backend.aplose.models import User
from backend.aplose.serializers import UserSerializer
from backend.utils.serializers import EnumField, SlugRelatedGetOrCreateField


class AnnotationCampaignArchiveSerializer(serializers.ModelSerializer):
    """Serializer for annotation campaign archive"""

    by_user = UserSerializer(read_only=True)

    class Meta:
        model = AnnotationCampaignArchive
        fields = "__all__"


class AnnotationCampaignSerializer(serializers.ModelSerializer):
    """Serializer for annotation campaign"""

    files_count = serializers.IntegerField(read_only=True)
    datasets = serializers.SlugRelatedField(
        many=True, queryset=Dataset.objects.all(), slug_field="name"
    )
    my_progress = serializers.IntegerField(read_only=True)
    my_total = serializers.IntegerField(read_only=True)
    progress = serializers.IntegerField(read_only=True)
    total = serializers.IntegerField(read_only=True)
    usage = EnumField(enum=AnnotationCampaignUsage)

    label_set = serializers.PrimaryKeyRelatedField(
        queryset=LabelSet.objects.all(),
        required=False,
    )
    labels_with_acoustic_features = SlugRelatedGetOrCreateField(
        queryset=Label.objects.all(),
        slug_field="name",
        required=False,
        many=True,
    )
    confidence_indicator_set = serializers.PrimaryKeyRelatedField(
        queryset=ConfidenceIndicatorSet.objects.all(), required=False, allow_null=True
    )
    owner = serializers.SlugRelatedField(
        queryset=User.objects.all(),
        slug_field="username",
        required=False,
    )
    spectro_configs = serializers.PrimaryKeyRelatedField(
        queryset=SpectrogramConfiguration.objects.all(),
        many=True,
    )
    archive = AnnotationCampaignArchiveSerializer(read_only=True)

    class Meta:
        model = AnnotationCampaign
        fields = "__all__"

    def validate_create_usage(self, attrs: dict):
        """Validate attributes for a "create" usage creation"""
        if "label_set" not in attrs or attrs["label_set"] is None:
            raise serializers.ValidationError(
                {"label_set": "This field is required."},
                code="required",
            )

    def validate_spectro_configs_in_datasets(self, attrs: dict) -> None:
        """Validates that chosen spectros correspond to chosen datasets"""
        spectro_configs: list[SpectrogramConfiguration] = attrs["spectro_configs"]
        datasets: list[Dataset] = attrs["datasets"]
        bad_vals = []
        for spectro in spectro_configs:
            if spectro.dataset not in datasets:
                bad_vals.append(str(spectro))
        if bad_vals:
            error = f"{bad_vals} not valid ids for spectro configs of given datasets ({[str(d) for d in datasets]})"
            raise serializers.ValidationError({"spectro_configs": error})

    def validate(self, attrs):
        attrs = super().validate(attrs)
        attrs["owner"] = self.context["request"].user
        if (
            "deadline" in attrs
            and attrs["deadline"] is not None
            and attrs["deadline"] < datetime.now(tz=pytz.UTC).date()
        ):
            raise serializers.ValidationError(
                {"deadline": "Deadline date should be in the future."},
                code="min_value",
            )
        self.validate_spectro_configs_in_datasets(attrs)
        if attrs["usage"] == AnnotationCampaignUsage.CREATE:
            self.validate_create_usage(attrs)
        if attrs["usage"] == AnnotationCampaignUsage.CHECK:
            attrs["label_set"], _ = LabelSet.objects.get_or_create(
                name=f"{attrs['name']} label set"
            )
        if "labels_with_acoustic_features" in attrs:
            label_set: LabelSet = attrs["label_set"]
            for label in attrs["labels_with_acoustic_features"]:
                if not label_set.labels.filter(name=label).exists():
                    if attrs["usage"] == AnnotationCampaignUsage.CREATE:
                        message = (
                            "Label with acoustic features should belong to label set"
                        )
                        raise serializers.ValidationError(
                            {"labels_with_acoustic_features": message},
                        )
                    if attrs["usage"] == AnnotationCampaignUsage.CHECK:
                        label_obj, _ = Label.objects.get_or_create(name=label)
                        label_set.labels.add(label_obj)
        return attrs

    def create(self, validated_data):
        if validated_data["usage"] == AnnotationCampaignUsage.CHECK:
            validated_data["label_set"], _ = LabelSet.objects.get_or_create(
                name=f"{validated_data['name']} label set"
            )
        return super().create(validated_data)


class AnnotationCampaignPatchSerializer(serializers.Serializer):
    """Serializer for annotation campaign"""

    labels_with_acoustic_features = serializers.SlugRelatedField(
        queryset=Label.objects.all(),
        slug_field="name",
        required=False,
        many=True,
    )

    class Meta:
        fields = "__all__"

    def create(self, validated_data):
        pass

    def update(self, instance: AnnotationCampaign, validated_data):
        if "labels_with_acoustic_features" in validated_data:
            label_set: LabelSet = instance.label_set
            for label in validated_data["labels_with_acoustic_features"]:
                if not label_set.labels.filter(name=label).exists():
                    message = "Label with acoustic features should belong to label set"
                    raise serializers.ValidationError(
                        {"labels_with_acoustic_features": message},
                    )

        instance.labels_with_acoustic_features.set(
            validated_data["labels_with_acoustic_features"]
        )
        instance.save()
        return instance
