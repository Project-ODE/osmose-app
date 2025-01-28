export function colorSpectro(canvas: HTMLCanvasElement, colormapName: string, invert: boolean = false) {
  const context = canvas.getContext('2d');
  if (!context) return;

  const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  const colormap = createColormap({ colormap: COLORMAPS[colormapName], nshades: 256 });

  for (let i = 0; i < data.length; i += 4) {
    const newColor = invert ? colormap[255 - data[i]] : colormap[data[i]];
    data[i] = newColor[0];
    data[i + 1] = newColor[1];
    data[i + 2] = newColor[2];
  }
  context.putImageData(imgData, 0, 0);
}

// Linear Interpolation
function lerp(v0: number, v1: number, t: number): number {
  return v0 * (1 - t) + v1 * t;
}

export type ColorMapConfig = {
  colormap?: string | ColorStep[];
  nshades?: number;
  alpha?: number;
}

export function createColormap(spec: ColorMapConfig): number[][] {
  /*
   * Default Options
   */
  let indicies,
    fromrgba: number[],
    torgba: number[],
    nsteps: number,
    cmap: ColorStep[],
    colormap: string | ColorStep[] | undefined,
    nshades: number,
    colors: number[][],
    alpha: number | number[],
    i;

  if (!spec) spec = {};

  nshades = (spec.nshades || 72) - 1;

  colormap = spec.colormap;
  if (!colormap) colormap = 'none';

  if (typeof colormap === 'string') {
    colormap = colormap.toLowerCase();

    if (!COLORMAPS[colormap]) {
      throw Error(colormap + ' not a supported colorscale');
    }

    cmap = COLORMAPS[colormap];

  } else if (Array.isArray(colormap)) {
    cmap = colormap.slice();

  } else {
    throw Error('unsupported colormap option' + colormap);
  }

  if (cmap.length > nshades + 1) {
    throw new Error(
      colormap + ' map requires nshades to be at least size ' + cmap.length
    );
  }

  if (!Array.isArray(spec.alpha)) {

    if (typeof spec.alpha === 'number') {
      alpha = [spec.alpha, spec.alpha];

    } else {
      alpha = [1, 1];
    }

  } else if (spec.alpha.length !== 2) {
    alpha = [1, 1];

  } else {
    alpha = spec.alpha.slice();
  }

  // map index points from 0..1 to 0..n-1
  indicies = cmap.map(function (c) {
    return Math.round(c.index * nshades);
  });

  // Add alpha channel to the map
  alpha[0] = Math.min(Math.max(alpha[0], 0), 1);
  alpha[1] = Math.min(Math.max(alpha[1], 0), 1);

  const steps = cmap.map(function (_, i) {
    const index = cmap[i].index

    const rgba = cmap[i].rgb.slice();

    // if user supplies their own map use it
    if (rgba.length === 4 && rgba[3] >= 0 && rgba[3] <= 1) {
      return rgba
    }
    rgba[3] = (alpha as number[])[0] + ((alpha as number[])[1] - (alpha as number[])[0]) * index;

    return rgba
  });

  /*
   * map increasing linear values between indicies to
   * linear steps in colorvalues
   */
  colors = [];
  for (i = 0; i < indicies.length - 1; ++i) {
    nsteps = indicies[i + 1] - indicies[i];
    fromrgba = steps[i];
    torgba = steps[i + 1];

    for (var j = 0; j < nsteps; j++) {
      var amt = j / nsteps
      colors.push([
        Math.round(lerp(fromrgba[0], torgba[0], amt)),
        Math.round(lerp(fromrgba[1], torgba[1], amt)),
        Math.round(lerp(fromrgba[2], torgba[2], amt)),
        lerp(fromrgba[3], torgba[3], amt)
      ])
    }
  }

  //add 1 step as last value
  colors.push(cmap[cmap.length - 1].rgb.concat(alpha[1]))

  return colors;
};

export type ColorStep = {
  index: number;
  rgb: number[];
}

