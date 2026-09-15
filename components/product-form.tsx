"use client";
import { useState, type FormEvent } from "react";
import { marginFromPrice, money, priceFromMargin, type Product } from "@/lib/domain";
import { saveProduct } from "@/lib/storage";
import { Modal } from "./modal";
export function ProductForm({ product, onClose, onSaved }: {
  product?: Product; onClose: () => void; onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(product?.nombre ?? "");
  const [brand, setBrand] = useState(product?.marca ?? "");
  const [cost, setCost] = useState(product?.costo ?? 0);
  const [margin, setMargin] = useState(() => {
    if (product) return product.margen;
    try { const saved = localStorage.getItem("app_config.default_margin"); const n = saved === null ? 40 : Number(saved); return Number.isFinite(n) && n >= 0 ? n : 40; } catch { return 40; }
  });
  const [price, setPrice] = useState(product?.precioVenta ?? 0);
  const [incoming, setIncoming] = useState(0);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError("");
    try {
      await saveProduct({ ean: product?.ean ?? `SKU-${crypto.randomUUID()}`, nombre: name, marca: brand, costo: cost, margen: margin, precioVenta: price, stock: product?.stock ?? 0, updatedAt: "" }, !!product, incoming);
      if (remember) { try { localStorage.setItem("app_config.default_margin", String(margin)); } catch { /* Product remains saved if preferences are unavailable. */ } }
      await onSaved(); onClose();
    } catch (error) { setError(error instanceof Error ? error.message : "No se pudo guardar."); }
    finally { setBusy(false); }
  }
  return <Modal title={product ? "Editar producto" : "Nuevo producto"} onClose={() => { if (!busy) onClose(); }}>
    <form onSubmit={submit} className="form-stack">
      <label>Nombre<input required maxLength={120} value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Alfajor de chocolate" /></label>
      <label>Marca <span className="muted">(opcional)</span><input maxLength={80} value={brand} onChange={e => setBrand(e.target.value)} placeholder="Ej. Águila" /></label>
      <div className="two-columns">
        <label>Costo ($)<input required type="number" min="0" max="100000000" step="0.01" value={Number.isFinite(cost) ? cost : ""} onChange={e => { const n = e.target.valueAsNumber; setCost(n); setPrice(priceFromMargin(n, margin)); }} /></label>
        <label>Margen (%)<input required type="number" min="0" step="0.1" value={Number.isFinite(margin) ? Number(margin.toFixed(1)) : ""} onChange={e => { const n = e.target.valueAsNumber; setMargin(n); setPrice(priceFromMargin(cost, n)); }} /></label>
      </div>
      <div className="presets" aria-label="Márgenes rápidos">{[30, 40, 50, 60, 100].map(n => <button type="button" key={n} aria-pressed={margin === n} onClick={() => { setMargin(n); setPrice(priceFromMargin(cost, n)); }}>{n}%</button>)}</div>
      <label>Precio de venta ($)<input required type="number" min="0.01" max="100000000" step="0.01" value={Number.isFinite(price) ? price : ""} onChange={e => { const n = e.target.valueAsNumber; setPrice(n); setMargin(Number(marginFromPrice(cost, n).toFixed(1))); }} /></label>
      <p className="hint">Con costo y margen redondeamos hacia arriba a $50. Si cambiás el precio, recalculamos el margen.{cost === 0 ? " Con costo cero el margen inverso es 0%." : ""}</p>
      {product ? <p className="hint">Stock actual: {product.stock} unidades. Para reponer, usá la sección Agregar stock.</p> :
        <label>Stock inicial<input required type="number" min="0" step="1" value={Number.isFinite(incoming) ? incoming : ""} onChange={e => setIncoming(e.target.valueAsNumber)} /></label>}
      <label className="check"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />Usar este margen para nuevos productos</label>
      {error && <p role="alert" className="error">{error}</p>}
      <button className="primary" disabled={busy}>{busy ? "Guardando…" : `Guardar producto · ${money(price || 0)}`}</button>
    </form>
  </Modal>;
}
