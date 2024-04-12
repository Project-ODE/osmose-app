"""Annotation campaign create DRF serializers file"""

from rest_framework import serializers

from backend.api.models import (
    User,
    AnnotationCampaign,
    Dataset,
    LabelSet,
    SpectroConfig,
    ConfidenceIndicatorSet,
    AnnotationCampaignUsage,
    Label,
    ConfidenceIndicator,
    Detector,
    DetectorConfiguration,
    AnnotationResult,
)
from backend.api.serializers.utils import EnumField
from backend.utils.validators import valid_model_ids
from ._utils_ import (
    create_campaign_with_annotators,
    check_annotation_goal,
    check_spectro_configs_in_datasets,
)


class AnnotationCampaignCreateCreateAnnotationsSerializer(serializers.ModelSerializer):
    """Serializer meant for AnnotationCampaign creation with corresponding tasks"""

    annotators = serializers.ListField(
        child=serializers.IntegerField(), validators=[valid_model_ids(User)]
    )
    annotation_goal = serializers.IntegerField(min_value=1)
    usage = EnumField(enum=AnnotationCampaignUsage)

    class Meta:
        model = AnnotationCampaign
        # pylint:disable=duplicate-code
        fields = [
            "name",
            "desc",
            "instructions_url",
            "deadline",
            "datasets",
            "spectro_configs",
            "label_set",
            "confidence_indicator_set",
            "annotators",
            "annotation_goal",
            "annotation_scope",
            "usage",
        ]

    def validate(self, attrs):
        """Validates given data"""

        check_annotation_goal(attrs)
        check_spectro_configs_in_datasets(attrs)

        # Handle non-present confidence set
        if "confidence_indicator_set" not in attrs:
            attrs["confidence_indicator_set"] = None
        return attrs

    def create(self, validated_data):
        label_set = validated_data["label_set"]  # type: LabelSet
        confidence_indicator_set = validated_data[
            "confidence_indicator_set"
        ]  # type: ConfidenceIndicatorSet | None

        campaign = AnnotationCampaign(
            name=validated_data["name"],
            desc=validated_data.get("desc"),
            deadline=validated_data.get("deadline"),
            label_set=label_set,
            confidence_indicator_set=confidence_indicator_set,
            annotation_scope=validated_data["annotation_scope"],
            usage=validated_data["usage"],
            owner_id=validated_data["owner_id"],
            instructions_url=validated_data.get("instructions_url"),
        )

        spectro_configs = validated_data["spectro_configs"]  # type: list[SpectroConfig]
        datasets = validated_data["datasets"]  # type: list[Dataset]

        campaign.save()
        campaign.datasets.set(datasets)
        campaign.spectro_configs.set(spectro_configs)

        return create_campaign_with_annotators(
            campaign=campaign,
            goal=int(validated_data["annotation_goal"]),
            annotators=validated_data["annotators"],
        )


