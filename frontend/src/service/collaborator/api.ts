import { createApi } from '@reduxjs/toolkit/query/react';
import { getAuthenticatedBaseQuery } from '@/service/auth/function.ts';
import { Collaborator } from "@/service/collaborator/type.ts";

export const CollaboratorAPI = createApi({
  reducerPath: 'collaboratorApi',
  baseQuery: getAuthenticatedBaseQuery('/api/collaborators/'),
  endpoints: (builder) => ({
    list: builder.query<Array<Collaborator>, void>({ query: () => 'on_aplose_home', }),
  })
})

export const {
  useListQuery: useListCollaboratorsQuery,
} = CollaboratorAPI;