import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "IZI Market — Assistant Commercial WhatsApp IA pour PME",
  description:
    "Convertissez vos messages WhatsApp en clients 24h/24 grâce à l'IA. Conçu spécialement pour les agences immobilières, boutiques et entreprises au Sénégal et en Afrique.",
  keywords: [
    "WhatsApp Business",
    "IA Commerciale",
    "Sénégal",
    "PME Afrique",
    "Automatisation WhatsApp",
    "Claude Sonnet",
    "CRM WhatsApp",
    "Dakar"
  ],
  authors: [{ name: "IZI Market Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-[#0b141a]`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
