import { test } from "node:test";
import assert from "node:assert/strict";
import type { Product } from "./model";
import { createProductSearch } from "./search";
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
