"use client";
import { useState } from "react";
import { lineCents, money, type Product } from "@/lib/domain";
import { Modal } from "./modal";

export function WeightPicker({
  product,
  available,
  initial = 100,
  onClose,
  onConfirm,
}: {
  product: Product;
  available: number;
  initial?: number;
  onClose: () => void;
  onConfirm: (grams: number) => void;
}) {
  const [grams, setGrams] = useState(initial);
  const valid = Number.isSafeInteger(grams) && grams > 0 && grams <= available;
  return (
    <Modal
      title="Elegir peso"
      onClose={onClose}
    >
      <form
        className="form-stack"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) {
            onConfirm(grams);
            onClose();
          }
        }}
      >
        <h3>{product.nombre}</h3>
        <p className="muted">
          {money(product.precioVenta)} /kg · {available} g disponibles
        </p>
        <div
          className="presets"
          aria-label="Pesos rápidos"
        >
          {[100, 200, 300].map((value) => (
            <button
              type="button"
              key={value}
              disabled={value > available}
              aria-pressed={grams === value}
              onClick={() => setGrams(value)}
            >
              {value} g
            </button>
          ))}
        </div>
        <label>
          Peso exacto (g)
          <input
            autoFocus
            required
            type="number"
            inputMode="numeric"
            min="1"
            max={available}
            step="1"
            value={Number.isFinite(grams) ? grams : ""}
            onChange={(event) => setGrams(event.target.valueAsNumber)}
          />
        </label>
        <p className="hint">
          Ingresá el peso que indica la balanza. El stock se descuenta al confirmar la venta.
        </p>
        {!valid && (
          <p
            role="status"
            className="error"
          >
            Ingresá gramos enteros entre 1 y {available}.
          </p>
        )}
        <button
          className="primary"
          disabled={!valid}
        >
          Confirmar peso{valid ? ` · ${money(lineCents({ ...product, qty: grams }) / 100)}` : ""}
        </button>
      </form>
    </Modal>
  );
}
