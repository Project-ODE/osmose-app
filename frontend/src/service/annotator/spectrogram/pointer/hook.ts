import { useEffect, useRef } from 'react';
import { useSpectrogramDimensions } from '@/service/annotator/spectrogram';
import { useAxis } from '@/service/annotator/spectrogram/scale';
import { AbstractScale } from "@/service/dataset/spectrogram-configuration/scale";

type Position = { clientX: number, clientY: number }

export const usePointerService = () => {

  const { xAxis, yAxis } = useAxis();
  const { height, width } = useSpectrogramDimensions();

  const _xAxis = useRef<AbstractScale>(xAxis);
  useEffect(() => {
    _xAxis.current = xAxis
  }, [ xAxis ]);

  const _yAxis = useRef<AbstractScale>(yAxis);
  useEffect(() => {
    _yAxis.current = yAxis
  }, [ yAxis ]);

  const _width = useRef<number>(width);
  useEffect(() => {
    _width.current = width
  }, [ width ]);

  const _height = useRef<number>(height);
  useEffect(() => {
    _height.current = height
  }, [ height ]);

  function isSpectroCanvas(element: Element): boolean {
    return element instanceof HTMLCanvasElement
      && element.height === Math.floor(_height.current)
      && element.width === Math.floor(_width.current)
  }

  function isOverCanvas(e: Position): boolean {
    return document.elementsFromPoint(e.clientX, e.clientY).some(isSpectroCanvas);
  }

  function getCanvas(): HTMLCanvasElement | undefined {
    return [ ...document.getElementsByTagName('canvas') ].find(isSpectroCanvas) as HTMLCanvasElement;
  }

  function getCoords(e: Position, corrected: boolean = true): { x: number, y: number } | undefined {
    const canvas = getCanvas();
    if (!canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const x = e.clientX - bounds.x
    const y = e.clientY - bounds.y;
    if (corrected) {
      return {
        x: Math.min(Math.max(0, x), bounds.width),
        y: Math.min(Math.max(0, y), bounds.height),
      }
    } else return { x, y }
  }

  function getFreqTime(e: Position): { frequency: number, time: number } | undefined {
    const coords = getCoords(e);
    if (!coords) return;
    return {
      frequency: _yAxis.current.positionToValue(coords.y),
      time: _xAxis.current.positionToValue(coords.x),
    }
  }

  return { isHoverCanvas: isOverCanvas, getCoords, getFreqTime }
}