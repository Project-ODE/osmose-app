import React, {
  Fragment,
  MouseEvent,
  PointerEvent,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  WheelEvent
} from "react";
import { Annotation, AnnotationMode, AnnotationType, Usage } from "@/types/annotations.ts";
import { Region } from "./region.component.tsx";
import { AudioPlayer } from "./audio-player.component.tsx";
import { useAppDispatch, useAppSelector } from "@/slices/app";
import { getZoomFromPath, leavePointer, updatePointerPosition, zoom } from "@/slices/annotator/spectro.ts";
import { SpectrogramImage } from "@/types/spectro.ts";
import { ScaleMapping } from "@/services/spectrogram/scale/abstract.scale.ts";
import { YAxis } from "@/components/spectrogram/y-axis.component.tsx";
import { XAxis } from "@/components/spectrogram/x-axis.component.tsx";
import { setDangerToast } from "@/slices/annotator/global-annotator.ts";
import { addResult } from "@/slices/annotator/annotations.ts";
import { colorSpectro } from "@/services/utils/color.ts";

export const SPECTRO_HEIGHT: number = 512;
export const SPECTRO_WIDTH: number = 1813;
export const Y_WIDTH: number = 35;
export const X_HEIGHT: number = 30;
export const SCROLLBAR_RESERVED: number = 20;
export const CONTROLS_AREA_SIZE: number = 80;

interface Props {
  audioPlayer: AudioPlayer | null;
}


class EditAnnotation {
  initTime: number;
  currentTime: number;
  initFrequency: number;
  currentFrequency: number;

  get startTime(): number {
    return Math.min(this.initTime, this.currentTime);
  }

  get endTime(): number {
    return Math.max(this.initTime, this.currentTime);
  }

  get startFrequency(): number {
    return Math.min(this.initFrequency, this.currentFrequency);
  }

  get endFrequency(): number {
    return Math.max(this.initFrequency, this.currentFrequency);
  }

  constructor(initTime: number, initFrequency: number) {
    this.initTime = initTime;
    this.initFrequency = initFrequency;
    this.currentTime = initTime;
    this.currentFrequency = initFrequency;
  }

  update(time: number, frequency: number): void {
    this.currentTime = time;
    this.currentFrequency = frequency;
  }

  copy(): EditAnnotation {
    const a = new EditAnnotation(this.initTime, this.initFrequency);
    a.update(this.currentTime, this.currentFrequency);
    return a;
  }
}

export interface SpectrogramRender {
  getCanvasData: () => Promise<string>;
}

