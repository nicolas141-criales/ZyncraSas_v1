import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reseñas",
  description: "Lo que dicen nuestros clientes. Cientos de salones, spas y negocios de servicios en Colombia ya usan Zyncra para gestionar su negocio.",
  alternates: { canonical: "https://zyncra.app/reviews" },
  openGraph: {
    url: "https://zyncra.app/reviews",
    title: "Reseñas | Zyncra",
    description: "Lo que dicen nuestros clientes. Cientos de salones, spas y negocios de servicios en Colombia ya usan Zyncra.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Reseñas de Zyncra" }],
  },
};

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
