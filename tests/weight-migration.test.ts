import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { listProducts, openDatabase, transactionDone } from "../lib/storage";
import { checkout, listSales } from "../lib/sales";

test("la migración v1 a v2 conserva productos y ventas por unidad", async () => {
  const legacy = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("pagokiosco", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("products", { keyPath: "ean" });
      request.result
        .createObjectStore("sales", { keyPath: "id" })
        .createIndex("createdAt", "createdAt");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const product = {
    ean: "old",
    nombre: "Galletitas",
    costo: 100,
    margen: 50,
    precioVenta: 150,
    stock: 3,
    updatedAt: "",
  };
  const tx = legacy.transaction(["products", "sales"], "readwrite");
  const done = transactionDone(tx);
  tx.objectStore("products").put(product);
  tx.objectStore("sales").put({
    id: "old-sale",
    createdAt: 1,
    method: "EFECTIVO",
    lines: [{ ...product, qty: 1 }],
    total: 150,
  });
  await done;
  legacy.close();
  assert.deepEqual(await listProducts(), [product]);
  const db = await openDatabase();
  assert.equal(db.version, 2);
  assert.equal(db.objectStoreNames.contains("waste"), true);
  db.close();
  assert.equal((await listSales(0))[0].total, 150);
  assert.equal((await checkout("new-sale", [{ ...product, qty: 2 }], "TRANSFERENCIA")).total, 300);
  assert.equal((await listProducts())[0].stock, 1);
});
