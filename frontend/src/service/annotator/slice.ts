import { createSlice } from '@reduxjs/toolkit'
import { AnnotatorState, } from './type';
import { COLORS } from '@/consts/colors.const.tsx';
import { AnnotationResult, AnnotationResultBounds } from '@/service/campaign/result';
import { getDefaultConfidence, getPresenceLabels, getResultType } from './function.ts';
import { ID } from '@/service/type.ts';
import { AnnotatorAPI } from './api.ts';
import { AnnotationComment } from '@/service/campaign/comment';
import { getNewItemID } from '@/service/function';
import { AcousticFeatures } from '@/service/campaign/result/type.ts';
import { CampaignAPI } from "@/service/campaign";
import { LabelSetAPI } from "@/service/campaign/label-set";
import { UserAPI } from "@/service/user";
import { ConfidenceSetAPI } from "@/service/campaign/confidence-set";

function _focusTask(state: AnnotatorState) {
  state.focusedResultID = undefined;
  state.focusedLabel = undefined;
  state.focusedConfidenceLabel = getDefaultConfidence(state)?.label;
  state.focusedCommentID = state.task_comments?.find(c => c)?.id;
}

function _focusResult(state: AnnotatorState, { payload }: { payload: ID }) {
  const result = state.results?.find(r => r.id === payload);
  if (!result) return _focusTask(state);
  state.focusedResultID = result.id;
  state.focusedLabel = result.label;
  state.focusedConfidenceLabel = result.confidence_indicator ?? undefined;
  state.focusedCommentID = result.comments.find(c => c)?.id;
}

