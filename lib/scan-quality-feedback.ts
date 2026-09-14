import { analyzeFrameQuality, type FrameQualityIssue } from "./scan-quality";

export const SCAN_GUIDANCE = "Apuntá al código EAN de 8 o 13 dígitos.";
const messages: Record<FrameQualityIssue, string> = {
  dark: "Buscá más luz para ver el código.",
  bright: "Incliná el envase o buscá menos reflejo.",
  "low-detail": "Mostrá las barras y mantené el celular quieto.",
  ok: SCAN_GUIDANCE,
};

/** Small, advisory sample after failed reads; never decides whether ZXing runs. */
export function createScanQualityFeedback(video: HTMLVideoElement) {
  let canvas: HTMLCanvasElement | undefined;
  let context: CanvasRenderingContext2D | null = null;
  let disabled = false;
  let lastSample = -Infinity;
  let pending: FrameQualityIssue | undefined;
  let consecutive = 0;
  let displayed: FrameQualityIssue = "ok";

  return (now: number): string | undefined => {
    if (disabled || now - lastSample < 500) return;
    lastSample = now;
    try {
      if (!canvas) {
        canvas = document.createElement("canvas");
        context = canvas.getContext("2d", { willReadFrequently: true });
      }
      if (!context) { disabled = true; return; }
      const scale = Math.min(1, 160 / Math.max(video.videoWidth, video.videoHeight));
      const width = Math.max(2, Math.round(video.videoWidth * scale));
      const height = Math.max(2, Math.round(video.videoHeight * scale));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      context.drawImage(video, 0, 0, width, height);
      const quality = analyzeFrameQuality(context.getImageData(0, 0, width, height));
      if (!quality) { consecutive = 0; return; }
      consecutive = quality.issue === pending ? consecutive + 1 : 1;
      pending = quality.issue;
      // Three consecutive samples avoid flashing guidance during camera exposure
      // adjustment. React state changes only when the stable message changes.
      if (consecutive >= 3 && displayed !== pending) {
        displayed = pending;
        return messages[displayed];
      }
    } catch {
      // A failed quality sample must not disable the barcode reader.
      disabled = true;
      return SCAN_GUIDANCE;
    }
  };
}
