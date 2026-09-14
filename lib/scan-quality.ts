export type FrameQualityIssue = "dark" | "bright" | "low-detail" | "ok";

export type FrameQuality = {
  issue: FrameQualityIssue;
  /** Mean luminance, from 0 to 255. */
  brightness: number;
  /** Standard deviation of luminance. */
  contrast: number;
  /** Mean absolute difference between adjacent pixels, not an autofocus score. */
  edgeStrength: number;
};

type FramePixels = {
  data: Uint8ClampedArray;
  width: number;
  height: number;
};

/**
 * Advisory heuristics for a small camera sample (caller should use <= 160px width).
 * Low detail can mean a plain surface, distance or blur; it cannot identify which.
 * Never reject a decoder attempt based on these metrics: even a poor sample can
 * contain a readable barcode. These thresholds still need real-device calibration.
 */
export function analyzeFrameQuality({ data, width, height }: FramePixels): FrameQuality | null {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 2 || height < 2 || data.length < width * height * 4) {
    return null;
  }

  const previousRow = new Float32Array(width);
  const pixelCount = width * height;
  let total = 0;
  let squaredTotal = 0;
  let darkPixels = 0;
  let brightPixels = 0;
  let edgeTotal = 0;
  let edgeCount = 0;

  for (let y = 0; y < height; y += 1) {
    let previousPixel = 0;
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const luminance = (77 * data[offset] + 150 * data[offset + 1] + 29 * data[offset + 2]) / 256;
      total += luminance;
      squaredTotal += luminance * luminance;
      if (luminance <= 30) darkPixels += 1;
      if (luminance >= 240) brightPixels += 1;
      if (x > 0) {
        edgeTotal += Math.abs(luminance - previousPixel);
        edgeCount += 1;
      }
      if (y > 0) {
        edgeTotal += Math.abs(luminance - previousRow[x]);
        edgeCount += 1;
      }
      previousPixel = luminance;
      previousRow[x] = luminance;
    }
  }

  const brightness = total / pixelCount;
  const contrast = Math.sqrt(Math.max(0, squaredTotal / pixelCount - brightness * brightness));
  const edgeStrength = edgeTotal / edgeCount;
  let issue: FrameQualityIssue = "ok";

  // Require almost the whole image to be near an exposure extreme. A white
  // package or a dark background alone should not routinely produce a warning.
  if (darkPixels / pixelCount >= 0.9 && brightness < 35) issue = "dark";
  else if (brightPixels / pixelCount >= 0.9 && brightness > 235) issue = "bright";
  else if (contrast < 12 && edgeStrength < 3) issue = "low-detail";

  return { issue, brightness, contrast, edgeStrength };
}
