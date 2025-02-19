export {
  AnnotatorAPI,
  usePostAnnotatorMutation,
  useRetrieveAnnotatorQuery,
} from './api';

export {
  CANVAS_DIMENSIONS
} from './const'

export {
  getPresenceLabels,
  getResultType,
  getDefaultConfidence,
} from './function';

export * from './slice';


export type {
  ResultType,
  AnnotatorData,
  WriteAnnotatorData,
  AnnotatorState,
} from './type';