import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkout } from "@/features/venta/checkout";
import { listSales } from "@/features/caja/list-sales";
import { startOfToday } from "@/shared/lib/date";
import { saveProduct } from "@/features/inventario/save-product";
import { listProducts } from "@/entities/product";
import { summarize } from "@/features/caja/summary";
test("checkout es atómico, idempotente y resiste ventas concurrentes", async () => {
  const product = {
    ean: "SKU-sale",
    nombre: "Galletitas",
    costo: 100,
    margen: 50,
    precioVenta: 150,
    stock: 0,
    updatedAt: "",
  };
  await saveProduct(product, false, 3);
  const line = { ean: product.ean, nombre: product.nombre, precioVenta: 150, qty: 2 };
  const results = await Promise.allSettled([
    checkout("sale-1", [line], "EFECTIVO"),
    checkout("sale-2", [line], "TRANSFERENCIA"),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal((await listProducts())[0].stock, 1);
  const completed = (await listSales(0))[0];
  await checkout(completed.id, [line], "EFECTIVO");
  assert.equal((await listSales(0)).length, 1);
  await assert.rejects(
    checkout(
      "rollback",
      [
        { ...line, qty: 1 },
        { ...line, ean: "missing" },
      ],
      "EFECTIVO",
    ),
    /Stock insuficiente/,
  );
  assert.equal((await listProducts())[0].stock, 1);
  await assert.rejects(
    checkout("price", [{ ...line, qty: 1, precioVenta: 100 }], "EFECTIVO"),
    /Cambió el precio/,
  );
  assert.equal((await listSales(0)).length, 1);
  await checkout(
    "custom",
    [{ ean: "CUSTOM-1", nombre: "Importe libre", precioVenta: 10.25, qty: 1, custom_amount: true }],
    "TRANSFERENCIA",
  );
  assert.equal(summarize(await listSales(0)).total, 310.25);
  assert.equal((await listSales(Date.now() + 1000, Date.now() + 2000)).length, 0);
  assert.equal(new Date(startOfToday(new Date(2026, 8, 13, 16))).getHours(), 0);
});
