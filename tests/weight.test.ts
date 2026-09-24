import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { kilogramsToGrams, lineCents, type Product } from "../lib/domain";
import { saveProduct, listProducts, openDatabase, requestValue } from "../lib/storage";
import { checkout, listSales } from "../lib/sales";
import { addStock, recordWaste } from "../lib/stock";

test("peso: precisión, venta mixta, reposición y merma atómicas", async () => {
  const ham: Product = {
    ean: "ham",
    nombre: "Jamón",
    unidadVenta: "peso",
    costo: 6000,
    margen: 66.7,
    precioVenta: 10000,
    stock: 0,
    updatedAt: "",
  };
  const unit: Product = {
    ...ham,
    ean: "bread",
    nombre: "Pan",
    unidadVenta: undefined,
    precioVenta: 150,
  };
  assert.equal(kilogramsToGrams(8.25), 8250);
  assert.equal(kilogramsToGrams(1.001), 1001);
  for (const kg of [-1, NaN, Infinity, 0.0001]) assert.throws(() => kilogramsToGrams(kg));
  assert.equal(lineCents({ ...ham, precioVenta: 1234.56, qty: 235 }), 29012);
  await saveProduct(ham, false, 8250);
  await saveProduct(unit, false, 3);
  const lines = [
    { ...ham, qty: 235 },
    { ...unit, qty: 2 },
  ];
  assert.equal((await checkout("sale", lines, "EFECTIVO")).total, 2650);
  await checkout("sale", lines, "EFECTIVO");
  const stock = async () => (await listProducts()).find((p) => p.ean === "ham")!.stock;
  assert.equal(await stock(), 8015);
  await assert.rejects(checkout("oversell", [{ ...ham, qty: 9000 }], "EFECTIVO"));
  await assert.rejects(
    checkout("wrong-unit", [{ ...ham, unidadVenta: undefined, qty: 1 }], "EFECTIVO"),
  );
  await assert.rejects(checkout("fraction", [{ ...ham, qty: 0.5 }], "EFECTIVO"));
  await assert.rejects(saveProduct({ ...ham, unidadVenta: "unidad" }, true, 0));
  await Promise.all([addStock("ham", 1000), recordWaste("waste", "ham", 115, "Recortes")]);
  assert.equal(await stock(), 8900);
  await recordWaste("waste", "ham", 115, "Recortes");
  assert.equal(await stock(), 8900);
  await assert.rejects(recordWaste("too-much", "ham", 9000, "Descarte"));
  await assert.rejects(recordWaste("no-reason", "ham", 1, " "));
  const db = await openDatabase();
  assert.equal(
    (await requestValue(db.transaction("waste").objectStore("waste").getAll())).length,
    1,
  );
  db.close();
  assert.equal((await listSales(0)).length, 1);
  assert.equal(await stock(), 8900);
});
