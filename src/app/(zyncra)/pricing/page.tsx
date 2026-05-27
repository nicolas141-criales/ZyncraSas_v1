"use client";

import Pricing from "@/components/landing/Pricing";
import { PageHero } from "@/components/landing/primitives";
import RoiSection from "@/components/landing/RoiSection";
import { CtaSection } from "@/components/landing/Sections";

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Precios"
        title={
          <>
            Precios honestos.{" "}
            <span className="serif gradient-text">Sin sorpresas.</span>
          </>
        }
        sub="14 días gratis, sin tarjeta. Más económico que la competencia gringa. Cancela cuando quieras."
        accent="#EC4899"
      />
      <Pricing />
      <RoiSection />
      <CtaSection />
    </>
  );
}
