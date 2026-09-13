"use client";
import { useCallback, useEffect, useState } from "react";
import { cents, money, summarize, type Sale } from "@/lib/domain";
import { listSales, startOfToday } from "@/lib/sales";
import { Modal } from "./modal";
const day = 86_400_000;
export function Cashbook() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<{ sales: Sale[]; now: number } | null>(null);
  const [error, setError] = useState("");
  const [closure, setClosure] = useState<Sale[] | null>(null);
  const [closing, setClosing] = useState(false);
  const refresh = useCallback(() => {
    const now = Date.now();
    return listSales(now - days * day, now).then(sales => { setData({ sales, now }); setError(""); }).catch(() => setError("No pudimos leer tus ventas. Volvé a intentar."));
  }, [days]);
  useEffect(() => { void refresh(); const timer = setInterval(refresh, 60_000); window.addEventListener("focus", refresh); return () => { clearInterval(timer); window.removeEventListener("focus", refresh); }; }, [refresh]);
  async function closeDay() {
    setClosing(true); setError("");
    try { const sales = await listSales(startOfToday()); setClosure(sales); }
    catch { setError("No se pudo calcular el cierre. Volvé a intentar."); }
    finally { setClosing(false); }
  }
  const summary = summarize(data?.sales ?? []);
  const daily = summarize((data?.sales ?? []).filter(s => s.createdAt >= startOfToday()));
  const bins = Array.from({ length: 7 }, (_, i) => {
    const start = (data?.now ?? 0) - days * day + i * days * day / 7;
    const end = start + days * day / 7;
    const total = (data?.sales ?? []).filter(s => s.createdAt >= start && (i === 6 ? s.createdAt <= end : s.createdAt < end)).reduce((sum, s) => sum + cents(s.total), 0) / 100;
    const label = new Date(start).toLocaleString("es-AR", days === 1 ? { hour: "2-digit", minute: "2-digit" } : { day: "numeric", month: "short" });
    return { label, total };
  });
  const max = Math.max(1, ...bins.map(b => b.total));
  const closed = summarize(closure ?? []);
  return <div className="form-stack">
    <section className="stats" aria-label="Caja de hoy"><article><span>Total de hoy</span><strong>{money(daily.total)}</strong><small>{daily.count} ventas registradas</small></article><article><span>Efectivo de hoy</span><strong>{money(daily.cash)}</strong></article><article><span>Transferencias de hoy</span><strong>{money(daily.transfer)}</strong></article></section>
    {error && <div role="alert" className="error">{error}<button onClick={refresh}>Reintentar</button></div>}
    <section className="panel"><div className="section-head"><h2>Cómo viene tu negocio</h2><label><span className="sr-only">Período</span><select value={days} onChange={e => { setDays(Number(e.target.value)); setData(null); }}>{[[1, "Últimas 24 horas"], [7, "Últimos 7 días"], [30, "Últimos 30 días"], [365, "Últimos 365 días"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
      {!data ? <p role="status">Cargando métricas…</p> : <><div className="metrics-summary"><strong>{money(summary.total)}</strong><span>{summary.count} ventas en el período</span></div><div className="bar-chart" role="img" aria-label={`Ventas en el período: ${bins.map(b => `${b.label}: ${money(b.total)}`).join("; ")}`}>{bins.map((b, i) => <div className="bar-column" key={i}><span className="bar-value">{money(b.total)}</span><div className="bar-track"><div style={{ height: `${Math.max(2, b.total / max * 100)}%` }} /></div><span>{b.label}</span></div>)}</div><p className="hint">Siete intervalos consecutivos del período seleccionado. Fechas según este dispositivo.</p></>}
    </section>
    <section className="panel"><div className="section-head"><h2>Movimientos</h2><button className="primary" disabled={closing || !data} onClick={closeDay}>{closing ? "Calculando…" : "Cierre de caja"}</button></div>
    {data && !data.sales.length ? <div className="empty"><h3>Todavía no hay ventas en este período</h3><p>Cuando registres una venta, vas a verla acá.</p></div> : <ul className="sales-list">{data?.sales.slice().reverse().map(s => <li key={s.id}><div><strong>{s.method === "EFECTIVO" ? "Efectivo" : "Transferencia"}</strong><small>{new Date(s.createdAt).toLocaleString("es-AR")} · {s.lines.reduce((sum, l) => sum + l.qty, 0)} artículos</small></div><strong>{money(s.total)}</strong></li>)}</ul>}
    </section>
    {closure !== null && <Modal title="Cierre de caja · hoy" onClose={() => setClosure(null)}><div className="form-stack"><p className="muted">Consolidado del día en este dispositivo. Podés consultarlo nuevamente; las ventas se conservan.</p><dl className="closure"><div><dt>Efectivo</dt><dd>{money(closed.cash)}</dd></div><div><dt>Transferencia</dt><dd>{money(closed.transfer)}</dd></div><div><dt>Total general</dt><dd>{money(closed.total)}</dd></div></dl><p>{closed.count} ventas registradas.</p><button className="primary" onClick={() => setClosure(null)}>Listo</button></div></Modal>}
  </div>;
}
