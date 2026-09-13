import { test, expect } from "@playwright/test";
test("beforeinstallprompt abre el aviso y ejecuta la instalación", async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem("pagokiosco.install-dismissed", "1"));
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Escanear", exact: false })).toBeEnabled();
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
  await page.getByRole("button", { name: "Escanear producto", exact: true }).click();
  await page.getByRole("button", { name: "Producto sin código · carga manual", exact: true }).click();
  await page.getByLabel("Nombre", { exact: true }).fill("Pan sin conexión");
  await page.getByLabel("Costo ($)", { exact: true }).fill("100");
  await page.getByLabel("Stock inicial").fill("2");
  await page.getByRole("button", { name: "Guardar producto" }).click();
  await page.getByRole("button", { name: "Vender", exact: true }).click();
  await page.getByRole("button", { name: /SIN CÓDIGO Pan/ }).click();
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
  await page.getByRole("button", { name: "Escanear", exact: false }).click();
  await expect(page.locator(".scanner")).toContainText(/No pudimos usar la cámara|Apuntá al código/);
  await page.getByLabel("Código EAN", { exact: true }).fill("12345678");
  await page.getByRole("button", { name: "Buscar código" }).click();
  await expect(page.getByRole("dialog")).toContainText("Cargalo desde Agregar stock antes de venderlo.");
  await expect(page.getByRole("button", { name: "Cargar producto manualmente" })).toHaveCount(0);
});
test("el escáner libera el MediaStream al cerrar", async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem("pagokiosco.install-dismissed", "1");
    navigator.mediaDevices.getUserMedia = async () => {
      const canvas = document.createElement("canvas"); canvas.width = 640; canvas.height = 480;
      const ctx = canvas.getContext("2d")!; ctx.fillStyle = "white"; ctx.fillRect(0, 0, 640, 480);
      const stream = canvas.captureStream(1);
      (window as Window & { testStream?: MediaStream }).testStream = stream;
      return stream;
    };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Escanear", exact: false }).click();
  await expect(page.locator(".scanner")).toContainText("Apuntá al código");
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as Window & { testStream?: MediaStream }).testStream?.getTracks()[0].readyState)).toBe("ended");
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
  await expect(page.getByRole("button", { name: "Escanear", exact: false })).toBeEnabled();
  await page.evaluate(() => window.dispatchEvent(new Event("beforeinstallprompt", { cancelable: true })));
  await expect(page.getByRole("button", { name: "Instalar app", exact: true })).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
