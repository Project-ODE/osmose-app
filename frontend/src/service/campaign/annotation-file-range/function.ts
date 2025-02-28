import { FileFilters } from "@/service/ui/type.ts";

export function getQueryParamsForFilters(filters: Partial<FileFilters>): any {
  const params: any = { }
  if (filters.search) params['filename__icontains'] = filters.search;
  if (filters.withUserAnnotations !== undefined) params['with_user_annotations'] = filters.withUserAnnotations;
  if (filters.isSubmitted !== undefined) params['is_submitted'] = filters.isSubmitted;
  if (filters.label !== undefined) params['annotation_results__label__name'] = filters.label;
  if (filters.confidence !== undefined) params['annotation_results__confidence_indicator__label'] = filters.confidence;
  if (filters.detector !== undefined) params['annotation_results__detector_configuration__detector__name'] = filters.detector;
  if (filters.hasAcousticFeatures !== undefined) params['annotation_results__acoustic_features__isnull'] = !filters.hasAcousticFeatures;
  if (filters.minDate !== undefined) params['end__gte'] = filters.minDate;
  if (filters.maxDate !== undefined) params['start__lte'] = filters.maxDate;
  return params;
}