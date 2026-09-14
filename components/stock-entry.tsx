"use client";
import { useMemo, useState } from "react";
import type { Product } from "@/lib/domain";
import { createProductSearch } from "@/lib/product-search";

export function StockEntry({ products, disabled, onCreate, onSelect, onEdit }: {
  products: Product[]; disabled: boolean; onCreate: () => void;
  onSelect: (product: Product) => void;
  onEdit: (product: Product) => void;
}) {
  const [query, setQuery] = useState("");
  const search = useMemo(() => createProductSearch(products), [products]);
  const matches = search(query);
  return <div className="stock-entry">
    <section className="panel" aria-labelledby="stock-search-title">
      <h2 id="stock-search-title">Buscá la mercadería</h2>
      <p className="muted stock-search-description">Encontrá un producto por marca o nombre y elegí cuántas unidades sumar.</p>
      <label className="search-label">Buscar producto para reponer
        <input type="search" placeholder="Buscar por marca o producto…" value={query} onChange={event => setQuery(event.target.value)} disabled={disabled} />
      </label>
        <p role="status" className="hint">{disabled ? "Catálogo no disponible todavía." : matches.length ? matches.length + " productos encontrados" : "No encontramos ese producto. Podés crear uno nuevo."}</p>
        <div className="product-list">{matches.map(product => <div className="product-row" key={product.ean}>
          <div className="product-name"><strong>{product.nombre}</strong>{product.marca && <small>{product.marca}</small>}<small>Stock actual: {product.stock} unidades</small></div>
          <button aria-label={"Agregar stock a " + product.nombre} onClick={() => onSelect(product)} disabled={disabled}>Agregar stock</button>
          <button className="quiet" aria-label={"Editar " + product.nombre} onClick={() => onEdit(product)} disabled={disabled}>Editar datos</button>
        </div>)}</div>
      <p className="hint">El stock se guarda cuando confirmás el ingreso.</p>
      <button onClick={onCreate} disabled={disabled}>Crear producto</button>
    </section>
  </div>;
}
