import { DetectorConfiguration } from '@/service/campaign/detector';
import { AnnotationComment } from '@/services/api';
import { WriteAnnotationComment } from '@/services/api/annotation/comment.service.tsx';

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

export interface AnnotationResult extends AnnotationResultBounds {
  id: number;
  label: string;
  confidence_indicator: string | null;
  annotation_campaign: number; // pk - read only
  annotator: number; // pk - read only
  dataset_file: number; // pk - read only
  detector_configuration: DetectorConfiguration & { detector: string } | null;
  comments: Array<AnnotationComment>;
  validations: Array<AnnotationResultValidations>;
}

export type WriteAnnotationResult =
  Omit<AnnotationResult, "id" | "comments" | "validations" | "annotation_campaign" | "dataset_file" | "annotator">
  & {
  id: number | null;
  comments: Array<WriteAnnotationComment>;
  validations: Array<Omit<AnnotationResultValidations, "id" | "annotator" | "result"> & { id: number | null }>;
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