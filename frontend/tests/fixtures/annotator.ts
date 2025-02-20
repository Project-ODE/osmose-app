import { AnnotatorData } from '../../src/service/annotator';
import { AnnotationComment } from '../../src/service/campaign/comment';
import { CAMPAIGN, CONFIDENCE, DETECTOR, FILE_RANGE, LABEL } from './campaign';
import { USERS } from './user';
import { BoxResult, WeakResult } from '../../src/service/campaign/result';
import { DATASET } from './dataset';

export const COMMENT = {
  task: {
    id: 1,
    comment: 'A task comment',
    annotation_campaign: CAMPAIGN.id,
    annotation_result: null,
    author: USERS.annotator.id,
    dataset_file: FILE_RANGE.unsubmittedFile.id
  } satisfies AnnotationComment,
  presence: {
    id: 2,
    comment: 'A presence comment',
    annotation_campaign: CAMPAIGN.id,
    annotation_result: 1, // RESULTS.presence.id
    author: USERS.annotator.id,
    dataset_file: FILE_RANGE.unsubmittedFile.id
  } satisfies AnnotationComment
}
export const RESULTS: { presence: WeakResult, box: BoxResult } = {
  presence: {
    id: 1,
    label: LABEL.classic,
    type: 'Weak',
    start_time: null,
    end_time: null,
    start_frequency: null,
    end_frequency: null,
    acoustic_features: null,
    annotation_campaign: CAMPAIGN.id,
    dataset_file: FILE_RANGE.unsubmittedFile.id,
    comments: [ COMMENT.presence ],
    confidence_indicator: CONFIDENCE.sure.label,
    annotator: USERS.annotator.id,
    validations: [],
    detector_configuration: null,
  },
  box: {
    id: 2,
    label: LABEL.classic,
    type: 'Box',
    start_time: 5,
    end_time: 10,
    start_frequency: 12,
    end_frequency: 40,
    acoustic_features: null,
    annotation_campaign: CAMPAIGN.id,
    dataset_file: FILE_RANGE.unsubmittedFile.id,
    comments: [],
    confidence_indicator: CONFIDENCE.notSure.label,
    annotator: USERS.annotator.id,
    validations: [],
    detector_configuration: null,
  }
}
export const CREATE_DATA: (empty?: boolean) => AnnotatorData = empty => ({
  is_submitted: false,
  is_assigned: true,
  task_comments: empty ? [] : [ COMMENT.task ],
  campaignID: CAMPAIGN.id,
  results: empty ? [] : [ RESULTS.presence, RESULTS.box ],
  file: FILE_RANGE.unsubmittedFile,
  previous_file_id: FILE_RANGE.submittedFile.id,
  next_file_id: null,
  spectrogram_configurations: DATASET.spectros,
  userID: USERS.annotator.id,
  current_task_index: 2,
  current_task_index_in_filter: 2,
  total_tasks: FILE_RANGE.range.files_count,
  total_tasks_in_filter: FILE_RANGE.range.files_count
})
export const CHECK_DATA: (empty?: boolean) => AnnotatorData = empty => ({
  is_submitted: false,
  is_assigned: true,
  task_comments: empty ? [] : [ COMMENT.task ],
  campaignID: CAMPAIGN.id,
  results: empty ? [] : [ {
    ...RESULTS.presence,
    annotator: null,
    detector_configuration: { ...DETECTOR.configurations[0], detector: DETECTOR.name },
  }, {
    ...RESULTS.box,
    annotator: null,
    detector_configuration: { ...DETECTOR.configurations[0], detector: DETECTOR.name },
  } ],
  file: FILE_RANGE.unsubmittedFile,
  previous_file_id: FILE_RANGE.submittedFile.id,
  next_file_id: null,
  spectrogram_configurations: DATASET.spectros,
  userID: USERS.annotator.id,
  current_task_index: 2,
  current_task_index_in_filter: 2,
  total_tasks: FILE_RANGE.range.files_count,
  total_tasks_in_filter: FILE_RANGE.range.files_count
})