export const COLORMAPS: Record<string, ColorStep[]> = {
  "none": [{ "index": 0, "rgb": [0, 0, 0] }, { "index": 1, "rgb": [255, 255, 255] }],
  "jet": [{ "index": 0, "rgb": [0, 0, 131] }, { "index": 0.125, "rgb": [0, 60, 170] }, { "index": 0.375, "rgb": [5, 255, 255] }, { "index": 0.625, "rgb": [255, 255, 0] }, { "index": 0.875, "rgb": [250, 0, 0] }, { "index": 1, "rgb": [128, 0, 0] }],
  "hsv": [{ "index": 0, "rgb": [255, 0, 0] }, { "index": 0.169, "rgb": [253, 255, 2] }, { "index": 0.173, "rgb": [247, 255, 2] }, { "index": 0.337, "rgb": [0, 252, 4] }, { "index": 0.341, "rgb": [0, 252, 10] }, { "index": 0.506, "rgb": [1, 249, 255] }, { "index": 0.671, "rgb": [2, 0, 253] }, { "index": 0.675, "rgb": [8, 0, 253] }, { "index": 0.839, "rgb": [255, 0, 251] }, { "index": 0.843, "rgb": [255, 0, 245] }, { "index": 1, "rgb": [255, 0, 6] }],
  "yignbu": [{ "index": 0, "rgb": [8, 29, 88] }, { "index": 0.125, "rgb": [37, 52, 148] }, { "index": 0.25, "rgb": [34, 94, 168] }, { "index": 0.375, "rgb": [29, 145, 192] }, { "index": 0.5, "rgb": [65, 182, 196] }, { "index": 0.625, "rgb": [127, 205, 187] }, { "index": 0.75, "rgb": [199, 233, 180] }, { "index": 0.875, "rgb": [237, 248, 217] }, { "index": 1, "rgb": [255, 255, 217] }],
  "yiorrd": [{ "index": 0, "rgb": [128, 0, 38] }, { "index": 0.125, "rgb": [189, 0, 38] }, { "index": 0.25, "rgb": [227, 26, 28] }, { "index": 0.375, "rgb": [252, 78, 42] }, { "index": 0.5, "rgb": [253, 141, 60] }, { "index": 0.625, "rgb": [254, 178, 76] }, { "index": 0.75, "rgb": [254, 217, 118] }, { "index": 0.875, "rgb": [255, 237, 160] }, { "index": 1, "rgb": [255, 255, 204] }],
  "rainbow": [{ "index": 0, "rgb": [150, 0, 90] }, { "index": 0.125, "rgb": [0, 0, 200] }, { "index": 0.25, "rgb": [0, 25, 255] }, { "index": 0.375, "rgb": [0, 152, 255] }, { "index": 0.5, "rgb": [44, 255, 150] }, { "index": 0.625, "rgb": [151, 255, 0] }, { "index": 0.75, "rgb": [255, 234, 0] }, { "index": 0.875, "rgb": [255, 111, 0] }, { "index": 1, "rgb": [255, 0, 0] }],
  "viridis": [{ "index": 0, "rgb": [68, 1, 84] }, { "index": 0.13, "rgb": [71, 44, 122] }, { "index": 0.25, "rgb": [59, 81, 139] }, { "index": 0.38, "rgb": [44, 113, 142] }, { "index": 0.5, "rgb": [33, 144, 141] }, { "index": 0.63, "rgb": [39, 173, 129] }, { "index": 0.75, "rgb": [92, 200, 99] }, { "index": 0.88, "rgb": [170, 220, 50] }, { "index": 1, "rgb": [253, 231, 37] }],
  "inferno": [{ "index": 0, "rgb": [0, 0, 4] }, { "index": 0.13, "rgb": [31, 12, 72] }, { "index": 0.25, "rgb": [85, 15, 109] }, { "index": 0.38, "rgb": [136, 34, 106] }, { "index": 0.5, "rgb": [186, 54, 85] }, { "index": 0.63, "rgb": [227, 89, 51] }, { "index": 0.75, "rgb": [249, 140, 10] }, { "index": 0.88, "rgb": [249, 201, 50] }, { "index": 1, "rgb": [252, 255, 164] }],
  "magma": [{ "index": 0, "rgb": [0, 0, 4] }, { "index": 0.13, "rgb": [28, 16, 68] }, { "index": 0.25, "rgb": [79, 18, 123] }, { "index": 0.38, "rgb": [129, 37, 129] }, { "index": 0.5, "rgb": [181, 54, 122] }, { "index": 0.63, "rgb": [229, 80, 100] }, { "index": 0.75, "rgb": [251, 135, 97] }, { "index": 0.88, "rgb": [254, 194, 135] }, { "index": 1, "rgb": [252, 253, 191] }],
  "plasma": [{ "index": 0, "rgb": [13, 8, 135] }, { "index": 0.13, "rgb": [75, 3, 161] }, { "index": 0.25, "rgb": [125, 3, 168] }, { "index": 0.38, "rgb": [168, 34, 150] }, { "index": 0.5, "rgb": [203, 70, 121] }, { "index": 0.63, "rgb": [229, 107, 93] }, { "index": 0.75, "rgb": [248, 148, 65] }, { "index": 0.88, "rgb": [253, 195, 40] }, { "index": 1, "rgb": [240, 249, 33] }],
};
