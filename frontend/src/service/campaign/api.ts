import { createApi } from '@reduxjs/toolkit/query/react';

import { AnnotationCampaign, AnnotationCampaignUsage, WriteAnnotationCampaign } from '@/service/campaign';
import { ID } from '@/service/type';
import { downloadResponseHandler, encodeQueryParams } from '@/service/function';
import { getAuthenticatedBaseQuery } from '@/service/auth';

export const CampaignAPI = createApi({
  reducerPath: 'campaignApi',
  baseQuery: getAuthenticatedBaseQuery('/api/annotation-campaign/'),
  endpoints: (builder) => ({
    list: builder.query<Array<AnnotationCampaign>, {
      onlyArchived?: boolean;
      usage?: AnnotationCampaignUsage;
      owner?: ID;
      annotator?: ID;
      search?: string;
    }>({
      query: (clientParams) => {
        const params: { [key in string]: any } = {}
        if (clientParams?.onlyArchived !== undefined) params.archive__isnull = !clientParams.onlyArchived;
        switch (clientParams?.usage) {
          case 'Create':
            params.usage = 0;
            break;
          case 'Check':
            params.usage = 1;
            break;
        }
        if (clientParams?.owner) params.owner = clientParams.owner;
        if (clientParams?.annotator) params.annotators__id = clientParams.annotator;
        if (clientParams?.search !== undefined) params.search = clientParams.search;
        return {
          url: `/${ encodeQueryParams(params) }`
        }
      },
    }),
    retrieve: builder.query<AnnotationCampaign, ID>({ query: (id) => `${ id }/`, }),
    create: builder.mutation<AnnotationCampaign, WriteAnnotationCampaign>({
      query: (data) => ({
        url: '',
        method: 'POST',
        body: data
      }),
    }),
    patch: builder.mutation<AnnotationCampaign, Pick<WriteAnnotationCampaign, 'labels_with_acoustic_features'> & {
      id: ID
    }>({
      query: (data) => ({
        url: `${ data.id }/`,
        method: 'PATCH',
        body: {
          ...data,
          id: undefined
        }
      }),
    }),
    archive: builder.mutation<AnnotationCampaign, ID>({
      query: (id) => ({
        url: `${ id }/archive/`,
        method: 'POST',
      }),
    }),
    downloadReport: builder.query<undefined, AnnotationCampaign>({
      query: (campaign) => ({
        url: `${ campaign.id }/report/${ encodeQueryParams({
          filename: campaign.name.replaceAll(' ', '_') + '_results.csv',
        }) }`,
        responseHandler: downloadResponseHandler
      }),
    }),
    downloadStatus: builder.mutation<void, AnnotationCampaign>({
      query: (campaign) => ({
        url: `${ campaign.id }/report-status/${ encodeQueryParams({
          filename: campaign.name.replaceAll(' ', '_') + '_status.csv',
        }) }`,
        responseHandler: downloadResponseHandler
      }),
    }),
  })
})

export const {
  useListQuery: useListCampaignsQuery,
  useRetrieveQuery: useRetrieveCampaignQuery,
  useCreateMutation: useCreateCampaignMutation,
  useArchiveMutation: useArchiveCampaignMutation,
  useLazyDownloadReportQuery: useDownloadCampaignReportLazyQuery,
  useDownloadStatusMutation: useDownloadCampaignStatusMutation,
  usePatchMutation: usePatchCampaignMutation,
} = CampaignAPI;