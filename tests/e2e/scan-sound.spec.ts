import { test, expect } from "@playwright/test";
import { useBarcodeCamera } from "./scanner-camera";

test("cada lectura suena una vez y termina aunque el escáner se cierre", async ({ page }) => {
  await useBarcodeCamera(page);
  await page.addInitScript(() => {
    const original = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      const oscillator = original.call(this);
      document.documentElement.dataset.beepCount = String(Number(document.documentElement.dataset.beepCount ?? 0) + 1);
      document.documentElement.dataset.audioState = this.state;
      oscillator.addEventListener("ended", () => {
        document.documentElement.dataset.beepEnded = String(Number(document.documentElement.dataset.beepEnded ?? 0) + 1);
      });
      return oscillator;
    };
  });
  await page.route("**/api/products?*", route => route.fulfill({
    json: { found: true, ean: "7798113302458", nombre: "Manaos pomelo blanco zero" },
  }));
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveAttribute("data-beep-count");
  await page.getByRole("button", { name: "Agregar stock", exact: true }).click();
  await page.getByRole("button", { name: "Escanear producto", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Nuevo producto", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-beep-count", "1");
  await expect(page.locator("html")).toHaveAttribute("data-audio-state", "running");
  await expect(page.locator("html")).toHaveAttribute("data-beep-ended", "1");
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await page.getByRole("button", { name: "Vender", exact: true }).click();
  await page.getByRole("button", { name: "Escanear", exact: false }).click();
  await expect(page.getByRole("dialog")).toContainText("Cargalo desde Agregar stock");
  await expect(page.locator("html")).toHaveAttribute("data-beep-count", "2");
  await expect(page.locator("html")).toHaveAttribute("data-beep-ended", "2");
  await page.getByLabel("Código EAN", { exact: true }).fill("7798113302458");
  await page.getByRole("button", { name: "Buscar código", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-beep-count", "2");
});

test("la lectura continúa si el dispositivo no permite audio", async ({ page }) => {
  await useBarcodeCamera(page);
  await page.addInitScript(() => {
    Object.defineProperty(window, "AudioContext", { value: class {
      constructor() { throw new Error("Audio unavailable"); }
    } });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Escanear", exact: false }).click();
  await expect(page.getByRole("dialog")).toContainText("Cargalo desde Agregar stock");
  await expect(page.getByLabel("Código EAN", { exact: true })).toHaveValue("7798113302458");
});
