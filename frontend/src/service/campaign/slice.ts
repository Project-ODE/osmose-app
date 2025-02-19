import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { CampaignAPI } from './api.ts';
import {
  CampaignState,
  CannotFormatCSVError,
  DetectorSelection,
  FileData,
  UnreadableFileError,
  UnsupportedCSVError,
  WriteAnnotationCampaign,
  WrongMIMETypeError
} from './type';
import { Errors } from '@/service/type.ts';
import { AnnotationFileRange, WriteAnnotationFileRange } from '@/service/campaign/annotation-file-range';
import { getNewItemID } from '@/service/function.ts';
import { AnnotationResultAPI } from '@/service/campaign/result';
import { ACCEPT_CSV_MIME_TYPE, ACCEPT_CSV_SEPARATOR, IMPORT_ANNOTATIONS_COLUMNS } from '@/consts/csv.ts';
import { formatCSV } from '@/services/utils/format.tsx';

export const loadFile = createAsyncThunk(
  'campaign/loadFile',
  async (file: File) => {
    if (!ACCEPT_CSV_MIME_TYPE.includes(file.type)) throw new WrongMIMETypeError(file.type);

    return await new Promise<FileData>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsText(file, 'UTF-8');
      reader.onerror = () => reject(new UnreadableFileError())
      reader.onload = (event) => {
        const result = event.target?.result;
        if (!result || typeof result !== 'string') {
          reject(new UnsupportedCSVError())
          return;
        }

        try {
          const data = formatCSV(
            result,
            ACCEPT_CSV_SEPARATOR,
            IMPORT_ANNOTATIONS_COLUMNS
          );
          if (!data) {
            reject(new CannotFormatCSVError())
            return;
          }

          const getDetectors = (data: Array<{
            dataset: string,
            annotator: string
          }>) => [ ...new Set(data.map(d => d.annotator)) ].sort()

          const datasets = [ ...new Set(data.map(d => d.dataset)) ];
          const detectorsForDatasets: { [key in string]: Array<string> } = {}
          for (const dataset of datasets) {
            detectorsForDatasets[dataset] = getDetectors(data.filter(d => d.dataset === dataset));
          }

          resolve({
            filename: file.name,
            type: file.type,
            datasets, detectorsForDatasets,
            detectors: getDetectors(data),
            labels: [ ...new Set(data.map(d => d.annotation)) ].sort()
          })
        } catch (e) {
          reject(e)
        }
      }
    })
  }
)

function _addDraftFileRange(state: CampaignState, { payload }: {
  payload: Partial<WriteAnnotationFileRange> & { annotator: number }
}) {
  if (state.draftFileRanges.find(r => r.id === payload.id)) {
    state.draftFileRanges = state.draftFileRanges.map(r => r.id === payload.id ? { ...payload, id: r.id } : r)
  } else {
    state.draftFileRanges.push({
      ...payload,
      id: payload.id ?? getNewItemID(state.draftFileRanges)
    });
  }
}

export const CampaignSlice = createSlice({
  name: 'campaign',
  initialState: {
    currentCampaign: undefined,
    draftCampaign: {},
    submissionErrors: {},
    draftFileRanges: [],
    resultImport: { isSubmitted: false, isLoading: false },
  } satisfies CampaignState as CampaignState,
  reducers: {
    clear: (state) => {
      state.currentCampaign = undefined;
      state.draftCampaign = {};
      state.draftFileRanges = [];
      state.submissionErrors = {};
      state.resultImport = { isSubmitted: false, isLoading: false };
    },
    clearDraft: (state) => {
      state.draftCampaign = {};
      state.draftFileRanges = [];
      state.submissionErrors = {};
      state.resultImport = { isSubmitted: false, isLoading: false };
    },
    updateDraftCampaign: (state, { payload }: { payload: Partial<WriteAnnotationCampaign> }) => {
      Object.assign(state.draftCampaign, payload);
    },
    updateSubmissionErrors: (state, { payload }: { payload: Errors<WriteAnnotationCampaign> }) => {
      for (const [ key, value ] of Object.entries(payload)) {
        if (value !== undefined) state.submissionErrors[key as keyof WriteAnnotationCampaign] = value;
        else delete state.submissionErrors[key as keyof WriteAnnotationCampaign];
      }
    },

    addDraftFileRange: _addDraftFileRange,
    loadDraftFileRange: (state, { payload }: { payload: AnnotationFileRange[] }) => {
      for (const range of payload) {
        _addDraftFileRange(state, {
          payload: {
            ...range,
            first_file_index: range.first_file_index + 1,
            last_file_index: range.last_file_index + 1,
          }
        })
      }
    },
    updateDraftFileRange: (state, { payload }: { payload: Partial<WriteAnnotationFileRange> & { id: number } }) => {
      state.draftFileRanges = state.draftFileRanges.map(r => {
        if (r.id !== payload.id) return r;
        return {
          ...r,
          ...payload
        }
      });
    },
    removeDraftFileRange: (state, { payload }: { payload: number }) => {
      state.draftFileRanges = state.draftFileRanges.filter(r => r.id !== payload);
    },

    clearImport: (state) => {
      state.resultImport = { isSubmitted: false, isLoading: false };
    },
    setFilteredDatasets: (state, { payload }: { payload: Array<string> }) => {
      state.resultImport.filterDatasets = payload;
    },
    setDetectors: (state, { payload }: { payload: Array<DetectorSelection> }) => {
      state.resultImport.detectors = payload;
      state.resultImport.filterDetectors = payload.map(d => d.initialName);
    },
    setFilteredDetectors: (state, { payload }: { payload: Array<string> }) => {
      state.resultImport.filterDetectors = payload;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(
      loadFile.pending,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (state) => {
        state.resultImport = { isSubmitted: false, isLoading: true };
      }
    )
    builder.addCase(
      loadFile.fulfilled,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (state, { payload }) => {
        state.resultImport = { isSubmitted: false, isLoading: false, fileData: payload };
      }
    )
    builder.addCase(
      loadFile.rejected,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (state, action) => {
        state.resultImport = { isSubmitted: false, isLoading: false, error: action.error.message };
      }
    )
    builder.addMatcher(
      CampaignAPI.endpoints.retrieve.matchFulfilled,
      (state, { payload }) => {
        state.currentCampaign = payload;
      },
    )
    builder.addMatcher(
      CampaignAPI.endpoints.create.matchFulfilled,
      (state, { payload }) => {
        state.currentCampaign = payload;
      },
    )
    builder.addMatcher(
      CampaignAPI.endpoints.archive.matchFulfilled,
      (state, { payload }) => {
        state.currentCampaign = payload;
      },
    )
    builder.addMatcher(
      AnnotationResultAPI.endpoints.import.matchFulfilled,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      (state, _) => {
        state.resultImport.isSubmitted = true;
      }
    )
  },
})

export const {
  clear: clearCampaign,
  clearDraft: clearDraftCampaign,
  updateDraftCampaign,
  updateSubmissionErrors: updateCampaignSubmissionErrors,
  removeDraftFileRange,
  addDraftFileRange,
  loadDraftFileRange,
  updateDraftFileRange,
  clearImport,
  setFilteredDatasets,
  setDetectors,
  setFilteredDetectors,
} = CampaignSlice.actions
