"use client";
import { useState } from "react";
import { money, type Product } from "@/lib/domain";

export function Catalog({ products, loading }: {
  products: Product[]; loading: boolean;
}) {
  const [query, setQuery] = useState("");
  const filtered = products.filter(product =>
    (product.nombre + " " + product.ean).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return <>
    <section className="stats" aria-label="Resumen del catálogo">
      <article><span>Productos</span><strong>{products.length}</strong></article>
      <article><span>Unidades disponibles</span><strong>{products.reduce((sum, product) => sum + product.stock, 0)}</strong></article>
      <article><span>Con stock bajo</span><strong>{products.filter(product => product.stock <= 5).length}</strong><small>5 unidades o menos</small></article>
    </section>
    <section className="panel">
      <div className="section-head"><h2>Tus productos</h2><span className="muted">Precios y existencias</span></div>
      <label className="search-label"><span className="sr-only">Buscar producto</span>
        <input type="search" placeholder="Buscar por nombre o código…" value={query} onChange={event => setQuery(event.target.value)} />
      </label>
      {loading ? <p role="status" className="empty">Cargando tu catálogo…</p> : filtered.length ?
        <div className="product-list">{filtered.map(product => <div className="product-row" key={product.ean}>
          <span className="product-avatar" aria-hidden="true">{product.nombre.slice(0, 2).toUpperCase()}</span>
          <div className="product-name"><strong>{product.nombre}</strong><small>{product.ean.startsWith("SKU-") ? "Sin código de barras" : product.ean}</small></div>
          <span className={product.stock <= 5 ? "stock low" : "stock"}>{product.stock} u.</span>
          <strong>{money(product.precioVenta)}</strong>
        </div>)}</div> :
        <div className="empty">
          <span className="empty-symbol" aria-hidden="true">▦</span>
          <h3>{query ? "No encontramos ese producto" : "Todavía no hay productos"}</h3>
          <p>{query ? "Probá con otro nombre o código." : "Los productos que cargues desde Agregar stock aparecerán acá."}</p>
        </div>}
    </section>
  </>;
}
