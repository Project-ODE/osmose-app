export type ScaleMapping = {

  valueToPosition(value: number): number;
  valuesToPositionRange(min: number, max: number): number;

  positionToValue(position: number): number;
  positionsToRange(min: number, max: number): number;

  isRangeContinuouslyOnScale(min: number, max: number): boolean;

  canvas?: HTMLCanvasElement;
}
export type AbstractScale = ScaleMapping & {
  getSteps(): Array<Step>;
}

export type Step = {
  position: number;
  importance: 'small' | 'big';
  value: number;
  additionalValue?: number;
  correspondingRatio?: number;
}

export type LinearScale = {
  name?: string;
  ratio: number;
  min_value: number;
  max_value: number;
}

export interface MultiLinearScale {
  name?: string;
  inner_scales: Array<LinearScale>;
}

export type AxisProps = {
  height: number,
  width: number,
  linear_scale?: LinearScale | null,
  multi_linear_scale?: MultiLinearScale | null,
  max_value: number,
  style?: any,
  className?: string
}
