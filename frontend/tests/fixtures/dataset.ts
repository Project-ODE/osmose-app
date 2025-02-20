import { SpectrogramConfiguration } from '../../src/service/dataset/spectrogram-configuration';
import { Dataset, ImportDataset } from '../../src/service/dataset';
import { AudioMetadatum } from '../../src/service/dataset/audio-metatada';

export const DATASET_SR: number = 480
export const SPECTROGRAM_CONFIGURATION: SpectrogramConfiguration = {
  id: 1,
  name: '2048_2048_50',
  desc: '',
  nfft: 2048,
  window_size: 2048,
  overlap: 50,
  hp_filter_min_freq: 1000,
  colormap: 'viridis',
  data_normalization: 'instrument',
  dynamic_min: 30,
  dynamic_max: 60,
  frequency_resolution: 250,
  spectro_normalization: 'density',
  time_resolution_zoom_0: 0,
  time_resolution_zoom_1: 0,
  time_resolution_zoom_2: 0,
  time_resolution_zoom_3: 0,
  time_resolution_zoom_4: 0,
  time_resolution_zoom_5: 0,
  time_resolution_zoom_6: 0,
  time_resolution_zoom_7: 0,
  time_resolution_zoom_8: 0,
  zscore_duration: 'original',
  window_type: null,
  linear_frequency_scale: null,
  multi_linear_frequency_scale: null,
  folder_path: '',
  dataset_sr: DATASET_SR,
  spectro_duration: 10,
  zoom_level: 2,
}
export const AUDIO_METADATA: AudioMetadatum = {
  id: 1,
  channel_count: 8,
  dataset_sr: 240,
  end: "2022-07-13T06:00:00Z",
  files_subtypes: [ "8" ],
  start: "2021-08-02T00:00:00Z",
}
export const DATASET: Dataset = {
  id: 1,
  name: 'Test dataset',
  created_at: new Date().toISOString(),
  files_type: ".wav",
  start_date: "2010-08-19",
  end_date: "2010-11-02",
  files_count: 99,
  type: "Coastal audio recordings",
  spectros: [ SPECTROGRAM_CONFIGURATION ],
}
export const IMPORT_DATASET: ImportDataset = {
  name: 'Test import dataset',
  dataset: 'Test import dataset',
  dataset_sr: DATASET_SR.toString(),
  path: 'mypath/dataset',
  file_type: ".wav",
  spectro_duration: '3600'
}