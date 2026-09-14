"use client";
import { useEffect, useRef, useState } from "react";
import type { ScanReader } from "@/lib/scan-reader";
import { playScanSound, prepareScanSound } from "@/lib/scan-sound";
import { startScanFrames } from "@/lib/scan-frames";
import { createScanQualityFeedback, SCAN_GUIDANCE } from "@/lib/scan-quality-feedback";

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
    let reader: ScanReader | undefined;
    let stream: MediaStream | undefined;
    let stopFrames: (() => void) | undefined;
    const element = video.current;
    function stop() {
      stopFrames?.();
      reader?.reset();
      stream?.getTracks().forEach(track => track.stop());
      if (element && element.srcObject === stream) {
        element.pause();
        element.srcObject = null;
      }
    }
    function fail() {
      stop();
      if (active && !detected) {
        setBusy(false);
        setStatus("No pudimos usar la cámara. Revisá el permiso o ingresá el código abajo.");
      }
    }
    async function scan() {
      const { createScanReader, isScanMiss } = await import("@/lib/scan-reader");
      if (!active || !element) return;
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("CAMERA_UNAVAILABLE");
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }, audio: false,
      });
      if (!active) { media.getTracks().forEach(track => track.stop()); return; }
      stream = media;
      reader = createScanReader();
      const qualityFeedback = createScanQualityFeedback(element);
      setStatus(SCAN_GUIDANCE);
      element.srcObject = media;
      // Register before play: even a stream with a single frame can be read.
      stopFrames = startScanFrames(element, now => {
        if (!active || detected) return;
        let code: string;
        try {
          code = reader!.decode(element).getText();
        } catch (error) {
          if (isScanMiss(error)) {
            const guidance = qualityFeedback(now);
            if (guidance) setStatus(guidance);
            return;
          }
          throw error;
        }
        if (!/^\d{8}$|^\d{13}$/.test(code)) return;
        detected = true; stop();
        playScanSound();
        setBusy(false); setStatus("Código leído.");
        onCodeRef.current(code);
      }, fail);
      await element.play();
    }
    void scan().catch(fail);
    return () => { active = false; stop(); };
  }, [attempt]);

  return <div className="scanner">
    <video ref={video} muted playsInline aria-label="Vista de la cámara para escanear" />
    <button type="button" className="primary" disabled={busy} onClick={() => {
      prepareScanSound();
      setBusy(true); setStatus("Solicitando acceso a la cámara…"); setAttempt(value => value + 1);
    }}>{busy ? "Cámara activa…" : "Activar cámara"}</button>
    <p role="status" className="hint">{status || "Apuntá al código para identificar el producto."}</p>
  </div>;
}
