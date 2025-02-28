import { createSlice } from '@reduxjs/toolkit'
import { AuthAPI } from './api.ts';
import { AuthState } from './type.ts';
import { UserAPI } from "@/service/user";


export const AuthSlice = createSlice({
  name: 'auth',
  initialState: {
    token: undefined,
    isNewUser: false,
  } satisfies AuthState as AuthState,
  reducers: {
    logout: (state) => {
      state.token = undefined;
      document.cookie = 'token=;max-age=0;path=/';
    }
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      AuthAPI.endpoints.login.matchFulfilled,
      (state, { payload }) => {
        if (payload !== state.token) state.isNewUser = true;
        state.token = payload;
        // Cookie is set to expire a bit before 8 hours
        document.cookie = `token=${ payload };max-age=28000;path=/`;
      },
    )

    builder.addMatcher(
      UserAPI.endpoints.getCurrentUser.matchFulfilled,
      (state) => {
        state.isNewUser = false;
      }
    )
  },
})

export const { logout } = AuthSlice.actions
