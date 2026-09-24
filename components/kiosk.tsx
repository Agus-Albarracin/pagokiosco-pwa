"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { quantityLabel, type Product } from "@/lib/domain";
import { listProducts } from "@/lib/storage";
import { ProductForm } from "./product-form";
import { CartProvider } from "./cart-context";
import { Pos } from "./pos";
import { Cashbook } from "./cashbook";
import { StockReceipt } from "./stock-receipt";
import { WasteForm } from "./waste-form";
import { Catalog } from "./catalog";
import { StockEntry } from "./stock-entry";
import { WorkspaceNav, type WorkspaceView } from "./workspace-nav";

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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editor, setEditor] = useState<Product | "new" | null>(null);
  const [receipt, setReceipt] = useState<Product | null>(null);
  const [waste, setWaste] = useState<Product | null>(null);
  const [notice, setNotice] = useState("");
  const refresh = useCallback(
    () =>
      listProducts()
        .then((result) => {
          setProducts(result);
          setError("");
        })
        .catch(() => {
          setError(
            "No pudimos abrir tus datos. Revisá el almacenamiento del navegador y reintentá.",
          );
        })
        .finally(() => setLoading(false)),
    [],
  );
  useEffect(() => {
    void refresh();
    const focus = () => {
      void refresh();
    };
    window.addEventListener("focus", focus);
    return () => window.removeEventListener("focus", focus);
  }, [refresh]);

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
        {view === "stock" && (
          <StockEntry
            products={products}
            disabled={disabled}
            onCreate={() => {
              setNotice("");
              setEditor("new");
            }}
            onSelect={(product) => {
              setNotice("");
              setReceipt(product);
            }}
            onEdit={(product) => setEditor(product)}
            onWaste={(product) => {
              setNotice("");
              setWaste(product);
            }}
          />
        )}
        {view === "caja" && <Cashbook />}
        <p className="footer-note">PagoKiosco registra tus operaciones. No procesa pagos.</p>
      </main>
      {editor && (
        <ProductForm
          product={editor === "new" ? undefined : editor}
          onClose={() => setEditor(null)}
          onSaved={async () => {
            await refresh();
            setNotice(
              view === "venta"
                ? ""
                : editor === "new"
                  ? "Producto agregado al catálogo. Stock inicial guardado."
                  : "Producto actualizado.",
            );
          }}
        />
      )}
      {waste && (
        <WasteForm
          product={waste}
          onClose={() => setWaste(null)}
          onSaved={async (product) => {
            await refresh();
            setNotice(
              "Merma registrada: " +
                product.nombre +
                " · Stock: " +
                quantityLabel(product.stock, product),
            );
          }}
        />
      )}
      {receipt && (
        <StockReceipt
          product={receipt}
          onClose={() => setReceipt(null)}
          onSaved={async (product) => {
            await refresh();
            setNotice(
              "Stock actualizado: " +
                product.nombre +
                " · " +
                quantityLabel(product.stock, product) +
                ".",
            );
          }}
        />
      )}
    </div>
  );
}
