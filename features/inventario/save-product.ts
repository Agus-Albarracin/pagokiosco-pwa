import { validateProduct, type Product } from "@/entities/product";
import { openDatabase, requestValue, transactionDone } from "@/infrastructure/indexeddb";
// Read and write share a transaction, so concurrent tabs cannot lose stock.
export async function saveProduct(input: Product, editing: boolean, incoming: number) {
  validateProduct(input);
  if (!Number.isSafeInteger(incoming) || incoming < 0)
    throw new Error("El ingreso debe ser un número entero no negativo.");
  const db = await openDatabase();
  const tx = db.transaction("products", "readwrite");
  const done = transactionDone(tx);
  try {
    const store = tx.objectStore("products");
    const current = await requestValue<Product | undefined>(store.get(input.ean));
    if (!editing && current)
      throw new Error("Este código ya existe. Usá Agregar stock para reponer unidades.");
    if (editing && !current) throw new Error("El producto ya no existe.");
    const unidadVenta = input.unidadVenta ?? current?.unidadVenta ?? "unidad";
    if (current && unidadVenta !== (current.unidadVenta ?? "unidad"))
      throw new Error("No se puede cambiar el tipo de venta de un producto existente.");
    const product: Product = {
      unidadVenta,
      ean: input.ean,
      nombre: input.nombre.trim(),
      marca: input.marca?.trim() ?? current?.marca ?? "",
      costo: input.costo,
      margen: input.margen,
      precioVenta: input.precioVenta,
      stock: (current?.stock ?? 0) + incoming,
      updatedAt: new Date().toISOString(),
    };
    validateProduct(product);
    store.put(product);
    await done;
  } catch (error) {
    try {
      tx.abort();
    } catch {
      /* already completed */
    }
    await done.catch(() => {});
    throw error;
  } finally {
    db.close();
  }
}
