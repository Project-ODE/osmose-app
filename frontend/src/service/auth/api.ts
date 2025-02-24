import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { prepareHeadersWithToken } from './function.ts';
import { Token } from './type.ts';

export const AuthAPI = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/',
    prepareHeaders: prepareHeadersWithToken,
  }),
  endpoints: (builder) => ({
    login: builder.mutation<Token, { username: string, password: string }>({
      query: (credentials) => ({
        url: 'token/',
        method: 'POST',
        body: credentials
      }),
      transformResponse: (response: { access: Token }) => response.access,
    })
  }),
})


export const {
  useLoginMutation,
} = AuthAPI;
