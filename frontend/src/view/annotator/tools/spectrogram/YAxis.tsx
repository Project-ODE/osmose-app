import React, { useEffect, useRef } from "react";
import { LinearScale, Step } from '@/service/dataset/spectrogram-configuration/scale';
import { useYAxis, Y_WIDTH } from '@/service/annotator/spectrogram/scale';
import { useCurrentConfiguration, useSpectrogramDimensions } from '@/service/annotator/spectrogram/hook.ts';

export const YAxis: React.FC<{
  className?: string;
}> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const yAxis = useYAxis()
  const { height } = useSpectrogramDimensions()
  const currentConfiguration = useCurrentConfiguration()

  useEffect(() => display(), [ canvasRef, yAxis ]);

  const display = (): void => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d');
    if (!canvas || !context || !height) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'rgba(0, 0, 0)';
    context.font = "500 10px 'Exo 2'";

    let previousRatio = 0;
    let offset = 0;
    const scaleSteps = yAxis.getSteps().sort((a, b) => (a.correspondingRatio ?? 0) - (b.correspondingRatio ?? 0));
    const maxRatio = Math.max(...scaleSteps.map(s => s.correspondingRatio ?? 0));
    const realSteps = new Array<Step>();
    for (const step of scaleSteps) {
      if (step.correspondingRatio) {
        if (step.correspondingRatio !== previousRatio) {
          offset = previousRatio / maxRatio * height;
          previousRatio = step.correspondingRatio
        }
      }
      const y = Math.round(height - (offset + step.position));
      const existingStep = realSteps.find(s => s.position === y)
      if (existingStep) {
        existingStep.additionalValue = step.value;
      } else {
        realSteps.push({
          ...step,
          position: y
        })
      }
    }
    for (const step of realSteps) {
      const y = step.position;

      // Tick
      let tickWidth = 10;
      let tickHeight = 1;
      if (step.importance === 'big') {
        tickWidth = 15;
        tickHeight = 2;
      }
      const allBorders = currentConfiguration?.multi_linear_frequency_scale?.inner_scales.flatMap((s: LinearScale) => [ s.min_value, s.max_value ]) ?? []
      if (allBorders.includes(step.value)) {
        tickHeight = 4;
        tickWidth = 15;
      }
      let yTick = y;
      if (height - tickHeight < yTick) yTick = height - tickHeight
      context.fillRect(canvas.width - tickWidth, yTick, tickWidth, tickHeight);

      // Text
      if (step.additionalValue) {
        const min = Math.min(step.value, step.additionalValue)
        const max = step.value === min ? step.additionalValue : step.value;
        context.textBaseline = 'top'
        context.fillText(frequencyToString(min), 0, y);
        context.textBaseline = 'bottom'
        context.fillText(frequencyToString(max), 0, y);
      } else {
        // "Top align" all labels but first
        if (y < (height - 5)) context.textBaseline = 'top'
        else context.textBaseline = 'bottom'
        context.fillText(frequencyToString(step.value), 0, y);
      }
    }
  }

  const frequencyToString = (value: number): string => {
    if (value < 1000) return value.toString()
    let newValue: string | number = value / 1000;
    if (newValue % 1 > 0) newValue = newValue.toFixed(1)
    return `${ newValue }k`;
  }

  return <canvas ref={ canvasRef }
                 width={ Y_WIDTH }
                 height={ height }
                 className={ className }/>
}
