"use client";
import { useRef, useState, type FormEvent } from "react";
import { isWeight, kilogramsToGrams, quantityLabel, type Product } from "@/entities/product";
import { money } from "@/shared/lib/money";
import { addStock } from "./stock";
import { Modal } from "@/shared/ui/modal";

export function StockReceipt({
  product,
  onClose,
  onSaved,
}: {
  product: Product;
  onClose: () => void;
  onSaved: (product: Product) => Promise<void>;
}) {
  const [units, setUnits] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const updated = await addStock(
        product.ean,
        isWeight(product) ? kilogramsToGrams(units) : units,
      );
      await onSaved(updated);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo agregar stock.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Agregar stock"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form
        className="form-stack"
        onSubmit={submit}
      >
        <div>
          <h3>{product.nombre}</h3>
          <p className="muted">
            {quantityLabel(product.stock, product)} disponibles · {money(product.precioVenta)}{" "}
            {isWeight(product) ? "/kg" : "c/u"}
          </p>
        </div>
        <label>
          {isWeight(product) ? "Kilos a agregar" : "Unidades a agregar"}
          <input
            autoFocus
            required
            type="number"
            min={isWeight(product) ? "0.001" : "1"}
            step={isWeight(product) ? "0.001" : "1"}
            inputMode="decimal"
            value={Number.isFinite(units) ? units : ""}
            onChange={(event) => setUnits(event.target.valueAsNumber)}
          />
        </label>
        <p className="hint">
          Se suman al stock actual. El nombre, el costo y el precio se conservan.
        </p>
        {error && (
          <p
            className="error"
            role="alert"
          >
            {error}
          </p>
        )}
        <button
          className="primary"
          disabled={busy}
        >
          {busy ? "Guardando…" : "Confirmar ingreso"}
        </button>
      </form>
    </Modal>
  );
}
