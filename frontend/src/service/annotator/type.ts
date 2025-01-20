import { DatasetFile } from '@/service/dataset';
import { AnnotationResult, WriteAnnotationResult } from '@/service/campaign/result';
import { SpectrogramConfiguration } from '@/service/dataset/spectrogram-configuration';
import { AnnotationComment, WriteAnnotationComment } from '@/service/campaign/comment';

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
}


export type AnnotatorData = {
  is_submitted: boolean;
  campaignID: number;
  userID: number
  file: DatasetFile;
  results: Array<AnnotationResult>;
  task_comments: Array<AnnotationComment>;
  spectrogram_configurations: Array<SpectrogramConfiguration>;
  previous_file_id: number | null;
  next_file_id: number | null;
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