export const AnnotatorSlice = createSlice({
  name: 'annotator',
  initialState: {
    hasChanged: false,
    userPreferences: {
      audioSpeed: 1,
      zoomLevel: 1,
      spectrogramConfigurationID: 1,
      colormap: 'none',
      colormapInverted: false,
      brightness: 100,
      contrast: 100,
    },
    audio: {
      isPaused: true,
      time: 0,
    },
    ui: {},
    labelColors: {},
    sessionStart: Date.now()
  } satisfies AnnotatorState as AnnotatorState,
  reducers: {
    focusResult: _focusResult,
    focusTask: _focusTask,
    addResult: (state, { payload }: { payload: AnnotationResultBounds }) => {
      const newResult: AnnotationResult = {
        ...payload,
        id: getNewItemID(state.results),
        annotator: -1,
        annotation_campaign: -1,
        dataset_file: -1,
        detector_configuration: null,
        comments: [],
        validations: [],
        confidence_indicator: state.focusedConfidenceLabel ?? null,
        label: state.focusedLabel ?? getPresenceLabels(state.results)!.pop()!,
        acoustic_features: null,
      }
      if (!state.results) state.results = [];
      state.results.push(newResult);
      state.hasChanged = true;
      _focusResult(state, { payload: newResult.id })
    },
    updateFocusResultBounds: (state, { payload }: { payload: AnnotationResultBounds }) => {
      if (!state.focusedResultID) return;
      if (!state.results) state.results = [];
      state.results = state.results.map(r => {
        if (r.id !== state.focusedResultID) return r;
        return {
          ...r,
          ...payload
        }
      });
      state.hasChanged = true;
      _focusResult(state, { payload: state.focusedResultID })
    },
    addPresenceResult: (state, { payload }: {
      payload: {
        label: string,
        focus?: boolean
      }
    }) => {
      const newResult: AnnotationResult = {
        id: getNewItemID(state.results),
        annotator: -1,
        annotation_campaign: -1,
        dataset_file: -1,
        detector_configuration: null,
        comments: [],
        validations: [],
        confidence_indicator: state.focusedConfidenceLabel ?? null,
        label: payload.label,
        end_frequency: null,
        end_time: null,
        start_time: null,
        start_frequency: null,
        acoustic_features: null,
      }
      if (!state.results) state.results = [];
      state.results.push(newResult);
      state.hasChanged = true;
      if (payload.focus === false) return;
      _focusResult(state, { payload: newResult.id })
    },
    removeResult: (state, { payload }: { payload: number }) => {
      const result = state.results?.find(r => r.id === payload);
      if (!result) return _focusTask(state);
      state.hasChanged = true;
      if (getResultType(result) === 'presence') {
        state.results = state.results!.filter(r => r.label !== result.label);
        return _focusTask(state);
      }
      state.results = state.results!.filter(r => r.id !== result.id);
      const presenceResult = state.results!.find(r => r.label === result.label && getResultType(r) === 'presence');
      if (presenceResult) _focusResult(state, { payload: presenceResult.id });
      else _focusTask(state);
    },
    removePresence: (state, { payload }: { payload: string }) => {
      const presenceResult = state.results!.find(r => r.label === payload && getResultType(r) === 'presence');
      if (!presenceResult) return _focusTask(state);
      state.hasChanged = true;
      state.results = state.results!.filter(r => r.label !== presenceResult.label);
      return _focusTask(state);
    },
    focusLabel: (state, { payload }: { payload: string }) => {
      state.focusedLabel = payload;
      const result = state.results?.find(r => r.id === state.focusedResultID);
      if (!result) return;
      const type = getResultType(result);
      if (type === 'presence') {
        _focusTask(state);
      } else {
        state.results = state.results?.map(r => {
          if (r.id !== state.focusedResultID) return r;
          return {
            ...r,
            label: payload
          }
        })
        state.hasChanged = true;
      }
    },
    focusPresence: (state, { payload }: { payload: string }) => {
      const result = state.results?.find(r => r.label === payload && getResultType(r) === 'presence');
      if (result) _focusResult(state, { payload: result.id })
      else _focusTask(state)
    },
    focusConfidence: (state, { payload }: { payload: string }) => {
      state.focusedConfidenceLabel = payload;
      state.hasChanged = true;
      state.results = state.results?.map(r => {
        if (r.id !== state.focusedResultID) return r;
        return { ...r, confidence_indicator: payload }
      });
    },
    updateFocusComment: (state, { payload }: { payload: string }) => {
      state.hasChanged = true;
      if (!state.focusedCommentID) {
        const newComment: AnnotationComment = {
          comment: payload,
          annotation_result: state.focusedResultID ?? null,
          annotation_campaign: state.campaignID ?? -1,
          dataset_file: state.file?.id ?? -1,
          id: getNewItemID([ ...(state.results ?? []).flatMap(r => r.comments), ...(state.task_comments ?? []) ]),
          author: state.userID ?? -1
        };
        if (newComment.annotation_result) {
          state.results = state.results?.map(r => {
            if (r.id !== newComment.annotation_result) return r;
            return {
              ...r,
              comments: [ ...r.comments, newComment ]
            }
          });
        } else {
          state.task_comments = [ ...(state.task_comments ?? []), newComment ]
        }
        state.focusedCommentID = newComment.id;
        return;
      }
      state.task_comments = state.task_comments?.map(c => {
        if (c.id !== state.focusedCommentID) return c;
        return {
          ...c,
          comment: payload
        };
      })
      state.results = state.results?.map(r => ({
        ...r,
        comments: r.comments?.map(c => {
          if (c.id !== state.focusedCommentID) return c;
          return {
            ...c,
            comment: payload
          };
        })
      }));
    },
    removeFocusComment: (state) => {
      if (!state.focusedCommentID) return;
      state.task_comments = state.task_comments?.filter(c => c.id !== state.focusedCommentID)
      state.results = state.results?.map(r => ({
        ...r,
        comments: r.comments?.filter(c => c.id !== state.focusedCommentID)
      }));
      state.focusedCommentID = undefined;
      state.hasChanged = true;
    },
    validateResult: (state, { payload }: { payload: number }) => {
      const result = state.results?.find(r => r.id === payload);
      if (!result) return;
      const type = getResultType(result);
      state.results = state.results?.map(r => {
        if (r.id === payload ||
          (type !== 'presence' && r.label === result.label && getResultType(r) === 'presence')) {
          let validations = r.validations;
          if (validations.find(v => v.annotator === state.userID)) {
            validations = validations.map(v => {
              if (v.annotator !== state.userID) return v;
              return {
                ...v,
                is_valid: true
              }
            })
          } else validations.push({
            id: getNewItemID(state.results?.flatMap(r => r.validations) ?? []),
            annotator: state.userID ?? -1,
            is_valid: true,
            result: r.id
          })
          return { ...r, validations }
        }
        return r;
      })
      _focusResult(state, { payload })
    },
    invalidateResult: (state, { payload }: { payload: number }) => {
      const result = state.results?.find(r => r.id === payload);
      if (!result) return;
      const type = getResultType(result);
      state.results = state.results?.map(r => {
        if ((type !== 'presence' && r.id === payload) ||
          (type === 'presence' && r.label === result.label)) {
          let validations = r.validations;
          if (validations.find(v => v.annotator === state.userID)) {
            validations = validations.map(v => {
              if (v.annotator !== state.userID) return v;
              return {
                ...v,
                is_valid: false
              }
            })
          } else validations.push({
            id: getNewItemID(state.results?.flatMap(r => r.validations) ?? []),
            annotator: state.userID ?? -1,
            is_valid: false,
            result: r.id
          })
          return { ...r, validations }
        }
        return r;
      })
      _focusResult(state, { payload })
    },
    selectSpectrogramConfiguration: (state, { payload }: { payload: number }) => {
      state.userPreferences.spectrogramConfigurationID = payload;
      state.userPreferences.zoomLevel = 1;
    },
    setColormap: (state, { payload }: { payload: string }) => {
      state.userPreferences.colormap = payload;
    },
    invertColormap: (state) => {
      state.userPreferences.colormapInverted = !state.userPreferences.colormapInverted;
    },
    setBrightness: (state, { payload }: { payload: number }) => {
      state.userPreferences.brightness = payload;
    },
    setContrast: (state, { payload }: { payload: number }) => {
      state.userPreferences.contrast = payload;
    },
    setPointerPosition: (state, { payload }: { payload: { time: number, frequency: number } }) => {
      state.ui.pointerPosition = payload;
    },
    leavePointerPosition: (state) => {
      state.ui.pointerPosition = undefined;
    },
    zoom: (state, action: {
      payload: { direction: 'in' | 'out', origin?: { x: number; y: number } }
    }) => {
      state.ui.zoomOrigin = action.payload.origin;
      let max = Math.max(...(state.spectrogram_configurations ?? []).map(s => s.zoom_level));
      max = Math.max(0, max - 1)
      switch (action.payload.direction) {
        case "in":
          state.userPreferences.zoomLevel = Math.min(state.userPreferences.zoomLevel * 2, 2 ** max);
          break;
        case "out":
          state.userPreferences.zoomLevel = Math.max(state.userPreferences.zoomLevel / 2, 1);
          break;
      }
    },
    onPlay: (state) => {
      state.audio.isPaused = false;
    },
    onPause: (state) => {
      state.audio.isPaused = true;
    },
    setTime: (state, action: { payload: number }) => {
      state.audio.time = action.payload ?? 0;
    },
    setStopTime: (state, action: { payload: number | undefined }) => {
      state.audio.stopTime = action.payload;
    },
    setAudioSpeed: (state, action: { payload: number }) => {
      state.userPreferences.audioSpeed = action.payload;
    },

    // Acoustic features
    updateCurrentResultAcousticFeatures(state, { payload }: { payload: Partial<AcousticFeatures> | null }) {
      state.results = state.results?.map(r => {
        if (r.id !== state.focusedResultID) return r;
        if (!payload) return { ...r, acoustic_features: null }
        return {
          ...r,
          acoustic_features: {
            start_frequency: null,
            end_frequency: null,
            has_harmonics: null,
            steps_count: null,
            trend: null,
            relative_max_frequency_count: null,
            relative_min_frequency_count: null,
            ...(r.acoustic_features ?? {}),
            ...payload
          } satisfies AcousticFeatures
        }
      })
      state.hasChanged = true;
    }
  },
  extraReducers:
    (builder) => {
      builder.addMatcher(
        AnnotatorAPI.endpoints.retrieve.matchFulfilled,
        (state, { payload }) => {
          // initialize slice
          Object.assign(state, payload);
          state.focusedCommentID = payload.task_comments && payload.task_comments.length > 0 ? payload.task_comments[0].id : undefined;
          state.focusedResultID = undefined;
          state.focusedLabel = undefined;
          state.focusedConfidenceLabel = getDefaultConfidence(state)?.label;
          state.hasChanged = false;
          state.audio = {
            time: 0,
            isPaused: true,
          }
          state.sessionStart = Date.now();
        },
      )
      builder.addMatcher(
        CampaignAPI.endpoints.retrieve.matchFulfilled,
        (state, { payload }) => {
          // Reset user preferences if new campaign
          if (state.campaignID !== payload.id) {
            state.userPreferences.audioSpeed = 1;
            state.userPreferences.zoomLevel = 1;
          }
          state.campaignID = payload.id;
        },
      )
      builder.addMatcher(
        LabelSetAPI.endpoints.retrieve.matchFulfilled,
        (state, { payload }) => {
          const labelColors = {};
          for (const label of payload.labels) {
            Object.assign(labelColors, { [label]: COLORS[payload.labels.indexOf(label) % COLORS.length] })
          }
          state.labelColors = labelColors;
        },
      )
      builder.addMatcher(
        ConfidenceSetAPI.endpoints.retrieve.matchFulfilled,
        (state, { payload }) => {
          state.confidenceIndicators = payload.confidence_indicators;
        },
      )
      builder.addMatcher(
        UserAPI.endpoints.getCurrentUser.matchFulfilled,
        (state, { payload }) => {
          state.userID = payload.id;
        },
      )
    },
})

export const {
  focusResult,
  focusPresence,
  focusTask,
  updateFocusComment,
  focusConfidence,
  focusLabel,
  invalidateResult,
  validateResult,
  addPresenceResult,
  removePresence,
  removeFocusComment,
  removeResult,
  addResult,
  selectSpectrogramConfiguration,
  setColormap,
  invertColormap,
  setBrightness,
  setContrast,
  setPointerPosition,
  zoom,
  leavePointerPosition,
  setTime,
  onPause,
  setAudioSpeed,
  setStopTime,
  onPlay,
  updateCurrentResultAcousticFeatures,
  updateFocusResultBounds,
} = AnnotatorSlice.actions
