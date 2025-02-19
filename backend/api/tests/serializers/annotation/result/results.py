# pylint: disable=missing-module-docstring, missing-class-docstring, missing-function-docstring, duplicate-code

from django.test import TestCase

from backend.api.models import (
    AnnotationCampaign,
    DatasetFile,
    AnnotationResult,
    AnnotationResultAcousticFeatures,
)
from backend.api.serializers import AnnotationResultSerializer
from backend.utils.tests import all_fixtures

features = {
    "start_frequency": 10.0,
    "end_frequency": 50.0,
    "relative_max_frequency_count": 5,
    "relative_min_frequency_count": 4,
    "steps_count": 2,
    "has_harmonics": True,
    "trend": "Modulated",
}
presence_result = {
    "label": "Boat",
    "confidence_indicator": "confident",
    "start_time": None,
    "end_time": None,
    "start_frequency": None,
    "end_frequency": None,
    "dataset_file": 9,
    "detector_configuration": None,
    "annotation_campaign": 1,
    "annotator": 4,
    "validations": [],
    "comments": [],
    "acoustic_features": None,
}
box_result = {
    "label": "Boat",
    "confidence_indicator": "confident",
    "start_time": 0.0,
    "end_time": 10.0,
    "start_frequency": 5.0,
    "end_frequency": 25.0,
    "dataset_file": 9,
    "detector_configuration": None,
    "annotation_campaign": 1,
    "annotator": 4,
    "validations": [],
    "comments": [],
    "acoustic_features": features,
}


class CreateTestCase(TestCase):
    fixtures = all_fixtures
    maxDiff = None  # See all differences on failed tests

    def _get_serializer(self, data, campaign_id=1):
        return AnnotationResultSerializer(
            data=data,
            context={
                "campaign": AnnotationCampaign.objects.get(pk=campaign_id),
                "file": DatasetFile.objects.get(pk=9),
            },
        )

    def test_presence(self):
        serializer = self._get_serializer(presence_result)
        self.assertTrue(serializer.is_valid(raise_exception=True))
        self.assertDictEqual(dict(serializer.data), {**presence_result, "id": None})

    def test_box(self):
        serializer = self._get_serializer(box_result)
        self.assertTrue(serializer.is_valid(raise_exception=True))
        self.assertDictEqual(dict(serializer.data), {**box_result, "id": None})

    # Corrected
    def test_wrong_order(self):
        serializer = self._get_serializer(
            {
                **presence_result,
                "start_time": 9 * 60,
                "end_time": 7 * 60,
                "start_frequency": 9_000,
                "end_frequency": 7_000,
            }
        )
        self.assertTrue(serializer.is_valid(raise_exception=True))
        self.assertEqual(serializer.data["start_time"], 7 * 60)
        self.assertEqual(serializer.data["end_time"], 9 * 60)
        self.assertEqual(serializer.data["start_frequency"], 7_000)
        self.assertEqual(serializer.data["end_frequency"], 9_000)

    # Errors
    def test_required(self):
        serializer = self._get_serializer({})
        self.assertFalse(serializer.is_valid(raise_exception=False))
        self.assertEqual(serializer.errors["label"][0].code, "required")
        self.assertEqual(serializer.errors["dataset_file"][0].code, "required")
        self.assertEqual(serializer.errors["annotation_campaign"][0].code, "required")

    def test_null(self):
        serializer = self._get_serializer(
            {
                "start_time": None,
                "end_time": None,
                "start_frequency": None,
                "end_frequency": None,
                "annotator": None,
                "detector_configuration": None,
                "label": None,
                "dataset_file": None,
                "annotation_campaign": None,
                "confidence_indicator": None,  # Cannot be null since campaign has a confidence indicator set
                "comments": [],
                "validations": [],
            }
        )
        self.assertFalse(serializer.is_valid(raise_exception=False))
        self.assertListEqual(
            list(serializer.errors.keys()),
            [
                "annotation_campaign",
                "label",
                "confidence_indicator",
                "dataset_file",
            ],
        )
        self.assertEqual(serializer.errors["annotation_campaign"][0].code, "null")
        self.assertEqual(serializer.errors["label"][0].code, "null")
        self.assertEqual(serializer.errors["confidence_indicator"][0].code, "null")
        self.assertEqual(serializer.errors["dataset_file"][0].code, "null")

    def test_null_confidence_in_campaign_without_confidence(self):
        serializer = self._get_serializer(
            {
                "confidence_indicator": None,  # Can be null since campaign has no confidence indicator set
            },
            campaign_id=2,
        )
        self.assertFalse(serializer.is_valid(raise_exception=False))
        self.assertNotIn("confidence_indicator", list(serializer.errors.keys()))

    def test_does_not_exist(self):
        serializer = self._get_serializer(
            {
                "label": "DCall",  # label exist in different label set
                "dataset_file": -1,
                "annotation_campaign": -1,
                "confidence_indicator": "test",
            }
        )
        self.assertFalse(serializer.is_valid(raise_exception=False))
        self.assertEqual(serializer.errors["label"][0].code, "does_not_exist")
        self.assertEqual(serializer.errors["dataset_file"][0].code, "does_not_exist")
        self.assertEqual(
            serializer.errors["annotation_campaign"][0].code, "does_not_exist"
        )
        self.assertEqual(
            serializer.errors["confidence_indicator"][0].code, "does_not_exist"
        )

    def test_min_value(self):
        serializer = self._get_serializer(
            {
                **presence_result,
                "start_time": -1,
                "end_time": -1,
                "start_frequency": -1,
                "end_frequency": -1,
            }
        )
        self.assertFalse(serializer.is_valid(raise_exception=False))
        self.assertEqual(serializer.errors["start_time"][0].code, "min_value")
        self.assertEqual(serializer.errors["end_time"][0].code, "min_value")
        self.assertEqual(serializer.errors["start_frequency"][0].code, "min_value")
        self.assertEqual(serializer.errors["start_frequency"][0].code, "min_value")

    def test_max_value(self):
        serializer = self._get_serializer(
            {
                **presence_result,
                "start_time": 16 * 60,
                "end_time": 17 * 60,
                "start_frequency": 130_000,
                "end_frequency": 140_000,
            }
        )
        self.assertFalse(serializer.is_valid(raise_exception=False))
        self.assertEqual(serializer.errors["start_time"][0].code, "max_value")
        self.assertEqual(serializer.errors["end_time"][0].code, "max_value")
        self.assertEqual(serializer.errors["start_frequency"][0].code, "max_value")
        self.assertEqual(serializer.errors["start_frequency"][0].code, "max_value")


