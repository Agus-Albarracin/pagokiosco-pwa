import type { Sale } from "@/entities/sale";
import { openDatabase, requestValue } from "@/infrastructure/indexeddb";
export async function listSales(from: number, to = Date.now()): Promise<Sale[]> {
  const db = await openDatabase();
  try {
    const index = db.transaction("sales").objectStore("sales").index("createdAt");
    return await requestValue<Sale[]>(index.getAll(IDBKeyRange.bound(from, to)));
  } finally {
    db.close();
  }
}
