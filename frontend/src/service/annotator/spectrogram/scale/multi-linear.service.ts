import { LinearScaleService } from "./linear.service.ts";
import { AbstractScale, Step, LinearScale } from '@/service/dataset/spectrogram-configuration/scale';

export class MultiLinearScaleService implements AbstractScale {

  private innerScales: Array<{ service: LinearScaleService, scale: LinearScale }> = [];

  constructor(private pixelHeight: number,
              innerScales: Array<LinearScale>,) {
    let previousRatio = 0
    const data = [...innerScales].sort((a, b) => a.ratio - b.ratio)
    for (const scale of data) {
      // Go through scale with ascending ratio (since ratio correspond to the scale max frequency position)
      if (innerScales.some(otherScale => otherScale.min_value < scale.min_value && otherScale.max_value > scale.min_value))
        throw new Error('Given scales are conflicting!')
      if (innerScales.some(otherScale => otherScale.min_value < scale.max_value && otherScale.max_value > scale.max_value))
        throw new Error('Given scales are conflicting!')
      if (scale.ratio === 0)
        throw new Error('Cannot have a ratio of 0!')

      this.innerScales.push({
        scale,
        service: new LinearScaleService(
          pixelHeight * (scale.ratio - previousRatio),
          scale.max_value,
          scale.min_value
        )
      })
      previousRatio = scale.ratio;
    }
  }

  valueToPosition(value: number): number {
    const scale = this.getScaleForValue(value)!;
    return scale.service.valueToPosition(value) + this.getPreviousScalesHeight(scale.scale);
  }

  valuesToPositionRange(min: number, max: number): number {
    return Math.abs(this.valueToPosition(min) - this.valueToPosition(max))
  }

  positionToValue(position: number): number {
    const scale = this.getScaleForPosition(position);
    return scale.service.positionToValue(position - this.getPreviousScalesHeight(scale.scale));
  }

  positionsToRange(min: number, max: number): number {
    return Math.abs(this.positionToValue(min) - this.positionToValue(max))
  }

  getSteps(): Array<Step> {
    const array = new Array<Step>()
    for (const scale of this.innerScales.sort(s => s.scale.ratio)) {
      const scaleSteps = scale.service.getSteps();

      for (const step of scaleSteps) {
        if (array.find(s => s.value === step.value)) continue;
        if (step.value === scale.scale.max_value
          && this.innerScales.some(s => s.scale.min_value === scale.scale.max_value)) {
          array.push({
            ...step,
            additionalValue: step.value,
            correspondingRatio: scale.scale.ratio
          })
          continue;
        }
        if (step.value === scale.scale.min_value
          && this.innerScales.some(s => s.scale.max_value === scale.scale.min_value))
          continue;
        const existingPosition = array.find(s => s.position === step.position && s.correspondingRatio === step.correspondingRatio);
        if (existingPosition) {
          existingPosition.additionalValue = step.value;
        } else {
          array.push({
            ...step,
            correspondingRatio: scale.scale.ratio
          })
        }
      }
    }
    return array;
  }

  isRangeContinuouslyOnScale(min: number, max: number): boolean {
    const minScale = this.getScaleForValue(Math.min(min, max))?.scale;
    const maxScale = this.getScaleForValue(Math.max(min, max))?.scale;
    if (!minScale || !maxScale) return false; // Values are out of given scales

    // Check if range is over a void in the scale
    if (minScale.ratio === maxScale?.ratio) return true; // On same linear scale
    const scalesBetween = this.innerScales
      .map(s => s.scale)
      .filter(s => s.ratio >= minScale.ratio && s.ratio <= maxScale.ratio)
      .sort((a, b) => a.ratio - b.ratio);
    let previousMax = minScale.max_value;
    for (const scale of scalesBetween) {
      if (scale.max_value === previousMax) continue;
      if (scale.min_value !== previousMax) return false;
      previousMax = scale.max_value;
    }
    return true;
  }

  private getScaleForValue(value: number, force: boolean=true): { service: LinearScaleService, scale: LinearScale } | undefined {
    // Scale including value
    let correspondingScale = this.innerScales.find(s => s.scale.min_value <= value && s.scale.max_value >= value);

    if (!correspondingScale && force) {
      // Search out of the scale
      const absoluteMin = Math.min(...this.innerScales.map(s => s.scale.min_value))
      const absoluteMax = Math.max(...this.innerScales.map(s => s.scale.max_value))
      if (value < absoluteMin) {
        correspondingScale = this.innerScales.find(s => s.scale.min_value === absoluteMin);
      } else if (value > absoluteMax)
        correspondingScale = this.innerScales.find(s => s.scale.max_value === absoluteMax);
      else {
        // Value between 2 scales
        const directUp = Math.min(...this.innerScales.filter(s => s.scale.min_value > value).map(s => s.scale.min_value))
        correspondingScale = this.innerScales.find(s => s.scale.min_value === directUp);
      }
    }

    return correspondingScale;
  }

  private getScaleForPosition(position: number): { service: LinearScaleService, scale: LinearScale } {
    const ratio = position / this.pixelHeight;
    const minUpperRatio = Math.min(...this.innerScales.filter(s => s.scale.ratio >= ratio).map(s => s.scale.ratio))
    return this.innerScales.find(s => s.scale.ratio === minUpperRatio)!;
  }

  private getPreviousScalesHeight(scale: LinearScale): number {
    return this.innerScales.filter(s => s.scale.ratio < scale.ratio)
      .reduce((total, s) => s.service.height + total, 0)
  }
}
