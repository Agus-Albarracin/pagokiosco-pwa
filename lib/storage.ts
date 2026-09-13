import { validateProduct, type Product } from "./domain";

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("pagokiosco", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore("products", { keyPath: "ean" });
      const sales = db.createObjectStore("sales", { keyPath: "id" });
      sales.createIndex("createdAt", "createdAt");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("No se pudo abrir el almacenamiento local."));
    request.onblocked = () => reject(new Error("Cerrá otras pestañas de PagoKiosco y volvé a intentar."));
  });
}
export function requestValue<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export function transactionDone(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error ?? new Error("No se guardaron los cambios. Volvé a intentar."));
    tx.onerror = () => reject(tx.error);
  });
}
export async function listProducts(): Promise<Product[]> {
  const db = await openDatabase();
  try { return (await requestValue<Product[]>(db.transaction("products").objectStore("products").getAll())).sort((a, b) => a.nombre.localeCompare(b.nombre)); }
  finally { db.close(); }
}
// Read and write share a transaction, so concurrent tabs cannot lose stock.
export async function saveProduct(input: Product, editing: boolean, incoming: number) {
  validateProduct(input);
  if (!Number.isSafeInteger(incoming) || incoming < 0) throw new Error("El ingreso debe ser un número entero no negativo.");
  const db = await openDatabase();
  const tx = db.transaction("products", "readwrite");
  const done = transactionDone(tx);
  try {
    const store = tx.objectStore("products");
    const current = await requestValue<Product | undefined>(store.get(input.ean));
    if (!editing && current) throw new Error("Este código ya existe. Editá el producto para ingresar stock.");
    if (editing && !current) throw new Error("El producto ya no existe.");
    const product: Product = {
      ean: input.ean, nombre: input.nombre.trim(), costo: input.costo, margen: input.margen,
      precioVenta: input.precioVenta, stock: (current?.stock ?? 0) + incoming, updatedAt: new Date().toISOString(),
    };
    validateProduct(product);
    store.put(product);
    await done;
  } catch (error) {
    try { tx.abort(); } catch { /* already completed */ }
    await done.catch(() => {});
    throw error;
  } finally { db.close(); }
}
