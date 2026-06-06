import type { Metadata } from "next";
import { Inter, Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://zyncra.app"),
  title: {
    default: "Zyncra — Agenda, POS y Marketing para tu negocio de servicios",
    template: "%s | Zyncra",
  },
  description: "Agenda, POS y Marketing en un solo lugar. La solución todo en uno para salones, spas, manicuristas y negocios de servicios en Colombia y Latinoamérica.",
  keywords: ["agenda online", "software salón de belleza", "POS salón", "recordatorios WhatsApp", "software spa", "gestión citas", "Colombia"],
  authors: [{ name: "Zyncra", url: "https://zyncra.app" }],
  creator: "Zyncra",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: "https://zyncra.app",
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: "https://zyncra.app",
    siteName: "Zyncra",
    title: "Zyncra — Agenda, POS y Marketing para tu negocio de servicios",
    description: "Agenda, POS y Marketing en un solo lugar. La solución todo en uno para salones, spas, manicuristas y negocios de servicios en Colombia.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Zyncra — Software de gestión para negocios de servicios",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zyncra — Agenda, POS y Marketing para tu negocio de servicios",
    description: "Agenda, POS y Marketing en un solo lugar. La solución todo en uno para salones, spas, manicuristas y negocios de servicios en Colombia.",
    images: ["/og-image.png"],
    creator: "@zyncraapp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} ${manrope.variable} ${spaceGrotesk.variable}`}>
        {children}
      </body>
    </html>
  );
}
