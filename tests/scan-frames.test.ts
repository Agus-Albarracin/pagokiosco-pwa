import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { startScanFrames } from "../lib/scan-frames";

function camera(t: TestContext) {
  let clock = 0;
  t.mock.method(performance, "now", () => clock);
  let pending: VideoFrameRequestCallback | undefined;
  const video = {
    paused: false, ended: false, readyState: 2, videoWidth: 640, videoHeight: 480, currentTime: 0,
    requestVideoFrameCallback(callback: VideoFrameRequestCallback) { pending = callback; return 1; },
    cancelVideoFrameCallback() { pending = undefined; },
  };
  return {
    video: video as unknown as HTMLVideoElement,
    emit(now: number, frame: number) {
      clock = now;
      const callback = pending;
      pending = undefined;
      callback?.(now, { presentedFrames: frame } as VideoFrameCallbackMetadata);
    },
    isScheduled: () => pending !== undefined,
  };
}

test("escanea solo fotogramas nuevos y respeta 10 intentos por segundo", t => {
  const source = camera(t);
  const attempts: number[] = [];
  const stop = startScanFrames(source.video, now => attempts.push(now), error => { throw error; });
  for (let now = 0; now < 1000; now += 10) source.emit(now, now);
  assert.deepEqual(attempts, [0, 100, 200, 300, 400, 500, 600, 700, 800, 900]);
  source.emit(1200, 990); // Same last presented frame, despite elapsed time.
  assert.equal(attempts.length, 10);
  stop();
  source.emit(1300, 1300);
  assert.equal(attempts.length, 10);
  assert.equal(source.isScheduled(), false);
});

test("ignora vídeo no disponible, admite menor frecuencia y cancela desde el lector", t => {
  const source = camera(t);
  const attempts: number[] = [];
  const stop = startScanFrames(source.video, now => {
    attempts.push(now);
    if (attempts.length === 2) stop();
  }, error => { throw error; }, 5);
  Object.assign(source.video, { readyState: 1 });
  source.emit(0, 1);
  Object.assign(source.video, { readyState: 2 });
  source.emit(100, 2);
  source.emit(150, 3);
  source.emit(300, 4);
  source.emit(500, 5);
  assert.deepEqual(attempts, [100, 300]);
  assert.equal(source.isScheduled(), false);
});

test("cancela el ciclo y comunica un error inesperado", t => {
  const source = camera(t);
  const errors: unknown[] = [];
  const failure = new Error("capture failed");
  startScanFrames(source.video, () => { throw failure; }, error => errors.push(error));
  source.emit(0, 1);
  source.emit(100, 2);
  assert.deepEqual(errors, [failure]);
  assert.equal(source.isScheduled(), false);
});

test("fallback usa el contador de imágenes y finalmente el tiempo de vídeo", t => {
  let clock = 0;
  t.mock.method(performance, "now", () => clock);
  let pending: FrameRequestCallback | undefined;
  const originalRequest = Object.getOwnPropertyDescriptor(globalThis, "requestAnimationFrame");
  const originalCancel = Object.getOwnPropertyDescriptor(globalThis, "cancelAnimationFrame");
  Object.defineProperty(globalThis, "requestAnimationFrame", { configurable: true, value: (callback: FrameRequestCallback) => { pending = callback; return 1; } });
  Object.defineProperty(globalThis, "cancelAnimationFrame", { configurable: true, value: () => { pending = undefined; } });
  t.after(() => {
    if (originalRequest) Object.defineProperty(globalThis, "requestAnimationFrame", originalRequest);
    else Reflect.deleteProperty(globalThis, "requestAnimationFrame");
    if (originalCancel) Object.defineProperty(globalThis, "cancelAnimationFrame", originalCancel);
    else Reflect.deleteProperty(globalThis, "cancelAnimationFrame");
  });
  let frames = 1;
  const video = {
    paused: false, ended: false, readyState: 2, videoWidth: 640, videoHeight: 480, currentTime: 0,
    getVideoPlaybackQuality: () => ({ totalVideoFrames: frames, droppedVideoFrames: 0 }),
  } as unknown as HTMLVideoElement;
  const attempts: number[] = [];
  const stop = startScanFrames(video, now => attempts.push(now), error => { throw error; });
  const emit = (now: number) => { clock = now; const callback = pending; pending = undefined; callback?.(now); };
  emit(0);
  video.currentTime = 0.1;
  emit(100); // Clock advances but no new decoded image.
  frames++;
  emit(200);
  frames = 0; // Browser without usable frame statistics.
  video.currentTime = 0.3;
  emit(300);
  emit(400);
  video.currentTime = 0.5;
  emit(500);
  assert.deepEqual(attempts, [0, 200, 300, 500]);
  stop();
  assert.equal(pending, undefined);
});
