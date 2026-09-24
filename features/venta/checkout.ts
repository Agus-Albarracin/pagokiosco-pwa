import { cents } from "@/shared/lib/money";
import { isWeight, type Product } from "@/entities/product";
import { lineCents, type CartLine, type PaymentMethod, type Sale } from "@/entities/sale";
import { openDatabase, requestValue, transactionDone } from "@/infrastructure/indexeddb";
export async function checkout(
  id: string,
  lines: CartLine[],
  method: PaymentMethod,
): Promise<Sale> {
  if (!id || !lines.length || !["EFECTIVO", "TRANSFERENCIA"].includes(method))
    throw new Error("Elegí productos y un medio de pago.");
  if (new Set(lines.map((line) => line.ean)).size !== lines.length)
    throw new Error("El carrito contiene códigos repetidos.");
  for (const line of lines) {
    if (line.unidadVenta !== undefined && !["unidad", "peso"].includes(line.unidadVenta))
      throw new Error("Tipo de venta inválido.");
    if (line.custom_amount && isWeight(line)) throw new Error("Un importe libre no admite peso.");
    if (
      !Number.isSafeInteger(line.qty) ||
      line.qty <= 0 ||
      !Number.isFinite(line.precioVenta) ||
      line.precioVenta <= 0 ||
      line.precioVenta > 100_000_000
    )
      throw new Error("Revisá las cantidades y los importes.");
  }
  const db = await openDatabase();
  const tx = db.transaction(["products", "sales"], "readwrite");
  const done = transactionDone(tx);
  try {
    const sales = tx.objectStore("sales");
    const existing = await requestValue<Sale | undefined>(sales.get(id));
    if (existing) {
      await done;
      return existing;
    }
    const products = tx.objectStore("products");
    const confirmed: CartLine[] = [];
    for (const line of lines) {
      if (line.custom_amount) {
        if (!line.ean.startsWith("CUSTOM-")) throw new Error("Importe libre inválido.");
        confirmed.push({
          ean: line.ean,
          nombre: "Importe libre",
          precioVenta: cents(line.precioVenta) / 100,
          qty: line.qty,
          custom_amount: true,
        });
        continue;
      }
      const product = await requestValue<Product | undefined>(products.get(line.ean));
      if (!product || product.stock < line.qty)
        throw new Error(`Stock insuficiente de ${line.nombre}. Revisá el carrito.`);
      if (isWeight(product) !== isWeight(line))
        throw new Error("El tipo de venta no coincide con el producto.");
      if (cents(product.precioVenta) !== cents(line.precioVenta))
        throw new Error(`Cambió el precio de ${product.nombre}. Quitalo y volvé a agregarlo.`);
      products.put({
        ...product,
        stock: product.stock - line.qty,
        updatedAt: new Date().toISOString(),
      });
      confirmed.push({
        ean: product.ean,
        nombre: product.nombre,
        precioVenta: product.precioVenta,
        qty: line.qty,
        unidadVenta: product.unidadVenta ?? "unidad",
      });
    }
    const totalCents = confirmed.reduce((sum, line) => sum + lineCents(line), 0);
    if (!Number.isSafeInteger(totalCents) || totalCents <= 0)
      throw new Error("El total no es válido.");
    const sale: Sale = {
      id,
      createdAt: Date.now(),
      method,
      lines: confirmed,
      total: totalCents / 100,
    };
    sales.add(sale);
    await done;
    return sale;
  } catch (error) {
    try {
      tx.abort();
    } catch {
      /* already aborted */
    }
    await done.catch(() => {});
    throw error;
  } finally {
    db.close();
  }
}
