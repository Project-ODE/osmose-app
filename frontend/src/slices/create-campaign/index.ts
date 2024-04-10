import { createSlice } from "@reduxjs/toolkit";
import {
  DatasetListItem as Dataset,
  ConfidenceSetListItem as ConfidenceSet,
} from "@/services/api"
import { Usage } from "@/types/annotations.ts";
import { CSVDetectorItem, AnnotationsCSV } from "@/types/csv-import-annotations.ts";
import { User } from '@/types/user.ts';
import { LabelSet } from "@/types/label.ts";
import { SpectrogramConfiguration } from "@/types/process-metadata/spectrograms.ts";



export type CreateCampaignSlice = {
  name: string | undefined;
  description: string | undefined;
  instructionURL: string | undefined;
  deadline: string | undefined;

  dataset: Dataset | undefined;
  datasetSpectroConfigs: Array<SpectrogramConfiguration>;

  usage: Usage | undefined;
  labelSet: LabelSet | undefined;
  confidenceSet: ConfidenceSet | undefined;
  detectors: Array<CSVDetectorItem & { display_name: string }>;
  csv: AnnotationsCSV | undefined;

  annotators: Array<User>;
  annotatorsPerFile: number;
}

export const createCampaignSlice = createSlice({
  name: 'Create campaign',
  initialState: {
    name: undefined,
    description: undefined,
    instructionURL: undefined,
    deadline: undefined,

    dataset: undefined,
    datasetSpectroConfigs: [],

    usage: undefined,
    labelSet: undefined,
    confidenceSet: undefined,
    detectors: [],
    csv: undefined,

    annotators: [],
    annotatorsPerFile: 0,
  } as CreateCampaignSlice,

  reducers: {
    updateName: (state, action: { payload: string }) => {
      state.name = action.payload;
    },
    updateDescription: (state, action: { payload: string }) => {
      state.description = action.payload;
    },
    updateInstructionURL: (state, action: { payload: string }) => {
      state.instructionURL = action.payload;
    },
    updateDeadline: (state, action: { payload: string }) => {
      state.deadline = action.payload;
    },

    updateDataset: (state, action: { payload: Dataset | undefined }) => {
      state.dataset = action.payload;
    },
    updateDatasetSpectroConfigs: (state, action: { payload: Array<SpectrogramConfiguration> | undefined }) => {
      state.datasetSpectroConfigs = action.payload ?? [];
    },

    updateAnnotators: (state, action: { payload: Array<User> | undefined }) => {
      state.annotators = action.payload ?? [];
    },
    updateAnnotatorsPerFile: (state, action: { payload: number | undefined }) => {
      state.annotatorsPerFile = action.payload ?? 0;
    },

    updateUsage: (state, action: { payload: Usage | undefined }) => {
      state.usage = action.payload;
    },
    updateLabelSet: (state, action: { payload: LabelSet | undefined }) => {
      state.labelSet = action.payload;
    },
    updateConfidenceSet: (state, action: { payload: ConfidenceSet | undefined }) => {
      state.confidenceSet = action.payload;
    },
    updateDetectors: (state, action: { payload: Array<CSVDetectorItem & { display_name: string }> | undefined }) => {
      state.detectors = action.payload ?? [];
    },

    setDetectors: (state, action: { payload: Array<CSVDetectorItem & { display_name: string }> }) => {
      state.detectors = action.payload;
    }
  },
})

export const createCampaignReducer = createCampaignSlice.reducer
export const createCampaignActions = createCampaignSlice.actions
