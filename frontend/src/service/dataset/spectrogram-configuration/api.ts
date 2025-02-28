import { createApi } from '@reduxjs/toolkit/query/react';
import { getAuthenticatedBaseQuery } from '@/service/auth/function.ts';
import { ID } from '@/service/type.ts';
import { SpectrogramConfiguration } from './type.ts';
import { downloadResponseHandler, encodeQueryParams } from '@/service/function.ts';
import { AnnotationCampaign } from '@/service/campaign';

export const SpectrogramConfigurationAPI = createApi({
  reducerPath: 'spectrogramConfigurationApi',
  baseQuery: getAuthenticatedBaseQuery('/api/spectrogram-configuration/'),
  endpoints: (builder) => ({
    list: builder.query<Array<SpectrogramConfiguration>, {
      campaignID?: ID,
    }>({
      query: ({ campaignID }) => {
        const params: any = {}
        if (campaignID) params.annotation_campaigns = campaignID;
        return encodeQueryParams(params);
      },
    }),
    download: builder.mutation<void, AnnotationCampaign>({
      query: ({ name, id }) => ({
        url: `export/${ encodeQueryParams({
          annotation_campaigns: id,
          filename: name.replaceAll(' ', '_') + '_spectrogram_configuration.csv',
        }) }`,
        responseHandler: downloadResponseHandler
      }),
    }),
  })
})

export const {
  useListQuery: useListSpectrogramConfigurationQuery,
  useDownloadMutation: useDownloadSpectrogramConfigurationMutation,
} = SpectrogramConfigurationAPI;