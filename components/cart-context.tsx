"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { type CartLine, type Product } from "@/lib/domain";
type Cart = { lines: CartLine[]; add: (p: Product) => void; custom: (amount: number) => void; change: (ean: string, delta: number) => void; clear: () => void };
const Context = createContext<Cart | null>(null);
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  function add(p: Product) {
    setLines(current => {
      const existing = current.find(line => line.ean === p.ean);
      if ((existing?.qty ?? 0) >= p.stock) return current;
      return existing ? current.map(line => line.ean === p.ean ? { ...line, qty: line.qty + 1 } : line) : [...current, { ean: p.ean, nombre: p.nombre, precioVenta: p.precioVenta, qty: 1 }];
    });
  }
  return <Context.Provider value={{ lines, add,
    custom: amount => { if (Number.isFinite(amount) && amount > 0 && amount <= 100_000_000) setLines(current => [...current, { ean: `CUSTOM-${crypto.randomUUID()}`, nombre: "Importe libre", precioVenta: Math.round(amount * 100) / 100, qty: 1, custom_amount: true }]); },
    change: (ean, delta) => setLines(current => current.map(line => line.ean === ean ? { ...line, qty: line.qty + delta } : line).filter(line => line.qty > 0)),
    clear: () => setLines([]),
  }}>{children}</Context.Provider>;
}
export function useCart() { const cart = useContext(Context); if (!cart) throw new Error("CartProvider missing"); return cart; }
