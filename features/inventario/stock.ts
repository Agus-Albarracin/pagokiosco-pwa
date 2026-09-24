import { validateProduct, type Product } from "@/entities/product";
import { openDatabase, requestValue, transactionDone } from "@/infrastructure/indexeddb";

export type WasteRecord = {
  id: string;
  ean: string;
  nombre: string;
  grams: number;
  reason: string;
  createdAt: number;
};
export async function recordWaste(
  id: string,
  ean: string,
  grams: number,
  reason: string,
): Promise<Product> {
  if (
    !id ||
    !Number.isSafeInteger(grams) ||
    grams <= 0 ||
    !reason.trim() ||
    reason.trim().length > 120
  )
    throw new Error("Ingresá gramos enteros mayores a cero y un motivo de hasta 120 caracteres.");
  const db = await openDatabase();
  const tx = db.transaction(["products", "waste"], "readwrite");
  const done = transactionDone(tx);
  try {
    const products = tx.objectStore("products");
    const waste = tx.objectStore("waste");
    const previous = await requestValue<WasteRecord | undefined>(waste.get(id));
    const current = await requestValue<Product | undefined>(products.get(ean));
    if (!current || current.unidadVenta !== "peso")
      throw new Error("Seleccioná un producto vendido por peso.");
    if (previous) {
      if (previous.ean !== ean || previous.grams !== grams || previous.reason !== reason.trim())
        throw new Error("El registro de merma ya existe con otros datos.");
      await done;
      return current;
    }
    if (grams > current.stock) throw new Error("La merma supera el stock disponible.");
    const updated = {
      ...current,
      stock: current.stock - grams,
      updatedAt: new Date().toISOString(),
    };
    validateProduct(updated);
    products.put(updated);
    waste.add({
      id,
      ean,
      nombre: current.nombre,
      grams,
      reason: reason.trim(),
      createdAt: Date.now(),
    } satisfies WasteRecord);
    await done;
    return updated;
  } catch (error) {
    try {
      tx.abort();
    } catch {
      /* already finished */
    }
    await done.catch(() => {});
    throw error;
  } finally {
    db.close();
  }
}

// Replenishment reads the latest record and never overwrites pricing or names.
export async function addStock(ean: string, units: number): Promise<Product> {
  if (!Number.isSafeInteger(units) || units <= 0)
    throw new Error("Ingresá una cantidad entera mayor a cero.");
  const db = await openDatabase();
  const tx = db.transaction("products", "readwrite");
  const done = transactionDone(tx);
  try {
    const store = tx.objectStore("products");
    const current = await requestValue<Product | undefined>(store.get(ean));
    if (!current) throw new Error("El producto ya no está en el catálogo. Volvé a buscarlo.");
    const updated = {
      ...current,
      stock: current.stock + units,
      updatedAt: new Date().toISOString(),
    };
    validateProduct(updated);
    store.put(updated);
    await done;
    return updated;
  } catch (error) {
    try {
      tx.abort();
    } catch {
      /* already finished */
    }
    await done.catch(() => {});
    throw error;
  } finally {
    db.close();
  }
}
