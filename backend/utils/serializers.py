""" Serializer util functions """

from django.db import transaction
from django.db.models import QuerySet
from rest_framework import serializers
from rest_framework.serializers import Serializer


class EnumField(serializers.ChoiceField):
    """Serializer for enums"""

    def __init__(self, enum, **kwargs):
        self.enum = enum
        self.choices = enum.choices
        kwargs["choices"] = [(e.name, e.name) for e in enum]
        super().__init__(**kwargs)

    def to_representation(self, value):
        return self.enum(value).label

    def to_internal_value(self, data):

        index = self.enum.labels.index(data)
        value = self.enum.values[index]
        try:
            return self.enum(value)
        except KeyError:
            return self.fail("invalid_choice", input=data)


class ListSerializer(serializers.ListSerializer):
    """Default list serializer -> will update corresponding ids,
    remove extra items in queryset and create extra items in data"""

    def get_serializer_data(self, data: dict) -> dict:
        """Get serialized data"""
        return self.child.__class__(data).data

    @transaction.atomic()
    def update(self, instance: QuerySet, validated_data: list[dict]):
        serializer_list: [Serializer] = []
        for data in validated_data:
            serializer_data = self.get_serializer_data(data)
            if "id" in data and data["id"] is not None:
                update_instance = instance.filter(id=data["id"])
                if update_instance.exists():
                    serializer_list.append(
                        self.child.__class__(
                            instance=update_instance.first(),
                            data=serializer_data,
                            context=self.context,
                        )
                    )
                    continue
            serializer_list.append(
                self.child.__class__(data=serializer_data, context=self.context)
            )
        serializer: Serializer
        for serializer in serializer_list:
            serializer.is_valid(raise_exception=True)

        result_instances = []
        for serializer in serializer_list:
            serializer.save()
            result_instances.append(serializer.instance)
        instance.exclude(id__in=[r.id for r in result_instances]).delete()
        return result_instances


class FileUploadSerializer(serializers.Serializer):
    """File upload form serializer"""

    file = serializers.FileField()

    class Meta:
        fields = ("file",)

    def update(self, instance, validated_data):
        raise NotImplementedError("`update()` must be implemented.")

    def create(self, validated_data):
        raise NotImplementedError("`create()` must be implemented.")


class SlugRelatedGetOrCreateField(serializers.SlugRelatedField):
    """Slug related field that can create an unknown item"""

    def to_internal_value(self, data):
        queryset = self.get_queryset()
        try:
            return queryset.get_or_create(**{self.slug_field: data})[0]
        except (TypeError, ValueError):
            self.fail("invalid")
            return None
