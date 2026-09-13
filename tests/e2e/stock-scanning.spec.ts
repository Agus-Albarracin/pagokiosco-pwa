import { test, expect } from "@playwright/test";
import { useBarcodeCamera } from "./scanner-camera";

test("Nuevo producto inicia ZXing, carga el nombre y permite reponer sin vender", async ({ page }) => {
  await useBarcodeCamera(page);
  let lookups = 0;
  await page.route("**/api/products?*", async route => {
    lookups++;
    expect(new URL(route.request().url()).searchParams.get("ean")).toBe("7798113302458");
    await route.fulfill({ json: { found: true, ean: "7798113302458", nombre: "Manaos pomelo blanco zero" } });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Nuevo producto" }).click();
  await expect(page.getByRole("dialog", { name: "Nuevo producto", exact: true })).toBeVisible();
  await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("Manaos pomelo blanco zero");
  await expect(page.getByLabel("Código de barras")).toHaveValue("7798113302458");
  await expect(page.getByLabel("Stock inicial")).toHaveValue("1");
  await expect.poll(() => page.evaluate(() => (window as Window & { testStream?: MediaStream }).testStream?.getTracks()[0].readyState)).toBe("ended");
  await page.getByLabel("Costo ($)", { exact: true }).fill("1000");
  await page.getByLabel("Stock inicial").fill("3");
  await page.getByRole("button", { name: "Guardar producto" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Nuevo producto" }).click();
  await expect(page.getByRole("dialog", { name: "Agregar stock", exact: true })).toContainText("Manaos pomelo blanco zero");
  await page.getByLabel("Unidades a agregar").fill("2");
  await page.getByRole("button", { name: "Confirmar ingreso", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".cart-lines li")).toHaveCount(0);
  expect(lookups).toBe(1);
  await page.getByRole("button", { name: "Catálogo", exact: true }).click();
  await expect(page.locator(".product-row")).toHaveCount(1);
  await expect(page.locator(".product-row")).toContainText("5 u.");
  await expect(page.locator(".product-row")).toContainText("1.400");
});
