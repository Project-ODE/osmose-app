import { createApi } from '@reduxjs/toolkit/query/react';
import { getAuthenticatedBaseQuery } from '@/service/auth/function.ts';
import { ID } from '@/service/type.ts';
import { downloadResponseHandler, encodeQueryParams } from '@/service/function.ts';
import { AnnotationCampaign } from '@/service/campaign';
import { AudioMetadatum } from './type';

export const AudioMetadataAPI = createApi({
  reducerPath: 'audioMetadataAPI',
  baseQuery: getAuthenticatedBaseQuery('/api/audio-metadata/'),
  endpoints: (builder) => ({
    list: builder.query<Array<AudioMetadatum>, {
      campaignID?: ID,
    }>({
      query: ({ campaignID }) => {
        const params: any = {}
        if (campaignID) params.dataset__annotation_campaigns = campaignID;
        return encodeQueryParams(params);
      },
    }),
    download: builder.mutation<void, AnnotationCampaign>({
      query: ({ id, name }) => ({
        url: `export/${ encodeQueryParams({
          filename: name.replaceAll(' ', '_') + '_audio_metadata.csv',
          dataset__annotation_campaigns: id
        }) }`,
        responseHandler: downloadResponseHandler
      }),
    }),
  })
})

export const {
  useListQuery: useListAudioMetadataQuery,
  useDownloadMutation: useDownloadAudioMetadataMutation,
} = AudioMetadataAPI;