"use client";
import { useEffect, useRef } from "react";

export type WorkspaceView = "venta" | "catalogo" | "stock" | "caja";
const sections: { view: WorkspaceView; label: string; icon: string }[] = [
  { view: "venta", label: "Vender", icon: "＋" },
  { view: "catalogo", label: "Catálogo", icon: "▦" },
  { view: "stock", label: "Agregar stock", icon: "▥" },
  { view: "caja", label: "Caja", icon: "↗" },
];

export function WorkspaceNav({
  view,
  onChange,
}: {
  view: WorkspaceView;
  onChange: (view: WorkspaceView) => void;
}) {
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const container = nav.current;
    const active = container?.querySelector<HTMLButtonElement>('[aria-current="page"]');
    if (!container || !active) return;
    const bounds = container.getBoundingClientRect();
    const item = active.getBoundingClientRect();
    if (item.left < bounds.left) container.scrollLeft += item.left - bounds.left;
    else if (item.right > bounds.right) container.scrollLeft += item.right - bounds.right;
  }, [view]);

  return (
    <>
      <nav
        ref={nav}
        className="workspace-nav"
        aria-label="Principal"
      >
        {sections.map((section) => (
          <button
            key={section.view}
            className={view === section.view ? "nav-active" : ""}
            aria-current={view === section.view ? "page" : undefined}
            onClick={() => onChange(section.view)}
          >
            <span aria-hidden="true">{section.icon}</span> {section.label}
          </button>
        ))}
      </nav>
      <p className="nav-scroll-hint">
        Deslizá las secciones <span aria-hidden="true">↔</span>
      </p>
    </>
  );
}
