"use client";
import { useEffect, useRef, type ReactNode } from "react";
export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} onCancel={onClose} aria-label={title}>
    <div className="section-head"><h2>{title}</h2><button type="button" className="quiet" aria-label="Cerrar" onClick={onClose}>✕</button></div>{children}
  </dialog>;
}
