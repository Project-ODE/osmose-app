# pylint: disable=missing-module-docstring, missing-class-docstring, missing-function-docstring, duplicate-code

from django.test import TestCase
from rest_framework.utils.serializer_helpers import ReturnDict

from backend.api.models import AnnotationResultAcousticFeatures, SignalTrend
from backend.api.serializers import AnnotationResultAcousticFeaturesSerializer


class AbstractTestCase(TestCase):
    def check_correct(self, instance: AnnotationResultAcousticFeatures):
        self.assertEqual(instance.start_frequency, 10)
        self.assertEqual(instance.end_frequency, 50)
        self.assertEqual(instance.relative_max_frequency_count, 5)
        self.assertEqual(instance.relative_min_frequency_count, 4)
        self.assertEqual(instance.steps_count, 2)
        self.assertEqual(instance.has_harmonics, True)
        self.assertEqual(instance.trend, SignalTrend.MODULATED)

    def check_empty(self, instance: AnnotationResultAcousticFeatures):
        self.assertEqual(instance.start_frequency, None)
        self.assertEqual(instance.end_frequency, None)
        self.assertEqual(instance.relative_max_frequency_count, None)
        self.assertEqual(instance.relative_min_frequency_count, None)
        self.assertEqual(instance.steps_count, None)
        self.assertEqual(instance.has_harmonics, None)
        self.assertEqual(instance.trend, None)

    def check_errors(self, errors: ReturnDict):
        self.assertEqual(errors["start_frequency"][0].code, "min_value")
        self.assertEqual(errors["end_frequency"][0].code, "min_value")
        self.assertEqual(errors["relative_max_frequency_count"][0].code, "min_value")
        self.assertEqual(errors["relative_min_frequency_count"][0].code, "min_value")
        self.assertEqual(errors["steps_count"][0].code, "min_value")
        self.assertEqual("has_harmonics" in errors, False)
        self.assertEqual("trend" in errors, False)


class AcousticFeaturesCreateTestCase(AbstractTestCase):
    def test_correct(self):
        serializer = AnnotationResultAcousticFeaturesSerializer(
            data={
                "start_frequency": 10,
                "end_frequency": 50,
                "relative_max_frequency_count": 5,
                "relative_min_frequency_count": 4,
                "has_harmonics": True,
                "trend": "Modulated",
                "steps_count": 2,
            }
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        self.check_correct(serializer.instance)

    def test_empty(self):
        serializer = AnnotationResultAcousticFeaturesSerializer(
            data={
                "start_frequency": None,
                "end_frequency": None,
                "relative_max_frequency_count": None,
                "relative_min_frequency_count": None,
                "has_harmonics": None,
                "trend": None,
                "steps_count": None,
            }
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        self.check_empty(serializer.instance)

    def test_invalid_negative_number(self):
        serializer = AnnotationResultAcousticFeaturesSerializer(
            data={
                "start_frequency": -10,
                "end_frequency": -50,
                "relative_max_frequency_count": -5,
                "relative_min_frequency_count": -4,
                "steps_count": -2,
                "has_harmonics": True,
                "trend": "Modulated",
            }
        )
        serializer.is_valid(raise_exception=False)
        self.check_errors(serializer.errors)


class AcousticFeaturesUpdateTestCase(AbstractTestCase):
    def setUp(self):
        self.instance = AnnotationResultAcousticFeatures.objects.create(
            **{
                "start_frequency": 0,
                "end_frequency": 0,
                "relative_max_frequency_count": 0,
                "relative_min_frequency_count": 0,
                "steps_count": 0,
                "has_harmonics": False,
                "trend": SignalTrend.FLAT,
            }
        )

    def test_correct(self):
        serializer = AnnotationResultAcousticFeaturesSerializer(
            self.instance,
            data={
                "start_frequency": 10,
                "end_frequency": 50,
                "relative_max_frequency_count": 5,
                "relative_min_frequency_count": 4,
                "has_harmonics": True,
                "trend": "Modulated",
                "steps_count": 2,
            },
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        self.check_correct(serializer.instance)

    def test_create_empty(self):
        serializer = AnnotationResultAcousticFeaturesSerializer(
            self.instance,
            data={
                "start_frequency": None,
                "end_frequency": None,
                "relative_max_frequency_count": None,
                "relative_min_frequency_count": None,
                "has_harmonics": None,
                "trend": None,
                "steps_count": None,
            },
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        self.check_empty(serializer.instance)

    def test_create_invalid_negative_number(self):
        serializer = AnnotationResultAcousticFeaturesSerializer(
            self.instance,
            data={
                "start_frequency": -10,
                "end_frequency": -50,
                "relative_max_frequency_count": -5,
                "relative_min_frequency_count": -4,
                "steps_count": -2,
                "has_harmonics": True,
                "trend": "Modulated",
            },
        )
        serializer.is_valid(raise_exception=False)
        self.check_errors(serializer.errors)
