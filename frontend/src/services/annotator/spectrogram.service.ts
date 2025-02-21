import { MutableRefObject, useEffect, useMemo, useRef } from "react";
import { useAppSelector } from '@/service/app';
import { buildErrorMessage } from "@/services/utils/format.tsx";
import { AnnotationResultBounds } from '@/service/campaign/result';
import { useToast } from "@/service/ui";
import { ScaleMapping } from '@/service/dataset/spectrogram-configuration/scale';
import { getDuration } from "@/service/dataset";
import { useAnnotator } from "@/service/annotator/hook.ts";
import { colorSpectro, interpolate } from "../utils/color";

export const useSpectrogramService = (
  canvas: MutableRefObject<HTMLCanvasElement | null>,
  xAxis: MutableRefObject<ScaleMapping | null>,
  yAxis: MutableRefObject<ScaleMapping | null>,
) => {
  const { annotatorData } = useAnnotator()

  const {
    audio,
    userPreferences,
  } = useAppSelector(state => state.annotator);
  const toast = useToast();

  const duration = useMemo(() => getDuration(annotatorData?.file), [ annotatorData?.file ]);

  const images = useRef<Map<number, Array<HTMLImageElement | undefined>>>(new Map);

  useEffect(() => {
    images.current = new Map()
  }, [userPreferences.spectrogramConfigurationID]);

  function areAllImagesLoaded(): boolean {
    const currentImages = images.current.get(userPreferences.zoomLevel);
    return currentImages?.filter(i => !!i).length === userPreferences.zoomLevel
  }

  async function loadImages() {
    const currentConfiguration = annotatorData?.spectrogram_configurations.find(c => c.id === userPreferences.spectrogramConfigurationID);
    if (!currentConfiguration || !annotatorData) {
      images.current = new Map();
      return;
    }

    if (areAllImagesLoaded()) return;

    const filename = annotatorData.file.filename.split('.')[0]
    return Promise.all(
      Array.from(new Array<HTMLImageElement | undefined>(userPreferences.zoomLevel)).map(async (_, index) => {
        console.info(`Will load for zoom ${ userPreferences.zoomLevel }, image ${ index }`)
        const image = new Image();
        image.src = `${ currentConfiguration.folder_path }/${ filename }_${ userPreferences.zoomLevel }_${ index }.png`;
        return await new Promise<HTMLImageElement | undefined>((resolve) => {
          image.onload = () => {
            console.info(`Image loaded: ${ image.src }`)
            resolve(image);
          }
          image.onerror = e => {
            console.error(`Cannot load spectrogram image with source: ${ image.src } [${ buildErrorMessage(e as any) }]`, e)
            toast.presentError(`Cannot load spectrogram image with source: ${ image.src } [${ buildErrorMessage(e as any) }]`)
            resolve(undefined);
          }
        })
      })
    ).then(loadedImages => {
      images.current.set(userPreferences.zoomLevel, loadedImages)
    })
  }

  function resetCanvas() {
    const context = canvas.current?.getContext('2d', { alpha: false });
    if (!canvas.current || !context) return;
    context.filter = '';
    context.clearRect(0, 0, canvas.current.width, canvas.current.height);
  }

  async function drawSpectrogram() {
    const context = canvas.current?.getContext('2d', { alpha: false });
    if (!canvas.current || !context) return;

    if (!areAllImagesLoaded()) await loadImages();
    if (!areAllImagesLoaded()) return;

    // Filter images (filter must be set before drawing)
    const brightness: number = Math.round(interpolate(userPreferences.brightness, 0, 100, 50, 150));
    const contrast: number = Math.round(interpolate(userPreferences.contrast, 0, 100, 50, 150));
    context.filter = `brightness(${brightness.toFixed()}%) contrast(${contrast.toFixed()}%)`;

    // Draw images
    const currentImages = images.current.get(userPreferences.zoomLevel)
    if (!currentImages) return;
    for (const i in currentImages) {
      const index: number | undefined = i ? +i : undefined;
      if (index === undefined) continue;
      const start = index * duration / userPreferences.zoomLevel;
      const end = (index + 1) * duration / userPreferences.zoomLevel;
      const image = currentImages[index];
      if (!image) continue
      context.drawImage(
        image,
        xAxis.current!.valueToPosition(start),
        0,
        Math.floor(xAxis.current!.valuesToPositionRange(start, end)),
        canvas.current.height
      )
    }

    // Color spectro images
    colorSpectro(canvas.current, userPreferences.colormap, userPreferences.colormapInverted);
  }

  function drawProgressBar() {
    const context = canvas.current?.getContext('2d', { alpha: false });
    if (!canvas.current || !context) return;
    context.fillStyle = 'rgba(0, 0, 0)';
    context.fillRect(xAxis.current!.valueToPosition(audio.time), 0, 1, canvas.current.height);
  }

  function drawResult(result: AnnotationResultBounds) {
    const context = canvas.current?.getContext('2d', { alpha: false });
    if (!canvas.current || !context || !xAxis.current || !yAxis.current
      || result.start_time === null || result.end_time === null || result.start_frequency === null || result.end_frequency === null) return;
    context.strokeStyle = 'blue';
    context.strokeRect(
      xAxis.current.valueToPosition(Math.min(result.start_time, result.end_time)),
      yAxis.current.valueToPosition(Math.max(result.start_frequency, result.end_frequency)),
      Math.floor(xAxis.current.valuesToPositionRange(result.start_time, result.end_time)),
      yAxis.current.valuesToPositionRange(result.start_frequency, result.end_frequency)
    );

  }

  return {
    resetCanvas,
    drawSpectrogram,
    drawProgressBar,
    drawResult,
  }
}