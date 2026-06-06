import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Funciones",
  description: "Agenda inteligente, POS, recordatorios automáticos por WhatsApp, facturación electrónica y más. Todo lo que necesita tu negocio de servicios en un solo lugar.",
  alternates: { canonical: "https://zyncra.app/features" },
  openGraph: {
    url: "https://zyncra.app/features",
    title: "Funciones | Zyncra",
    description: "Agenda inteligente, POS, recordatorios automáticos por WhatsApp, facturación electrónica y más. Todo lo que necesita tu negocio de servicios.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Funciones de Zyncra" }],
  },
};

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
