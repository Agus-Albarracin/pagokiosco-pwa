"use client";
import { useState } from "react";
import Link from "next/link";
import { CartProvider, Pos } from "@/features/venta";
import { Catalog } from "@/features/catalogo";
import { Cashbook } from "@/features/caja";
import { InventoryWorkspace } from "@/features/inventario";
import { WorkspaceNav, type WorkspaceView } from "./workspace-nav";
import { useProducts } from "../_hooks/use-products";

const headings = {
  venta: {
    breadcrumb: "Punto de venta",
    eyebrow: "UN BUEN DÍA PARA VENDER",
    title: "Tu mostrador",
    description: "Cada venta, simple. Tu negocio, al día.",
  },
  catalogo: {
    breadcrumb: "Catálogo",
    eyebrow: "TODO EN SU LUGAR",
    title: "Tu catálogo",
    description: "Consultá precios y disponibilidad de tus productos.",
  },
  stock: {
    breadcrumb: "Agregar stock",
    eyebrow: "MERCADERÍA LISTA PARA VENDER",
    title: "Agregar stock",
    description: "Buscá por marca o producto para reponer mercadería.",
  },
  caja: {
    breadcrumb: "Caja y métricas",
    eyebrow: "LOS NÚMEROS DE TU NEGOCIO",
    title: "Tu caja, en claro",
    description: "Revisá ventas, medios de pago y el cierre del día.",
  },
};

export function Kiosk() {
  return (
    <CartProvider>
      <Workspace />
    </CartProvider>
  );
}

function Workspace() {
  const [view, setView] = useState<WorkspaceView>("venta");
  const { products, loading, error, refresh } = useProducts();
  const [notice, setNotice] = useState("");

  const disabled = loading || !!error;
  const heading = headings[view];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link
          href="/"
          className="brand"
        >
          <span className="brand-mark">pk</span>PagoKiosco<span className="badge">MVP</span>
        </Link>
        <p className="sidebar-caption">TU NEGOCIO, AL DÍA</p>
        <WorkspaceNav
          view={view}
          onChange={(next) => {
            setView(next);
            setNotice("");
          }}
        />
        <p className="sidebar-foot">
          Hecho para tu mostrador.
          <br />
          Tus datos quedan en este dispositivo.
        </p>
      </aside>
      <main id="main">
        <header className="topbar">
          <span>
            Mi kiosco <span className="muted">/ {heading.breadcrumb}</span>
          </span>
          <span className="pill">● &nbsp; Guardado local</span>
        </header>
        <div className="page-heading">
          <div>
            <p className="eyebrow">{heading.eyebrow}</p>
            <h1>{heading.title}</h1>
            <p className="muted">{heading.description}</p>
          </div>
        </div>
        {notice && (
          <p
            role="status"
            className="success"
          >
            {notice}
          </p>
        )}
        {error && (
          <div
            role="alert"
            className="error"
          >
            {error}
            <button onClick={refresh}>Reintentar</button>
          </div>
        )}
        {view === "venta" && (
          <Pos
            products={products}
            onRefresh={refresh}
            disabled={disabled}
          />
        )}
        {view === "catalogo" && (
          <Catalog
            products={products}
            loading={loading}
          />
        )}
        <InventoryWorkspace
          products={products}
          disabled={disabled}
          active={view === "stock"}
          showSavedNotice={view !== "venta"}
          onRefresh={refresh}
          onNotice={setNotice}
        />
        {view === "caja" && <Cashbook />}
        <p className="footer-note">PagoKiosco registra tus operaciones. No procesa pagos.</p>
      </main>
    </div>
  );
}
