# Generate a dataset

All annotation campaigns are base on a dataset. Each dataset should be imported.

The datasets must be located in a `datasets` folder.


## OSEkit <Badge type="tip" text="Recommended" />

We developed our Python package to manipulate audio files.
This package allows to directly output the dataset in a file structure that can be read by APLOSE.

This package can be found on GitHub: https://github.com/Project-OSmOSE/OSEkit

You can also directly access its documentation: https://project-osmose.github.io/OSEkit/


## Manually

To create a dataset manually you must understand the expected file structure and metadata files.

### File structure

The root folder is named `dataset`.

```
dataset/
├── datasets.csv
├── {Acquisition campaign}/
│   ├── {Dataset}
│   └── ...
├── {Dataset}
└── ...
```

The datasets folder can be located at the root or within an "Acquisition campaign" folder.
Each dataset folder contains the file structure detailed below.

```
.
└── {Dataset}/
    ├── data/
    │   └── audio/
    │       ├── {Spectrogram duration}_{Sample rate}/
    │       │   ├── metadata.csv
    │       │   ├── timestamp.csv
    │       │   ├── {audio file name}.wav
    │       │   └── ...
    │       └── ...
    └── processed/
        └── spectrogram/
            ├── {Spectrogram duration}_{Sample rate}/
            │   ├── {NFFT}_{Window size}_{Overlap}_{frequency scale}/
            │   │   ├── metadata.csv
            │   │   └── image/
            │   │       ├── {audio file name}_{zoom level}_{index in zoom level}.png
            │   │       └── ...
            │   └── ...
            └── ...
```

All the spectrogram must be pre-processed and available in the dataset folder.
There should be at least one spectrogram image by audio file.

To recover the appropriate image in the annotator display, APLOSE uses the audio file name, the zoom level and the index in the zoom level to get the image name. 
Zoom levels increase as a power of 2.
The naming of the spectrogram is really important.

::: details Understanding the spectrogram image naming
For a "sound.wav" audio file there should be at least a "sound_1_0.png" image: corresponds to the first zoom level and the first (and only) image.

For a second zoom level:
- sound_2_0.png
- sound_2_1.png

For a third level:
- sound_4_0.png
- sound_4_1.png
- sound_4_2.png
- sound_4_3.png

And so on...
:::

### Metadata files

#### datasets.csv
_Located at ./datasets.csv_

This is where APLOSE will search for new datasets. 
This file list the available datasets and give information to recover the audio and spectrogram files.

| Column           |  Type  | Description                                                                                                             |
|------------------|:------:|-------------------------------------------------------------------------------------------------------------------------|
| path             | string | Path from the dataset root folder (ie: {Acquisition campaign}/{Dataset} or {Dataset})                                   |
| dataset          | string | The name to display the dataset in APLOSE, this name can be different from the folder name and must be unique in APLOSE |
| spectro_duration |  int   | The duration of the files                                                                                               |
| dataset_sr       |  int   | The sample rate                                                                                                         |
| file_type        | string | The type of file used (example: .wav)                                                                                   |


#### [Audio] metadata.csv
_Located at ./{Dataset}/data/audio/{Spectrogram duration}\_{Sample rate}/metadata.csv_

This file describe the audio files. It gives information about the process they had.

| Column                      |      Type       | Description                                 |
|-----------------------------|:---------------:|---------------------------------------------|
| origin_sr                   |       int       | Sample rate of the original audio files     |
| sample_bits                 | array of string | Files subtypes (example: ['PCM-16'])        |
| channel_count               |       int       | Number of channels in the file              |
| start_date                  |    timestamp    | Start of the dataset                        |
| end_date                    |    timestamp    | End of the dataset                          |
| audio_file_origin_duration  |       int       | Duration of the original files              |
| audio_file_origin_volume    |      float      |                                             |
| dataset_origin_volume       |       int       |                                             |
| dataset_origin_duration     |       int       | Total duration of the dataset               |
| is_built                    |     boolean     |                                             |
| audio_file_dataset_overlap  |       int       | The time overlap between two files          |
| lat                         |      float      | Latitude of the recording                   |
| long                        |      float      | Longitude of the recording                  |
| depth                       |    int (>0)     | Depth of the instrument (in positive meter) |
| dataset_sr                  |       int       | Sample rate of the processed files          |
| audio_file_dataset_duration |       int       | Duration of the processed files             |

::: danger TODO
Check information
:::

#### [Audio] timestamp.csv
_Located at ./{Dataset}/data/audio/{Spectrogram duration}\_{Sample rate}/timestamp.csv_

This file lists all the audio files. APLOSE uses it over the file structure to known which files to use.

::: info
This mean you can create a subset by removing files from this CSV.
Or if you don't want to listen audio while annotating, you can add this CSV without the associated wav files.
:::

| Column    |   Type    | Description                           |
|-----------|:---------:|---------------------------------------|
| filename  |  string   | Name of the file (with the extension) |
| timestamp | timestamp | Start of the audio file               |

#### [Spectrogram] metadata.csv
_Located at ./{Dataset}/processed/spectrogram/{Spectrogram duration}\_{Sample rate}/{NFFT}\_{Window size}\_{Overlap}\_{frequency scale}/metadata.csv_

This files describe the spectrogram generation process.

| Column                        |  Type  | Description                               |
|-------------------------------|:------:|-------------------------------------------|
| dataset_name                  | string | Name of the dataset                       |
| dataset_sr                    |  int   | Sample rate                               |
| nfft                          |  int   |                                           |
| window_size                   |  int   |                                           |
| overlap                       |  int   | Time overlap between two files            |
| colormap                      | string | Colormap used to generate the spectrogram |
| zoom_level                    |  int   | Available zoom levels                     |
| number_adjustment_spectrogram |  int   |                                           |
| dynamic_min                   |  int   |                                           |
| dynamic_max                   |  int   |                                           |
| spectro_duration              |  int   | Duration of the spectrogram (in seconds)  |
| audio_file_folder_name        | string |                                           |
| data_normalization            | string |                                           |
| hp_filter_min_freq            |  int   |                                           |
| sensitivity_dB                | float  | Sensitivity of the instrument, in dB      |
| peak_voltage                  | float  |                                           |
| spectro_normalization         | string |                                           |
| gain_dB                       |  int   | Gain of the instrument, in dB             |
| zscore_duration               | string |                                           |
| window_type                   | string |                                           |
| number_spectra                |  int   |                                           |
| frequency_resolution          | float  |                                           |
| temporal_resolution           | float  |                                           |
| audio_file_dataset_overlap    |  int   |                                           |
| custom_frequency_scale        | string | Name of the frequency scale to apply      |


::: details Available frequency scales

| Scale      | Description                                                                                                                     |
|------------|---------------------------------------------------------------------------------------------------------------------------------|
| linear     | Linear scale from 0 to sample rate / 2                                                                                          |
| audible    | Linear scale from 0 to 22kHz                                                                                                    |
| porp_delph | Multi-linear scale:<ul><li>0-50%: 0 to 30kHz</li><li>50-70%: 30kHz to 80kHz</li><li>70-100%: 80kHz to sample rate / 2</li></ul> |
| dual_lf_hf | Multi-linear scale:<ul><li>0-50%: 0 to 22kHz</li><li>50-100%: 22kHz to sample rate / 2</li></ul>                                |
:::


::: danger TODO
Check information
:::