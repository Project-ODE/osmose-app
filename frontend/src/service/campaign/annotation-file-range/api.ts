import { createApi } from '@reduxjs/toolkit/query/react';
import { getAuthenticatedBaseQuery } from '@/service/auth/function.ts';
import { ID } from '@/service/type.ts';
import { AnnotationFileRange, AnnotationFileRangeWithFiles, WriteAnnotationFileRange } from './type.ts';
import { encodeQueryParams } from '@/service/function.ts';

export const AnnotationFileRangeAPI = createApi({
  reducerPath: 'fileRangeApi',
  baseQuery: getAuthenticatedBaseQuery('/api/annotation-file-range/'),
  endpoints: (builder) => ({

    list: builder.query<Array<AnnotationFileRange>, {
      campaignID?: ID,
      forCurrentUser?: boolean,
    }>({
      query: ({ campaignID, forCurrentUser }) => {
        const params: any = {}
        if (campaignID) params.annotation_campaign = campaignID;
        if (forCurrentUser) params.for_current_user = true;
        return encodeQueryParams(params);
      },
    }),
    listWithFiles: builder.query<Array<AnnotationFileRangeWithFiles>, {
      campaignID?: ID,
      forCurrentUser?: boolean,
    }>({
      query: ({ campaignID, forCurrentUser }) => {
        const params: any = { with_files: true }
        if (campaignID) params.annotation_campaign = campaignID;
        if (forCurrentUser) params.for_current_user = true;
        return encodeQueryParams(params);
      },
    }),

    post: builder.mutation<Array<AnnotationFileRange>, { campaignID: ID, data: Array<WriteAnnotationFileRange>, force?: boolean }>({
      query: ({ campaignID, data, force }) => ({
        url: `campaign/${ campaignID }/`,
        method: 'POST',
        body: { data, force }
      })
    })
  })
})

export const {
  useListQuery: useListAnnotationFileRangeQuery,
  useListWithFilesQuery: useListAnnotationFileRangeWithFilesQuery,
  usePostMutation: usePostAnnotationFileRangeMutation,
} = AnnotationFileRangeAPI;