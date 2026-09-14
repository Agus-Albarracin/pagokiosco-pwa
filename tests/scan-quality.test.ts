import { test } from "node:test";
import assert from "node:assert/strict";
import { analyzeFrameQuality } from "../lib/scan-quality";

function frame(luminance: (x: number, y: number) => number, width = 96, height = 48) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const value = luminance(x, y);
      data.set([value, value, value, 255], offset);
    }
  }
  return { data, width, height };
}

test("informa oscuridad y exceso de luz en fotogramas casi uniformes", () => {
  const dark = analyzeFrameQuality(frame(() => 5));
  const bright = analyzeFrameQuality(frame(() => 250));
  assert.equal(dark?.issue, "dark");
  assert.equal(bright?.issue, "bright");
  assert.equal(dark?.brightness, 5);
  assert.equal(bright?.brightness, 250);
});

test("poca textura orienta sin afirmar que la cámara está desenfocada", () => {
  const plain = analyzeFrameQuality(frame(() => 128));
  const faint = analyzeFrameQuality(frame(x => 128 + 5 * Math.sin(x / 8)));
  assert.equal(plain?.issue, "low-detail");
  assert.equal(faint?.issue, "low-detail");
  assert.equal(plain?.contrast, 0);
  assert.equal(plain?.edgeStrength, 0);
});

test("las barras visibles aportan detalle incluso sobre un envase blanco", () => {
  const bars = analyzeFrameQuality(frame(x => x % 6 === 0 ? 0 : 255));
  assert.equal(bars?.issue, "ok");
  assert.ok(bars && bars.contrast > 50 && bars.edgeStrength > 10);
});

test("la fuerza de bordes distingue transiciones marcadas de transiciones suaves", () => {
  const crisp = analyzeFrameQuality(frame(x => x % 8 < 4 ? 30 : 225));
  const smooth = analyzeFrameQuality(frame(x => 128 + 80 * Math.sin(x * Math.PI / 24)));
  assert.ok(crisp && smooth && crisp.edgeStrength > smooth.edgeStrength * 3);
});

test("mide bordes en ambas orientaciones sin unir extremos de filas", () => {
  const vertical = analyzeFrameQuality(frame(x => x % 4 < 2 ? 0 : 255, 48, 48));
  const horizontal = analyzeFrameQuality(frame((_x, y) => y % 4 < 2 ? 0 : 255, 48, 48));
  assert.ok(vertical && horizontal);
  assert.equal(vertical.edgeStrength, horizontal.edgeStrength);
  assert.equal(vertical.issue, "ok");
  assert.equal(horizontal.issue, "ok");
});

test("un fotograma sin dimensiones o incompleto no produce diagnóstico", () => {
  assert.equal(analyzeFrameQuality({ data: new Uint8ClampedArray(), width: 0, height: 0 }), null);
  assert.equal(analyzeFrameQuality({ data: new Uint8ClampedArray(4), width: 2, height: 2 }), null);
});
