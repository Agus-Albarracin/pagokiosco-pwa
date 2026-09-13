import { test, expect } from "@playwright/test";
import { useBarcodeCamera } from "./scanner-camera";

test("catálogo y reposición separados conservan precios y carrito al navegar", async ({ page }, testInfo) => {
  await useBarcodeCamera(page);
  await page.route("**/api/products?*", route => route.fulfill({
    json: { found: true, ean: "7798113302458", nombre: "Manaos pomelo blanco zero" },
  }));
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Principal" });
  await expect(nav.getByRole("button")).toHaveText(["＋ Vender", "▦ Catálogo", "▥ Agregar stock", "↗ Caja"]);
  await expect(page.getByRole("button", { name: /Nuevo producto|Crear producto/ })).toHaveCount(0);
  await nav.getByRole("button", { name: "Catálogo", exact: true }).click();
  await expect(page.locator("main button")).toHaveCount(0);
  await nav.getByRole("button", { name: "Vender", exact: true }).click();
  await page.getByRole("button", { name: "Escanear", exact: false }).click();
  await expect(page.getByRole("dialog")).toContainText("Cargalo desde Agregar stock antes de venderlo.");
  await expect(page.getByRole("button", { name: /Cargar producto|Producto sin código/ })).toHaveCount(0);
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await nav.getByRole("button", { name: "Agregar stock", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Agregar stock", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Escanear producto", exact: true }).click();
  await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("Manaos pomelo blanco zero");
  await page.getByLabel("Costo ($)", { exact: true }).fill("1000");
  await page.getByLabel("Stock inicial").fill("3");
  await page.getByRole("button", { name: "Guardar producto" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.screenshot({ path: "test-results/stock-" + testInfo.project.name + ".png", fullPage: true });

  await nav.getByRole("button", { name: "Vender", exact: true }).click();
  await page.getByRole("button", { name: /Manaos pomelo/ }).click();
  await expect(page.locator(".cart-lines li")).toHaveCount(1);
  await nav.getByRole("button", { name: "Catálogo", exact: true }).click();
  await expect(page.locator("main button")).toHaveCount(0);
  await page.screenshot({ path: "test-results/catalog-" + testInfo.project.name + ".png", fullPage: true });
  await nav.getByRole("button", { name: "Agregar stock", exact: true }).click();
  await page.getByLabel("Buscar producto para reponer").fill("manaos");
  await page.getByRole("button", { name: "Editar Manaos pomelo blanco zero", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Para reponer, usá la sección Agregar stock.");
  await expect(page.getByLabel(/Ingresar unidades|Stock inicial/)).toHaveCount(0);
  await page.getByLabel("Precio de venta ($)").fill("1500");
  await page.getByRole("button", { name: "Guardar producto" }).click();
  await nav.getByRole("button", { name: "Catálogo", exact: true }).click();
  await expect(page.locator("main button")).toHaveCount(0);
  await expect(page.locator(".product-row")).toContainText("3 u.");
  await expect(page.locator(".product-row")).toContainText("1.500");
  await page.screenshot({ path: "test-results/catalog-" + testInfo.project.name + ".png", fullPage: true });

  await nav.getByRole("button", { name: "Agregar stock", exact: true }).click();
  await page.getByLabel("Buscar producto para reponer").fill("manaos");
  await page.getByRole("button", { name: "Agregar stock a Manaos pomelo blanco zero", exact: true }).click();
  await page.getByLabel("Unidades a agregar").fill("2");
  await page.getByRole("button", { name: "Confirmar ingreso", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".product-row")).toContainText("Stock actual: 5 unidades");
  await nav.getByRole("button", { name: "Caja", exact: true }).click();
  await nav.getByRole("button", { name: "Vender", exact: true }).click();
  await expect(page.locator(".cart-lines li")).toHaveCount(1);
  await expect(page.locator(".cart-lines li")).toContainText("Manaos pomelo blanco zero");
  await page.reload();
  await nav.getByRole("button", { name: "Catálogo", exact: true }).click();
  await expect(page.locator(".product-row")).toContainText("5 u.");
  await expect(page.locator(".product-row")).toContainText("1.500");
});

test("la navegación móvil permite deslizar en ambos sentidos sin desbordar la página", async ({ page, context, isMobile }) => {
  test.skip(!isMobile, "Solo la navegación móvil tiene desplazamiento horizontal");
  await page.addInitScript(() => sessionStorage.setItem("pagokiosco.install-dismissed", "1"));
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Principal" });
  const box = (await nav.boundingBox())!;
  expect(await nav.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
  const session = await context.newCDPSession(page);
  async function swipe(from: number, to: number) {
    const y = box.y + box.height / 2;
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: from, y }] });
    for (let step = 1; step <= 10; step++) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove", touchPoints: [{ x: from + (to - from) * step / 10, y }],
      });
    }
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  }
  await swipe(box.x + box.width - 20, box.x + 20);
  await expect.poll(() => nav.evaluate(element => element.scrollLeft)).toBeGreaterThan(100);
  await nav.getByRole("button", { name: "Caja", exact: true }).click();
  await expect(nav.getByRole("button", { name: "Caja", exact: true })).toHaveAttribute("aria-current", "page");
  await swipe(box.x + 20, box.x + box.width - 20);
  await expect.poll(() => nav.evaluate(element => element.scrollLeft)).toBeLessThan(20);
  await nav.getByRole("button", { name: "Vender", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tu mostrador", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await session.detach();
});