class UpdateTestCase(CreateTestCase):
    fixtures = all_fixtures

    def setUp(self):
        campaign = AnnotationCampaign.objects.get(pk=1)
        features_instance = AnnotationResultAcousticFeatures.objects.create(**features)
        self.instance = AnnotationResult.objects.create(
            annotation_campaign=campaign,
            dataset_file=campaign.datasets.first().files.first(),
            annotator=campaign.annotators.first(),
            label=campaign.label_set.labels.first(),
            confidence_indicator=campaign.confidence_indicator_set.confidence_indicators.first(),
            start_time=1,
            end_time=9,
            start_frequency=10,
            end_frequency=15,
            acoustic_features=features_instance,
        )

    def tearDown(self):
        self.instance.delete()

    def _get_response_result(self, result: dict):
        return {
            **result,
            "validations": [],
            "comments": [],
            "detector_configuration": None,
            "id": self.instance.id,
            "acoustic_features": {
                "id": self.instance.acoustic_features.id,
                **result["acoustic_features"],
            }
            if result["acoustic_features"] is not None
            else None,
        }

    def _get_serializer(self, data, campaign_id=1):
        return AnnotationResultSerializer(
            instance=self.instance,
            data=data,
            context={
                "campaign": AnnotationCampaign.objects.get(pk=campaign_id),
                "file": DatasetFile.objects.get(pk=9),
            },
        )

    def test_presence(self):
        serializer = self._get_serializer(presence_result)
        self.assertTrue(serializer.is_valid(raise_exception=True))
        serializer.save()
        self.assertDictEqual(
            dict(serializer.data),
            {
                "id": self.instance.id,
                "type": "Weak",
                **self._get_response_result(presence_result),
            },
        )

    def test_box(self):
        serializer = self._get_serializer(box_result)
        self.assertTrue(serializer.is_valid(raise_exception=True))
        serializer.save()
        self.assertDictEqual(
            dict(serializer.data),
            {
                "id": self.instance.id,
                "type": "Box",
                **self._get_response_result(box_result),
            },
        )

    # Corrected
    def test_wrong_order(self):
        serializer = self._get_serializer(
            {
                **presence_result,
                "start_time": 9 * 60,
                "end_time": 7 * 60,
                "start_frequency": 9_000,
                "end_frequency": 7_000,
            }
        )
        self.assertTrue(serializer.is_valid(raise_exception=True))
        serializer.save()
        self.assertDictEqual(
            dict(serializer.data),
            {
                **self._get_response_result(presence_result),
                "id": self.instance.id,
                "type": "Box",
                "start_time": 7 * 60.0,
                "end_time": 9 * 60.0,
                "start_frequency": 7_000.0,
                "end_frequency": 9_000.0,
            },
        )
