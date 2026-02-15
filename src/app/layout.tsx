import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Turonia — Escola el Turó",
  description: "Gestió intel·ligent de currículums per a l'Escola el Turó",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ca">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