export const SpectroRenderComponent = React.forwardRef<SpectrogramRender, Props>(({ audioPlayer, }, ref) => {

  const {
    currentMode,
    focusedLabel,
    wholeFileBoundaries,
    focusedConfidence,
    results,
  } = useAppSelector(state => state.annotator.annotations);
  const {
    time,
  } = useAppSelector(state => state.annotator.audio);
  const {
    task
  } = useAppSelector(state => state.annotator.global);
  const {
    currentZoom,
    currentZoomOrigin,
    selectedSpectroId,
    colormap,
    colormapInverted,
    brightness,
    contrast
  } = useAppSelector(state => state.annotator.spectro);
  const dispatch = useAppDispatch()

  const [_zoom, _setZoom] = useState<number>(1);
  const currentTime = useRef<number>(0)
  const [newAnnotation, setNewAnnotation] = useState<EditAnnotation | undefined>(undefined);
  const [images, setImages] = useState<Map<SpectrogramImage, HTMLImageElement>>(new Map());

  /**
   * Ref to canvas wrapper is used to modify its scrollLeft property.
   * @property { RefObject<HTMLDivElement>} wrapperRef React reference to the wrapper
   */
  const wrapperRef = useRef<HTMLDivElement>(null)

  /**
   * Ref to canvases are used to get their context.
   * @property { RefObject<HTMLCanvasElement>} canvasRef React reference to the canvas
   */
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const xAxis = useRef<ScaleMapping | null>(null);
  const yAxis = useRef<ScaleMapping | null>(null);

  // Is drawing enabled? (always in box mode, when a label is selected in presence mode)
  const isDrawingEnabled = useMemo(() => task.mode === Usage.create && currentMode === AnnotationMode.boxes || (
    currentMode === AnnotationMode.wholeFile && !!focusedLabel
  ), [focusedLabel, currentMode, task.mode]);

  const timeWidth = useMemo(() => SPECTRO_WIDTH * currentZoom, [currentZoom]);
  const currentSpectro = useMemo(() => task.spectroUrls.find(s => s.id === selectedSpectroId), [task.spectroUrls, selectedSpectroId]);

  // Handle current images list
  const currentImages = useMemo(() => {
    setImages(new Map());
    const list: Array<SpectrogramImage> = []
    for (const path of currentSpectro?.urls ?? []) {
      const { zoom, id } = getZoomFromPath(path)
      if (zoom !== currentZoom) continue
      list.push({
        path,
        id
      })
    }
    return list;
  }, [currentSpectro?.urls, currentZoom])

  useEffect(() => {
    loadSpectro()
  }, [currentImages, canvasRef.current, colormap, colormapInverted, brightness, contrast])

  const isInCanvas = (event: PointerEvent<HTMLDivElement> | MouseEvent) => {
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (!bounds) return false;
    if (event.clientX < bounds.x) return false;
    if (event.clientY < bounds.y) return false;
    if (event.clientX > bounds.x + bounds.width) return false;
    return event.clientY <= bounds.y + bounds.height;
  }

  // On zoom updated
  useEffect(() => {
    const canvas = canvasRef.current;
    const timeAxis = xAxis.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !timeAxis || !wrapper) return;

    // If zoom factor has changed
    if (currentZoom === _zoom) return;
    // New timePxRatio
    const newTimePxRatio: number = SPECTRO_WIDTH * currentZoom / wholeFileBoundaries.duration;

    // Resize canvases and scroll
    canvas.width = SPECTRO_WIDTH * currentZoom;

    // Compute new center (before resizing)
    let newCenter: number;
    if (currentZoomOrigin) {
      // x-coordinate has been given, center on it
      const bounds = canvas.getBoundingClientRect();
      newCenter = (currentZoomOrigin.x - bounds.left) * currentZoom / _zoom;
    } else {
      // If no x-coordinate: center on currentTime
      newCenter = currentTime.current * newTimePxRatio;
    }
    wrapper.scrollLeft = Math.floor(newCenter - SPECTRO_WIDTH / 2);
    _setZoom(currentZoom);
  }, [currentZoom]);

  // On current params loaded/changed

  // On current audio time changed
  useEffect(() => {
    // Scroll if progress bar reach the right edge of the screen
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;
    const oldX: number = Math.floor(canvas.width * currentTime.current / wholeFileBoundaries.duration);
    const newX: number = Math.floor(canvas.width * time / wholeFileBoundaries.duration);

    if ((oldX - wrapper.scrollLeft) < SPECTRO_WIDTH && (newX - wrapper.scrollLeft) >= SPECTRO_WIDTH) {
      wrapper.scrollLeft += SPECTRO_WIDTH;
    }
    currentTime.current = time;

    loadSpectro();
  }, [time])

  // On current newAnnotation changed
  useEffect(() => {
    loadSpectro();
  }, [newAnnotation?.currentTime, newAnnotation?.currentFrequency, newAnnotation])

  useImperativeHandle(ref, () => ({
    getCanvasData: async () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Cannot get fake canvas 2D context');

      // Get spectro images
      await loadSpectro(false)
      const spectroDataURL = canvasRef.current?.toDataURL('image/png');
      if (!spectroDataURL) throw new Error('Cannot recover spectro dataURL');
      loadSpectro();
      const spectroImg = new Image();

      // Get frequency scale
      const freqDataURL = yAxis.current?.canvas?.toDataURL('image/png');
      if (!freqDataURL) throw new Error('Cannot recover frequency dataURL');
      const freqImg = new Image();

      // Get time scale
      const timeDataURL = xAxis.current?.canvas?.toDataURL('image/png');
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
      context.drawImage(timeImg, Y_WIDTH, SPECTRO_HEIGHT, timeImg.width, timeImg.height);

      return canvas.toDataURL('image/png')
    }
  }), [canvasRef.current, xAxis.current, yAxis.current])

  const loadSpectroImages = (): Promise<void> => {
    if (!currentImages.length) throw 'no images to load';
    const promises = [];
    for (const data of currentImages) {
      if (data.image) continue;
      const image = new Image();
      image.src = data.path;
      promises.push(new Promise<void>((resolve, reject) => {
        image.onload = () => {
          images.set(data, image);
          setImages(images)
          resolve();
        }
        image.onerror = e => {
          dispatch(setDangerToast(`Cannot load spectrogram image with source: ${ image.src }`))
          reject(e);
        }
      }))
    }
    return Promise.all(promises).then();
  }

  const loadSpectro = async (withProgressBar: boolean = true): Promise<void> => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !context || currentImages.length < 0 || !yAxis.current || !xAxis.current) return;

    await loadSpectroImages();
    if (images.size !== currentImages.length) return;


    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!yAxis.current || !xAxis.current) return;

    // Draw spectro images
    for (const [spectro, image] of images.entries()) {
      const start = spectro.id * wholeFileBoundaries.duration / currentZoom;
      const end = (spectro.id + 1) * wholeFileBoundaries.duration / currentZoom;
      context.drawImage(
        image,
        xAxis.current!.valueToPosition(start),
        0,
        Math.floor(xAxis.current!.valuesToPositionRange(start, end)),
        canvas.height
      )
    }

    // Color spectro images
    colorSpectro(canvas, colormap, colormapInverted);
    context.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    // Progress bar
    if (withProgressBar) {
      context.fillStyle = 'rgba(0, 0, 0)';
      context.fillRect(xAxis.current!.valueToPosition(currentTime.current), 0, 1, canvas.height);
    }

    // Render new annotation
    if (newAnnotation && yAxis.current) {
      const a = newAnnotation;
      context.strokeStyle = 'blue';
      context.strokeRect(
        xAxis.current!.valueToPosition(Math.min(a.startTime, a.endTime)),
        yAxis.current!.valueToPosition(Math.max(a.startFrequency, a.endFrequency)),
        Math.floor(xAxis.current!.valuesToPositionRange(a.startTime, a.endTime)),
        yAxis.current!.valuesToPositionRange(a.startFrequency, a.endFrequency)
      );
    }
  }

  const getCoordsFromPointer = (e: PointerEvent | WheelEvent | MouseEvent): { x: number, y: number } | undefined => {
    if (!canvasRef.current) return;
    const bounds = canvasRef.current.getBoundingClientRect();
    return {
      y: e.clientY - bounds.y,
      x: e.clientX - bounds.x,
    }
  }

  const getFreqTimeFromPointer = (e: PointerEvent<HTMLDivElement> | MouseEvent): {
    frequency: number,
    time: number
  } | undefined => {
    if (!isInCanvas(e)) return;
    if (!yAxis.current || !xAxis.current || !wrapperRef.current) return;
    const coords = getCoordsFromPointer(e);
    if (!coords) return;
    return {
      frequency: yAxis.current.positionToValue(coords.y),
      time: xAxis.current.positionToValue(coords.x),
    }
  }

  const onUpdateNewAnnotation = (e: PointerEvent<HTMLDivElement>) => {
    const data = getFreqTimeFromPointer(e);
    if (data) {
      dispatch(updatePointerPosition(data))
      newAnnotation?.update(data.time, data.frequency);
    } else dispatch(leavePointer())
  }

  const onStartNewAnnotation = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDrawingEnabled) return;
    const data = getFreqTimeFromPointer(e);
    if (!data) return;

    const newAnnotation = new EditAnnotation(data!.time, data!.frequency);
    setNewAnnotation(newAnnotation);
  }

  const onEndNewAnnotation = (e: PointerEvent<HTMLDivElement>) => {
    if (!yAxis.current || !xAxis.current) return;
    if (newAnnotation) {
      const data = getFreqTimeFromPointer(e);
      if (data) newAnnotation.update(data.time, data.frequency)
      if (!yAxis.current.isRangeContinuouslyOnScale(newAnnotation.startFrequency, newAnnotation.endFrequency)) {
        const minFreq = Math.min(newAnnotation.startFrequency, newAnnotation.endFrequency);
        const maxFreq = Math.max(newAnnotation.startFrequency, newAnnotation.endFrequency);
        dispatch(setDangerToast(`Be careful, your annotation overlaps a void in the frequency scale.
         Are you sure your annotation goes from ${ minFreq.toFixed(0) }Hz to ${ maxFreq.toFixed(0) }Hz?`))
      }
      const width = xAxis.current?.valuesToPositionRange(newAnnotation.startTime, newAnnotation.endTime);
      const height = yAxis.current?.valuesToPositionRange(newAnnotation.startFrequency, newAnnotation.endFrequency);
      if (width > 2 && height > 2) {
        dispatch(addResult({
          type: AnnotationType.box,
          label: focusedLabel ?? '',
          confidenceIndicator: focusedConfidence,
          startTime: newAnnotation.startTime,
          endTime: newAnnotation.endTime,
          startFrequency: newAnnotation.startFrequency,
          endFrequency: newAnnotation.endFrequency,
          result_comments: [],
          validation: null
        }))
      }
    }
    setNewAnnotation(undefined);
  }

  const onWheel = (event: WheelEvent) => {
    // Prevent page scrolling
    event.stopPropagation(); // TODO: make it work!

    const origin = getCoordsFromPointer(event);

    if (!origin) return;
    if (event.deltaY < 0) dispatch(zoom({ direction: 'in', origin }))
    else if (event.deltaY > 0) dispatch(zoom({ direction: 'out', origin }))
  }

  return (
    <Fragment>

      <YAxis width={ Y_WIDTH }
             height={ SPECTRO_HEIGHT }
             ref={ yAxis }
             linear_scale={ currentSpectro?.linear_frequency_scale }
             multi_linear_scale={ currentSpectro?.multi_linear_frequency_scale }
             max_value={ wholeFileBoundaries.endFrequency }
             style={ { position: 'absolute', top: `${ CONTROLS_AREA_SIZE }px` } }></YAxis>


      <div className="canvas-wrapper"
           ref={ wrapperRef }
           onPointerDown={ onStartNewAnnotation }
           onPointerMove={ onUpdateNewAnnotation }
           onPointerLeave={ () => dispatch(leavePointer()) }
           onPointerUp={ onEndNewAnnotation }
           style={ {
             width: `${ SPECTRO_WIDTH }px`,
             height: `${ SPECTRO_HEIGHT + X_HEIGHT + SCROLLBAR_RESERVED }px`,
             top: `${ CONTROLS_AREA_SIZE }px`,
           } }>

        <canvas className={ `canvas ${ isDrawingEnabled && 'drawable' }` }
                ref={ canvasRef }
                height={ SPECTRO_HEIGHT }
                width={ SPECTRO_WIDTH }
                onClick={ e => audioPlayer?.seek(getFreqTimeFromPointer(e)?.time ?? 0) }
                onWheel={ onWheel }></canvas>

        <XAxis width={ timeWidth }
               height={ X_HEIGHT }
               ref={ xAxis }
               max_value={ wholeFileBoundaries.duration }
               style={ { position: 'absolute', top: `${ SPECTRO_HEIGHT }px` } }></XAxis>

        { results
          .filter(a => a.type === AnnotationType.box)
          .map((annotation: Annotation, key: number) => (
            <Region key={ key }
                    annotation={ annotation }
                    yAxis={ yAxis }
                    xAxis={ xAxis }
                    audioPlayer={ audioPlayer }></Region>
          )) }
      </div>
    </Fragment>)
})
