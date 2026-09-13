"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { money, type Product } from "@/lib/domain";
import { listProducts } from "@/lib/storage";
import { ProductForm } from "./product-form";
import { Lookup } from "./lookup";
import { CartProvider, useCart } from "./cart-context";
import { Pos } from "./pos";
import { Cashbook } from "./cashbook";
export function Kiosk() {
  return <CartProvider><Workspace /></CartProvider>;
}
function Workspace() {
  const cart = useCart();
  const [view, setView] = useState<"venta" | "inventario" | "caja">("venta");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<Product | "new" | null>(null);
  const [lookup, setLookup] = useState(false);
  const [draft, setDraft] = useState({ ean: "", name: "" });
  const refresh = useCallback(() => listProducts()
    .then(result => { setProducts(result); setError(""); })
    .catch(() => { setError("No pudimos abrir tus datos. Revisá el almacenamiento del navegador y reintentá."); })
    .finally(() => setLoading(false)), []);
  useEffect(() => { void refresh(); const focus = () => { void refresh(); }; window.addEventListener("focus", focus); return () => window.removeEventListener("focus", focus); }, [refresh]);
  const filtered = products.filter(p => `${p.nombre} ${p.ean}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <div className="app-shell">
    <aside className="sidebar"><Link href="/" className="brand"><span className="brand-mark">pk</span>PagoKiosco<span className="badge">MVP</span></Link><p className="sidebar-caption">TU NEGOCIO, AL DÍA</p><nav aria-label="Principal"><button className={view === "venta" ? "nav-active" : ""} aria-current={view === "venta" ? "page" : undefined} onClick={() => setView("venta")}>＋ &nbsp; Vender</button><button className={view === "inventario" ? "nav-active" : ""} aria-current={view === "inventario" ? "page" : undefined} onClick={() => setView("inventario")}>▦ &nbsp; Inventario</button><button className={view === "caja" ? "nav-active" : ""} aria-current={view === "caja" ? "page" : undefined} onClick={() => setView("caja")}>↗ &nbsp; Caja</button></nav><p className="sidebar-foot">Hecho para tu mostrador.<br />Tus datos quedan en este dispositivo.</p></aside>
    <main id="main"><header className="topbar"><span>Mi kiosco <span className="muted">/ {view === "venta" ? "Punto de venta" : view === "caja" ? "Caja y métricas" : "Inventario"}</span></span><span className="pill">● &nbsp; Guardado local</span></header>
      <div className="page-heading"><div><p className="eyebrow">{view === "venta" ? "UN BUEN DÍA PARA VENDER" : "TODO EN SU LUGAR"}</p><h1>{view === "venta" ? "Tu mostrador" : view === "caja" ? "Tu caja, en claro" : "Tu inventario"}</h1><p className="muted">{view === "venta" ? "Cada venta, simple. Tu negocio, al día." : "Productos y precios listos para vender."}</p></div><button className="primary" onClick={() => setEditor("new")} disabled={loading || !!error}>＋ Nuevo producto</button></div>
      {view === "venta" && <Pos products={products} onScan={() => setLookup(true)} onRefresh={refresh} disabled={loading || !!error} />}
      {view === "caja" && <Cashbook />}{view === "inventario" && <>
      <section className="stats" aria-label="Resumen del inventario"><article><span>Productos</span><strong>{products.length}</strong></article><article><span>Unidades disponibles</span><strong>{products.reduce((sum, p) => sum + p.stock, 0)}</strong></article><article><span>Con stock bajo</span><strong>{products.filter(p => p.stock <= 5).length}</strong><small>5 unidades o menos</small></article></section>
      {error && <div role="alert" className="error">{error}<button onClick={refresh}>Reintentar</button></div>}
      <section className="panel"><div className="section-head"><h2>Catálogo</h2><button onClick={() => setLookup(true)} disabled={loading || !!error}>▥ Escanear código</button></div><label className="search-label"><span className="sr-only">Buscar producto</span><input type="search" placeholder="Buscar por nombre o código…" value={query} onChange={e => setQuery(e.target.value)} /></label>
      {loading ? <p role="status" className="empty">Cargando tu inventario…</p> : filtered.length ? <div className="product-list">{filtered.map(p => <div className="product-row" key={p.ean}><span className="product-avatar">{p.nombre.slice(0, 2).toUpperCase()}</span><div className="product-name"><strong>{p.nombre}</strong><small>{p.ean.startsWith("SKU-") ? "Sin código de barras" : p.ean}</small></div><span className={p.stock <= 5 ? "stock low" : "stock"}>{p.stock} u.</span><strong>{money(p.precioVenta)}</strong><button aria-label={`Editar ${p.nombre}`} onClick={() => setEditor(p)}>Editar</button></div>)}</div> : <div className="empty"><span className="empty-symbol">▦</span><h3>{query ? "No encontramos ese producto" : "Tu primer producto empieza acá"}</h3><p>{query ? "Probá con otro nombre o código." : "Cargá el costo, elegí tu margen y dejá listo el precio."}</p>{!query && <button onClick={() => setEditor("new")} disabled={!!error}>＋ Agregar producto</button>}</div>}
      </section></>}{view === "venta" && error && <div role="alert" className="error">{error}<button onClick={refresh}>Reintentar</button></div>}<p className="footer-note">PagoKiosco registra tus operaciones. No procesa pagos.</p>
    </main>{editor && <ProductForm product={editor === "new" ? undefined : editor} initialEan={draft.ean} initialName={draft.name} onClose={() => { setEditor(null); setDraft({ ean: "", name: "" }); }} onSaved={refresh} />}
    {lookup && <Lookup products={products} onClose={() => setLookup(false)} onFound={p => { setLookup(false); if (view === "venta") cart.add(p); else setEditor(p); }} onCreate={(ean, name) => { setLookup(false); setDraft({ ean, name }); setEditor("new"); }} />}
  </div>;
}
