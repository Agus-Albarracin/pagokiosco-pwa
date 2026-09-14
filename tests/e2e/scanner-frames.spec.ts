import { test, expect, type Page } from "@playwright/test";
import { useBarcodeCamera as installBarcodeCamera } from "./scanner-camera";

type CameraWindow = Window & typeof globalThis & {
  testStream?: MediaStream;
  scannerAttempts: number[];
  showBarcode: () => void;
};

async function openScanner(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Agregar stock", exact: true }).click();
  await page.getByRole("button", { name: "Escanear producto", exact: true }).click();
}

async function expectCameraStopped(page: Page) {
  await expect.poll(() => page.evaluate(() =>
    (window as CameraWindow).testStream?.getTracks()[0].readyState,
  )).toBe("ended");
}

async function installChangingCamera(page: Page) {
  await installBarcodeCamera(page);
  await page.addInitScript(() => {
    const state = window as CameraWindow;
    state.scannerAttempts = [];
    const drawImage = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (source: CanvasImageSource, ...coordinates: number[]) {
      // Observe full-resolution ZXing reads, excluding the small quality sample.
      if (source instanceof HTMLVideoElement && this.canvas.width === 640 && this.canvas.height === 480) {
        state.scannerAttempts.push(performance.now());
      }
      return Reflect.apply(drawImage, this, [source, ...coordinates]);
    };
    const captureStream = HTMLCanvasElement.prototype.captureStream;
    HTMLCanvasElement.prototype.captureStream = function () {
      const context = this.getContext("2d")!;
      const barcode = context.getImageData(0, 0, this.width, this.height);
      context.fillStyle = "#777";
      context.fillRect(0, 0, this.width, this.height);
      const stream = captureStream.call(this, 30);
      let frame = 0;
      const timer = window.setInterval(() => {
        if (stream.getTracks().every(track => track.readyState === "ended")) {
          clearInterval(timer);
          return;
        }
        context.fillStyle = frame++ % 2 ? "#777" : "#888";
        context.fillRect(0, 0, 2, 2);
      }, 33);
      state.showBarcode = () => context.putImageData(barcode, 0, 0);
      return stream;
    };
  });
}

test("el fallback sin callbacks de vídeo lee un EAN con ZXing", async ({ page }) => {
  await installBarcodeCamera(page);
  await page.addInitScript(() => {
    Object.defineProperty(HTMLVideoElement.prototype, "requestVideoFrameCallback", { value: undefined });
  });
  await page.route("**/api/products?*", route => route.fulfill({
    json: { found: true, ean: "7798113302458", nombre: "Manaos pomelo blanco zero" },
  }));
  await openScanner(page);
  await expect(page.getByRole("dialog", { name: "Nuevo producto", exact: true })).toBeVisible();
  await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("Manaos pomelo blanco zero");
  await expectCameraStopped(page);
});

test("el escáner sigue los nuevos fotogramas hasta que aparece el EAN", async ({ page }) => {
  await installChangingCamera(page);
  let lookups = 0;
  await page.route("**/api/products?*", route => {
    lookups++;
    expect(new URL(route.request().url()).searchParams.get("ean")).toBe("7798113302458");
    return route.fulfill({ json: { found: true, ean: "7798113302458", nombre: "Manaos pomelo blanco zero" } });
  });
  await openScanner(page);
  await expect.poll(() => page.evaluate(() => (window as CameraWindow).scannerAttempts.length)).toBeGreaterThanOrEqual(3);
  await expect(page.getByRole("dialog", { name: "Escanear para agregar stock", exact: true })).toBeVisible();
  expect(lookups).toBe(0);
  await page.evaluate(() => (window as CameraWindow).showBarcode());
  await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("Manaos pomelo blanco zero");
  await expectCameraStopped(page);
  expect(lookups).toBe(1);
});

test("limita los intentos y deja de procesar al cerrar la cámara", async ({ page }) => {
  await installChangingCamera(page);
  await openScanner(page);
  await expect.poll(() => page.evaluate(() => (window as CameraWindow).scannerAttempts.length)).toBeGreaterThanOrEqual(6);
  const attempts = await page.evaluate(() => (window as CameraWindow).scannerAttempts);
  // Allow minor clock/capture overhead variance without accepting an unbounded loop.
  expect(attempts.slice(1).every((time, index) => time - attempts[index] >= 95)).toBe(true);
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expectCameraStopped(page);
  const countAfterClose = await page.evaluate(() => (window as CameraWindow).scannerAttempts.length);
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => (window as CameraWindow).scannerAttempts.length)).toBe(countAfterClose);
});
