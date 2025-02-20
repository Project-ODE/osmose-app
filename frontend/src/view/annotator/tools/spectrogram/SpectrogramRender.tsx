import React, {
  MouseEvent,
  MutableRefObject,
  PointerEvent,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  WheelEvent
} from "react";
import { useAppDispatch, useAppSelector } from '@/service/app';
import { useAudioService } from "@/services/annotator/audio.service.ts";
import { AnnotationResult, BoxBounds } from '@/service/campaign/result';
import { addResult, leavePointerPosition, setPointerPosition, zoom } from '@/service/annotator';
import { useToast } from "@/service/ui";
import styles from '../annotator-tools.module.scss'
import { YAxis } from "@/view/annotator/tools/spectrogram/YAxis.tsx";
import { XAxis } from "@/view/annotator/tools/spectrogram/XAxis.tsx";
import { AcousticFeatures } from "@/view/annotator/tools/bloc/AcousticFeatures.tsx";
import { MOUSE_DOWN_EVENT, MOUSE_MOVE_EVENT, MOUSE_UP_EVENT } from "@/service/events";
import { useAnnotator } from "@/service/annotator/hook.ts";
import { TimeBar } from "@/view/annotator/tools/spectrogram/TimeBar.tsx";
import { Annotation } from "@/view/annotator/tools/spectrogram/annotation/Annotation.tsx";
import { usePointerService } from '@/service/annotator/spectrogram/pointer';
import { useDisplaySpectrogram, useFileDuration, useSpectrogramDimensions } from '@/service/annotator/spectrogram';
import { useAxis, Y_WIDTH } from '@/service/annotator/spectrogram/scale';

interface Props {
  audioPlayer: MutableRefObject<HTMLAudioElement | null>;
}

export interface SpectrogramRender {
  getCanvasData: () => Promise<string>;
}

