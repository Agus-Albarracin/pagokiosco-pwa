"use client";
import { useEffect, useRef, useState } from "react";
import type { BrowserMultiFormatReader } from "@zxing/library";

export function Scanner({ onCode, autoStart = false }: {
  onCode: (ean: string) => void; autoStart?: boolean;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const onCodeRef = useRef(onCode);
  const [attempt, setAttempt] = useState(autoStart ? 1 : 0);
  const [busy, setBusy] = useState(autoStart);
  const [status, setStatus] = useState(autoStart ? "Solicitando acceso a la cámara…" : "");
  useEffect(() => { onCodeRef.current = onCode; }, [onCode]);

  useEffect(() => {
    if (!attempt) return;
    let active = true;
    let detected = false;
    let reader: BrowserMultiFormatReader | undefined;
    let stream: MediaStream | undefined;
    function stop() {
      reader?.reset();
      stream?.getTracks().forEach(track => track.stop());
    }
    async function scan() {
      const { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } = await import("@zxing/library");
      if (!active) return;
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("CAMERA_UNAVAILABLE");
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }, audio: false,
      });
      if (!active) { media.getTracks().forEach(track => track.stop()); return; }
      stream = media;
      reader = new BrowserMultiFormatReader(new Map([
        [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_8, BarcodeFormat.EAN_13]],
      ]), 300);
      setStatus("Apuntá al código EAN de 8 o 13 dígitos.");
      await reader.decodeFromStream(media, video.current!, result => {
        if (!active || detected || !result) return;
        const code = result.getText();
        if (!/^\d{8}$|^\d{13}$/.test(code)) return;
        detected = true; stop();
        setBusy(false); setStatus("Código leído.");
        onCodeRef.current(code);
      });
    }
    void scan().catch(() => {
      stop();
      if (active) {
        setBusy(false);
        setStatus("No pudimos usar la cámara. Revisá el permiso o ingresá el código abajo.");
      }
    });
    return () => { active = false; stop(); };
  }, [attempt]);

  return <div className="scanner">
    <video ref={video} muted playsInline aria-label="Vista de la cámara para escanear" />
    <button type="button" className="primary" disabled={busy} onClick={() => {
      setBusy(true); setStatus("Solicitando acceso a la cámara…"); setAttempt(value => value + 1);
    }}>{busy ? "Cámara activa…" : "Activar cámara"}</button>
    <p role="status" className="hint">{status || "Apuntá al código para identificar el producto."}</p>
  </div>;
}
