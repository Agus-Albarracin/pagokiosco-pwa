"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { type Product } from "@/lib/domain";
import { Modal } from "./modal";
import { Scanner } from "./scanner";
export function Lookup({ products, onClose, onFound, onCreate }: { products: Product[]; onClose: () => void; onFound: (p: Product) => void; onCreate: (ean: string, name: string) => void }) {
  const [ean, setEan] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [manual, setManual] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const alive = useRef(true);
  const requestId = useRef(0);
  useEffect(() => { alive.current = true; return () => { alive.current = false; controller.current?.abort(); }; }, []);
  async function lookup(code: string) {
    controller.current?.abort();
    const id = ++requestId.current;
    setEan(code); setMessage(""); setManual(false);
    if (!/^\d{8}$|^\d{13}$/.test(code)) { setMessage("Ingresá 8 o 13 dígitos."); return; }
    const existing = products.find(p => p.ean === code);
    if (existing) { onFound(existing); return; }
    setBusy(true); controller.current = new AbortController();
    try {
      const response = await fetch(`/api/products?ean=${code}`, { signal: controller.current.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message);
      if (!alive.current || id !== requestId.current) return;
      if (data.found) onCreate(code, data.nombre);
      else { setMessage("No está en Open Food Facts. Podés cargarlo en tu catálogo."); setManual(true); }
    } catch {
      if (alive.current && id === requestId.current) { setMessage("No pudimos consultar el catálogo. Podés cargarlo manualmente y seguir trabajando."); setManual(true); }
    } finally { if (alive.current && id === requestId.current) setBusy(false); }
  }
  return <Modal title="Escanear o ingresar código" onClose={onClose}><div className="form-stack"><Scanner onCode={lookup} />
    <form className="form-stack" onSubmit={(e: FormEvent) => { e.preventDefault(); void lookup(ean); }}><label>Código EAN<input required inputMode="numeric" pattern="[0-9]{8}|[0-9]{13}" value={ean} onChange={e => { setEan(e.target.value); setManual(false); }} disabled={busy} /></label><button className="primary" disabled={busy}>{busy ? "Consultando…" : "Buscar código"}</button></form>
    {message && <p role="status" className="hint">{message}</p>}{manual && <button onClick={() => onCreate(ean, "")}>Cargar producto manualmente</button>}
    <p className="hint">Nombres sugeridos por Open Food Facts. Confirmá el nombre antes de guardar.</p>
  </div></Modal>;
}
