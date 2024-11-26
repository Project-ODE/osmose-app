import React, { useImperativeHandle, useRef } from 'react';
import { SpectrogramRender, SpectroRenderComponent } from "./spectro-render.component.tsx";
import { AudioPlayer } from "./audio-player.component.tsx";
import { useAppDispatch, useAppSelector } from "@/slices/app";
import { selectSpectro, updateBrightness, updateColormap, updateColormapInverted, updateContrast, zoom } from "@/slices/annotator/spectro.ts";
import { RetrieveSpectroURL } from "@/services/api/annotation-task-api.service.tsx";
import { PointerPosition } from "@/view/audio-annotator/components/bloc/pointer-position.component.tsx";
import { COLORMAPS } from '@/services/utils/color.ts';
import { Select } from '@/components/form/index.ts';

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

export const Workbench = React.forwardRef<SpectrogramRender, Props>(({ audioPlayer, }, ref) => {

  const {
    task
  } = useAppSelector(state => state.annotator.global);
  const {
    wholeFileBoundaries,
  } = useAppSelector(state => state.annotator.annotations);
  const {
    currentZoom,
    selectedSpectroId,
    colormap,
    colormapInverted,
    brightness,
    contrast
  } = useAppSelector(state => state.annotator.spectro);
  const dispatch = useAppDispatch()

  const style = {
    workbench: {
      height: `${ CONTROLS_AREA_SIZE + SPECTRO_CANVAS_HEIGHT + TIME_AXIS_SIZE + SCROLLBAR_RESERVED }px`,
      width: `${ FREQ_AXIS_SIZE + SPECTRO_CANVAS_WIDTH }px`,
    },
  };

  const spectrogramRender = useRef<SpectrogramRender | null>(null);
  useImperativeHandle(ref, () => ({
    getCanvasData: async () => {
      if (!spectrogramRender.current) throw new Error('no renderer');
      return spectrogramRender.current.getCanvasData();
    }
  }), [spectrogramRender.current])

  const getScaleNameFor = (spectro: RetrieveSpectroURL) => {
    if (spectro.linear_frequency_scale) return spectro.linear_frequency_scale.name ?? 'Linear';
    if (spectro.multi_linear_frequency_scale) return spectro.multi_linear_frequency_scale.name ?? 'Multi-linear';
    return 'Default'
  }

  return (
    <div className="workbench rounded"
         style={ style.workbench }>
      <div className="workbench-controls">

        {/* Param selection */}
        <div>
          <select
            defaultValue={ selectedSpectroId }
            onChange={ e => dispatch(selectSpectro(+e.target.value)) }>
            { task.spectroUrls.map(spectro => (
              <option key={ spectro.id } value={ spectro.id }>
                nfft: { spectro.nfft } | winsize: { spectro.winsize } | overlap: { spectro.overlap } | scale: { getScaleNameFor(spectro) }
              </option>
            ))
            }
          </select>
        </div>

        {/* Zoom selection */}
        <div>
          <button className="btn-simple fa fa-search-plus"
                  onClick={ () => dispatch(zoom({ direction: 'in' })) }></button>
          <button className="btn-simple fa fa-search-minus"
                  onClick={ () => dispatch(zoom({ direction: 'out' })) }></button>
          <span>{ currentZoom }x</span>
        </div>

        {/* Colormap selection */}
        <div>
          <Select required={ true }
                  value={ colormap }
                  placeholder="Select a colormap"
                  onValueSelected={ (value) => dispatch(updateColormap(value as string)) }
                  optionsContainer="popover"
                  options={ Object.keys(COLORMAPS).map((cmap) => ({
                    value: cmap, label: cmap, img: `/images/colormaps/${cmap}.png`
                  })) }
          />
          <input
            id="invertColors"
            type="checkbox"
            checked={ colormapInverted }
            onChange={ e => dispatch(updateColormapInverted(e.target.checked)) }
          />
          <label htmlFor="invertColors">Inverted</label>
          <input id="brightness" type="range" name="brightness" min="0" max="200" onChange={
            e => dispatch(updateBrightness(e.target.valueAsNumber))
          } />
          <label htmlFor="brightness">{ brightness } %</label>
          <input id="contrast" type="range" name="contrast" min="0" max="200" onChange={
            e => dispatch(updateContrast(e.target.valueAsNumber))
          } />
          <label htmlFor="contrast">{ contrast } %</label>
        </div>
      </div>

      <PointerPosition/>

      <p className="workbench-info workbench-info--intro">
        Campaign: <strong>{ task.campaignName }</strong>
        <br/>
        File: <strong>{ task.audioUrl?.split('/').pop() ?? '' }</strong> -
        Sampling: <strong>{ task.audioRate ?? 0 } Hz</strong>
        <br/>
        Start date: <strong>{ new Date(wholeFileBoundaries.startTime).toUTCString() }</strong>
      </p>

      <SpectroRenderComponent audioPlayer={ audioPlayer } ref={ spectrogramRender }/>
    </div>
  );
})
