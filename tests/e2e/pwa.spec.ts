import { test, expect } from "@playwright/test";
test("beforeinstallprompt abre el aviso y ejecuta la instalación", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("pagokiosco.install-dismissed", "1"));
  await page.goto("/");
  await expect(page.getByLabel("Buscar para vender", { exact: true })).toBeEnabled();
  await page.evaluate(() => {
    sessionStorage.removeItem("pagokiosco.install-dismissed");
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.defineProperties(event, {
      prompt: { value: async () => { document.documentElement.dataset.installCalled = "yes"; } },
      userChoice: { value: Promise.resolve({ outcome: "accepted" }) },
    });
    window.dispatchEvent(event);
  });
  await expect(page.getByRole("dialog", { name: "Tu kiosco, a un toque" })).toBeVisible();
  await page.getByRole("button", { name: "Instalar PagoKiosco", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-install-called", "yes");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Instalar app", exact: true })).toHaveCount(0);
});
test("recarga, inventario y venta funcionan offline", async ({ page, context }) => {
  await page.addInitScript(() => sessionStorage.setItem("pagokiosco.install-dismissed", "1"));
  await page.goto("/");
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await expect(page.locator(".pwa-status")).toContainText("Lista para usar sin conexión");
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Tu mostrador", exact: true })).toBeVisible();
  await expect(page.locator(".pwa-status")).toContainText("Sin conexión");
  await page.getByRole("button", { name: "Agregar stock", exact: true }).click();
  await page.getByRole("button", { name: "Crear producto", exact: true }).click();
  await page.getByLabel("Nombre", { exact: true }).fill("Pan sin conexión");
  await page.getByLabel("Costo ($)", { exact: true }).fill("100");
  await page.getByLabel("Stock inicial").fill("2");
  await page.getByRole("button", { name: "Guardar producto" }).click();
  await page.getByRole("button", { name: "Vender", exact: true }).click();
  await page.getByLabel("Buscar para vender", { exact: true }).fill("pan conexion");
  await page.getByRole("button", { name: /Pan sin conexión/ }).click();
  await page.getByRole("button", { name: "Registrar venta" }).click();
  await page.getByRole("button", { name: "Confirmar y descontar stock" }).click();
  await expect(page.locator(".success")).toContainText("Venta registrada");
  await page.reload();
  await page.getByRole("button", { name: "Catálogo", exact: true }).click();
  await expect(page.locator(".product-row")).toContainText("1 u.");
  await page.getByRole("button", { name: "Caja", exact: false }).click();
  await page.getByRole("button", { name: "Cierre de caja", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("150");
  await page.getByRole("button", { name: "Listo", exact: true }).click();
  await page.getByRole("button", { name: "Vender", exact: false }).click();
  await page.getByLabel("Buscar para vender", { exact: true }).fill("producto inexistente");
  await expect(page.getByRole("heading", { name: "Sin coincidencias" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Crear producto" })).toHaveCount(0);
});
test("buscar y cambiar de sección no solicita cámara ni catálogo externo", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("pagokiosco.install-dismissed", "1");
    navigator.mediaDevices.getUserMedia = async () => {
      document.documentElement.dataset.cameraRequested = "yes";
      throw new Error("Camera must not be requested");
    };
  });
  const lookups: string[] = [];
  page.on("request", request => { if (request.url().includes("/api/products") || request.url().includes("openfoodfacts")) lookups.push(request.url()); });
  await page.goto("/");
  await page.getByLabel("Buscar para vender", { exact: true }).fill("galletitas");
  await page.getByRole("button", { name: "Catálogo", exact: true }).click();
  await page.getByLabel("Buscar producto", { exact: true }).fill("marca");
  await page.getByRole("button", { name: "Agregar stock", exact: true }).click();
  await page.getByLabel("Buscar producto para reponer").fill("marca");
  await expect(page.locator("video")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Escanear|Activar cámara/ })).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveAttribute("data-camera-requested");
  expect(lookups).toEqual([]);
});
test("ofrece instalación y la suprime en modo standalone", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("pagokiosco.install-dismissed", "1"));
  await page.goto("/");
  await page.getByRole("button", { name: "Instalar app", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Tu kiosco, a un toque" })).toBeVisible();
  await page.getByRole("button", { name: "Ahora no", exact: true }).click();
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(page.getByRole("button", { name: "Instalar app", exact: true })).toHaveCount(0);
  await page.addInitScript(() => {
    const original = window.matchMedia.bind(window);
    window.matchMedia = query => { const result = original(query); if (query.includes("display-mode")) Object.defineProperty(result, "matches", { value: true }); return result; };
  });
  await page.reload();
  await expect(page.getByLabel("Buscar para vender", { exact: true })).toBeEnabled();
  await page.evaluate(() => window.dispatchEvent(new Event("beforeinstallprompt", { cancelable: true })));
  await expect(page.getByRole("button", { name: "Instalar app", exact: true })).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
