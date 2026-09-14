import { validateProduct, type Product } from "./domain";
import { openDatabase, requestValue, transactionDone } from "./storage";

// Replenishment reads the latest record and never overwrites pricing or names.
export async function addStock(ean: string, units: number): Promise<Product> {
  if (!Number.isSafeInteger(units) || units <= 0) throw new Error("Ingresá una cantidad entera mayor a cero.");
  const db = await openDatabase();
  const tx = db.transaction("products", "readwrite");
  const done = transactionDone(tx);
  try {
    const store = tx.objectStore("products");
    const current = await requestValue<Product | undefined>(store.get(ean));
    if (!current) throw new Error("El producto ya no está en el catálogo. Volvé a buscarlo.");
    const updated = { ...current, stock: current.stock + units, updatedAt: new Date().toISOString() };
    validateProduct(updated);
    store.put(updated);
    await done;
    return updated;
  } catch (error) {
    try { tx.abort(); } catch { /* already finished */ }
    await done.catch(() => {});
    throw error;
  } finally { db.close(); }
}
