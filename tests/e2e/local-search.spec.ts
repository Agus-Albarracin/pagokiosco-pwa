import { test, expect } from "@playwright/test";

test("marca y nombre se buscan sin tildes y persisten al reponer y editar", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("pagokiosco.install-dismissed", "1"));
  await page.goto("/");
  await page.getByRole("button", { name: "Agregar stock", exact: true }).click();
  await page.getByRole("button", { name: "Crear producto", exact: true }).click();
  await page.getByLabel("Nombre", { exact: true }).fill("Café molido 250 g");
  await page.getByLabel("Marca").fill("Águila");
  await page.getByLabel("Costo ($)", { exact: true }).fill("100");
  await page.getByLabel("Stock inicial").fill("2");
  await page.getByRole("button", { name: "Guardar producto" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByLabel("Buscar producto para reponer").fill("AGUI cafe");
  await expect(page.locator(".product-row")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Agregar stock a Café molido 250 g", exact: true })
    .click();
  await page.getByLabel("Unidades a agregar").fill("3");
  await page.getByRole("button", { name: "Confirmar ingreso" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Editar Café molido 250 g", exact: true }).click();
  await expect(page.getByLabel("Marca")).toHaveValue("Águila");
  await page.getByLabel("Marca").fill("Cabrales");
  await page.getByRole("button", { name: "Guardar producto" }).click();
  await expect(page.locator(".product-row")).toHaveCount(0);
  await page.getByLabel("Buscar producto para reponer").fill("cabr");
  await expect(page.locator(".product-row")).toContainText("5 unidades");
  await page.getByRole("button", { name: "Vender", exact: true }).click();
  await page.getByLabel("Buscar para vender", { exact: true }).fill("mol CABR");
  await expect(page.locator(".quick-product")).toHaveCount(1);
  await page.locator(".quick-product").click();
  await expect(page.locator(".cart-lines li")).toContainText("Café molido");
  await page.reload();
  await page.getByRole("button", { name: "Catálogo", exact: true }).click();
  await page.getByLabel("Buscar producto", { exact: true }).fill("CAFE cabr");
  await expect(page.locator(".product-row")).toContainText("Cabrales");
  await expect(page.locator(".product-row")).toContainText("5 u.");
  await expect(page.locator("main button")).toHaveCount(0);
});
