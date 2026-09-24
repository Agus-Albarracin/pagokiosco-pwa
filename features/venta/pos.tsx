"use client";
import { useMemo, useRef, useState } from "react";
import { createProductSearch } from "@/entities/product";
import { isWeight, quantityLabel, type Product } from "@/entities/product";
import { lineCents, type PaymentMethod } from "@/entities/sale";
import { money } from "@/shared/lib/money";
import { checkout } from "./checkout";
import { useCart } from "./cart-context";
import { Modal } from "@/shared/ui/modal";
import { WeightPicker } from "./weight-picker";
export function Pos({
  products,
  onRefresh,
  disabled,
}: {
  products: Product[];
  onRefresh: () => Promise<void>;
  disabled: boolean;
}) {
  const cart = useCart();
  const [weight, setWeight] = useState<{ product: Product; editing: boolean } | null>(null);
  const [query, setQuery] = useState("");
  const [amount, setAmount] = useState("");
  const [keypad, setKeypad] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("EFECTIVO");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const lock = useRef(false);
  const saleId = useRef("");
  const total = cart.lines.reduce((sum, line) => sum + lineCents(line), 0) / 100;
  const search = useMemo(() => createProductSearch(products), [products]);
  const filtered = search(query);
  async function finish() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const sale = await checkout(saleId.current, cart.lines, method);
      cart.clear();
      setConfirm(false);
      setSuccess(`Venta registrada · ${money(sale.total)} en ${method.toLowerCase()}.`);
      await onRefresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo registrar la venta.");
      await onRefresh();
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <>
      <div className="pos-layout">
        <section className="panel">
          <div className="section-head">
            <h2>Elegí los productos</h2>
          </div>
          <label className="search-label">
            <span>Buscar para vender</span>
            <input
              type="search"
              placeholder="Buscar por marca o producto…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={disabled}
            />
          </label>
          <div className="quick-grid">
            {filtered.map((p) => (
              <button
                key={p.ean}
                className="quick-product"
                disabled={
                  disabled || p.stock <= (cart.lines.find((l) => l.ean === p.ean)?.qty ?? 0)
                }
                onClick={() => {
                  if (isWeight(p)) setWeight({ product: p, editing: false });
                  else cart.add(p);
                  setSuccess("");
                }}
              >
                <span className="quick-code">{p.marca || "PRODUCTO"}</span>
                <strong>{p.nombre}</strong>
                <span>
                  {money(p.precioVenta)}
                  {isWeight(p) ? " /kg" : ""}
                </span>
                <small>
                  {p.stock > 0 ? `${quantityLabel(p.stock, p)} disponibles` : "Sin stock"}
                </small>
              </button>
            ))}
          </div>
          {!filtered.length && (
            <div className="empty">
              <h3>{query ? "Sin coincidencias" : "Prepará tu mostrador"}</h3>
              <p>
                {query
                  ? "Probá con otra marca o nombre. Las altas se hacen desde Agregar stock."
                  : "Cargá tus productos desde Agregar stock o registrá un importe libre."}
              </p>
            </div>
          )}
          <button
            className="amount-button"
            disabled={disabled}
            onClick={() => {
              setAmount("");
              setKeypad(true);
            }}
          >
            ＋ Agregar importe libre <span>Productos sueltos o a granel</span>
          </button>
        </section>
        <section className="panel cart-panel">
          <div className="section-head">
            <h2>Venta actual</h2>
            <span className="pill">{cart.lines.length} productos</span>
          </div>
          {!cart.lines.length ? (
            <div className="empty">
              <span className="empty-symbol">＋</span>
              <h3>Empezá una nueva venta</h3>
              <p>Los productos que elijas aparecen acá.</p>
            </div>
          ) : (
            <ul className="cart-lines">
              {cart.lines.map((line) => (
                <li key={line.ean}>
                  <div className="cart-line-title">
                    <span>
                      {isWeight(line) ? line.qty + " g" : line.qty} × {line.nombre}
                    </span>
                    <strong>{money(lineCents(line) / 100)}</strong>
                  </div>
                  <div className={isWeight(line) ? "quantity weight-quantity" : "quantity"}>
                    {isWeight(line) ? (
                      <>
                        <button
                          disabled={busy}
                          aria-label={"Cambiar peso de " + line.nombre}
                          onClick={() => {
                            const product = products.find((p) => p.ean === line.ean);
                            if (product) setWeight({ product, editing: true });
                          }}
                        >
                          Cambiar peso
                        </button>
                        <button
                          disabled={busy}
                          aria-label={"Quitar " + line.nombre}
                          onClick={() => cart.change(line.ean, -line.qty)}
                        >
                          Quitar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          aria-label={`Quitar una unidad de ${line.nombre}`}
                          disabled={busy}
                          onClick={() => cart.change(line.ean, -1)}
                        >
                          −
                        </button>
                        <span>{line.qty}</span>
                        <button
                          aria-label={`Agregar una unidad de ${line.nombre}`}
                          disabled={
                            busy ||
                            (!line.custom_amount &&
                              line.qty >= (products.find((p) => p.ean === line.ean)?.stock ?? 0))
                          }
                          onClick={() => cart.change(line.ean, 1)}
                        >
                          ＋
                        </button>
                      </>
                    )}
                    <small>
                      {money(line.precioVenta)} {isWeight(line) ? "/kg" : "c/u"}
                    </small>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="cart-total">
            <span>Total</span>
            <strong>{money(total)}</strong>
          </div>
          <button
            className="primary checkout-button"
            disabled={busy || disabled || !cart.lines.length}
            onClick={() => {
              saleId.current = crypto.randomUUID();
              setError("");
              setMethod("EFECTIVO");
              setConfirm(true);
            }}
          >
            Registrar venta <span>→</span>
          </button>
          <p className="hint cart-hint">Elegí el medio al confirmar. No se realiza ningún cobro.</p>
        </section>
      </div>
      {success && (
        <p
          role="status"
          className="success"
        >
          ✓ {success}
        </p>
      )}
      {weight && (
        <WeightPicker
          product={weight.product}
          available={
            weight.product.stock -
            (weight.editing
              ? 0
              : (cart.lines.find((line) => line.ean === weight.product.ean)?.qty ?? 0))
          }
          initial={
            weight.editing
              ? cart.lines.find((line) => line.ean === weight.product.ean)?.qty
              : Math.min(
                  100,
                  weight.product.stock -
                    (cart.lines.find((line) => line.ean === weight.product.ean)?.qty ?? 0),
                )
          }
          onClose={() => setWeight(null)}
          onConfirm={(grams) => {
            if (weight.editing)
              cart.change(
                weight.product.ean,
                grams - (cart.lines.find((line) => line.ean === weight.product.ean)?.qty ?? 0),
              );
            else cart.add(weight.product, grams);
          }}
        />
      )}
      {keypad && (
        <Modal
          title="Importe libre"
          onClose={() => setKeypad(false)}
        >
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              cart.custom(Number(amount));
              setKeypad(false);
              setSuccess("");
            }}
          >
            <label>
              Importe ($)
              <input
                required
                type="number"
                min="0.01"
                max="100000000"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </label>
            <div className="keypad">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map((key) => (
                <button
                  type="button"
                  key={key}
                  aria-label={key === "⌫" ? "Borrar último dígito" : key}
                  onClick={() =>
                    setAmount((value) =>
                      key === "⌫"
                        ? value.slice(0, -1)
                        : key === "." && value.includes(".")
                          ? value
                          : (value + key).slice(0, 12),
                    )
                  }
                >
                  {key}
                </button>
              ))}
            </div>
            <button className="primary">Agregar al carrito</button>
          </form>
        </Modal>
      )}
      {confirm && (
        <Modal
          title="Confirmar venta"
          onClose={() => {
            if (!busy) setConfirm(false);
          }}
        >
          <div className="form-stack">
            <div className="confirmation-total">{money(total)}</div>
            <p className="muted">
              Seleccioná cómo recibiste el pago. Este registro no mueve dinero.
            </p>
            <div className="two-columns">
              {(["EFECTIVO", "TRANSFERENCIA"] as const).map((m) => (
                <button
                  key={m}
                  disabled={busy}
                  aria-pressed={method === m}
                  className={method === m ? "selected" : ""}
                  onClick={() => setMethod(m)}
                >
                  {m === "EFECTIVO" ? "Efectivo" : "Transferencia"}
                </button>
              ))}
            </div>
            {error && (
              <p
                role="alert"
                className="error"
              >
                {error}
              </p>
            )}
            <button
              className="primary"
              disabled={busy}
              onClick={finish}
            >
              {busy ? "Registrando…" : "Confirmar y descontar stock"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
