import { AbstractScale, Steps } from "./abstract.scale.ts";

export interface LinearScale {
  name?: string;
  ratio: number;
  min_value: number;
  max_value: number;
}

export class LinearScaleService implements AbstractScale {

  private MIN_SMALL_STEPS_RANGE_PX = 8;
  private MIN_BIG_STEPS_RANGE_PX = 30;

  get range(): number {
    return this.maxValue - this.minValue;
  }

  constructor(private pixelHeight: number,
              private maxValue: number,
              private minValue: number = 0,) {
  }

  valueToPosition(value: number): number {
    return this.crossProduct(value - this.minValue, this.range, this.pixelHeight);
  }

  valuesToPositionRange(min: number, max: number): number {
    return Math.abs(this.valueToPosition(max) - this.valueToPosition(min));
  }

  positionToValue(position: number): number {
    return this.minValue + this.crossProduct(position, this.pixelHeight, this.range);
  }

  positionsToRange(min: number, max: number): number {
    return Math.abs(this.positionToValue(max) - this.positionToValue(min));
  }

  getSteps(): Steps {
    const bigStepsRange = this.getMinBigStepsRange();
    const smallStepsRange = this.getMinSmallStepsRange(bigStepsRange);

    const smallSteps = new Map<number, number>();
    const bigSteps = new Map<number, number>();

    const innerSteps = Math.max(1, this.getNumber(1, smallStepsRange.toString().length))
    for (let value = Math.floor(this.minValue / innerSteps) * innerSteps;
         value <= Math.round(this.maxValue / innerSteps) * innerSteps; value += innerSteps) {
      if (value < this.minValue || value > this.maxValue) continue;
      const position: number = Math.floor(this.valueToPosition(value));
      if (value % bigStepsRange === 0)
        bigSteps.set(position, value)
      else if (smallStepsRange > 0 && value % smallStepsRange === 0)
        smallSteps.set(position, value)
    }
    if (!Array.from(bigSteps.values()).includes(this.minValue)) {
      bigSteps.set(
        Math.floor(this.valueToPosition(this.minValue)),
        this.minValue
      )
    }
    if (!Array.from(bigSteps.values()).includes(this.maxValue)) {
      bigSteps.set(
        Math.floor(this.valueToPosition(this.maxValue)),
        this.maxValue
      )
    }
    return { smallSteps, bigSteps }
  }

  private getMinBigStepsRange(): number {
    const maxFrequencyStr = Math.ceil(this.range).toString();
    let bigStepsRange = this.getNumber(1, maxFrequencyStr.length - 2);
    while (bigStepsRange * this.pixelHeight / this.range < this.MIN_BIG_STEPS_RANGE_PX) {
      switch (+bigStepsRange.toString()[0]) {
        case 1:
          bigStepsRange *= 2
          break;
        case 2:
          bigStepsRange *=  5
          break;
      }
    }
    return bigStepsRange
  }

  private getMinSmallStepsRange(bigStep: number): number {
    let range: number;
    switch (+bigStep.toString()[0]) {
      case 1:
        range = this.getNumber(2, bigStep.toString().length - 1);
        break;
      case 2:
        range = this.getNumber(5, bigStep.toString().length - 1);
        break;
      default:
        return 0;
    }
    while (range * this.pixelHeight / this.range < this.MIN_SMALL_STEPS_RANGE_PX) {
      switch (+range.toString()[0]) {
        case 2:
          range *= 2.5
          break;
        case 5:
          range *=  4
          break;
      }
    }
    return range;
  }

  private crossProduct(value: number, range: number, maxOtherScale: number): number {
    if (value < 0) return 0;
    if (value > range) return range;
    return value * maxOtherScale / range;
  }

  private getNumber(first: number, length: number) {
    return Math.max(0, +Array.from(new Array(length)).map((_, key) => key === 0 ? first : 0).join(''))
  }

}
