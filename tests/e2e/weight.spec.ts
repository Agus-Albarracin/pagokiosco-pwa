import { test, expect } from "@playwright/test";

test("fiambre: kilos, gramos exactos, edición, reposición y merma sin ingresos", async ({
  page,
  context,
}, testInfo) => {
  await page.addInitScript(() => sessionStorage.setItem("pagokiosco.install-dismissed", "1"));
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Principal" });
  await nav.getByRole("button", { name: "Agregar stock", exact: true }).click();
  await page.getByRole("button", { name: "Crear producto", exact: true }).click();
  await page.getByLabel("Nombre", { exact: true }).fill("Jamón cocido");
  await page.getByRole("button", { name: "Por peso (kg)", exact: true }).click();
  await page.getByLabel("Costo por kg ($)", { exact: true }).fill("6000");
  await page.getByLabel("Precio de venta por kg ($)", { exact: true }).fill("10000");
  await page.getByLabel("Stock inicial (kg)", { exact: true }).fill("8.250");
  await page.getByRole("button", { name: "Guardar producto" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".product-row")).toContainText("8,25 kg");
  await context.setOffline(true);
  await nav.getByRole("button", { name: "Vender", exact: true }).click();
  await page.getByLabel("Buscar para vender", { exact: true }).fill("jamon");
  await page.locator(".quick-product").click();
  for (const grams of [100, 200, 300]) {
    await page.getByRole("button", { name: `${grams} g`, exact: true }).click();
    await expect(page.getByLabel("Peso exacto (g)")).toHaveValue(String(grams));
  }
  await page.getByLabel("Peso exacto (g)").fill("9000");
  await expect(page.getByRole("button", { name: "Confirmar peso" })).toBeDisabled();
  await page.getByLabel("Peso exacto (g)").fill("235");
  await page.screenshot({
    path: `test-results/weight-picker-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Confirmar peso" }).click();
  await expect(page.locator(".cart-lines")).toContainText("235 g");
  await expect(page.locator(".cart-total")).toContainText("2.350");
  await page.getByRole("button", { name: "Cambiar peso de Jamón cocido" }).click();
  await page.getByLabel("Peso exacto (g)").fill("200");
  await page.getByRole("button", { name: "Confirmar peso" }).click();
  await expect(page.locator(".cart-total")).toContainText("2.000");
  await page.getByRole("button", { name: "Cambiar peso de Jamón cocido" }).click();
  await page.getByLabel("Peso exacto (g)").fill("235");
  await page.getByRole("button", { name: "Confirmar peso" }).click();
  await page.getByRole("button", { name: "Registrar venta" }).click();
  await page.getByRole("button", { name: "Confirmar y descontar stock" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await nav.getByRole("button", { name: "Agregar stock", exact: true }).click();
  await expect(page.locator(".product-row")).toContainText("8,015 kg");
  await page.getByRole("button", { name: "Agregar stock a Jamón cocido" }).click();
  await page.getByLabel("Kilos a agregar").fill("1.100");
  await page.getByRole("button", { name: "Confirmar ingreso" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Registrar merma de Jamón cocido" }).click();
  await page.getByLabel("Merma (g)").fill("115");
  await page.getByLabel("Motivo", { exact: true }).fill("Recortes");
  await page.getByRole("button", { name: "Confirmar merma" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".product-row")).toContainText("9 kg");
  await page.screenshot({
    path: `test-results/weight-stock-${testInfo.project.name}.png`,
    fullPage: true,
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await context.setOffline(false);
  await page.reload();
  await nav.getByRole("button", { name: "Catálogo", exact: true }).click();
  await expect(page.locator(".product-row")).toContainText("9 kg");
  await expect(page.locator(".product-row")).toContainText("/kg");
  await nav.getByRole("button", { name: "Caja", exact: true }).click();
  await expect(page.getByLabel("Caja de hoy")).toContainText("2.350");
  await expect(page.getByLabel("Caja de hoy")).toContainText("1 ventas registradas");
});
