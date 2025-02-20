import { USERS } from './user';
import { AnnotationCampaign } from '../../src/service/campaign';
import { DATASET, DATASET_SR, SPECTROGRAM_CONFIGURATION } from './dataset';
import { LabelSet } from '../../src/service/campaign/label-set';
import { ConfidenceIndicator, ConfidenceIndicatorSet } from '../../src/service/campaign/confidence-set';
import { AnnotationFile, AnnotationFileRange } from '../../src/service/campaign/annotation-file-range/type';
import { Detector } from '../../src/service/campaign/detector';

const deadline = new Date()
deadline.setTime(0)

const classic = 'Rain'
const withFeatures = 'Whistle'
export const LABEL = {
  classic, withFeatures,
  set: {
    id: 1,
    name: 'Test label set',
    labels: [ classic, withFeatures ]
  } satisfies LabelSet
}

const notSure: ConfidenceIndicator = {
  id: 1,
  level: 0,
  is_default: false,
  label: 'not sure'
}
const sure: ConfidenceIndicator = {
  id: 2,
  level: 1,
  is_default: true,
  label: 'sure'
}
export const CONFIDENCE = {
  sure, notSure,
  set: {
    id: 1,
    name: 'Test confidence set',
    desc: 'My test confidence indicator set',
    confidence_indicators: [ notSure, sure ]
  } satisfies ConfidenceIndicatorSet
}

export const CAMPAIGN = {
  id: 1,
  owner: USERS.creator.username,
  name: 'Test campaign',
  desc: 'Test campaign description',
  deadline: deadline.toISOString().split('T')[0],
  files_count: DATASET.files_count,
  created_at: new Date().toISOString(),
  label_set: LABEL.set.id,
  confidence_indicator_set: CONFIDENCE.set.id,
  instructions_url: 'testurl.fr',
  datasets: [ DATASET.name ],
  spectro_configs: [ SPECTROGRAM_CONFIGURATION.id ],
  labels_with_acoustic_features: [ LABEL.withFeatures ],
  usage: 'Create',
  archive: null,
  my_progress: 5,
  my_total: 10,
  progress: 50,
  total: 100,
} satisfies AnnotationCampaign

const start = new Date();
const end = new Date(start.toISOString());
end.setTime(start.getTime() + 10_000);

export const FILE_RANGE = {
  unsubmittedFile: {
    id: 1,
    is_submitted: false,
    results_count: 0,
    dataset_sr: DATASET_SR,
    dataset_name: DATASET.name,
    filename: 'File 2',
    start: start.toISOString(),
    end: end.toISOString(),
    size: 0,
    audio_url: ''
  } satisfies AnnotationFile,
  submittedFile: {
    id: 2,
    is_submitted: true,
    results_count: 2,
    dataset_sr: DATASET_SR,
    dataset_name: DATASET.name,
    filename: 'File 1',
    start: start.toISOString(),
    end: end.toISOString(),
    size: 0,
    audio_url: ''
  } satisfies AnnotationFile,
  range: {
    id: 1,
    files_count: 2,
    first_file_index: 2,
    last_file_index: 3,
    finished_tasks_count: 1,
    annotation_campaign: CAMPAIGN.id,
    annotator: USERS.annotator.id
  } satisfies AnnotationFileRange,
}

export const DETECTOR_CONFIGURATION = 'Test configuration';
export const DETECTOR: Detector = {
  name: 'detector1',
  id: 1,
  configurations: [ {
    id: 1,
    configuration: DETECTOR_CONFIGURATION
  } ]
}
