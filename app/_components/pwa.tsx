"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Modal } from "@/shared/ui/modal";
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}
export function Pwa() {
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    const display = window.matchMedia("(display-mode: standalone), (display-mode: fullscreen)");
    const isInstalled = () =>
      display.matches || !!(navigator as Navigator & { standalone?: boolean }).standalone;
    const update = () => {
      const value = isInstalled();
      setInstalled(value);
      if (value) {
        setShow(false);
        setPrompt(null);
      }
    };
    const onInstall = (event: Event) => {
      event.preventDefault();
      if (isInstalled()) return;
      setPrompt(event as InstallEvent);
      let dismissed = false;
      try {
        dismissed = sessionStorage.getItem("pagokiosco.install-dismissed") === "1";
      } catch {
        /* session preferences optional */
      }
      if (!dismissed && !document.querySelector("dialog[open]")) setShow(true);
    };
    const installedEvent = () => {
      setInstalled(true);
      setPrompt(null);
      setShow(false);
    };
    display.addEventListener("change", update);
    window.addEventListener("beforeinstallprompt", onInstall);
    window.addEventListener("appinstalled", installedEvent);
    // Initial browser-only state is read through an asynchronous callback.
    Promise.resolve().then(() => {
      if (active) update();
    });
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then(() => navigator.serviceWorker.ready)
        .then(() => {
          if (active) setReady(true);
        })
        .catch(() => {
          if (active)
            setError(
              "No se pudo preparar el modo sin conexión. Recargá con internet para reintentar.",
            );
        });
    }
    return () => {
      active = false;
      display.removeEventListener("change", update);
      window.removeEventListener("beforeinstallprompt", onInstall);
      window.removeEventListener("appinstalled", installedEvent);
    };
  }, []);
  function close() {
    if (busy) return;
    setShow(false);
    try {
      sessionStorage.setItem("pagokiosco.install-dismissed", "1");
    } catch {
      /* optional */
    }
  }
  async function install() {
    if (!prompt || busy) return;
    setBusy(true);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setShow(false);
      setPrompt(null);
    } catch {
      setError("No se pudo abrir la instalación. Usá el menú del navegador.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="pwa-status">
        <span role="status">
          {!online
            ? "● Sin conexión · podés seguir vendiendo"
            : ready
              ? "✓ Lista para usar sin conexión"
              : "Tus datos se guardan en este dispositivo"}
        </span>
        {!installed && (
          <button
            className="quiet"
            onClick={() => setShow(true)}
          >
            Instalar app
          </button>
        )}
      </div>
      {error && (
        <p
          role="alert"
          className="error"
        >
          {error}
        </p>
      )}
      {show && !installed && (
        <Modal
          title="Tu kiosco, a un toque"
          onClose={close}
          className="install-sheet"
        >
          <div className="form-stack">
            <span className="brand-mark">pk</span>
            <p>
              Agregá PagoKiosco a tu pantalla de inicio para abrirlo como una app y trabajar sin
              conexión después de la primera carga.
            </p>
            {prompt ? (
              <button
                className="primary"
                disabled={busy}
                onClick={install}
              >
                {busy ? "Abriendo instalación…" : "Instalar PagoKiosco"}
              </button>
            ) : (
              <p className="hint">
                En el menú del navegador elegí «Instalar aplicación» o «Agregar a pantalla de
                inicio». En Safari, abrí Compartir y luego «Agregar a inicio».
              </p>
            )}
            <button
              disabled={busy}
              onClick={close}
            >
              Ahora no
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
