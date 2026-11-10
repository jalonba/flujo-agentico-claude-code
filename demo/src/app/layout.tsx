import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agenda de citas",
  description: "Demo del flujo agéntico: horarios libres y reservas de un día.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es-CO" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
