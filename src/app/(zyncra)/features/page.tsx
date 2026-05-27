"use client";

import DemosSection from "@/components/landing/Demos";
import { PageHero } from "@/components/landing/primitives";
import {
  CtaSection,
  FeaturesGrid,
  IndustriesMarquee,
  ProcessSteps,
} from "@/components/landing/Sections";

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Funciones"
        title={
          <>
            Todo lo que tu negocio necesita.{" "}
            <span className="gradient-text">En una sola plataforma.</span>
          </>
        }
        sub="Agenda, marketing por WhatsApp, POS, facturación DIAN, comisiones, reseñas. No más herramientas pegadas con cinta."
      />
      <DemosSection />
      <FeaturesGrid />
      <ProcessSteps />
      <IndustriesMarquee />
      <CtaSection />
    </>
  );
}
