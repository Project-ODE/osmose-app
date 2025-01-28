import { DatasetFile } from '@/service/dataset';
import { AnnotationResult, WriteAnnotationResult } from '@/service/campaign/result';
import { SpectrogramConfiguration } from '@/service/dataset/spectrogram-configuration';
import { AnnotationComment, WriteAnnotationComment } from '@/service/campaign/comment';
import { ConfidenceIndicator } from "@/service/campaign/confidence-set";
import { ID } from "@/service/type.ts";
import { FileFilters } from "@/service/ui/type.ts";

export type AnnotatorState = Partial<AnnotatorData> & {
  focusedResultID?: number,
  focusedCommentID?: number,
  focusedLabel?: string,
  focusedConfidenceLabel?: string,
  hasChanged: boolean,
  labelColors: { [key: string]: string };
  userPreferences: {
    audioSpeed: number;
    spectrogramConfigurationID: number;
    zoomLevel: number;
    colormap: string;
    colormapInverted: boolean;
    brightness: number;
    contrast: number;
  },
  ui: {
    pointerPosition?: { time: number, frequency: number },
    zoomOrigin?: { x: number, y: number },
  },
  audio: {
    time: number;
    isPaused: boolean;
    stopTime?: number;
  },
  sessionStart: number;
  confidenceIndicators?: ConfidenceIndicator[];
}


export type AnnotatorData = {
  is_submitted: boolean;
  is_assigned: boolean; // Is the user allowed to edit this file
  campaignID: number;
  userID: number
  file: DatasetFile;
  results: Array<AnnotationResult>;
  task_comments: Array<AnnotationComment>;
  spectrogram_configurations: Array<SpectrogramConfiguration>;
  previous_file_id: number | null;
  next_file_id: number | null;

  current_task_index: number;
  total_tasks: number;
  current_task_index_in_filter: number;
  total_tasks_in_filter: number;
}

export type WriteAnnotatorData = {
  results: Array<WriteAnnotationResult>;
  task_comments: Array<WriteAnnotationComment>;
  session: {
    start: Date; // Send ISO String
    end: Date; // Send ISO String
  },
}

export type ResultType = 'presence' | 'point' | 'box';

export type RetrieveParams = { campaignID: ID, fileID: ID } & Partial<FileFilters>