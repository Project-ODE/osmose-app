export interface ScaleMapping {

  valueToPosition(value: number): number;
  valuesToHeight(min: number, max: number): number;

  positionToValue(position: number): number;
  positionsToRange(min: number, max: number): number;

  canvas?: HTMLCanvasElement;
}
export interface AbstractScale extends ScaleMapping{
  getSteps(): Steps;
}

export interface Steps {
  /**
   * Map <position to value>
   */
  smallSteps: Map<number, number>;

  /**
   * Map <position to value>
   */
  bigSteps: Map<number, number>;
}
