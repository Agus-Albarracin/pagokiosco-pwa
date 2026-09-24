import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { addStock } from "../lib/stock";
import { listProducts, saveProduct } from "../lib/storage";

test("reposición concurrente conserva el precio actualizado y no duplica el catálogo", async () => {
  const product = {
    ean: "7798113302458",
    nombre: "Manaos",
    costo: 100,
    margen: 50,
    precioVenta: 150,
    stock: 0,
    updatedAt: "",
  };
  await saveProduct(product, false, 5);
  await saveProduct({ ...product, precioVenta: 200, margen: 100 }, true, 0);
  await Promise.all([addStock(product.ean, 2), addStock(product.ean, 3)]);
  const products = await listProducts();
  assert.equal(products.length, 1);
  assert.equal(products[0].stock, 10);
  assert.equal(products[0].precioVenta, 200);
  assert.equal(products[0].margen, 100);
  await assert.rejects(addStock(product.ean, 0));
  await assert.rejects(addStock(product.ean, 1.5));
  await assert.rejects(addStock("missing", 1), /catálogo/);
  assert.equal((await listProducts())[0].stock, 10);
});
