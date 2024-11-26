import { createSlice } from "@reduxjs/toolkit";
import { Retrieve, RetrieveSpectroURL } from "@/services/api/annotation-task-api.service.tsx";


export type SpectroSlice = {
  pointerPosition?: { time: number, frequency: number };

  selectedSpectroId: number;
  spectros: Array<RetrieveSpectroURL>;

  colormap: string;
  colormapInverted: boolean;
  brightness: number;
  contrast: number;

  currentZoom: number;
  currentZoomOrigin?: { x: number, y: number };
  maxZoom: number;
}

export function getZoomFromPath(path: string): { zoom: number, id: number } {
  const pathSplit = path.split('.')
  pathSplit.pop(); // pop file extension
  const filename = pathSplit.pop()!
  const filenameSplit = filename.split('_')
  const id = +filenameSplit.pop()! // pop id of the image for zoom level
  const zoom = +filenameSplit.pop()! // pop zoom level
  return { zoom, id };
}

function getMaxZoom(state: SpectroSlice): number {
  let max = 1
  const spectro = state.spectros.find(s => s.id === state.selectedSpectroId);
  if (!spectro) return max
  for (const url of spectro.urls) {
    max = Math.max(max, getZoomFromPath(url).zoom)
  }
  return max
}

export const spectroSlice = createSlice({
  name: 'Spectro',
  initialState: {
    selectedSpectroId: 0,
    spectros: [],
    colormap: 'none',
    colormapInverted: false,
    brightness: 100,
    contrast: 100,
    currentZoom: 1,
    maxZoom: 1,
  } as SpectroSlice,
  reducers: {
    initSpectro: (state, action: { payload: Retrieve }) => {
      state.currentZoom = 1;
      state.currentZoomOrigin = undefined;
      if (!action.payload.spectroUrls.some(s => s.id === state.selectedSpectroId)) {
        const simpleSpectroID = action.payload.spectroUrls.find(s => !s.multi_linear_frequency_scale && !s.linear_frequency_scale)?.id;
        state.selectedSpectroId = simpleSpectroID ?? Math.min(...action.payload.spectroUrls.map(s => s.id));
      }
      state.spectros = action.payload.spectroUrls;
      state.maxZoom = getMaxZoom(state);
    },

    selectSpectro: (state, action: { payload: number }) => {
      if (state.selectedSpectroId === action.payload) return;
      state.selectedSpectroId = action.payload
      state.currentZoom = 1
      state.maxZoom = getMaxZoom(state);
    },

    updatePointerPosition: (state, action: { payload: { time: number, frequency: number } }) => {
      state.pointerPosition = action.payload
    },

    leavePointer: (state) => {
      state.pointerPosition = undefined
    },

    zoom: (state, action: {
      payload: { direction: 'in' | 'out', origin?: { x: number; y: number } }
    }) => {
      state.currentZoomOrigin = action.payload.origin;
      switch (action.payload.direction) {
        case "in":
          state.currentZoom = Math.min(state.currentZoom * 2, state.maxZoom);
          break;
        case "out":
          state.currentZoom = Math.max(state.currentZoom / 2, 1);
          break;
      }
    },

    updateColormap: (state, action: { payload: string }) => {
      state.colormap = action.payload;
    },

    updateColormapInverted: (state, action: { payload: boolean }) => {
      state.colormapInverted = action.payload;
    },

    updateBrightness: (state, action: { payload: number }) => {
      state.brightness = action.payload;
    },

    updateContrast: (state, action: { payload: number }) => {
      state.contrast = action.payload;
    },
  }
})

export const {
  initSpectro,
  updatePointerPosition,
  leavePointer,
  zoom,
  selectSpectro,
  updateColormap,
  updateColormapInverted,
  updateBrightness,
  updateContrast,
} = spectroSlice.actions;

export default spectroSlice.reducer;
