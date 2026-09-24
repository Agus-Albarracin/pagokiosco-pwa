import type { Product } from "./model";
import { openDatabase, requestValue } from "@/infrastructure/indexeddb";
export async function listProducts(): Promise<Product[]> {
  const db = await openDatabase();
  try {
    return (
      await requestValue<Product[]>(db.transaction("products").objectStore("products").getAll())
    ).sort((a, b) => a.nombre.localeCompare(b.nombre));
  } finally {
    db.close();
  }
}
