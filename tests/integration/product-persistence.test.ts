import { test } from "node:test";
import assert from "node:assert/strict";
import { IDBFactory } from "fake-indexeddb";
import { listProducts, type Product } from "@/entities/product";
import { saveProduct } from "@/features/inventario/save-product";
import { addStock } from "@/features/inventario/stock";
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
