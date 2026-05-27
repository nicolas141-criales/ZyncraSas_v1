"use client";

import BentoHero from "@/components/landing/BentoHero";
import {
  CtaSection,
  IndustriesMarquee,
  StatsBar,
} from "@/components/landing/Sections";
import LivePulseSection from "@/components/landing/LivePulse";
import DemosSection from "@/components/landing/Demos";
import ScrollStorySection from "@/components/landing/ScrollStory";

export default function HomePage() {
  return (
    <>
      <BentoHero />
      <StatsBar />
      <LivePulseSection />
      <DemosSection />
      <IndustriesMarquee />
      <ScrollStorySection />
      <CtaSection />
    </>
  );
}