export const SpectrogramRender = React.forwardRef<SpectrogramRender, Props>(({ audioPlayer, }, ref) => {
  // Data
  const {
    annotatorData,
    campaign,
  } = useAnnotator();
  const {
    focusedLabel,
    results,
    audio,
    userPreferences,
    ui,
  } = useAppSelector(state => state.annotator)
  const dispatch = useAppDispatch()
  const [ newResult, setNewResult ] = useState<BoxBounds | undefined>(undefined);
  const _newResult = useRef<BoxBounds | undefined>(undefined);
  useEffect(() => {
    setNewResult(_newResult.current)
  }, [ _newResult.current ]);

  // Ref
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Services
  const duration = useFileDuration();
  const { containerWidth, height, width } = useSpectrogramDimensions()
  const { xAxis, yAxis } = useAxis()
  const { resetCanvas, drawSpectrogram, drawResult } = useDisplaySpectrogram(canvasRef);

  const audioService = useAudioService(audioPlayer);
  const pointerService = usePointerService();
  const toast = useToast();

  const [ _zoom, _setZoom ] = useState<number>(1);
  const currentTime = useRef<number>(0)


  // Is drawing enabled? (always in box mode, when a label is selected in presence mode)
  const isDrawingEnabled = useMemo(() => campaign?.usage === 'Create' && !!focusedLabel && !!annotatorData?.is_assigned, [ focusedLabel, campaign?.usage, annotatorData?.is_assigned ]);
  const _isDrawingEnabled = useRef<boolean>(isDrawingEnabled)
  useEffect(() => {
    _isDrawingEnabled.current = isDrawingEnabled
  }, [ isDrawingEnabled ]);

  useEffect(() => {
    updateCanvas()
  }, [ annotatorData?.spectrogram_configurations, userPreferences.spectrogramConfigurationID ])


  // On zoom updated
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = containerRef.current;
    if (!canvas || !wrapper) return;

    // If zoom factor has changed
    if (userPreferences.zoomLevel === _zoom) return;
    // New timePxRatio
    const newTimePxRatio: number = containerWidth * userPreferences.zoomLevel / duration;

    // Resize canvases and scroll
    canvas.width = containerWidth * userPreferences.zoomLevel;

    // Compute new center (before resizing)
    let newCenter: number;
    if (ui.zoomOrigin) {
      // x-coordinate has been given, center on it
      const bounds = canvas.getBoundingClientRect();
      newCenter = (ui.zoomOrigin.x - bounds.left) * userPreferences.zoomLevel / _zoom;
      const coords = {
        clientX: ui.zoomOrigin.x,
        clientY: ui.zoomOrigin.y
      }
      if (pointerService.isHoverCanvas(coords)) {
        const data = pointerService.getFreqTime(coords);
        if (data) dispatch(setPointerPosition(data))
      }
    } else {
      // If no x-coordinate: center on currentTime
      newCenter = currentTime.current * newTimePxRatio;
    }
    wrapper.scrollLeft = Math.floor(newCenter - containerWidth / 2);
    _setZoom(userPreferences.zoomLevel);
    updateCanvas()
  }, [ userPreferences.zoomLevel ]);

  // On current params loaded/changed

  // On current audio time changed
  useEffect(() => {
    // Scroll if progress bar reach the right edge of the screen
    const wrapper = containerRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;
    const oldX: number = Math.floor(canvas.width * currentTime.current / duration);
    const newX: number = Math.floor(canvas.width * audio.time / duration);

    if ((oldX - wrapper.scrollLeft) < containerWidth && (newX - wrapper.scrollLeft) >= containerWidth) {
      wrapper.scrollLeft += containerWidth;
    }
    currentTime.current = audio.time;
  }, [ audio.time ])

  // On current newAnnotation changed
  useEffect(() => {
    updateCanvas();
  }, [ newResult?.end_time, newResult?.end_frequency, newResult ])

  useImperativeHandle(ref, () => ({
    getCanvasData: async () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Cannot get fake canvas 2D context');

      // Get spectro images
      await updateCanvas()
      const spectroDataURL = canvasRef.current?.toDataURL('image/png');
      if (!spectroDataURL) throw new Error('Cannot recover spectro dataURL');
      updateCanvas();
      const spectroImg = new Image();

      // Get frequency scale
      const freqDataURL = yAxis.canvas?.toDataURL('image/png');
      if (!freqDataURL) throw new Error('Cannot recover frequency dataURL');
      const freqImg = new Image();

      // Get time scale
      const timeDataURL = xAxis.canvas?.toDataURL('image/png');
      if (!timeDataURL) throw new Error('Cannot recover time dataURL');
      const timeImg = new Image();

      // Compute global canvas
      /// Load images
      await new Promise((resolve, reject) => {
        let isSpectroLoaded = false;
        let isFreqLoaded = false;
        let isTimeLoaded = false;
        spectroImg.onerror = e => reject(e)
        freqImg.onerror = e => reject(e)
        timeImg.onerror = e => reject(e)

        spectroImg.onload = () => {
          isSpectroLoaded = true;
          if (isFreqLoaded && isTimeLoaded) resolve(true);
        }
        freqImg.onload = () => {
          isFreqLoaded = true;
          if (isSpectroLoaded && isTimeLoaded) resolve(true);
        }
        timeImg.onload = () => {
          isTimeLoaded = true;
          if (isSpectroLoaded && isFreqLoaded) resolve(true);
        }

        spectroImg.src = spectroDataURL;
        freqImg.src = freqDataURL;
        timeImg.src = timeDataURL;
      });
      canvas.height = timeImg.height + spectroImg.height;
      canvas.width = freqImg.width + spectroImg.width;

      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height)

      context.drawImage(spectroImg, Y_WIDTH, 0, spectroImg.width, spectroImg.height);
      context.drawImage(freqImg, 0, 0, freqImg.width, freqImg.height);
      context.drawImage(timeImg, Y_WIDTH, height, timeImg.width, timeImg.height);

      return canvas.toDataURL('image/png')
    }
  }), [ canvasRef.current, xAxis, yAxis ])

  useEffect(() => {
    MOUSE_DOWN_EVENT.add(onStartNewAnnotation)
    MOUSE_MOVE_EVENT.add(onUpdateNewAnnotation)
    MOUSE_UP_EVENT.add(onEndNewAnnotation)

    return () => {
      MOUSE_DOWN_EVENT.remove(onStartNewAnnotation)
      MOUSE_MOVE_EVENT.remove(onUpdateNewAnnotation)
      MOUSE_UP_EVENT.remove(onEndNewAnnotation)
    }
  }, []);


  const updateCanvas = async (): Promise<void> => {
    resetCanvas();
    await drawSpectrogram();

    if (newResult) drawResult(newResult);
  }

  const onUpdateNewAnnotation = (e: PointerEvent<HTMLDivElement>) => {
    const isHover = pointerService.isHoverCanvas(e)
    const data = pointerService.getFreqTime(e);
    if (data) {
      if (isHover) dispatch(setPointerPosition(data))
      if (_newResult.current) {
        _newResult.current.end_time = data.time;
        _newResult.current.end_frequency = data.frequency;
      }
    }
    if (!isHover || !data) dispatch(leavePointerPosition())
  }

  const onStartNewAnnotation = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!_isDrawingEnabled.current) return;
    const data = pointerService.getFreqTime(e);
    if (!data) return;

    _newResult.current = {
      type: 'Box',
      start_time: data.time,
      end_time: data.time,
      start_frequency: data.frequency,
      end_frequency: data.frequency,
    };
  }

  const onEndNewAnnotation = (e: PointerEvent<HTMLDivElement>) => {
    if (_newResult.current) {
      const data = pointerService.getFreqTime(e);
      if (data) {
        _newResult.current.end_time = data.time;
        _newResult.current.end_frequency = data.frequency;
      }
      if (_newResult.current.type !== 'Box') return;
      const start_time = Math.min(_newResult.current.start_time, _newResult.current.end_time);
      const end_time = Math.max(_newResult.current.start_time, _newResult.current.end_time);
      const start_frequency = Math.min(_newResult.current.start_frequency, _newResult.current.end_frequency);
      const end_frequency = Math.max(_newResult.current.start_frequency, _newResult.current.end_frequency);
      _newResult.current.start_time = start_time;
      _newResult.current.end_time = end_time;
      _newResult.current.start_frequency = start_frequency;
      _newResult.current.end_frequency = end_frequency;

      const minFreq = Math.min(_newResult.current.start_frequency, _newResult.current.end_frequency);
      const maxFreq = Math.max(_newResult.current.start_frequency, _newResult.current.end_frequency);
      if (!yAxis.isRangeContinuouslyOnScale(minFreq, maxFreq)) {
        toast.presentError(`Be careful, your annotation overlaps a void in the frequency scale.
         Are you sure your annotation goes from ${ minFreq.toFixed(0) }Hz to ${ maxFreq.toFixed(0) }Hz?`)
      }
      const width = xAxis.valuesToPositionRange(_newResult.current.start_time, _newResult.current.end_time);
      const height = yAxis.valuesToPositionRange(_newResult.current.start_frequency, _newResult.current.end_frequency);
      if (width > 2 && height > 2) {
        dispatch(addResult(_newResult.current))
      } else {
        dispatch(addResult({
          type: 'Point',
          start_time: _newResult.current.start_time,
          start_frequency: _newResult.current.start_frequency,
          end_time: null,
          end_frequency: null
        }))
      }
    }
    _newResult.current = undefined;
    if (!pointerService.isHoverCanvas(e)) dispatch(leavePointerPosition())
  }

  function onClick(e: MouseEvent<HTMLCanvasElement>) {
    audioService.seek(pointerService.getFreqTime(e)?.time ?? 0)
  }

  const onWheel = (event: WheelEvent) => {
    // Disable zoom if the user wants horizontal scroll
    if (event.shiftKey) return;

    // Prevent page scrolling
    event.stopPropagation();

    const origin = pointerService.getCoords(event);

    if (!origin) return;
    if (event.deltaY < 0) dispatch(zoom({ direction: 'in', origin }))
    else if (event.deltaY > 0) dispatch(zoom({ direction: 'out', origin }))
  }

  return (
    <div className={ styles.spectrogramRender }
         style={ { width: `${ Y_WIDTH + containerWidth }px` } }>

      <YAxis className={ styles.yAxis }/>

      <div ref={ containerRef } onMouseDown={ e => e.stopPropagation() }
           className={ styles.spectrogram }
           onPointerLeave={ () => dispatch(leavePointerPosition()) }>

        {/* 'drawable' class is for playwright tests */ }
        <canvas className={ isDrawingEnabled ? `drawable ${ styles.drawable }` : '' }
                ref={ canvasRef }
                height={ height }
                width={ width }
                onMouseDown={ onStartNewAnnotation }
                onClick={ onClick }
                onWheel={ onWheel }/>

        <TimeBar/>

        { results?.map((annotation: AnnotationResult, key: number) => (
          <Annotation key={ key } annotation={ annotation } audioPlayer={ audioPlayer }/>
        )) }
      </div>

      <XAxis className={ styles.xAxis }/>

      <AcousticFeatures/>
    </div>)
})
