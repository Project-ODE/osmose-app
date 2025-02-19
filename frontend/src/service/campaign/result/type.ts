import { DetectorConfiguration } from '@/service/campaign/detector';
import { AnnotationComment, WriteAnnotationComment } from '@/service/campaign/comment';

export interface AnnotationResultValidations {
  id: number;
  annotator: number; // pk - read only
  result: number; // pk - read only
  is_valid: boolean;
}

export interface AnnotationResultBounds {
  start_time: number | null; // null for presence
  end_time: number | null; // null for presence or point
  start_frequency: number | null; // null for presence
  end_frequency: number | null; // null for presence or point
}

export const SignalTrends = [ "Flat", "Ascending", "Descending", "Modulated" ];
export type SignalTrend = typeof SignalTrends[number];

export interface AcousticFeatures {
  start_frequency: number | null;
  end_frequency: number | null;

  relative_max_frequency_count: number | null;
  relative_min_frequency_count: number | null;

  has_harmonics: boolean | null;
  trend: SignalTrend | null;
  steps_count: number | null;
}

export interface AnnotationResult extends AnnotationResultBounds {
  id: number;
  label: string;
  confidence_indicator: string | null;
  annotation_campaign: number; // pk - read only
  annotator: number | null; // pk - read only
  dataset_file: number; // pk - read only
  detector_configuration: DetectorConfiguration & { detector: string } | null;
  comments: Array<AnnotationComment>;
  validations: Array<AnnotationResultValidations>;
  acoustic_features: AcousticFeatures | null;
}

export type WriteAnnotationResult =
  Omit<AnnotationResult, "id" | "comments" | "validations" | "annotation_campaign" | "dataset_file" | "annotator" | "confidence_indicator" | "detector_configuration">
  & {
  id?: number;
  confidence_indicator: string | undefined;
  detector_configuration: DetectorConfiguration & { detector: string } | undefined;
  comments: Array<WriteAnnotationComment>;
  validations: Array<Omit<AnnotationResultValidations, "id" | "annotator" | "result"> & { id?: number }>;
  acoustic_features: AcousticFeatures | null;
};

export interface ImportAnnotationResult {
  is_box: boolean;
  dataset: string;
  detector: string;
  detector_config: string;
  start_datetime: string; // datetime
  end_datetime: string; // datetime
  min_frequency: number;
  max_frequency: number;
  label: string;
  confidence_indicator: string | null;
}