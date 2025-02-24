export interface AudioMetadatum {
  id: number;
  start: string;
  end: string;
  channel_count: number;
  audio_file_count: number;
  audio_file_dataset_duration: number;
  dataset_sr: number;
  total_samples?: number;
  files_subtypes: Array<string>;
  gain_db?: number;
  gain_rel?: number;
  dutycycle_rdm?: number;
  dutycycle_rim?: number;
}
