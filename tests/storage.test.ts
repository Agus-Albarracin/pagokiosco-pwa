import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { listProducts, saveProduct } from "../lib/storage";
const product = {
  ean: "SKU-test",
  nombre: "Pan",
  costo: 100,
  margen: 40,
  precioVenta: 150,
  stock: 0,
  updatedAt: "",
};
test("stock incremental concurrente y códigos duplicados", async () => {
  await saveProduct(product, false, 5);
  await Promise.all([saveProduct(product, true, 2), saveProduct(product, true, 3)]);
  assert.equal((await listProducts())[0].stock, 10);
  await assert.rejects(saveProduct(product, false, 99), /ya existe/);
  assert.equal((await listProducts())[0].stock, 10);
});
