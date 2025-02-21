import { User } from '@/service/user';
import { Errors } from '@/service/type.ts';
import { WriteAnnotationFileRange } from '@/service/campaign/annotation-file-range';
import { ACCEPT_CSV_MIME_TYPE } from '@/consts/csv.ts';
import { Detector, DetectorConfiguration } from '@/service/campaign/detector';

export type AnnotationCampaignUsage = 'Create' | 'Check';

export type AnnotationCampaignArchive = {
  id: number;
  date: string; // Date
  by_user: User
}

export type BaseAnnotationCampaign = {
  name: string;
  desc: string | null;
  instructions_url: string | null;
  deadline: string | null; // Date
  datasets: Array<string>; // name
  spectro_configs: Array<number>; //pk
  labels_with_acoustic_features: Array<string>;
  allow_image_tuning: boolean;
  allow_colormap_tuning: boolean;
}

/**
 * Read interface
 */
export type AnnotationCampaign = BaseAnnotationCampaign & {
  id: number;
  created_at: string; // Date
  label_set: number; // pk
  labels_with_acoustic_features: Array<string>; // Labels
  usage: AnnotationCampaignUsage;
  owner: string; // username
  confidence_indicator_set: number | null; // pk
  archive: AnnotationCampaignArchive | null; // read_only

  files_count: number; // read_only
  my_progress: number; // read_only
  my_total: number; // read_only
  progress: number; // read_only
  total: number; // read_only
}

/**
 * Write interface for 'Create annotations' usage
 */
export type WriteCreateAnnotationCampaign = BaseAnnotationCampaign & {
  usage: 'Create';
  label_set: number; // pk
  confidence_indicator_set: number | null; // pk
}

/**
 * Write interface for 'Check annotations' usage
 */
export type WriteCheckAnnotationCampaign = BaseAnnotationCampaign & {
  usage: 'Check';
}
export type WriteAnnotationCampaign = WriteCheckAnnotationCampaign | WriteCreateAnnotationCampaign

export type CampaignState = {
  currentCampaign: AnnotationCampaign | undefined;
  draftCampaign: Partial<WriteAnnotationCampaign>;
  submissionErrors: CampaignErrors;

  resultImport: {
    fileData?: FileData;
    filterDatasets?: Array<string>;
    detectors?: Array<DetectorSelection>,
    filterDetectors?: Array<string>; // initialName
    isSubmitted: boolean;
    error?: string;
    isLoading: boolean;
  },
  draftFileRanges: Array<Partial<WriteAnnotationFileRange> & {
    id: number,
    annotator: number,
    finished_tasks_count?: number
  }>;
}

export type FileData = {
  filename: string;
  type: string;
  datasets: Array<string>;
  detectorsForDatasets: { [key in string]: Array<string> }; // dataset -> Array<detector>
  detectors: Array<string>;
  labels: Array<string>;
}

export type CampaignErrors = Errors<WriteCheckAnnotationCampaign> & Errors<WriteCreateAnnotationCampaign>;

export class UnreadableFileError extends Error {
  message = 'Error reading file, check the file isn\'t corrupted'
}

export class WrongMIMETypeError extends Error {
  constructor(type: string) {
    super(`Wrong MIME Type, found : ${ type } ; but accepted types are: ${ ACCEPT_CSV_MIME_TYPE }`);
  }
}

export class UnsupportedCSVError extends Error {
  message = `The file is empty or it does not contain a string content.`
}

export class CannotFormatCSVError extends Error {
  message = 'Cannot format the file data'
}

export interface DetectorSelection {
  initialName: string;
  isNew: boolean;
  knownDetector?: Detector; // isNew = false
  isNewConfiguration?: boolean;
  knownConfiguration?: DetectorConfiguration; // isNewConfiguration = false
  newConfiguration?: string; // isNewConfiguration = true
}