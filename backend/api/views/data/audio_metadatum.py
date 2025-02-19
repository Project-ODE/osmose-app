"""AudioMetadatum viewset"""
from django.db.models import QuerySet
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from backend.api.models import (
    AudioMetadatum,
)
from backend.api.serializers import AudioMetadatumSerializer
from backend.utils.filters import ModelFilter
from backend.utils.renderers import CSVRenderer


class AudioMetadatumViewSet(viewsets.ReadOnlyModelViewSet):
    """
    A simple ViewSet for AudioMetadatum related actions
    """

    queryset = AudioMetadatum.objects.all()
    serializer_class = AudioMetadatumSerializer
    filter_backends = (ModelFilter,)
    permission_classes = (permissions.IsAuthenticated,)

    @action(
        detail=False,
        url_path="export",
        url_name="export",
        renderer_classes=[CSVRenderer],
    )
    def export(self, request):
        """Export queryset as CSV"""
        queryset: QuerySet[AudioMetadatum] = self.filter_queryset(self.get_queryset())
        filename = (
            request.query_params["filename"]
            if "filename" in request.query_params
            else "audio_metadata"
        )
        header = [
            "dataset",
            "files_subtypes",
            "channel_count",
            "audio_file_count",
            "start_date",
            "end_date",
            # "dataset_origin_volume",
            # "dataset_origin_duration",
            # "is_built",
            # "audio_file_dataset_overlap",
            # "lat",
            # "lon",
            # "depth",
            "dataset_sr",
            "audio_file_dataset_duration",
        ]
        data = [header]

        for metadatum in queryset:
            metadatum_data = []
            for label in header:
                if label == "dataset":
                    all_datasets = metadatum.dataset_set
                    if "dataset__annotation_campaigns" in request.query_params:
                        all_datasets = all_datasets.filter(
                            annotation_campaigns__in=request.query_params.get(
                                "dataset__annotation_campaigns", []
                            )
                        )
                    metadatum_data.append(
                        '"'
                        + str(list(all_datasets.values_list("name", flat=True)))
                        + '"'
                    )
                elif label == "files_subtypes":
                    metadatum_data.append(
                        '"'
                        + str(
                            list(
                                metadatum.files_subtypes.values_list("name", flat=True)
                            )
                        )
                        + '"'
                    )
                elif label == "start_date":
                    metadatum_data.append(str(metadatum.start))
                elif label == "end_date":
                    metadatum_data.append(str(metadatum.end))
                else:
                    metadatum_data.append(str(getattr(metadatum, label)))
            data.append(metadatum_data)

        response = Response(data)
        response["Content-Disposition"] = f'attachment; filename="{filename}.csv"'
        return response
