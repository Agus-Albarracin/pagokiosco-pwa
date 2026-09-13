"use client";
import { useState, type FormEvent } from "react";
import { marginFromPrice, money, priceFromMargin, type Product } from "@/lib/domain";
import { saveProduct } from "@/lib/storage";
import { Modal } from "./modal";
export function ProductForm({ product, initialEan = "", initialName = "", onClose, onSaved }: {
  product?: Product; initialEan?: string; initialName?: string; onClose: () => void; onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(product?.nombre ?? initialName);
  const [ean, setEan] = useState(product?.ean ?? initialEan);
  const [cost, setCost] = useState(product?.costo ?? 0);
  const [margin, setMargin] = useState(() => {
    if (product) return product.margen;
    try { const saved = localStorage.getItem("app_config.default_margin"); const n = saved === null ? 40 : Number(saved); return Number.isFinite(n) && n >= 0 ? n : 40; } catch { return 40; }
  });
  const [price, setPrice] = useState(product?.precioVenta ?? 0);
  const [incoming, setIncoming] = useState(initialEan && !product ? 1 : 0);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError("");
    try {
      if (ean && !/^\d{8}$|^\d{13}$|^SKU-[\w-]+$/.test(ean)) throw new Error("Usá un EAN de 8 o 13 dígitos, o dejá el código vacío.");
      await saveProduct({ ean: ean || `SKU-${crypto.randomUUID()}`, nombre: name, costo: cost, margen: margin, precioVenta: price, stock: product?.stock ?? 0, updatedAt: "" }, !!product, incoming);
      if (remember) { try { localStorage.setItem("app_config.default_margin", String(margin)); } catch { /* Product remains saved if preferences are unavailable. */ } }
      await onSaved(); onClose();
    } catch (error) { setError(error instanceof Error ? error.message : "No se pudo guardar."); }
    finally { setBusy(false); }
  }
  return <Modal title={product ? "Editar producto" : "Nuevo producto"} onClose={() => { if (!busy) onClose(); }}>
    <form onSubmit={submit} className="form-stack">
      {!product && initialEan && <p className="hint">{initialName ? "Producto identificado. Revisá el nombre y completá costo, precio y stock." : "El código está listo. Completá el nombre para guardar el producto."}</p>}
      <label>Nombre<input required maxLength={120} value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Alfajor de chocolate" /></label>
      <label>Código de barras <span className="muted">(opcional)</span><input inputMode="numeric" value={ean} disabled={!!product} onChange={e => setEan(e.target.value.trim())} placeholder="Sin código: creamos un SKU interno" /></label>
      <div className="two-columns">
        <label>Costo ($)<input required type="number" min="0" max="100000000" step="0.01" value={Number.isFinite(cost) ? cost : ""} onChange={e => { const n = e.target.valueAsNumber; setCost(n); setPrice(priceFromMargin(n, margin)); }} /></label>
        <label>Margen (%)<input required type="number" min="0" step="0.1" value={Number.isFinite(margin) ? Number(margin.toFixed(1)) : ""} onChange={e => { const n = e.target.valueAsNumber; setMargin(n); setPrice(priceFromMargin(cost, n)); }} /></label>
      </div>
      <div className="presets" aria-label="Márgenes rápidos">{[30, 40, 50, 60, 100].map(n => <button type="button" key={n} aria-pressed={margin === n} onClick={() => { setMargin(n); setPrice(priceFromMargin(cost, n)); }}>{n}%</button>)}</div>
      <label>Precio de venta ($)<input required type="number" min="0.01" max="100000000" step="0.01" value={Number.isFinite(price) ? price : ""} onChange={e => { const n = e.target.valueAsNumber; setPrice(n); setMargin(Number(marginFromPrice(cost, n).toFixed(1))); }} /></label>
      <p className="hint">Con costo y margen redondeamos hacia arriba a $50. Si cambiás el precio, recalculamos el margen.{cost === 0 ? " Con costo cero el margen inverso es 0%." : ""}</p>
      <label>{product ? `Ingresar unidades · stock actual: ${product.stock}` : "Stock inicial"}<input required type="number" min="0" step="1" value={Number.isFinite(incoming) ? incoming : ""} onChange={e => setIncoming(e.target.valueAsNumber)} /></label>
      <label className="check"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />Usar este margen para nuevos productos</label>
      {error && <p role="alert" className="error">{error}</p>}
      <button className="primary" disabled={busy}>{busy ? "Guardando…" : `Guardar producto · ${money(price || 0)}`}</button>
    </form>
  </Modal>;
}
