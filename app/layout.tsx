import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Pwa } from "@/app/_components/pwa";
export const metadata: Metadata = {
  title: "PagoKiosco · Tu negocio, al día",
  description: "Inventario y registro de ventas para tu kiosco, incluso sin conexión.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "PagoKiosco" },
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
};
export const viewport: Viewport = { themeColor: "#1a365d", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body>
        {children}
        <Pwa />
      </body>
    </html>
  );
}
