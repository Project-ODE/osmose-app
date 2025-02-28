import { AnnotatorState, ResultType } from './type.ts';
import { AnnotationResult, AnnotationResultBounds } from '@/service/campaign/result';

export function getDefaultConfidence(state: AnnotatorState) {
  if (!state.confidenceIndicators) return undefined;
  const defaultIndicator = state.confidenceIndicators.find(c => c.is_default);
  return defaultIndicator ?? state.confidenceIndicators.find(c => c)
}

export function getPresenceLabels(results?: Array<AnnotationResult>) {
  if (!results) return [];
  return [ ...new Set(results.map(s => s.label)) ]
}

export function getResultType(result: AnnotationResultBounds): ResultType {
  if (result.start_time !== null && result.start_frequency !== null) {
    if (result.end_time !== null && result.end_frequency !== null) return 'box';
    return 'point';
  }
  return 'presence';
}
