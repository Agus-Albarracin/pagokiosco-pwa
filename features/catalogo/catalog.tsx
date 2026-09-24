"use client";
import { useMemo, useState } from "react";
import { createProductSearch } from "@/entities/product";
import { isWeight, quantityLabel, type Product } from "@/entities/product";
import { money } from "@/shared/lib/money";

export function Catalog({ products, loading }: { products: Product[]; loading: boolean }) {
  const [query, setQuery] = useState("");
  const search = useMemo(() => createProductSearch(products), [products]);
  const filtered = search(query);
  return (
    <>
      <section
        className="stats"
        aria-label="Resumen del catálogo"
      >
        <article>
          <span>Productos</span>
          <strong>{products.length}</strong>
        </article>
        <article>
          <span>Disponibilidad</span>
          <strong>
            {products
              .filter((product) => !isWeight(product))
              .reduce((sum, product) => sum + product.stock, 0)}{" "}
            u.
          </strong>
          <small>
            {quantityLabel(
              products.filter(isWeight).reduce((sum, product) => sum + product.stock, 0),
              { unidadVenta: "peso" },
            )}{" "}
            en productos por peso
          </small>
        </article>
        <article>
          <span>Con stock bajo</span>
          <strong>
            {products.filter((product) => product.stock <= (isWeight(product) ? 500 : 5)).length}
          </strong>
          <small>Hasta 5 unidades o 500 g</small>
        </article>
      </section>
      <section className="panel">
        <div className="section-head">
          <h2>Tus productos</h2>
          <span className="muted">Precios y existencias</span>
        </div>
        <label className="search-label">
          <span className="sr-only">Buscar producto</span>
          <input
            type="search"
            placeholder="Buscar por marca o producto…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {loading ? (
          <p
            role="status"
            className="empty"
          >
            Cargando tu catálogo…
          </p>
        ) : filtered.length ? (
          <div className="product-list">
            {filtered.map((product) => (
              <div
                className="product-row"
                key={product.ean}
              >
                <span
                  className="product-avatar"
                  aria-hidden="true"
                >
                  {product.nombre.slice(0, 2).toUpperCase()}
                </span>
                <div className="product-name">
                  <strong>{product.nombre}</strong>
                  {product.marca && <small>{product.marca}</small>}
                </div>
                <span
                  className={product.stock <= (isWeight(product) ? 500 : 5) ? "stock low" : "stock"}
                >
                  {isWeight(product)
                    ? quantityLabel(product.stock, product)
                    : product.stock + " u."}
                </span>
                <strong>
                  {money(product.precioVenta)}
                  {isWeight(product) ? " /kg" : ""}
                </strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">
            <span
              className="empty-symbol"
              aria-hidden="true"
            >
              ▦
            </span>
            <h3>{query ? "No encontramos ese producto" : "Todavía no hay productos"}</h3>
            <p>
              {query
                ? "Probá con otra marca o nombre."
                : "Los productos que cargues desde Agregar stock aparecerán acá."}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
