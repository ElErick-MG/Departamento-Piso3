import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Departamento Piso 3 - Gestión de Tareas",
  description: "App para gestionar turnos de compras y tareas del departamento",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
