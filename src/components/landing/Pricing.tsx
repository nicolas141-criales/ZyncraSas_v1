"use client";

import { useState } from "react";
import Link from "next/link";
import { IconArrow, IconCheck } from "./icons";
import {
  Container,
  GradientOrb,
  SectionTitle,
} from "./primitives";

export default function Pricing() {
  const [yearly, setYearly] = useState(true);
  const plans = [
    {
      name: "Starter",
      sub: "Para empezar tu negocio",
      monthly: 49000,
      yearly: 39000,
      featured: false,
      features: [
        "Agenda online ilimitada",
        "1 profesional",
        "Recordatorios WhatsApp",
        "POS básico",
        "Link público de reservas",
      ],
      cta: "Empezar gratis",
      ctaVariant: "secondary" as const,
      accent: "#22D3EE",
    },
    {
      name: "Pro",
      sub: "Lo más vendido en Colombia",
      monthly: 89000,
      yearly: 69000,
      featured: true,
      features: [
        "Todo lo de Starter +",
        "Hasta 5 profesionales",
        "Marketing WhatsApp (campañas)",
        "POS + Factura DIAN",
        "Reseñas Google automáticas",
        "Comisiones automatizadas",
        "Soporte prioritario",
      ],
      cta: "Probar Pro 14 días gratis",
      ctaVariant: "primary" as const,
      accent: "#0027fe",
    },
    {
      name: "Business",
      sub: "Para cadenas y multi-sede",
      monthly: 189000,
      yearly: 149000,
      featured: false,
      features: [
        "Todo lo de Pro +",
        "Profesionales ilimitados",
        "Multi-sede",
        "API + integraciones",
        "Gerente de cuenta dedicado",
        "SLA 99.9%",
      ],
      cta: "Hablar con ventas",
      ctaVariant: "secondary" as const,
      accent: "#fb0f05",
    },
  ];
  const fmt = (n: number) => `$${(n / 1000).toFixed(0)}.000`;

  return (
    <section id="precios" style={{ padding: "120px 0", position: "relative", overflow: "hidden" }}>
      <GradientOrb color="#0027fe" size={500} x="70%" y="30%" opacity={0.10} />
      <GradientOrb color="#fb0f05" size={500} x="-10%" y="50%" opacity={0.10} />
      <Container max={1240}>
        <SectionTitle
          eyebrow="Precios"
          title={
            <>
              Económico, <span className="gradient-text">honesto.</span>
            </>
          }
          sub="Más barato que la competencia gringa. Sin trucos, sin precios en dólares, sin sorpresas."
          align="center"
        />
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}>
          <div
            style={{
              display: "inline-flex",
              padding: 5,
              background: "rgba(20,15,30,0.04)",
              border: "1px solid var(--line)",
              borderRadius: 12,
              gap: 4,
            }}
          >
            {[
              ["Mensual", false],
              ["Anual · ahorra 20%", true],
            ].map(([l, v], i) => (
              <button
                key={i}
                type="button"
                onClick={() => setYearly(Boolean(v))}
                style={{
                  padding: "8px 16px",
                  background:
                    yearly === v
                      ? "linear-gradient(135deg, rgba(251,15,5,0.2), rgba(0,39,254,0.15))"
                      : "transparent",
                  border:
                    yearly === v ? "1px solid var(--line-strong)" : "1px solid transparent",
                  borderRadius: 8,
                  color: yearly === v ? "var(--fg)" : "var(--fg-dim)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {l as string}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
          className="pricing-grid"
        >
          {plans.map((p) => (
            <div
              key={p.name}
              style={{
                padding: 28,
                borderRadius: 22,
                position: "relative",
                background: p.featured
                  ? "linear-gradient(180deg, rgba(251,15,5,0.08) 0%, rgba(0,39,254,0.04) 100%)"
                  : "rgba(20,15,30,0.025)",
                border: p.featured ? "1px solid rgba(0,39,254,0.4)" : "1px solid var(--line)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                boxShadow: p.featured ? "0 30px 80px -30px rgba(0,39,254,0.4)" : "none",
              }}
            >
              {p.featured && (
                <div
                  style={{
                    position: "absolute",
                    top: -12,
                    right: 24,
                    padding: "5px 12px",
                    background: "linear-gradient(135deg, #fb0f05, #0027fe)",
                    color: "white",
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    fontWeight: 500,
                    letterSpacing: "0.06em",
                    borderRadius: 999,
                    textTransform: "uppercase",
                    boxShadow: "0 8px 20px -4px rgba(0,39,254,0.5)",
                  }}
                >
                  Más popular
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: p.accent,
                    boxShadow: `0 0 12px ${p.accent}`,
                  }}
                />
                <span
                  style={{
                    fontSize: 14,
                    color: "var(--fg-dim)",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {p.name.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: 15, color: "var(--fg-mute)", marginBottom: 20 }}>{p.sub}</div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 42,
                    fontWeight: 500,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {fmt(yearly ? p.yearly : p.monthly)}
                </span>
                <span style={{ color: "var(--fg-mute)", fontSize: 14 }}>/ mes</span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--fg-mute)",
                  marginBottom: 24,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {yearly
                  ? `Facturado anual · ${fmt(p.yearly * 12)} COP`
                  : "Facturado mensual"}
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {p.features.map((f, j) => (
                  <div
                    key={j}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      fontSize: 13.5,
                    }}
                  >
                    <IconCheck size={14} style={{ color: p.accent, marginTop: 3, flexShrink: 0 }} />
                    <span style={{ color: "var(--fg-dim)" }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/register"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  width: "100%",
                  padding: "11px 18px",
                  borderRadius: 12,
                  background:
                    p.ctaVariant === "primary"
                      ? "linear-gradient(135deg, #fb0f05 0%, #0027fe 100%)"
                      : "rgba(20,15,30,0.06)",
                  color: p.ctaVariant === "primary" ? "white" : "var(--fg)",
                  border: p.ctaVariant === "primary" ? "none" : "1px solid var(--line-strong)",
                  fontSize: 14.5,
                  fontWeight: 500,
                  fontFamily: "var(--font-sans)",
                  textDecoration: "none",
                  boxShadow:
                    p.ctaVariant === "primary"
                      ? "0 8px 30px -10px rgba(0,39,254,0.45), inset 0 1px 0 rgba(255,255,255,0.25)"
                      : "none",
                }}
              >
                <span>{p.cta}</span>
                <IconArrow size={14} />
              </Link>
            </div>
          ))}
        </div>
        <div
          style={{
            textAlign: "center",
            marginTop: 32,
            color: "var(--fg-mute)",
            fontSize: 13,
          }}
        >
          14 días gratis · Sin tarjeta · Cancela cuando quieras · Soporte 100% en español 🇨🇴
        </div>
      </Container>
    </section>
  );
}
