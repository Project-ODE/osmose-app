import { createApi } from '@reduxjs/toolkit/query/react';
import { getAuthenticatedBaseQuery } from '@/service/auth/function.ts';
import { Detector } from './type.ts';
import { ID } from "@/service/type.ts";
import { encodeQueryParams } from "@/service/function.ts";

export const DetectorAPI = createApi({
  reducerPath: 'detectorApi',
  baseQuery: getAuthenticatedBaseQuery('/api/detector/'),
  endpoints: (builder) => ({
    list: builder.query<Array<Detector>, { campaign?: ID } | undefined>({
      query: (params) => {
        if (!params) return '';
        const queryParams: any = {}
        if (params.campaign) queryParams['configurations__annotation_results__annotation_campaign'] = params.campaign
        return encodeQueryParams(queryParams)
      }
    }),
  })
})

export const {
  useListQuery: useListDetectorQuery,
} = DetectorAPI;