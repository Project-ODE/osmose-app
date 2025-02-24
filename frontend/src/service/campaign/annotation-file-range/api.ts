import { createApi } from '@reduxjs/toolkit/query/react';
import { getAuthenticatedBaseQuery } from '@/service/auth/function.ts';
import { ID, Paginated } from '@/service/type.ts';
import { AnnotationFile, AnnotationFileRange, WriteAnnotationFileRange } from './type.ts';
import { encodeQueryParams } from '@/service/function.ts';
import { FileFilters } from "@/service/ui/type.ts";

export const FILES_PAGE_SIZE = 20;

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
    listFilesWithPagination: builder.query<Paginated<AnnotationFile> & { resume?: number }, {
      page: number,
    } & FileFilters>({
      query: ({ campaignID, page, search, withUserAnnotations, isSubmitted, label, confidence, detector, hasAcousticFeatures }) => {
        const params: any = { page, page_size: FILES_PAGE_SIZE }
        if (search) params['search'] = search;
        if (withUserAnnotations !== undefined) params['with_user_annotations'] = withUserAnnotations;
        if (isSubmitted !== undefined) params['is_submitted'] = isSubmitted;
        if (label !== undefined) params['label'] = label;
        if (confidence !== undefined) params['confidence'] = confidence;
        if (detector !== undefined) params['detector'] = detector;
        if (detector !== undefined) params['detector'] = detector;
        if (hasAcousticFeatures !== undefined) params['acoustic_features'] = hasAcousticFeatures;
        return `campaign/${ campaignID }/files/${ encodeQueryParams(params) }`;
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
  useListFilesWithPaginationQuery,
  usePostMutation: usePostAnnotationFileRangeMutation,
} = AnnotationFileRangeAPI;