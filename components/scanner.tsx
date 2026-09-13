"use client";
import { useEffect, useRef, useState } from "react";
import type { BrowserMultiFormatReader } from "@zxing/library";
export function Scanner({ onCode }: { onCode: (ean: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const reader = useRef<BrowserMultiFormatReader | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const alive = useRef(true);
  const running = useRef(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  function stop() {
    running.current = false;
    reader.current?.reset();
    stream.current?.getTracks().forEach(track => track.stop());
    stream.current = null;
  }
  useEffect(() => { alive.current = true; return () => { alive.current = false; stop(); }; }, []);
  async function start() {
    if (running.current) return;
    running.current = true; setBusy(true); setStatus("Solicitando acceso a la cámara…");
    try {
      const { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } = await import("@zxing/library");
      if (!alive.current) return;
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("CAMERA_UNAVAILABLE");
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      if (!alive.current) { media.getTracks().forEach(track => track.stop()); return; }
      stream.current = media;
      const hints = new Map([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_8, BarcodeFormat.EAN_13]]]);
      reader.current = new BrowserMultiFormatReader(hints, 300);
      setStatus("Apuntá al código EAN de 8 o 13 dígitos.");
      await reader.current.decodeFromStream(media, video.current!, result => {
        if (!alive.current || !running.current || !result) return;
        const code = result.getText();
        if (!/^\d{8}$|^\d{13}$/.test(code)) return;
        stop(); setBusy(false); setStatus("Código leído."); onCode(code);
      });
    } catch {
      stop();
      if (alive.current) { setBusy(false); setStatus("No pudimos usar la cámara. Revisá el permiso o ingresá el código abajo."); }
    }
  }
  return <div className="scanner"><video ref={video} muted playsInline aria-label="Vista de la cámara para escanear" /><button type="button" onClick={start} disabled={busy}>{busy ? "Cámara activa…" : "Activar cámara"}</button><p role="status" className="hint">{status || "También podés escribir el código sin usar la cámara."}</p></div>;
}
