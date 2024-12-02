import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { prepareHeadersWithToken } from '@/service/auth/function.ts';
import { ID } from '@/service/type.ts';
import { encodeQueryParams } from '@/service/function.ts';
import { AnnotationCampaign } from '@/service/campaign';
import { AudioMetadatum } from './type';

export const AudioMetadataAPI = createApi({
  reducerPath: 'audioMetadataAPI',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/audio-metadata/',
    prepareHeaders: prepareHeadersWithToken,
  }),
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
          filename: name.replace(' ', '_') + '_audio_metadata.csv',
          dataset__annotation_campaigns: id
        }) }`,
        method: 'POST',
      }),
      transformResponse: (response) => {
        console.warn('transformResponse', response)
        // TODO
      }
    }),
  })
})

export const {
  useListQuery: useListAudioMetadataQuery,
  useDownloadMutation: useDownloadAudioMetadataMutation,
} = AudioMetadataAPI;