"use client";
import { useRef, useState, type FormEvent } from "react";
import { quantityLabel, type Product } from "@/lib/domain";
import { recordWaste } from "@/lib/stock";
import { Modal } from "./modal";

export function WasteForm({ product, onClose, onSaved }: {
  product: Product; onClose: () => void; onSaved: (product: Product) => Promise<void>;
}) {
  const [grams, setGrams] = useState(0);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const id = useRef("");
  async function submit(event: FormEvent) {
    event.preventDefault(); if (lock.current) return;
    lock.current = true; setBusy(true); setError("");
    id.current ||= crypto.randomUUID();
    try { const updated = await recordWaste(id.current, product.ean, grams, reason); await onSaved(updated); onClose(); }
    catch (error) { setError(error instanceof Error ? error.message : "No se pudo registrar la merma."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <Modal title="Registrar merma" onClose={() => { if (!busy) onClose(); }}><form className="form-stack" onSubmit={submit}>
    <h3>{product.nombre}</h3><p className="muted">Stock: {quantityLabel(product.stock, product)}</p>
    <label>Merma (g)<input autoFocus disabled={busy} required type="number" inputMode="numeric" min="1" max={product.stock} step="1" value={Number.isFinite(grams) ? grams : ""} onChange={event => setGrams(event.target.valueAsNumber)} /></label>
    <label>Motivo<input required disabled={busy} maxLength={120} placeholder="Ej. Recortes o corteza" value={reason} onChange={event => setReason(event.target.value)} /></label>
    <p className="hint">Se descontará este peso del stock. Se guarda el motivo y la fecha, sin registrar una venta ni ingresos en caja.</p>
    {error && <p role="alert" className="error">{error}</p>}
    <button className="primary" disabled={busy}>{busy ? "Guardando…" : "Confirmar merma"}</button>
  </form></Modal>;
}
