import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "PagoKiosco · Tu negocio, al día",
  description: "Inventario y registro de ventas para tu kiosco, incluso sin conexión.",
};
export const viewport: Viewport = { themeColor: "#1a365d", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es-AR"><body>{children}</body></html>;
}
