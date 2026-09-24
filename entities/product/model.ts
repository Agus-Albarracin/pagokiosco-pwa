export type SaleUnit = "unidad" | "peso";

export type Product = {
  unidadVenta?: SaleUnit;
  ean: string;
  nombre: string;
  marca?: string;
  costo: number;
  margen: number;
  precioVenta: number;
  stock: number;
  updatedAt: string;
};

export const isWeight = (item: { unidadVenta?: SaleUnit }) => item.unidadVenta === "peso";

export const quantityLabel = (qty: number, item: { unidadVenta?: SaleUnit }) =>
  isWeight(item)
    ? `${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 3 }).format(qty / 1000)} kg`
    : `${qty} unidades`;

export function kilogramsToGrams(kg: number): number {
  const grams = Math.round(kg * 1000);
  if (
    !Number.isFinite(kg) ||
    kg < 0 ||
    !Number.isSafeInteger(grams) ||
    Math.abs(kg * 1000 - grams) > 1e-6
  )
    throw new Error("Ingresá kilos con hasta tres decimales.");
  return grams;
}

export function validateProduct(product: Product) {
  if (product.unidadVenta !== undefined && !["unidad", "peso"].includes(product.unidadVenta))
    throw new Error("Tipo de venta inválido.");
  if (!product.ean.trim() || !product.nombre.trim() || product.nombre.length > 120)
    throw new Error("Ingresá un nombre y un código válidos.");
  if (
    product.marca !== undefined &&
    (typeof product.marca !== "string" || product.marca.length > 80)
  )
    throw new Error("La marca debe tener hasta 80 caracteres.");
  if (![product.costo, product.margen, product.precioVenta, product.stock].every(Number.isFinite))
    throw new Error("Revisá los valores numéricos.");
  if (
    product.costo < 0 ||
    product.margen < 0 ||
    product.precioVenta <= 0 ||
    product.stock < 0 ||
    !Number.isSafeInteger(product.stock)
  )
    throw new Error(
      "Precio positivo, costo y margen no negativos, y stock entero son obligatorios.",
    );
  if (product.precioVenta > 100_000_000 || product.costo > 100_000_000)
    throw new Error("El importe supera el máximo admitido.");
}
