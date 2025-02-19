# Générer un dataset

Toutes les campagnes d'annotation sont basées sur un jeu de données. Chaque jeu de données doit être importé.

Les jeux de données doivent être placés dans un dossier `datasets`.

## OSEkit <Badge type="tip" text="Recommandé" />

Nous avons développé notre package Python pour manipuler les fichiers audio.
Ce package permet de sortir directement l'ensemble des données dans une structure de fichier qui peut être lue par
APLOSE.

Ce package est disponible sur GitHub : https://github.com/Project-OSmOSE/OSEkit

Vous pouvez également accéder directement à sa documentation : https://project-osmose.github.io/OSEkit/

## Manuellement

Pour créer un jeu de données manuellement, vous devez comprendre la structure de fichier attendue et les fichiers de
métadonnées.

### Structure des fichiers

Le dossier racine est nommé `dataset`.

```
dataset/
├── datasets.csv
├── {Campagne d'acquisition}/
│ ├─── {Dataset}
│ └── ...
├── {Dataset}
└── ...
```

Les dossiers des jeux de données peuvent être situés à la racine ou dans un dossier « Campagne d'acquisition ».
Chaque dossier de jeu de données contient la structure de fichier décrite ci-dessous.

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

Tous les spectrogrammes doivent être pré-calculés et disponibles dans le dossier dataset.
Il doit y avoir au moins une image de spectrogramme par fichier audio.

Pour récupérer l'image appropriée dans l'affichage de l'annotateur, APLOSE utilise le nom du fichier audio, le niveau de
zoom et l'index dans le niveau de zoom pour obtenir le nom de l'image.
Les niveaux de zoom augmentent comme une puissance de 2.
Le nom du spectrogramme est très important.

::: details Comprendre le nommage de l'image du spectrogramme
Pour un fichier audio « sound.wav », il doit y avoir au moins une image « sound_1_0.png » : elle correspond au premier
niveau de zoom et à la première (et unique) image.

Pour un deuxième niveau de zoom :

- sound_2_0.png
- sound_2_1.png

Pour un troisième niveau :

- sound_4_0.png
- sound_4_1.png
- sound_4_2.png
- sound_4_3.png

Et ainsi de suite...

:::

### Fichiers de métadonnées

#### datasets.csv

_Situé à ./datasets.csv_

C'est ici qu'APLOSE recherchera de nouveaux jeux de données.
Ce fichier liste l'ensemble des jeux de données disponibles et donne des informations pour récupérer les fichiers audio
et les spectrogrammes.

| Column           |  Type  | Description                                                                                                            |
|------------------|:------:|------------------------------------------------------------------------------------------------------------------------|
| path             | string | Chemin d'accès au dossier racine de l'ensemble de données (par exemple: {Acquisition campaign}/{Dataset} or {Dataset}) |
| dataset          | string | Nom du jeux de données dans APLOSE, ce nom peut être différent du nom du dossier et doit être unique dans APLOSE.      |
| spectro_duration |  int   | Durée des fichiers                                                                                                     |
| dataset_sr       |  int   | Fréquence d'échantillonnage                                                                                            |
| file_type        | string | Type de fichiers utilisés (par exemple: .wav)                                                                          |

#### [Audio] metadata.csv

_Situé à ./{Dataset}/data/audio/{Spectrogram duration}\_{Sample rate}/metadata.csv_

Ce fichier décrit les fichiers audio. Il donne des informations sur le processus qu'ils ont suivi.

| Column                      |      Type       | Description                                       |
|-----------------------------|:---------------:|---------------------------------------------------|
| origin_sr                   |       int       | Fréquence d'échantillonnage des audio originaux   |
| sample_bits                 | array of string | Sous-types des fichiers (par exemple: ['PCM-16']) |
| channel_count               |       int       | Nombre de canaux du fichier                       |
| start_date                  |    timestamp    | Début du dataset                                  |
| end_date                    |    timestamp    | Fin du dataset                                    |
| audio_file_origin_duration  |       int       | Durée des fichiers originaux                      |
| audio_file_origin_volume    |      float      |                                                   |
| dataset_origin_volume       |       int       |                                                   |
| dataset_origin_duration     |       int       | Durée totale du dataset                           |
| is_built                    |     boolean     |                                                   |
| audio_file_dataset_overlap  |       int       | Overlap temporel entre deux fichiers              |
| lat                         |      float      | Latitude de l'enregistrement                      |
| long                        |      float      | Longitude de l'enregistrement                     |
| depth                       |    int (>0)     | Profondeur de l'instrument (en mètre positif)     |
| dataset_sr                  |       int       | Fréquence d'échantillonnage des fichiers traités  |
| audio_file_dataset_duration |       int       | Durée des fichiers traites                        |

::: danger TODO
Check information
:::

#### [Audio] timestamp.csv

_Situé à ./{Dataset}/data/audio/{Spectrogram duration}\_{Sample rate}/timestamp.csv_

Ce fichier répertorie tous les fichiers audio. APLOSE l'utilise par-dessus la structure des fichiers pour savoir quels
fichiers utiliser.

::: info

Cela signifie que vous pouvez créer un sous-ensemble en supprimant des fichiers de ce CSV.
Ou si vous ne voulez pas écouter d'audio pendant que vous annotez, vous pouvez ajouter ce CSV sans les fichiers wav
associés.

:::

| Column    |   Type    | Description                       |
|-----------|:---------:|-----------------------------------|
| filename  |  string   | Nom des fichiers (avec extension) |
| timestamp | timestamp | Début de l'enregistrement         |

#### [Spectrogram] metadata.csv

_Situé à ./{Dataset}/processed/spectrogram/{Spectrogram duration}\_{Sample rate}/{NFFT}\_{Window
size}\_{Overlap}\_{frequency scale}/metadata.csv_

Ces fichiers décrivent le processus de génération de spectrogrammes.

| Column                        |  Type  | Description                                |
|-------------------------------|:------:|--------------------------------------------|
| dataset_name                  | string | Nom du jeu de données                      |
| dataset_sr                    |  int   | Fréquence d'échantillonnage                |
| nfft                          |  int   |                                            |
| window_size                   |  int   |                                            |
| overlap                       |  int   | Overlap temporel entre deux fichiers       |
| colormap                      | string | Colormap utilisée pour généré les fichiers |
| zoom_level                    |  int   | Niveaux de zoom disponibles                |
| number_adjustment_spectrogram |  int   |                                            |
| dynamic_min                   |  int   |                                            |
| dynamic_max                   |  int   |                                            |
| spectro_duration              |  int   | Durée des spectrogrammes (en secondes)     |
| audio_file_folder_name        | string |                                            |
| data_normalization            | string |                                            |
| hp_filter_min_freq            |  int   |                                            |
| sensitivity_dB                | float  | Sensibilité de l'instrument, en dB         |
| peak_voltage                  | float  |                                            |
| spectro_normalization         | string |                                            |
| gain_dB                       |  int   | Gain de l'instrument, en dB                |
| zscore_duration               | string |                                            |
| window_type                   | string |                                            |
| number_spectra                |  int   |                                            |
| frequency_resolution          | float  |                                            |
| temporal_resolution           | float  |                                            |
| audio_file_dataset_overlap    |  int   |                                            |
| custom_frequency_scale        | string | Nom de l'échelle de fréquence à appliquer  |

<!--@include: ../../parts/frequency-scales.md-->

::: danger TODO
Check information
:::