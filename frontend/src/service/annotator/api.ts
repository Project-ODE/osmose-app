import { createApi, RootState } from '@reduxjs/toolkit/query/react';
import { getAuthenticatedBaseQuery } from '@/service/auth';
import { AnnotatorData, RetrieveParams, WriteAnnotatorData } from './type.ts';
import { ID } from '@/service/type.ts';
import { AnnotationCampaign } from '@/service/campaign';
import { encodeQueryParams } from "@/service/function.ts";
import { AppState } from "@/service/app.ts";

export const AnnotatorAPI = createApi({
  reducerPath: 'annotatorApi',
  baseQuery: getAuthenticatedBaseQuery('/api/annotator/'),
  endpoints: (builder) => ({
    retrieve: builder.query<AnnotatorData, RetrieveParams>({
      query: ({ campaignID, fileID, search, withUserAnnotations, isSubmitted, label }) => {
        const params: any = {}
        if (search) params['search'] = search;
        if (withUserAnnotations !== undefined) params['with_user_annotations'] = withUserAnnotations;
        if (isSubmitted !== undefined) params['is_submitted'] = isSubmitted;
        if (label !== undefined) params['label'] = label;
        return `campaign/${ campaignID }/file/${ fileID }/${ encodeQueryParams(params) }`;
      },
      forceRefetch({ currentArg, state }: {
        currentArg: RetrieveParams | undefined;
        state: RootState<any, any, string>
      }): boolean {
        const prevCampaignID = (state as unknown as AppState).annotator.campaignID;
        const prevFileID = (state as unknown as AppState).annotator.file?.id;
        if (prevCampaignID != currentArg?.campaignID) return true;
        return prevFileID != currentArg?.fileID;
      }
    }),
    post: builder.mutation<void, {
      campaign: AnnotationCampaign,
      fileID: ID,
      data: WriteAnnotatorData,
    }>({
      query: ({ campaign, fileID, data }) => ({
        url: `campaign/${ campaign.id }/file/${ fileID }/`,
        method: 'POST',
        body: {
          ...data,
          results: campaign.usage === 'Check' ? data.results.map(r => ({
            ...r,
            validations: r.validations.length > 0 ? r.validations : [ {
              id: undefined,
              is_valid: true
            } ],
          })) : data.results,
          session: {
            start: data.session.start.toISOString(),
            end: data.session.end.toISOString(),
          }
        }
      })
    })
  })
})

export const {
  useRetrieveQuery: useRetrieveAnnotatorQuery,
  usePostMutation: usePostAnnotatorMutation,
} = AnnotatorAPI;