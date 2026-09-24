import { isWeight, type SaleUnit } from "@/entities/product";
import { cents } from "@/shared/lib/money";
export type CartLine = {
  ean: string;
  nombre: string;
  precioVenta: number;
  qty: number;
  unidadVenta?: SaleUnit;
  custom_amount?: true;
};

export const lineCents = (line: CartLine) =>
  Math.round((cents(line.precioVenta) * line.qty) / (isWeight(line) ? 1000 : 1));

export type PaymentMethod = "EFECTIVO" | "TRANSFERENCIA";

export type Sale = {
  id: string;
  createdAt: number;
  method: PaymentMethod;
  lines: CartLine[];
  total: number;
};
