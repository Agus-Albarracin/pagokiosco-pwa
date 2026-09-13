"use client";
import { useState } from "react";
import type { Product } from "@/lib/domain";

export function StockEntry({ products, disabled, onScan, onManual, onSelect, onEdit }: {
  products: Product[]; disabled: boolean; onScan: () => void; onManual: () => void;
  onSelect: (product: Product) => void;
  onEdit: (product: Product) => void;
}) {
  const [query, setQuery] = useState("");
  const term = query.trim().toLocaleLowerCase();
  const matches = term ? products.filter(product =>
    (product.nombre + " " + product.ean).toLocaleLowerCase().includes(term)) : [];
  return <div className="stock-entry">
    <section className="panel scan-entry" aria-labelledby="scan-entry-title">
      <span className="scan-symbol" aria-hidden="true">▥</span>
      <p className="eyebrow">INGRESO DE MERCADERÍA</p>
      <h2 id="scan-entry-title">Empezá por el código de barras</h2>
      <p className="muted">Escaneá el producto y elegí cuántas unidades sumar. Si es nuevo, buscamos su nombre para que completes el precio.</p>
      <button className="primary" onClick={onScan} disabled={disabled}>Escanear producto</button>
      <button className="quiet" onClick={onManual} disabled={disabled}>Crear producto sin código</button>
      <p className="hint">El stock se guarda cuando confirmás el ingreso.</p>
    </section>
    <section className="panel" aria-labelledby="stock-search-title">
      <h2 id="stock-search-title">Reponer sin cámara</h2>
      <p className="muted stock-search-description">Buscá un producto que ya tengas en el catálogo.</p>
      <label className="search-label">Buscar producto para reponer
        <input type="search" placeholder="Nombre o código…" value={query} onChange={event => setQuery(event.target.value)} disabled={disabled} />
      </label>
      {term ? <>
        <p role="status" className="hint">{matches.length ? matches.length + " productos encontrados" : "No encontramos ese producto. Podés darlo de alta con las opciones de arriba."}</p>
        <div className="product-list">{matches.map(product => <div className="product-row" key={product.ean}>
          <div className="product-name"><strong>{product.nombre}</strong><small>Stock actual: {product.stock} unidades</small></div>
          <button aria-label={"Agregar stock a " + product.nombre} onClick={() => onSelect(product)} disabled={disabled}>Agregar stock</button>
          <button className="quiet" aria-label={"Editar " + product.nombre} onClick={() => onEdit(product)} disabled={disabled}>Editar datos</button>
        </div>)}</div>
      </> : <p className="hint">También sirve para productos sueltos o sin código de barras.</p>}
    </section>
  </div>;
}
