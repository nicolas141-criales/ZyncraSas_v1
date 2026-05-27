"use client";

import LivePulseSection from "@/components/landing/LivePulse";
import { PageHero } from "@/components/landing/primitives";
import { CtaSection, StatsBar } from "@/components/landing/Sections";
import Testimonials from "@/components/landing/Testimonials";

export default function ReviewsPage() {
  return (
    <>
      <PageHero
        eyebrow="Reseñas verificadas"
        title={
          <>
            500+ negocios.{" "}
            <span className="gradient-text">Resultados reales.</span>
          </>
        }
        sub="No es marketing. Son números reales de dueños de barberías, salones y spas que ya usan Zyncra."
        accent="#FB923C"
      />
      <StatsBar />
      <Testimonials />
      <LivePulseSection />
      <CtaSection />
    </>
  );
}
