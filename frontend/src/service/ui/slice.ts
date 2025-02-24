import { createSlice } from "@reduxjs/toolkit";
import { FileFilters, UIState } from "./type.ts";

const initialFileFiltersState: UIState['fileFilters'] = {
  campaignID: undefined,
  search: undefined,
  isSubmitted: undefined,
  withUserAnnotations: undefined,
}

export const UISlice = createSlice({
  name: "ui",
  initialState: {
    fileFilters: initialFileFiltersState
  } satisfies UIState as UIState,
  reducers: {
    setFileFilters: (state, { payload }: { payload: FileFilters }) => {
      state.fileFilters = payload;
    },
    resetFileFilters: (state) => {
      state.fileFilters = initialFileFiltersState;
    }
  }
})

export const {
  setFileFilters,
  resetFileFilters,
} = UISlice.actions;