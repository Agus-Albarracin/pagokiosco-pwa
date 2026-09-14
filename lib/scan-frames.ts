export const SCAN_ATTEMPTS_PER_SECOND = 10;

// The decoder is synchronous. Registering the next callback after it finishes
// keeps a single job active and never queues images behind a slow decode.
export function startScanFrames(
  video: HTMLVideoElement,
  onFrame: (now: number) => void,
  onError: (error: unknown) => void,
  attemptsPerSecond = SCAN_ATTEMPTS_PER_SECOND,
): () => void {
  if (!Number.isFinite(attemptsPerSecond) || attemptsPerSecond <= 0) {
    throw new RangeError("La frecuencia de escaneo debe ser positiva.");
  }
  const interval = 1000 / attemptsPerSecond;
  const nativeFrames = typeof video.requestVideoFrameCallback === "function"
    && typeof video.cancelVideoFrameCallback === "function";
  let active = true;
  let callbackId = 0;
  let lastFrame: string | undefined;
  let lastAttempt = -Infinity;

  function stop() {
    active = false;
    if (nativeFrames) video.cancelVideoFrameCallback(callbackId);
    else cancelAnimationFrame(callbackId);
  }

  function fallbackFrameId() {
    const quality = video.getVideoPlaybackQuality?.();
    // Prefer an actual frame counter: currentTime can advance between frames.
    if (quality && quality.totalVideoFrames > 0) {
      return `frame:${quality.totalVideoFrames - quality.droppedVideoFrames}`;
    }
    return `time:${video.currentTime}`;
  }

  function tick(now: number, frameId: string) {
    if (!active) return;
    try {
      if (!video.paused && !video.ended && video.readyState >= 2
        && video.videoWidth > 0 && video.videoHeight > 0 && frameId !== lastFrame) {
        lastFrame = frameId;
        if (now - lastAttempt >= interval) {
          lastAttempt = now;
          onFrame(now);
        }
      }
      if (active) schedule();
    } catch (error) {
      stop();
      onError(error);
    }
  }

  function schedule() {
    if (nativeFrames) {
      callbackId = video.requestVideoFrameCallback((_now, frame) => tick(performance.now(), `frame:${frame.presentedFrames}`));
    } else {
      callbackId = requestAnimationFrame(() => tick(performance.now(), fallbackFrameId()));
    }
  }

  schedule();
  return stop;
}
