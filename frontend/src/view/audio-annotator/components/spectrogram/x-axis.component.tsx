import React, { useEffect, useImperativeHandle, useMemo, useRef } from "react";
import {
  AbstractScale,
  AxisProps,
  formatTime,
  LinearScaleService,
  ScaleMapping
} from '@/service/dataset/spectrogram-configuration/scale';

export const XAxis = React.forwardRef<ScaleMapping, Omit<AxisProps, 'multi_linear_scale' | 'linear_scale'>>(({
                                                                                                               width,
                                                                                                               height,
                                                                                                               max_value,
                                                                                                               style
                                                                                                             }: AxisProps, ref: React.ForwardedRef<ScaleMapping>) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const scaleService: AbstractScale = useMemo(() => {
    return new LinearScaleService(
      width,
      max_value
    )
  }, [ max_value, width ]);

  const scale: ScaleMapping = useMemo(() => ({
    valueToPosition: scaleService.valueToPosition.bind(scaleService),
    valuesToPositionRange: scaleService.valuesToPositionRange.bind(scaleService),
    positionToValue: scaleService.positionToValue.bind(scaleService),
    positionsToRange: scaleService.positionsToRange.bind(scaleService),
    isRangeContinuouslyOnScale: scaleService.isRangeContinuouslyOnScale.bind(scaleService),
    canvas: canvasRef.current ?? undefined
  }), [ scaleService, canvasRef.current ])

  useImperativeHandle(ref, (): ScaleMapping => scale)

  useEffect(() => {
    display()
  }, [ canvasRef, width ]);

  const getTimeSteps = () => {
    if (max_value <= 60) return { step: 1, bigStep: 5 }
    else if (max_value > 60 && max_value <= 120) return { step: 2, bigStep: 5 }
    else if (max_value > 120 && max_value <= 500) return { step: 4, bigStep: 5 }
    else if (max_value > 500 && max_value <= 1000) return { step: 10, bigStep: 60 }
    else return { step: 30, bigStep: 120 }
  }

  const display = (): void => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d');
    if (!canvas || !context || !width) return;

    context.clearRect(0, 0, width, height);

    const steps = getTimeSteps();

    context.fillStyle = 'rgba(0, 0, 0)';
    context.font = "500 10px 'Exo 2'";

    for (let i = 0; i <= max_value; i++) {
      if (i % steps.step === 0) {
        const x: number = scaleService.valueToPosition(i);

        if (i % steps.bigStep === 0) {
          // Bar
          context.fillRect(x <= canvas.width - 2 ? x : canvas.width - 2, 0, 2, 15);

          // Text
          const timeText: string = formatTime(i);
          let xTxt: number = x;
          if (xTxt === 0) {
            context.textAlign = "left"
          } else if (xTxt > (width - timeText.length * 8)) {
            context.textAlign = "right"
            xTxt -= 8;
          } else {
            context.textAlign = "center"
          }
          context.fillText(timeText, xTxt, 25);
        } else {
          // Bar only
          context.fillRect(x, 0, 1, 10);
        }
      }
    }
  }

  return (
    <canvas ref={ canvasRef }
            width={ width }
            height={ height }
            style={ style }
    ></canvas>
  )
})
