import { configureStore } from "@reduxjs/toolkit";

import { useDispatch, useSelector } from "react-redux";
import { AuthAPI, AuthSlice } from '@/service/auth';
import { UserAPI } from '@/service/user';
import { CampaignAPI, CampaignSlice } from '@/service/campaign';
import { AnnotationFileRangeAPI } from '@/service/campaign/annotation-file-range';
import { LabelSetAPI } from '@/service/campaign/label-set';
import { DatasetAPI } from '@/service/dataset';
import { ConfidenceSetAPI } from '@/service/campaign/confidence-set';
import { SpectrogramConfigurationAPI } from '@/service/dataset/spectrogram-configuration';
import { AudioMetadataAPI } from '@/service/dataset/audio-metatada';
import { DetectorAPI } from '@/service/campaign/detector';
import { AnnotatorAPI, AnnotatorSlice } from '@/service/annotator';
import { AnnotationResultAPI } from '@/service/campaign/result';
import { CollaboratorAPI } from "@/service/collaborator";
import { EventSlice } from "@/service/events";
import { UISlice } from "@/service/ui";

export const AppStore = configureStore({
  reducer: {
    [UISlice.reducerPath]: UISlice.reducer,
    [EventSlice.reducerPath]: EventSlice.reducer,
    [AuthSlice.reducerPath]: AuthSlice.reducer,
    [CampaignSlice.reducerPath]: CampaignSlice.reducer,
    [AnnotatorSlice.reducerPath]: AnnotatorSlice.reducer,

    [AuthAPI.reducerPath]: AuthAPI.reducer,
    [UserAPI.reducerPath]: UserAPI.reducer,
    [CollaboratorAPI.reducerPath]: CollaboratorAPI.reducer,
    [CampaignAPI.reducerPath]: CampaignAPI.reducer,
    [AnnotationFileRangeAPI.reducerPath]: AnnotationFileRangeAPI.reducer,
    [DatasetAPI.reducerPath]: DatasetAPI.reducer,
    [LabelSetAPI.reducerPath]: LabelSetAPI.reducer,
    [ConfidenceSetAPI.reducerPath]: ConfidenceSetAPI.reducer,
    [SpectrogramConfigurationAPI.reducerPath]: SpectrogramConfigurationAPI.reducer,
    [AudioMetadataAPI.reducerPath]: AudioMetadataAPI.reducer,
    [DetectorAPI.reducerPath]: DetectorAPI.reducer,
    [AnnotatorAPI.reducerPath]: AnnotatorAPI.reducer,
    [AnnotationResultAPI.reducerPath]: AnnotationResultAPI.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(AuthAPI.middleware)
      .concat(UserAPI.middleware)
      .concat(CollaboratorAPI.middleware)
      .concat(CampaignAPI.middleware)
      .concat(AnnotationFileRangeAPI.middleware)
      .concat(DatasetAPI.middleware)
      .concat(LabelSetAPI.middleware)
      .concat(ConfidenceSetAPI.middleware)
      .concat(SpectrogramConfigurationAPI.middleware)
      .concat(AudioMetadataAPI.middleware)
      .concat(DetectorAPI.middleware)
      .concat(AnnotatorAPI.middleware)
      .concat(AnnotationResultAPI.middleware)
})

export type AppState = ReturnType<typeof AppStore.getState>;

export type AppDispatch = typeof AppStore.dispatch;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<AppState>()
