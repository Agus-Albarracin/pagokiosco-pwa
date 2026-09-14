export type Product = {
  ean: string; nombre: string; marca?: string; costo: number; margen: number;
  precioVenta: number; stock: number; updatedAt: string;
};
export type CartLine = { ean: string; nombre: string; precioVenta: number; qty: number; custom_amount?: true };
export type PaymentMethod = "EFECTIVO" | "TRANSFERENCIA";
export type Sale = { id: string; createdAt: number; method: PaymentMethod; lines: CartLine[]; total: number };
export const money = (value: number) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(value);
export const priceFromMargin = (cost: number, margin: number) => Math.ceil((cost * (1 + margin / 100) - 1e-9) / 50) * 50;
export const marginFromPrice = (cost: number, price: number) => cost > 0 ? (price - cost) / cost * 100 : 0;
export const cents = (value: number) => Math.round(value * 100);
export function validateProduct(product: Product) {
  if (!product.ean.trim() || !product.nombre.trim() || product.nombre.length > 120) throw new Error("Ingresá un nombre y un código válidos.");
  if (product.marca !== undefined && (typeof product.marca !== "string" || product.marca.length > 80)) throw new Error("La marca debe tener hasta 80 caracteres.");
  if (![product.costo, product.margen, product.precioVenta, product.stock].every(Number.isFinite)) throw new Error("Revisá los valores numéricos.");
  if (product.costo < 0 || product.margen < 0 || product.precioVenta <= 0 || product.stock < 0 || !Number.isSafeInteger(product.stock)) throw new Error("Precio positivo, costo y margen no negativos, y stock entero son obligatorios.");
  if (product.precioVenta > 100_000_000 || product.costo > 100_000_000) throw new Error("El importe supera el máximo admitido.");
}
export function summarize(sales: Sale[]) {
  const cash = sales.filter(s => s.method === "EFECTIVO").reduce((sum, s) => sum + cents(s.total), 0) / 100;
  const transfer = sales.filter(s => s.method === "TRANSFERENCIA").reduce((sum, s) => sum + cents(s.total), 0) / 100;
  return { cash, transfer, total: (cents(cash) + cents(transfer)) / 100, count: sales.length };
}
