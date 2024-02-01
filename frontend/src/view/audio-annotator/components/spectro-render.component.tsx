import { useAnnotatorService } from "../../../services/annotator/annotator.service.tsx";
import React, {
  Fragment,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  WheelEvent
} from "react";
import { AnnotationMode, AnnotationType } from "../../../enum/annotation.enum.tsx";
import { Annotation } from "../../../interface/annotation.interface.tsx";
import Region from "./region.component.tsx";
import { buildErrorMessage, formatTimestamp } from "../../../services/annotator/format/format.util.tsx";
import { Subscription } from "rxjs";
import { useAudioContext } from "../../../services/annotator/audio/audio.context.tsx";
import { AudioPlayer } from "./audio-player.component.tsx";
import { useSpectroContext, useSpectroDispatch } from "../../../services/annotator/spectro/spectro.context.tsx";

export const SPECTRO_HEIGHT: number = 512;
export const SPECTRO_WIDTH: number = 1813;
export const Y_WIDTH: number = 35;
export const X_HEIGHT: number = 30;
export const SCROLLBAR_RESERVED: number = 20;
export const CONTROLS_AREA_SIZE: number = 80;

interface Props {
  onAnnotationCreated: (a: Annotation) => void;
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
}

export const SpectroRenderComponent: React.FC<Props> = ({
                                                          onAnnotationCreated,
                                                          audioPlayer,
                                                        }) => {
  const { context, pointerUpSubject, pointerMoveSubject, toasts } = useAnnotatorService();
  const audioContext = useAudioContext();
  const spectroContext = useSpectroContext();
  const spectroDispatch = useSpectroDispatch();

  const [zoom, setZoom] = useState<number>(1);
  const [currenTime, setCurrenTime] = useState<number>(0);
  const [newAnnotation, setNewAnnotation] = useState<EditAnnotation | undefined>();

  /**
   * Ref to canvas wrapper is used to modify its scrollLeft property.
   * @property { RefObject<HTMLDivElement>} wrapperRef React reference to the wrapper
   */
  const wrapperRef = useRef<HTMLDivElement>(null)

  /**
   * Ref to canvases are used to get their context.
   * @property { RefObject<HTMLCanvasElement>} spectroRef React reference to the canvas
   */
  const spectroRef = useRef<HTMLCanvasElement>(null);
  const yAxisRef = useRef<HTMLCanvasElement>(null);
  const xAxisRef = useRef<HTMLCanvasElement>(null);

  // Is drawing enabled? (always in box mode, when a tag is selected in presence mode)
  const isDrawingEnabled = useMemo(() => !!context.task && (context.task.annotationScope === AnnotationMode.boxes || (
    context.task.annotationScope === AnnotationMode.wholeFile && !!context.annotations.focus?.annotation
  )), [context.task, context.annotations.focus?.annotation]);

  const frequencyRange = useMemo(
    () => context.task!.boundaries.endFrequency - context.task!.boundaries.startFrequency,
    [context.task?.boundaries]
  );

  const timePixelRatio = useMemo(() => SPECTRO_WIDTH * spectroContext.currentZoom / context.task!.duration, [context.task?.duration, spectroContext.currentZoom]);
  const frequencyPixelRatio = useMemo(() => SPECTRO_HEIGHT / (frequencyRange), [context.task?.boundaries]);

  const isInCanvas = (event: PointerEvent) => {
    const bounds = spectroRef.current?.getBoundingClientRect();
    return !!bounds
      && event.clientX >= bounds.x
      && event.clientX <= (bounds.x + bounds.width)
      && event.clientY >= bounds.y
      && event.clientX <= (bounds.y + bounds.height)
  }

  // Component loads
  useEffect(() => {
    loadY();
    loadX();

    const sub = new Subscription();
    sub.add(pointerMoveSubject.subscribe(e => {
      const time = getTimeFromClientX(e.clientX);
      const frequency = getFrequencyFromClientY(e.clientY)

      newAnnotation?.update(time, frequency);
      console.info('[pointerMove]', time, frequency)
      if (isInCanvas(e)) spectroDispatch!({ type: 'updatePointerPosition', position: { time, frequency } })
      else spectroDispatch!({ type: 'leavePointer' })
    }))
    ;
    sub.add(pointerUpSubject.subscribe(e => onEndNewAnnotation(e)));

    return () => {
      sub.unsubscribe();
    }
  }, [])

  // On zoom updated
  useEffect(() => {
    const canvas = spectroRef.current;
    const timeAxis = xAxisRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !timeAxis || !wrapper) return;

    // If zoom factor has changed
    if (spectroContext.currentZoom === zoom) return;
    // New timePxRatio
    const newTimePxRatio: number = SPECTRO_WIDTH * spectroContext.currentZoom / context.task!.duration;

    // Resize canvases and scroll
    canvas.width = SPECTRO_WIDTH * spectroContext.currentZoom;
    timeAxis.width = SPECTRO_WIDTH * spectroContext.currentZoom;

    // Compute new center (before resizing)
    let newCenter: number;
    if (spectroContext.currentZoomOrigin) {
      // x-coordinate has been given, center on it
      const bounds = canvas.getBoundingClientRect();
      newCenter = (spectroContext.currentZoomOrigin.x - bounds.left) * spectroContext.currentZoom / zoom;
    } else {
      // If no x-coordinate: center on currentTime
      newCenter = audioContext.time * newTimePxRatio;
    }
    wrapper.scrollLeft = Math.floor(newCenter - SPECTRO_WIDTH / 2);
    setZoom(spectroContext.currentZoom);
  }, [spectroContext.currentZoom]);

  // On current params loaded/changed
  useEffect(() => {
    loadX();
    loadSpectro();
  }, [spectroContext.currentImages])

  // On current audio time changed
  useEffect(() => {
    loadSpectro();

    // Scroll if progress bar reach the right edge of the screen
    const wrapper = wrapperRef.current;
    const canvas = spectroRef.current;
    if (!wrapper || !canvas) return;
    const oldX: number = Math.floor(canvas.width * currenTime / context.task!.duration);
    const newX: number = Math.floor(canvas.width * audioContext.time / context.task!.duration);

    if ((oldX - wrapper.scrollLeft) < SPECTRO_WIDTH && (newX - wrapper.scrollLeft) >= SPECTRO_WIDTH) {
      wrapper.scrollLeft += SPECTRO_WIDTH;
    }
    setCurrenTime(audioContext.time);
  }, [audioContext.time])

  // On current newAnnotation changed
  useEffect(() => {
    loadSpectro();
  }, [newAnnotation])

  const getTimeFromClientX = (clientX: number): number => {
    const canvas = spectroRef.current;
    if (!canvas) return 0;
    const bounds = canvas.getBoundingClientRect();

    const pixel = Math.min(Math.max(clientX, bounds.left), bounds.right) - bounds.left;
    return pixel / timePixelRatio;
  }

  const getFrequencyFromClientY = (clientY: number): number => {
    const canvas = spectroRef.current;
    if (!canvas) return 0;
    const bounds = canvas.getBoundingClientRect();

    const pixel = Math.min(Math.max(clientY, bounds.top), bounds.bottom);
    return (context.task!.boundaries.startFrequency + bounds.bottom - pixel) / frequencyPixelRatio;
  }

  const getXSteps = (duration: number) => {
    if (duration <= 60) return { step: 1, bigStep: 5 }
    else if (duration > 60 && duration <= 120) return { step: 2, bigStep: 5 }
    else if (duration > 120 && duration <= 500) return { step: 4, bigStep: 5 }
    else if (duration > 500 && duration <= 1000) return { step: 10, bigStep: 60 }
    else return { step: 30, bigStep: 120 }
  }

  const loadX = (): void => {
    const timeAxis = xAxisRef.current;
    const context = timeAxis?.getContext('2d');
    if (!timeAxis || !context) return;

    context.clearRect(0, 0, timeAxis.width, timeAxis.height);

    const durationOnScreen: number = SPECTRO_WIDTH / timePixelRatio;
    const steps = getXSteps(durationOnScreen);

    const bounds: DOMRect = timeAxis.getBoundingClientRect();
    const startTime: number = Math.ceil(getTimeFromClientX(bounds.left));
    const endTime: number = Math.floor(getTimeFromClientX(bounds.right));

    context.fillStyle = 'rgba(0, 0, 0)';
    context.font = '10px Arial';

    for (let i = startTime; i <= endTime; i++) {
      if (i % steps.step === 0) {
        const x: number = (i - startTime) * timePixelRatio;

        if (i % steps.bigStep === 0) {
          // Bar
          context.fillRect(x, 0, 2, 15);

          // Text
          const timeText: string = formatTimestamp(i, false);
          let xTxt: number = x;
          if (xTxt > 0) {
            // "Right align" all labels but first
            xTxt -= Math.round(timeText.length * 5);
          }
          context.fillText(timeText, xTxt, 25);
        } else {
          // Bar only
          context.fillRect(x, 0, 1, 10);
        }
      }
    }
  }

  const getYSteps = () => {
    if (frequencyRange <= 200) return { step: 5, bigStep: 20 }
    else if (frequencyRange > 200 && frequencyRange <= 500) return { step: 10, bigStep: 100 }
    else if (frequencyRange > 500 && frequencyRange <= 2000) return { step: 20, bigStep: 100 }
    else if (frequencyRange > 2000 && frequencyRange <= 20000) return { step: 500, bigStep: 2000 }
    else return { step: 2000, bigStep: 10000 }
  }

  const loadY = (): void => {
    const freqAxis = yAxisRef.current;
    const canvasContext = freqAxis?.getContext('2d');
    if (!freqAxis || !canvasContext) return;

    canvasContext.clearRect(0, 0, freqAxis.width, freqAxis.height);

    const bounds: DOMRect = freqAxis.getBoundingClientRect();
    const startFreq: number = Math.ceil(context.task?.boundaries.startFrequency ?? 0);
    const endFreq: number = Math.floor((context.task?.boundaries.startFrequency ?? 0) + frequencyRange);

    canvasContext.fillStyle = 'rgba(0, 0, 0)';
    canvasContext.font = '10px Arial';

    const steps = getYSteps();
    for (let i = startFreq; i <= endFreq; i += 5) {
      if (i % steps.step === 0) {
        const y: number = SPECTRO_HEIGHT - (i - startFreq) * frequencyPixelRatio - 2;

        if (i % steps.bigStep === 0) {
          // Bar
          canvasContext.fillRect(Y_WIDTH - 15, y, 15, 2);

          // Text
          let yTxt: number = y;
          if (yTxt < (bounds.height - 5)) {
            // "Top align" all labels but first
            yTxt += 12;
          }
          canvasContext.fillText(i.toString(), 0, yTxt);
        } else {
          // Bar only
          canvasContext.fillRect(Y_WIDTH - 10, y, 10, 1);
        }
      }
    }
  }

  const loadSpectroImages = (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      if (!spectroContext.currentImages.length) return reject('no images to load');
      if (spectroContext.currentImages.filter(i => !i.image).length === 0) return resolve();
      let nbLoaded = 0;
      for (const data of spectroContext.currentImages) {
        data.image = new Image();
        data.image.src = data.src;
        data.image.onload = () => {
          console.debug(nbLoaded, spectroContext.currentImages.length)
          if (++nbLoaded === spectroContext.currentImages.length) resolve();
        }
        data.image.onerror = e => {
          toasts.setDanger(buildErrorMessage(e));
          reject(e);
        }
      }
    });
  }
  const loadSpectro = async (): Promise<void> => {
    const canvas = spectroRef.current;
    const canvasContext = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !canvasContext) return;

    canvasContext.clearRect(0, 0, canvas.width, canvas.height);

    // Draw spectro images
    console.info('[currentSpectroImages]', spectroContext.currentZoom, spectroContext.currentImages.map(i => i.start), timePixelRatio)
    await loadSpectroImages();
    spectroContext.currentImages
      .forEach(spectro => canvasContext.drawImage(
        spectro.image!,
        spectro.start * timePixelRatio,
        0,
        Math.floor((spectro.end - spectro.start) * timePixelRatio),
        canvas.height
      ));

    // Progress bar
    const newX: number = Math.floor(canvas.width * audioContext.time / context.task!.duration);
    canvasContext.fillStyle = 'rgba(0, 0, 0)';
    canvasContext.fillRect(newX, 0, 1, canvas.height);

    // Render new annotation
    if (newAnnotation) {
      const a = newAnnotation;
      const x: number = Math.floor(a.startTime * timePixelRatio);
      const freqOffset: number = (a.startFrequency - (context.task?.boundaries.startFrequency ?? 0)) * frequencyPixelRatio;
      const y: number = Math.floor(canvas.height - freqOffset);
      const width: number = Math.floor((a.endTime - a.startTime) * timePixelRatio);
      const height: number = -Math.floor((a.endFrequency - a.startFrequency) * frequencyPixelRatio);
      canvasContext.strokeStyle = 'blue';
      canvasContext.strokeRect(x, y, width, height);
    }
  }

  const onStartNewAnnotation = (event: PointerEvent | ReactPointerEvent<HTMLElement>) => {
    if (!isDrawingEnabled) return;

    setNewAnnotation(new EditAnnotation(
      getTimeFromClientX(event.clientX),
      getFrequencyFromClientY(event.clientY)
    ));
  }

  const onEndNewAnnotation = (event: PointerEvent) => {
    if (newAnnotation) {
      newAnnotation.update(
        getTimeFromClientX(event.clientX),
        getFrequencyFromClientY(event.clientY)
      )
      onAnnotationCreated({
        type: AnnotationType.box,
        annotation: context.tags.focus ?? '',
        confidenceIndicator: context.confidences.focus,
        startTime: newAnnotation.startTime,
        endTime: newAnnotation.endTime,
        startFrequency: newAnnotation.startFrequency,
        endFrequency: newAnnotation.endFrequency,
        result_comments: []
      })
    }
    setNewAnnotation(undefined);
  }

  const onWheel = (event: WheelEvent) => {
    // Prevent page scrolling
    event.stopPropagation();
    // event.preventDefault();

    const origin = {
      x: event.clientX,
      y: event.clientY
    }

    if (event.deltaY < 0) spectroDispatch!({ type: 'zoom', direction: 'in', origin });
    else if (event.deltaY > 0) spectroDispatch!({ type: 'zoom', direction: 'out', origin });
  }

  return (
    <Fragment>
      <canvas className="freq-axis"
              ref={ yAxisRef }
              height={ SPECTRO_HEIGHT }
              width={ Y_WIDTH }
              style={ { top: `${ CONTROLS_AREA_SIZE }px` } }></canvas>


      <div className="canvas-wrapper"
           ref={ wrapperRef }
           style={ {
             width: `${ SPECTRO_WIDTH }px`,
             height: `${ SPECTRO_HEIGHT + X_HEIGHT + SCROLLBAR_RESERVED }px`,
             top: `${ CONTROLS_AREA_SIZE }px`,
           } }>

        <canvas className={ `canvas ${ isDrawingEnabled && 'drawable' }` }
                ref={ spectroRef }
                height={ SPECTRO_HEIGHT }
                width={ SPECTRO_WIDTH }
                onClick={ e => audioPlayer?.seek(getTimeFromClientX(e.clientX)) }
                onPointerDown={ onStartNewAnnotation }
                onWheel={ onWheel }></canvas>

        <canvas className="time-axis"
                ref={ xAxisRef }
                height={ X_HEIGHT }
                width={ SPECTRO_WIDTH }
                style={ { top: `${ SPECTRO_HEIGHT }px` } }></canvas>

        { context.annotations.array
          .filter(a => a.type === AnnotationType.box)
          .map((annotation: Annotation, key: number) => (
            <Region key={ key }
                    canvasWrapperRef={ wrapperRef }
                    annotation={ annotation }
                    timePxRatio={ timePixelRatio }
                    freqPxRatio={ frequencyPixelRatio }
                    audioPlayer={ audioPlayer }
                    onAddAnotherAnnotation={ onStartNewAnnotation }></Region>
          )) }
      </div>
    </Fragment>)
}