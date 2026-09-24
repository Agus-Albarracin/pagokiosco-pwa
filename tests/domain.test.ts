import { test } from "node:test";
import assert from "node:assert/strict";
import { priceFromMargin, marginFromPrice, validateProduct, summarize } from "../lib/domain";
test("redondeo comercial y margen inverso", () => {
  assert.equal(priceFromMargin(100, 40), 150);
  assert.equal(priceFromMargin(1000, 40), 1400);
  assert.equal(priceFromMargin(101, 50), 200);
  assert.equal(marginFromPrice(100, 150), 50);
  assert.equal(marginFromPrice(0, 100), 0);
});
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
  assert.deepEqual(summarize([]), { cash: 0, transfer: 0, total: 0, count: 0 });
});
