import { AbstractScale, Step } from '@/service/dataset/spectrogram-configuration/scale';

export class LinearScaleService implements AbstractScale {

  private MIN_SMALL_STEPS_RANGE_PX = 14;
  private MIN_BIG_STEPS_RANGE_PX = 30;

  get range(): number {
    return this.maxValue - this.minValue;
  }

  public get height(): number {
    return this.pixelHeight;
  }

  constructor(private pixelHeight: number,
              private maxValue: number,
              private minValue: number = 0,) {
    if (minValue > maxValue) throw `Incorrect scale range: min=${ minValue } and max=${ maxValue }`;
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

  getSteps(): Array<Step> {
    const bigStepsRange = this.getMinBigStepsRange();
    const smallStepsRange = this.getMinSmallStepsRange(bigStepsRange);

    const array = new Array<Step>();

    const innerSteps = Math.max(1, this.getNumber(1, smallStepsRange.toString().length))
    for (let value = Math.floor(this.minValue / innerSteps) * innerSteps;
         value <= Math.round(this.maxValue / innerSteps) * innerSteps; value += innerSteps) {
      if (value < this.minValue || value > this.maxValue) continue;
      const position: number = Math.floor(this.valueToPosition(value));
      if (value % bigStepsRange === 0)
        array.push({ position, value, importance: 'big' })
      else if (smallStepsRange > 0 && value % smallStepsRange === 0)
        array.push({ position, value, importance: 'small' })
    }
    if (!array.filter(s => s.importance === 'big').some(s => s.value === this.minValue)) {
      array.push({
        position: Math.floor(this.valueToPosition(this.minValue)),
        value: this.minValue,
        importance: 'big'
      })
    }
    if (!array.filter(s => s.importance === 'big').some(s => s.value === this.maxValue)) {
      array.push({
        position: Math.floor(this.valueToPosition(this.maxValue)),
        value: this.maxValue,
        importance: 'big'
      })
    }
    return array
  }

  isRangeContinuouslyOnScale(min: number, max: number): boolean {
    return min >= this.minValue && max >= this.minValue
      && min <= this.maxValue && max <= this.maxValue
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
          bigStepsRange *= 5
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
          range *= 4
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