class AnnotationCampaignCreateCheckAnnotationsSerializer(serializers.ModelSerializer):
    """Serializer meant for AnnotationCampaign creation with corresponding tasks"""

    annotation_goal = serializers.IntegerField(min_value=1)
    label_set_labels = serializers.ListField(child=serializers.CharField())
    confidence_set_indicators = serializers.ListField(
        allow_empty=True,
        required=False,
    )
    detectors = serializers.ListField()
    usage = EnumField(enum=AnnotationCampaignUsage)
    results = serializers.ListField()
    annotators = serializers.ListField(
        child=serializers.IntegerField(),
        validators=[valid_model_ids(User)],
    )

    class Meta:
        model = AnnotationCampaign
        # pylint:disable=duplicate-code
        fields = [
            "id",
            "name",
            "desc",
            "instructions_url",
            "deadline",
            "datasets",
            "spectro_configs",
            "spectro_configs",
            "annotators",
            "annotation_goal",
            "annotation_scope",
            "usage",
            "label_set_labels",
            "confidence_set_indicators",
            "detectors",
            "results",
        ]

    def validate(self, attrs):
        """Validates given data"""

        check_annotation_goal(attrs)
        check_spectro_configs_in_datasets(attrs)

        # Handle non-present confidence set
        if "confidence_set_indicators" not in attrs:
            attrs["confidence_set_indicators"] = None
        return attrs

    def get_label_set_name(self, target_name):
        """Create automatically new label set name"""
        if LabelSet.objects.filter(name=target_name):
            return self.get_label_set_name(target_name + "_1")
        return target_name

    def get_confidence_set_name(self, target_name):
        """Create automatically new confidence set name"""
        if ConfidenceIndicatorSet.objects.filter(name=target_name):
            return self.get_confidence_set_name(target_name + "_1")
        return target_name

    def create(self, validated_data):
        """Create label set"""
        label_set = LabelSet.objects.create(
            name=self.get_label_set_name(validated_data["name"] + "_set"),
            desc="Label set for " + validated_data["name"] + " campaign",
        )
        for name in validated_data["label_set_labels"]:
            label = Label.objects.get_or_create(name=name)
            label_set.labels.add(label[0])
        label_set.save()

        # Create confidence set
        confidence_set = None
        for data in validated_data["confidence_set_indicators"]:
            if data[0] is None or data[1] is None:
                continue
            if confidence_set is None:
                confidence_set = ConfidenceIndicatorSet.objects.create(
                    name=self.get_confidence_set_name(validated_data["name"] + "_set"),
                    desc="Confidence set for " + validated_data["name"] + " campaign",
                )
            confidence_set.confidence_indicators.get_or_create(
                label=data[0],
                level=data[1],
            )
        if confidence_set is not None:
            confidence_set.save()

        # Create detectors
        for detector in validated_data["detectors"]:
            detector_name = detector.pop("detectorName")
            detector_id = None
            detector_config_id = None
            try:
                detector_id = detector.pop("detectorId")
                detector_config_id = detector.pop("configurationId")
            except KeyError as error:
                print("KeyError", error)
            detector_config = detector.pop("configuration")
            detector_obj = None
            print(">> Will get detector", detector_name, detector_id, detector_obj)
            if detector_id is not None:
                detector_obj = Detector.objects.get(pk=detector_id)
            if detector_obj is None:
                detector_obj = Detector.objects.get_or_create(name=detector_name)[0]
            if detector_config_id is None:
                detector_obj.configurations.get_or_create(configuration=detector_config)
            detector_obj.save()
        print(">> Will create campaign")

        campaign = AnnotationCampaign(
            name=validated_data["name"],
            desc=validated_data.get("desc"),
            deadline=validated_data.get("deadline"),
            label_set_id=label_set.id,
            confidence_indicator_set_id=confidence_set.id
            if confidence_set is not None
            else None,
            annotation_scope=validated_data["annotation_scope"],
            usage=validated_data["usage"],
            owner_id=validated_data["owner_id"],
            instructions_url=validated_data.get("instructions_url"),
        )

        campaign.save()
        campaign.datasets.set(validated_data["datasets"])
        campaign.spectro_configs.set(validated_data["spectro_configs"])

        # Create results
        for result in validated_data["results"]:
            detector = Detector.objects.filter(name=result["detector"]).first()
            detector_config = DetectorConfiguration.objects.filter(
                detector=detector, configuration=result["detector_config"]
            ).first()
            dataset = Dataset.objects.get(name=result["dataset"])
            filename = result["dataset_file"]
            dataset_file = dataset.files.get(filename=filename)
            if dataset_file is None:
                raise serializers.ValidationError(
                    {
                        "dataset_file": f"'{filename}' doesn't exists in dataset '{dataset.name}'"
                    }
                )

            is_box = bool(result["is_box"])
            AnnotationResult.objects.create(
                annotation_campaign=campaign,
                detector_configuration=detector_config,
                label=Label.objects.get(name=result["label"]),
                confidence_indicator=ConfidenceIndicator.objects.get(
                    label=result["confidence"],
                    confidence_indicator_set=confidence_set,
                )
                if "confidence" in result
                else None,
                start_time=result["min_time"]
                if is_box and "min_time" in result
                else None,
                end_time=result["max_time"]
                if is_box and "max_time" in result
                else None,
                start_frequency=result["min_frequency"]
                if is_box and "min_frequency" in result
                else None,
                end_frequency=result["max_frequency"]
                if is_box and "max_frequency" in result
                else None,
                dataset_file=dataset_file,
            )

        print(">> Created", campaign.name, campaign.id)
        return create_campaign_with_annotators(
            campaign=campaign,
            goal=int(validated_data["annotation_goal"]),
            annotators=validated_data["annotators"],
        )
