import { WeakResult } from './type';

export const DEFAULT_PRESENCE_RESULT: WeakResult = {
  id: -1,
  label: "",
  confidence_indicator: null,
  type: 'Weak',
  start_time: null,
  end_time: null,
  start_frequency: null,
  end_frequency: null,
  comments: [],
  validations: [],
  detector_configuration: null,
  dataset_file: -1,
  annotator: -1,
  annotation_campaign: -1,
  acoustic_features: null
}
