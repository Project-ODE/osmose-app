import { FC, ReactNode, Reducer, useReducer } from "react";
import {
  SpectroContext,
  SpectroDispatchContext,
  SpectroCtx,
  SpectroCtxAction,
  SpectroCtxInitialValue, SpectrogramData, SpectrogramParams
} from "./spectro.context.tsx";
import { Retrieve } from "../../api/annotation-task-api.service.tsx";
import { colormaps } from "./color.util.tsx";

const baseUrlRegexp = /(.*\/)(.*)_\d*_\d*(\..*)/;

const spectroReducer: Reducer<SpectroCtx, SpectroCtxAction> = (currentContext: SpectroCtx, action: SpectroCtxAction): SpectroCtx => {
  const getAllSpectrograms = (task: Retrieve): Array<SpectrogramData> => {
    return task.spectroUrls.map(configuration => {
      const urlParts = configuration.urls[0].match(baseUrlRegexp);
      const nbZooms = Math.log2(configuration.urls.length + 1);
      return {
        ...configuration,
        nfft: configuration.nfft,
        winsize: configuration.winsize,
        overlap: configuration.overlap,
        zoomLevels: [ ...Array(nbZooms) ].map((_, i) => Math.pow(2, i)),
        urlPrefix: urlParts ? urlParts[1] : '',
        urlFileName: urlParts ? urlParts[2] : '',
        urlFileExtension: urlParts ? urlParts[3] : '',
      }
    }).flatMap(info => {
      return info.zoomLevels.map(zoom => {
        const step: number = task.boundaries.duration / zoom;
        return {
          nfft: info.nfft,
          winsize: info.winsize,
          overlap: info.overlap,
          zoom,
          images: [ ...Array(zoom) ].map((_, i) => ({
            start: i * step,
            end: (i + 1) * step,
            src: `${ info.urlPrefix }${ info.urlFileName }_${ zoom }_${ i }${ info.urlFileExtension }`
          }))
        }
      })
    })
  }

  const getSpectrogramForParams = (allSpectrograms: Array<SpectrogramData>,
                                   zoom: number,
                                   params?: SpectrogramParams): SpectrogramData | undefined => {
    if (allSpectrograms.length === 0) return;
    if (!params) return allSpectrograms.find(d => d.zoom === zoom)
    return allSpectrograms.filter(d =>
      d.nfft === params.nfft &&
      d.winsize === params.winsize &&
      d.overlap === params.overlap
    ).find(d => d.zoom === zoom)
  }

  const getNewZoomLevel = (direction: 'in' | 'out'): number => {
    const oldZoomId: number = currentContext.availableZoomLevels.findIndex(z => z === currentContext.currentZoom);
    // When zoom will be free: if (direction > 0 && oldZoomIdx < zoomLevels.length - 1)
    if (direction === 'in' && (oldZoomId + 1) < currentContext.availableZoomLevels.length) {
      // Zoom in
      return currentContext.availableZoomLevels[oldZoomId + 1];
    } else if (direction === 'out' && oldZoomId > 0) {
      // Zoom out
      return currentContext.availableZoomLevels[oldZoomId - 1];
    } else return currentContext.currentZoom;
  }

  let allSpectrograms = currentContext.allSpectrograms;
  let currentSpectro: SpectrogramData | undefined;
  let zoom = currentContext.currentZoom;
  let availableParams = currentContext.availableParams;

  switch (action.type) {
    case 'init':
      allSpectrograms = getAllSpectrograms(action.task);
      currentSpectro = getSpectrogramForParams(allSpectrograms, 1);
      availableParams = allSpectrograms.map(c => ({
        nfft: c.nfft,
        overlap: c.overlap,
        winsize: c.winsize
      }))
      availableParams = availableParams.filter((p, i) => availableParams.findIndex(a => a.winsize === p.winsize && a.nfft === p.nfft && a.overlap === p.overlap) === i)
      return {
        ...currentContext,
        allSpectrograms,
        availableZoomLevels: [ ...new Set(allSpectrograms.map(c => c.zoom)) ].sort((a, b) => a - b),
        availableParams,
        currentImages: currentSpectro?.images ?? [],
        currentParams: currentSpectro ? {
          nfft: currentSpectro.nfft,
          overlap: currentSpectro.overlap,
          winsize: currentSpectro.winsize
        } : undefined,
        availableColormaps: Object.keys(colormaps),
        currentZoom: 1,
        currentZoomOrigin: undefined
      }

    case 'updateParams':
      return {
        ...currentContext,
        currentImages: getSpectrogramForParams(allSpectrograms, action.zoom, action.params)?.images ?? [],
        currentParams: action.params,
        currentZoomOrigin: undefined
      }

    case 'updateBrightness':
      return {
        ...currentContext,
        currentBrightness: action.brightness,
      };
    
    case 'updateContrast':
      return {
        ...currentContext,
        currentContrast: action.contrast,
      };

    case 'updateColormap':
      return {
        ...currentContext,
        currentColormap: action.params,
      };

    case 'zoom':
      zoom = getNewZoomLevel(action.direction);
      return {
        ...currentContext,
        currentImages: getSpectrogramForParams(allSpectrograms, zoom, currentContext.currentParams)?.images ?? [],
        currentZoom: zoom,
        currentZoomOrigin: action.origin
      }

    case 'updatePointerPosition':
      return {...currentContext, pointerPosition: action.position}
    case 'leavePointer':
      return {...currentContext, pointerPosition: undefined}

    default:
      return currentContext;
  }
}

export const ProvideSpectro: FC<{ children?: ReactNode }> = ({children}) => {
  const [ task, dispatch ] = useReducer(spectroReducer, SpectroCtxInitialValue);

  return (
    <SpectroContext.Provider value={ task }>
      <SpectroDispatchContext.Provider value={ dispatch }>
        { children }
      </SpectroDispatchContext.Provider>
    </SpectroContext.Provider>
  )
}
