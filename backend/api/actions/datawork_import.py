"""Python file for datawork_import function that imports datasets from datawork"""

import csv
import os
from ast import literal_eval
from datetime import timedelta
from typing import Optional

from django.conf import settings
from django.db import transaction
from django.utils.dateparse import parse_datetime

from backend.api.actions.frequency_scales import get_frequency_scales
from backend.api.models import (
    Dataset,
    AudioMetadatum,
    DatasetFile,
    SpectrogramConfiguration,
    WindowType,
    MultiLinearScale,
    LinearScale,
)
from backend.api.models.metadata import FileSubtype


@transaction.atomic
def datawork_import(*, wanted_datasets, importer):
    """This function will import Datasets from datawork folder with importer user as owner"""
    # TODO : break up this process to remove code smell and in order to help with unit testing
    # pylint: disable=too-many-locals, duplicate-code
    current_dataset_names = Dataset.objects.values_list("name", flat=True)
    wanted_dataset_names = [dataset["name"] for dataset in wanted_datasets]
    csv_dataset_names = []
    new_datasets = []

    # Check for new datasets
    with open(
        settings.DATASET_IMPORT_FOLDER / settings.DATASET_FILE, encoding="utf-8"
    ) as csvfile:
        dataset: dict
        for dataset in csv.DictReader(csvfile):
            dataset["name"] = dataset["dataset"]
            csv_dataset_names.append(dataset["name"])
            if (
                dataset["name"] in wanted_dataset_names
                and dataset["name"] not in current_dataset_names
            ):
                new_datasets.append(dataset)

    created_datasets = []
    for dataset in new_datasets:
        # Create dataset metadata
        conf_folder = f"{dataset['spectro_duration']}_{dataset['dataset_sr']}"

        # Audio
        audio_folder = (
            settings.DATASET_IMPORT_FOLDER
            / dataset["path"]
            / settings.DATASET_FILES_FOLDER
            / conf_folder
        )
        with open(audio_folder / "metadata.csv", encoding="utf-8") as csvfile:
            audio_raw = list(csv.DictReader(csvfile))[0]
        audio_metadatum = AudioMetadatum.objects.create(
            channel_count=audio_raw["channel_count"],
            dataset_sr=audio_raw["dataset_sr"],
            start=parse_datetime(audio_raw["start_date"].strip()),
            end=parse_datetime(audio_raw["end_date"].strip()),
            audio_file_count=audio_raw["audio_file_count"]
            if "audio_file_count" in audio_raw
            else None,
            audio_file_dataset_duration=audio_raw["audio_file_dataset_duration"]
            if "audio_file_dataset_duration" in audio_raw
            else None,
        )
        for subtype in literal_eval(audio_raw["sample_bits"]):
            file_subtype, _ = FileSubtype.objects.get_or_create(name=subtype)
            audio_metadatum.files_subtypes.add(file_subtype)

        dataset_path = settings.DATASET_EXPORT_PATH / dataset["path"]
        dataset_path = dataset_path.as_posix()
        # Create dataset
        curr_dataset = Dataset.objects.create(
            name=dataset["name"],
            dataset_path=dataset_path,
            status=1,
            files_type=dataset["file_type"],
            dataset_conf=conf_folder,
            start_date=audio_metadatum.start.date(),
            end_date=audio_metadatum.end.date(),
            audio_metadatum=audio_metadatum,
            owner=importer,
        )
        created_datasets.append(curr_dataset.id)

        # Add Spectro Config
        dataset_folder = dataset_path.split("datawork/dataset/")[1]

        conf_folder_path = (
            settings.DATASET_IMPORT_FOLDER
            / dataset_folder
            / settings.DATASET_SPECTRO_FOLDER
            / conf_folder
        )

        # Search all sub folder, each sub folder have one metadata.csv
        for one_spectro_folder in os.scandir(conf_folder_path):
            if one_spectro_folder.is_dir():
                spectro_csv_path = f"{one_spectro_folder.path}/metadata.csv"
            else:
                continue

            with open(spectro_csv_path, encoding="utf-8") as csvfile:
                spectro: dict
                for spectro in csv.DictReader(csvfile):
                    name = f"{spectro['nfft']}_{spectro['window_size']}_{spectro['overlap']}"

                    is_instrument_normalization = (
                        spectro["data_normalization"] == "instrument"
                    )
                    is_zscore_normalization = spectro["data_normalization"] == "zscore"

                    custom_frequency_scale: (
                        Optional[LinearScale],
                        Optional[MultiLinearScale],
                    ) = (None, None)
                    if "custom_frequency_scale" in spectro:
                        custom_frequency_scale = get_frequency_scales(
                            spectro["custom_frequency_scale"],
                            int(audio_metadatum.dataset_sr),
                        )
                        if spectro["custom_frequency_scale"]:
                            name = f"{name}_{spectro['custom_frequency_scale']}"
                    new_spectro = SpectrogramConfiguration.objects.update_or_create(
                        name=name,
                        dataset=curr_dataset,
                        nfft=spectro["nfft"],
                        window_size=spectro["window_size"],
                        overlap=spectro["overlap"],
                        zoom_level=spectro["zoom_level"],
                        spectro_normalization=spectro["spectro_normalization"],
                        data_normalization=spectro["data_normalization"],
                        hp_filter_min_freq=spectro["hp_filter_min_freq"],
                        colormap=spectro["colormap"],
                        dynamic_min=spectro["dynamic_min"],
                        dynamic_max=spectro["dynamic_max"],
                        window_type=WindowType.objects.get_or_create(
                            name=spectro["window_type"]
                        )[0],
                        frequency_resolution=spectro["frequency_resolution"],
                        temporal_resolution=spectro["temporal_resolution"]
                        if "temporal_resolution" in spectro
                        else None,
                        spectro_duration=spectro["spectro_duration"]
                        if "spectro_duration" in spectro
                        else None,
                        audio_file_dataset_overlap=spectro["audio_file_dataset_overlap"]
                        if "audio_file_dataset_overlap" in spectro
                        else None,
                        zscore_duration=spectro["zscore_duration"]
                        if is_zscore_normalization
                        else None,
                        sensitivity_dB=spectro["sensitivity_dB"]
                        if is_instrument_normalization and "sensitivity_dB" in spectro
                        else None,
                        peak_voltage=spectro["peak_voltage"]
                        if is_instrument_normalization and "peak_voltage" in spectro
                        else None,
                        gain_dB=spectro["gain_dB"]
                        if is_instrument_normalization and "gain_dB" in spectro
                        else None,
                        linear_frequency_scale=custom_frequency_scale[0],
                        multi_linear_frequency_scale=custom_frequency_scale[1],
                    )[0]
                    new_spectro.save()

        dataset_files = []
        # Create dataset_files
        with open(audio_folder / "timestamp.csv", encoding="utf-8") as csvfile:
            timestamp_data: dict
            for timestamp_data in csv.DictReader(csvfile):
                start = parse_datetime(timestamp_data["timestamp"])
                dataset_files.append(
                    DatasetFile(
                        dataset=curr_dataset,
                        filename=timestamp_data["filename"],
                        filepath=settings.DATASET_FILES_FOLDER
                        / conf_folder
                        / timestamp_data["filename"],
                        size=0,
                        start=start,
                        end=(
                            start
                            + timedelta(
                                seconds=float(audio_raw["audio_file_dataset_duration"])
                            )
                        ),
                    )
                )
        curr_dataset.files.bulk_create(dataset_files)

    return Dataset.objects.filter(id__in=created_datasets)
