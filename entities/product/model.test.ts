import { test } from "node:test";
import assert from "node:assert/strict";
import { validateProduct } from "./model";
test("rechaza stock fraccionario y números no finitos", () => {
  const product = {
    ean: "SKU-1",
    nombre: "Pan",
    costo: 100,
    margen: 40,
    precioVenta: 150,
    stock: 1,
    updatedAt: new Date().toISOString(),
  };
  assert.doesNotThrow(() => validateProduct(product));
  assert.throws(() => validateProduct({ ...product, stock: 1.5 }));
  assert.throws(() => validateProduct({ ...product, costo: NaN }));
});
