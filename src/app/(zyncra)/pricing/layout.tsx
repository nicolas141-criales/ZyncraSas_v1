import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Precios",
  description: "Planes flexibles para salones, spas y negocios de servicios en Colombia. Empieza gratis y crece con Zyncra.",
  alternates: { canonical: "https://zyncra.app/pricing" },
  openGraph: {
    url: "https://zyncra.app/pricing",
    title: "Precios | Zyncra",
    description: "Planes flexibles para salones, spas y negocios de servicios en Colombia. Empieza gratis y crece con Zyncra.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Precios de Zyncra" }],
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
