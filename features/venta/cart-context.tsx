"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { type CartLine } from "@/entities/sale";
import { type Product } from "@/entities/product";
type Cart = {
  lines: CartLine[];
  add: (p: Product, qty?: number) => void;
  custom: (amount: number) => void;
  change: (ean: string, delta: number) => void;
  clear: () => void;
};
const Context = createContext<Cart | null>(null);
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  function add(p: Product, qty = 1) {
    setLines((current) => {
      const existing = current.find((line) => line.ean === p.ean);
      if (!Number.isSafeInteger(qty) || qty <= 0 || (existing?.qty ?? 0) + qty > p.stock)
        return current;
      return existing
        ? current.map((line) => (line.ean === p.ean ? { ...line, qty: line.qty + qty } : line))
        : [
            ...current,
            {
              ean: p.ean,
              nombre: p.nombre,
              precioVenta: p.precioVenta,
              unidadVenta: p.unidadVenta,
              qty,
            },
          ];
    });
  }
  return (
    <Context.Provider
      value={{
        lines,
        add,
        custom: (amount) => {
          if (Number.isFinite(amount) && amount > 0 && amount <= 100_000_000)
            setLines((current) => [
              ...current,
              {
                ean: `CUSTOM-${crypto.randomUUID()}`,
                nombre: "Importe libre",
                precioVenta: Math.round(amount * 100) / 100,
                qty: 1,
                custom_amount: true,
              },
            ]);
        },
        change: (ean, delta) =>
          setLines((current) =>
            current
              .map((line) => (line.ean === ean ? { ...line, qty: line.qty + delta } : line))
              .filter((line) => line.qty > 0),
          ),
        clear: () => setLines([]),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useCart() {
  const cart = useContext(Context);
  if (!cart) throw new Error("CartProvider missing");
  return cart;
}
