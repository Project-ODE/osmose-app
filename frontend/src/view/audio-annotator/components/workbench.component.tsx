import React, { useContext } from 'react';
import { formatTimestamp } from "../../../services/annotator/format/format.util.tsx";
import { SpectroRenderComponent } from "./spectro-render.component.tsx";
import { AudioPlayer } from "./audio-player.component.tsx";
import {
  SpectroContext, SpectroDispatchContext
} from "../../../services/annotator/spectro/spectro.context.tsx";
import { AnnotationsContext } from "../../../services/annotator/annotations/annotations.context.tsx";
import { AnnotatorContext } from "../../../services/annotator/annotator.context.tsx";

// Component dimensions constants
export const SPECTRO_CANVAS_HEIGHT: number = 512;
const SPECTRO_CANVAS_WIDTH: number = 1813;
const CONTROLS_AREA_SIZE: number = 80;
const TIME_AXIS_SIZE: number = 30;
const FREQ_AXIS_SIZE: number = 35;
const SCROLLBAR_RESERVED: number = 20;

type Props = {
  audioPlayer: AudioPlayer | null;
};

export const Workbench: React.FC<Props> = ({ audioPlayer, }) => {
  const spectroContext = useContext(SpectroContext);
  const spectroDispatch = useContext(SpectroDispatchContext);
  const resultContext = useContext(AnnotationsContext);
  const context = useContext(AnnotatorContext);

  const style = {
    workbench: {
      height: `${ CONTROLS_AREA_SIZE + SPECTRO_CANVAS_HEIGHT + TIME_AXIS_SIZE + SCROLLBAR_RESERVED }px`,
      width: `${ FREQ_AXIS_SIZE + SPECTRO_CANVAS_WIDTH }px`,
    },
  };

  return (
    <div className="workbench rounded"
         style={ style.workbench }>
      <div className="workbench-controls">
        <select
          defaultValue={ spectroContext.currentParams ? spectroContext.availableParams.indexOf(spectroContext.currentParams) : 0 }
          onChange={ e => spectroDispatch!({
            type: 'updateParams',
            params: spectroContext.availableParams[+e.target.value],
            zoom: 1
          }) }>
          { spectroContext.availableParams.map((params, idx) => {
            return (
              <option key={ `params-${ idx }` } value={ idx }>
                { `nfft: ${ params.nfft } / winsize: ${ params.winsize } / overlap: ${ params.overlap }` }
              </option>
            );
          }) }
        </select>
        <button className="btn-simple fa fa-search-plus"
                onClick={ () => spectroDispatch!({ type: 'zoom', direction: 'in' }) }></button>
        <button className="btn-simple fa fa-search-minus"
                onClick={ () => spectroDispatch!({ type: 'zoom', direction: 'out' }) }></button>
        <span>{ spectroContext.currentZoom }x</span>
        <label htmlFor="colormap">Colormap:</label>
        <select
          id="colormap"
          defaultValue={ spectroContext.currentColormap.colormap }
          onChange={ e => spectroDispatch!({
            type: 'updateColormap',
            params: { colormap: e.target.value, invertColors: spectroContext.currentColormap.invertColors },
          })}>
            { spectroContext.availableColormaps.map((colormap, idx) => {
              return (
                <option key={ `colormap-${idx}` } value={ colormap }>{ colormap }</option>
              );
            }) }
        </select>
        <div className="form-check">
          <input
            id="invertColors"
            type="checkbox"
            className="form-check-input"
            checked={ spectroContext.currentColormap.invertColors }
            onChange={ e => spectroDispatch!({
              type: 'updateColormap',
              params: { colormap: spectroContext.currentColormap.colormap, invertColors: e.target.checked },
            }) }
          />
          <label className="form-check-label" htmlFor="invertColors">Invert colors</label>
        </div>
      </div>

      { spectroContext.pointerPosition && <p className="workbench-pointer">
        { spectroContext.pointerPosition.frequency.toFixed(2) }Hz / { formatTimestamp(spectroContext.pointerPosition.time, false) }
      </p> }

      <p className="workbench-info workbench-info--intro">
        File : <strong>{ context.audioURL?.split('/').pop() ?? '' }</strong> - Sampling
        : <strong>{ context.audioRate ?? 0 } Hz</strong><br/>
        Start date : <strong>{ resultContext.wholeFileBoundaries.startTime.toUTCString() }</strong>
      </p>

      <SpectroRenderComponent audioPlayer={ audioPlayer }/>
    </div>
  );
}
