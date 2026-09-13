"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { type Product } from "@/lib/domain";
import { Modal } from "./modal";
import { Scanner } from "./scanner";

export function Lookup({ products, onClose, onFound, onCreate, onManual }: {
  products: Product[];
  onClose: () => void;
  onFound: (product: Product) => void;
  onCreate?: (ean: string, name: string) => void;
  onManual?: () => void;
}) {
  const [ean, setEan] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [manual, setManual] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const alive = useRef(true);
  const pending = useRef(false);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; controller.current?.abort(); };
  }, []);

  async function lookup(code: string) {
    if (pending.current) return;
    setEan(code); setMessage(""); setManual(false);
    if (!/^\d{8}$|^\d{13}$/.test(code)) { setMessage("Ingresá 8 o 13 dígitos."); return; }
    const existing = products.find(product => product.ean === code);
    if (existing) { onFound(existing); return; }
    if (!onCreate) {
      setMessage("No está en tu catálogo. Cargalo desde Agregar stock antes de venderlo.");
      return;
    }
    pending.current = true; setBusy(true);
    controller.current = new AbortController();
    try {
      const response = await fetch("/api/products?ean=" + code + "&version=3", {
        signal: controller.current.signal,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message);
      if (!alive.current) return;
      if (data.found === true) onCreate(code, typeof data.nombre === "string" ? data.nombre : "");
      else {
        setMessage("No está en Open Food Facts. Podés cargarlo en tu catálogo.");
        setManual(true);
      }
    } catch {
      if (alive.current) {
        setMessage("No pudimos consultar el catálogo. Podés cargarlo manualmente y seguir trabajando.");
        setManual(true);
      }
    } finally {
      pending.current = false;
      if (alive.current) setBusy(false);
    }
  }

  return <Modal title={onManual ? "Escanear para agregar stock" : "Escanear producto"} onClose={onClose}>
    <div className="form-stack">
      <p className="hint">{onCreate ? "Escaneá el código. Buscamos el nombre en tu catálogo y en Open Food Facts." : "Escaneá un producto de tu catálogo para sumarlo a la venta."}</p>
      <Scanner autoStart onCode={lookup} />
      <form className="form-stack" onSubmit={(event: FormEvent) => { event.preventDefault(); void lookup(ean); }}>
        <label>Código EAN<input required inputMode="numeric" pattern="[0-9]{8}|[0-9]{13}" value={ean}
          onChange={event => { setEan(event.target.value); setManual(false); setMessage(""); }} disabled={busy} /></label>
        <button disabled={busy}>{busy ? "Consultando nombre…" : "Buscar código"}</button>
      </form>
      {message && <p role="status" className="hint">{message}</p>}
      {manual && onCreate && <button onClick={() => onCreate(ean, "")}>Cargar producto manualmente</button>}
      {onManual && <button className="quiet" onClick={onManual}>Producto sin código · carga manual</button>}
      {onCreate && <p className="hint">Confirmá el nombre y el precio antes de guardar.</p>}
    </div>
  </Modal>;
}
