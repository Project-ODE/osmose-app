import { AnnotatorState } from './type.ts';
import { AnnotationResult } from '@/service/campaign/result';

export function getDefaultConfidence(state: AnnotatorState) {
  if (!state.confidenceIndicators) return undefined;
  const defaultIndicator = state.confidenceIndicators.find(c => c.is_default);
  return defaultIndicator ?? state.confidenceIndicators.find(c => c)
}

export function getPresenceLabels(results?: Array<AnnotationResult>) {
  if (!results) return [];
  return [ ...new Set(results.map(s => s.label)) ]
}
