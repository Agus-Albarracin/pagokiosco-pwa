import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { createScanQualityFeedback, SCAN_GUIDANCE } from "../lib/scan-quality-feedback";

function cameraSample(t: TestContext) {
  let kind: "dark" | "bright" | "bars" = "dark";
  let failRead = false;
  let draws = 0;
  let reads = 0;
  let creations = 0;
  const context = {
    drawImage() { draws += 1; },
    getImageData(...args: number[]) {
      reads += 1;
      if (failRead) throw new Error("Canvas read unavailable");
      const [, , width, height] = args;
      const data = new Uint8ClampedArray(width * height * 4);
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const value = kind === "dark" ? 5 : kind === "bright" ? 250 : x % 4 < 2 ? 0 : 255;
          data.set([value, value, value, 255], (y * width + x) * 4);
        }
      }
      return { data, width, height };
    },
  };
  const canvas = { width: 0, height: 0, getContext: () => context };
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      createElement(tag: string) {
        assert.equal(tag, "canvas");
        creations += 1;
        return canvas;
      },
    },
  });
  t.after(() => {
    if (originalDocument) Object.defineProperty(globalThis, "document", originalDocument);
    else Reflect.deleteProperty(globalThis, "document");
  });
  return {
    sample: createScanQualityFeedback({ videoWidth: 640, videoHeight: 480 } as HTMLVideoElement),
    show(value: typeof kind) { kind = value; },
    failRead() { failRead = true; },
    counts: () => ({ draws, reads, creations }),
    canvas,
  };
}

test("el análisis usa muestras pequeñas y limita las lecturas de canvas a dos por segundo", t => {
  const source = cameraSample(t);
  for (let now = 0; now < 2000; now += 100) source.sample(now);
  assert.deepEqual(source.counts(), { draws: 4, reads: 4, creations: 1 });
  assert.equal(source.canvas.width, 160);
  assert.equal(source.canvas.height, 120);
});

test("los cambios oscilantes no parpadean y la guía se recupera después de tres muestras estables", t => {
  const source = cameraSample(t);
  for (const [index, kind] of (["dark", "bright", "dark", "bright"] as const).entries()) {
    source.show(kind);
    assert.equal(source.sample(index * 500), undefined);
  }
  source.show("dark");
  assert.equal(source.sample(2000), undefined);
  assert.equal(source.sample(2500), undefined);
  assert.equal(source.sample(3000), "Buscá más luz para ver el código.");
  assert.equal(source.sample(3500), undefined);
  source.show("bars");
  assert.equal(source.sample(4000), undefined);
  assert.equal(source.sample(4500), undefined);
  assert.equal(source.sample(5000), SCAN_GUIDANCE);
  assert.equal(source.sample(5500), undefined);
});

test("un error de canvas recupera la guía sin lanzar errores y desactiva las muestras posteriores", t => {
  const source = cameraSample(t);
  source.failRead();
  assert.equal(source.sample(0), SCAN_GUIDANCE);
  assert.equal(source.sample(500), undefined);
  assert.equal(source.sample(2000), undefined);
  assert.deepEqual(source.counts(), { draws: 1, reads: 1, creations: 1 });
});
