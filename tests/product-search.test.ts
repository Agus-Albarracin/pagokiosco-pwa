import assert from "node:assert/strict";
import { test } from "node:test";
import { createProductSearch } from "../lib/product-search";
import { saveProduct, listProducts } from "../lib/storage";
import { addStock } from "../lib/stock";
import { IDBFactory } from "fake-indexeddb";
import type { Product } from "../lib/domain";

const original: Product = {
  ean: "SKU-cafe",
  nombre: "Café molido 250 g",
  marca: "Águila",
  costo: 100,
  margen: 40,
  precioVenta: 150,
  stock: 0,
  updatedAt: "",
};

test("busca por marca y producto con palabras parciales, tildes y orden libre", () => {
  const legacy = { ...original, ean: "7798113302458", nombre: "Manaos pomelo", marca: undefined };
  const search = createProductSearch([original, legacy]);
  assert.deepEqual(search("  AGUI cafe  "), [original]);
  assert.deepEqual(search("mol águila"), [original]);
  assert.deepEqual(search("manaos"), [legacy]);
  assert.deepEqual(search("7798113302458"), [legacy]);
  assert.deepEqual(search("águila pomelo"), []);
  assert.deepEqual(search("  "), [original, legacy]);
});

test("la marca persiste y una reposición o edición antigua no la pierde", async () => {
  globalThis.indexedDB = new IDBFactory();
  await saveProduct({ ...original, marca: " Águila " }, false, 3);
  assert.equal((await listProducts())[0].marca, "Águila");
  await addStock(original.ean, 2);
  const legacyInput = { ...original };
  delete legacyInput.marca;
  await saveProduct(legacyInput, true, 0);
  const saved = (await listProducts())[0];
  assert.equal(saved.marca, "Águila");
  assert.equal(saved.stock, 5);
  await assert.rejects(() => saveProduct({ ...saved, marca: "x".repeat(81) }, true, 0), /marca/);
});
