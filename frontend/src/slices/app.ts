import { combineReducers, configureStore } from "@reduxjs/toolkit";

import globalAnnotatorReducer from "@/slices/annotator/global-annotator";
import annotationsReducer from "@/slices/annotator/annotations";
import audioReducer from "@/slices/annotator/audio";
import spectroReducer from "@/slices/annotator/spectro";
import { useDispatch, useSelector } from "react-redux";
import { importAnnotationsReducer } from "@/slices/create-campaign/import-annotations.ts";
import { AuthAPI, AuthSlice } from '@/service/auth';
import { UserAPI } from '@/service/user';
import { CampaignAPI, CampaignSlice } from '@/service/campaign';
import { AnnotationFileRangeAPI } from '@/service/campaign/annotation-file-range';
import { LabelSetAPI } from '@/service/campaign/label-set';
import { DatasetAPI } from '@/service/dataset';
import { ConfidenceSetAPI } from '@/service/campaign/confidence-set';
import { SpectrogramConfigurationAPI } from '@/service/dataset/spectrogram-configuration';
import { AudioMetadataAPI } from '@/service/dataset/audio-metatada';

export const AppStore = configureStore({
  reducer: {
    [AuthSlice.reducerPath]: AuthSlice.reducer,
    [CampaignSlice.reducerPath]: CampaignSlice.reducer,

    createCampaignForm: combineReducers({
      importAnnotations: importAnnotationsReducer
    }),
    annotator: combineReducers({
      annotations: annotationsReducer,
      global: globalAnnotatorReducer,
      audio: audioReducer,
      spectro: spectroReducer
    }),

    [AuthAPI.reducerPath]: AuthAPI.reducer,
    [UserAPI.reducerPath]: UserAPI.reducer,
    [CampaignAPI.reducerPath]: CampaignAPI.reducer,
    [AnnotationFileRangeAPI.reducerPath]: AnnotationFileRangeAPI.reducer,
    [DatasetAPI.reducerPath]: DatasetAPI.reducer,
    [LabelSetAPI.reducerPath]: LabelSetAPI.reducer,
    [ConfidenceSetAPI.reducerPath]: ConfidenceSetAPI.reducer,
    [SpectrogramConfigurationAPI.reducerPath]: SpectrogramConfigurationAPI.reducer,
    [AudioMetadataAPI.reducerPath]: AudioMetadataAPI.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(AuthAPI.middleware)
      .concat(UserAPI.middleware)
      .concat(CampaignAPI.middleware)
      .concat(AnnotationFileRangeAPI.middleware)
      .concat(DatasetAPI.middleware)
      .concat(LabelSetAPI.middleware)
      .concat(ConfidenceSetAPI.middleware)
      .concat(SpectrogramConfigurationAPI.middleware)
      .concat(AudioMetadataAPI.middleware)
})

export type AppState = ReturnType<typeof AppStore.getState>;

export type AppDispatch = typeof AppStore.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<AppState>()
