import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("pagokiosco.install-dismissed", "1"));
});
test("inventario, venta, importe libre y cierre persisten", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Agregar stock", exact: true }).click();
  await page.getByRole("button", { name: "Crear producto", exact: true }).click();
  await page.getByLabel("Nombre", { exact: true }).fill("Alfajor de chocolate");
  await page.getByLabel("Costo ($)", { exact: true }).fill("1000");
  await expect(page.getByLabel("Precio de venta ($)")).toHaveValue("1400");
  await page.getByLabel("Stock inicial").fill("5");
  await page.getByRole("button", { name: "Guardar producto" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Vender", exact: true }).click();
  await page.getByRole("button", { name: /Alfajor de chocolate/ }).click();
  await page.screenshot({ path: `test-results/pos-${testInfo.project.name}.png`, fullPage: true });
  await page.getByRole("button", { name: "Registrar venta" }).click();
  await page.getByRole("button", { name: "Confirmar y descontar stock" }).click();
  await expect(page.locator(".success")).toContainText("Venta registrada");
  await page.getByRole("button", { name: "Agregar importe libre" }).click();
  await page.getByLabel("Importe ($)").fill("250");
  await page.getByRole("button", { name: "Agregar al carrito" }).click();
  await page.getByRole("button", { name: "Registrar venta" }).click();
  await page.getByRole("button", { name: "Transferencia", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar y descontar stock" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload();
  await page.getByRole("button", { name: "Catálogo", exact: true }).click();
  await expect(page.locator(".product-row")).toContainText("4 u.");
  await page.getByRole("button", { name: "Caja", exact: false }).click();
  await page.getByRole("button", { name: "Cierre de caja", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("1.650");
  await expect(page.getByRole("dialog")).toContainText("2 ventas registradas");
  await page.getByRole("button", { name: "Listo", exact: true }).click();
  await page.getByRole("combobox").selectOption("365");
  await expect(page.locator(".metrics-summary")).toContainText("1.650");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});
test("alta local no requiere código y permite cerrar el diálogo", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Agregar stock", exact: true }).click();
  await page.getByRole("button", { name: "Crear producto", exact: true }).click();
  await expect(page.getByRole("dialog").getByLabel("Nombre", { exact: true })).toBeVisible();
  await expect(page.getByRole("dialog").getByLabel(/Código/)).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
