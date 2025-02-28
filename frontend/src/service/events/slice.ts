import { createSlice } from '@reduxjs/toolkit'
import { EventState } from './type.ts';


export const EventSlice = createSlice({
  name: 'event',
  initialState: {
    areKbdShortcutsEnabled: true
  } satisfies EventState as EventState,
  reducers: {
    enableShortcuts: (state) => {
      state.areKbdShortcutsEnabled = true
    },
    disableShortcuts: (state) => {
      state.areKbdShortcutsEnabled = false
    },
  },
})

export const {
  enableShortcuts,
  disableShortcuts,
} = EventSlice.actions
