"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  IconArrow,
  IconBolt,
  IconBrush,
  IconCalendar,
  IconCamera,
  IconCard,
  IconChart,
  IconChat,
  IconCheck,
  IconEye,
  IconGlobe,
  IconHand,
  IconHeart,
  IconLotus,
  IconPaw,
  IconScissors,
  IconSpa,
  IconSparkle,
  IconStar,
  IconTooth,
  IconUsers,
  IconWhatsapp,
} from "./icons";
import {
  Card,
  Container,
  Eyebrow,
  GradientOrb,
  SectionTitle,
} from "./primitives";
import {
  CountUp,
  Magnetic,
  Reveal,
  Stagger,
  StaggerItem,
} from "./motion";

// ── StatsBar ──
export function StatsBar() {
  const stats = [
    {
      val: 500,
      prefix: "",
      suffix: "+",
      label: "Negocios activos",
      sub: "En 24 ciudades de Colombia",
    },
    {
      val: 1,
      prefix: "",
      suffix: "M+",
      label: "Citas gestionadas",
      sub: "Y subiendo todos los días",
    },
    {
      val: 60,
      prefix: "−",
      suffix: "%",
      label: "Menos no-shows",
      sub: "Promedio en 90 días",
    },
    {
      val: 4.9,
      prefix: "",
      suffix: "★",
      label: "Valoración",
      sub: "548 reseñas verificadas",
      decimals: 1,
    },
  ];
  return (
    <section style={{ padding: "40px 0 64px", position: "relative" }}>
      <Container max={1240}>
        <Stagger
          gap={0.1}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 0,
            background:
              "linear-gradient(180deg, rgba(20,15,30,0.025) 0%, rgba(20,15,30,0.005) 100%)",
            border: "1px solid var(--line)",
            borderRadius: 22,
            overflow: "hidden",
          }}
          className="stats-grid"
        >
          {stats.map((s, i) => (
            <StaggerItem
              key={i}
              style={{
                padding: "32px 28px",
                borderRight: i < 3 ? "1px solid var(--line)" : "none",
                position: "relative",
              }}
              className="stats-cell"
            >
              <div
                className="mono"
                style={{
                  fontSize: "clamp(34px, 4vw, 52px)",
                  fontWeight: 500,
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                  marginBottom: 10,
                }}
              >
                <CountUp
                  to={s.val}
                  prefix={s.prefix}
                  suffix={s.suffix}
                  decimals={s.decimals || 0}
                  duration={1.9}
                />
              </div>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: "var(--fg)",
                  marginBottom: 4,
                }}
              >
                {s.label}
              </div>
              <div style={{ fontSize: 12, color: "var(--fg-mute)" }}>
                {s.sub}
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}

// ── IndustriesMarquee ──
export function IndustriesMarquee() {
  const items: { icon: ReactNode; label: string }[] = [
    { icon: <IconScissors size={18} />, label: "Barberías" },
    { icon: <IconBrush size={18} />, label: "Salones de belleza" },
    { icon: <IconSpa size={18} />, label: "Spas & bienestar" },
    { icon: <IconHand size={18} />, label: "Manicuristas" },
    { icon: <IconHeart size={18} />, label: "Clínicas estéticas" },
    { icon: <IconLotus size={18} />, label: "Yoga & fitness" },
    { icon: <IconBrush size={18} />, label: "Tatuadores" },
    { icon: <IconEye size={18} />, label: "Micropigmentación" },
    { icon: <IconTooth size={18} />, label: "Odontología estética" },
    { icon: <IconPaw size={18} />, label: "Veterinarias" },
    { icon: <IconCamera size={18} />, label: "Fotografía" },
    { icon: <IconSparkle size={18} />, label: "Maquillaje" },
  ];
  const row = [...items, ...items];
  return (
    <section id="industrias" style={{ padding: "56px 0", position: "relative" }}>
      <Container max={1240}>
        <Reveal>
          <SectionTitle
            eyebrow="Diseñado para tí"
            title={
              <>
                Para cualquier negocio{" "}
                <span className="gradient-text">que trabaje con citas.</span>
              </>
            }
            sub="Si tu calendario es tu activo más importante, Zyncra es para ti. Pensado para profesionales, no para corporaciones."
            align="center"
          />
        </Reveal>
      </Container>
      <Reveal delay={0.12} y={20}>
        <div
          style={{
            position: "relative",
            maskImage:
              "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
            WebkitMaskImage:
              "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
            overflow: "hidden",
          }}
        >
          <div
            className="zn-marquee-row"
            style={{
              display: "flex",
              gap: 14,
              width: "max-content",
              animation: "scrollX 40s linear infinite",
              padding: "8px 0",
            }}
          >
            {row.map((it, i) => (
              <div
                key={`a-${i}`}
                className="zn-chip-glass"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 22px",
                  border: "1px solid var(--line)",
                  borderRadius: 999,
                  fontSize: 14.5,
                  whiteSpace: "nowrap",
                  color: "var(--fg-dim)",
                }}
              >
                <span style={{ color: "var(--violet-2)" }}>{it.icon}</span>
                {it.label}
              </div>
            ))}
          </div>
          <div
            className="zn-marquee-row"
            style={{
              display: "flex",
              gap: 14,
              width: "max-content",
              animation: "scrollX 50s linear infinite reverse",
              padding: "8px 0",
              marginTop: 14,
            }}
          >
            {row
              .slice()
              .reverse()
              .map((it, i) => (
                <div
                  key={`b-${i}`}
                  className="zn-chip-glass"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "14px 22px",
                    border: "1px solid var(--line)",
                    borderRadius: 999,
                    fontSize: 14.5,
                    whiteSpace: "nowrap",
                    color: "var(--fg-dim)",
                  }}
                >
                  <span style={{ color: "var(--magenta)" }}>{it.icon}</span>
                  {it.label}
                </div>
              ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

// ── CtaSection ──
export function CtaSection() {
  return (
    <section
      id="cta"
      style={{ padding: "72px 0", position: "relative", overflowX: "clip" }}
    >
      <Container max={1240}>
        <Reveal y={36}>
        <div
          style={{
            position: "relative",
            padding: "56px 52px",
            borderRadius: 28,
            background:
              "linear-gradient(135deg, rgba(251,15,5,0.18) 0%, rgba(0,39,254,0.12) 100%)",
            backgroundSize: "180% 180%",
            animation: "znGradientShift 9s ease infinite",
            border: "1px solid rgba(0,39,254,0.3)",
            overflow: "hidden",
            textAlign: "center",
            boxShadow: "0 40px 100px -30px rgba(0,39,254,0.4)",
          }}
          className="cta-wrap zn-beam-border"
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(rgba(20,15,30,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(20,15,30,0.04) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
              maskImage:
                "radial-gradient(ellipse at center, black 20%, transparent 70%)",
              WebkitMaskImage:
                "radial-gradient(ellipse at center, black 20%, transparent 70%)",
            }}
          />
          <GradientOrb color="#fb0f05" size={400} x="-10%" y="-30%" opacity={0.4} />
          <GradientOrb color="#0027fe" size={400} x="70%" y="60%" opacity={0.35} />

          <div style={{ position: "relative" }}>
            <Eyebrow accent>Únete a 500+ negocios</Eyebrow>
            <h2
              style={{
                fontSize: "clamp(36px, 5vw, 64px)",
                lineHeight: 1.02,
                letterSpacing: "-0.04em",
                fontWeight: 500,
                margin: "20px 0 18px",
              }}
            >
              ¿Listo para tu negocio
              <br />
              <span className="serif gradient-text">
                en piloto automático?
              </span>
            </h2>
            <p
              style={{
                fontSize: 17,
                color: "var(--fg-dim)",
                margin: "0 auto 32px",
                maxWidth: 540,
                lineHeight: 1.55,
              }}
            >
              14 días gratis. Sin tarjeta. Si no te sirve, te ayudamos a migrar a
              otro lado. En serio.
            </p>
            <div
              className="cta-buttons"
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <Magnetic>
                <Link
                  href="/register"
                  className="zn-cta-glow"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "14px 22px",
                    borderRadius: 14,
                    background:
                      "linear-gradient(135deg, #fb0f05 0%, #0027fe 100%)",
                    color: "white",
                    fontSize: 16,
                    fontWeight: 500,
                    fontFamily: "var(--font-sans)",
                    letterSpacing: "-0.01em",
                    textDecoration: "none",
                    boxShadow:
                      "0 8px 30px -10px rgba(0,39,254,0.45), inset 0 1px 0 rgba(255,255,255,0.25)",
                  }}
                >
                  <span>Empezar gratis</span>
                  <IconArrow size={16} />
                </Link>
              </Magnetic>
              <Magnetic strength={0.2}>
                <a
                  href="https://wa.me/573001234567?text=Hola%2C+me+interesa+Zyncra"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="zn-btn-soft"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "14px 22px",
                    borderRadius: 14,
                    background: "rgba(20,15,30,0.06)",
                    color: "var(--fg)",
                    border: "1px solid var(--line-strong)",
                    fontSize: 16,
                    fontWeight: 500,
                    fontFamily: "var(--font-sans)",
                    textDecoration: "none",
                    letterSpacing: "-0.01em",
                  }}
                >
                  <IconChat size={15} />
                  <span>Hablar por WhatsApp</span>
                </a>
              </Magnetic>
            </div>
            <div
              className="cta-trust"
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 22,
                marginTop: 28,
                color: "var(--fg-mute)",
                fontSize: 13,
                flexWrap: "wrap",
              }}
            >
              {[
                "14 días gratis",
                "Sin tarjeta",
                "Cancela cuando quieras",
                "Soporte 🇨🇴",
              ].map((t) => (
                <span
                  key={t}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <IconCheck size={14} style={{ color: "var(--green)" }} />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
        </Reveal>
      </Container>
    </section>
  );
}

// ── FeaturesGrid ──
const compactFeatures = [
  {
    icon: <IconWhatsapp size={16} />,
    title: "Marketing WhatsApp",
    desc: "Campañas segmentadas y recordatorios automáticos.",
    color: "#34D399",
    metric: "Apertura 98%",
  },
  {
    icon: <IconCard size={16} />,
    title: "POS + DIAN",
    desc: "Nequi, Daviplata o tarjeta. CUFE y XML automáticos.",
    color: "#0027fe",
    metric: "CUFE automático",
  },
  {
    icon: <IconStar size={16} />,
    title: "Reseñas Google",
    desc: "Solicita reseñas tras cada visita. Tu ranking sube solo.",
    color: "#FBBF24",
    metric: "Rating ↑ auto",
  },
  {
    icon: <IconUsers size={16} />,
    title: "Comisiones",
    desc: "Liquida comisiones de tu equipo en un clic.",
    color: "#22D3EE",
    metric: "Sin disputas",
  },
];

export function FeaturesGrid() {
  return (
    <section id="funciones" style={{ padding: "72px 0", position: "relative" }}>
      <Container max={1240}>
        <SectionTitle
          eyebrow="Funcionalidades"
          title={
            <>
              Todo en uno. <span className="serif">Sin pestañas.</span> Sin caos.
            </>
          }
          sub="Una plataforma completa para negocios de servicios que trabajan con citas. Reemplaza 5 herramientas con una sola."
          align="left"
        />

        {/* Row 1: Agenda (big) + 2×2 compact grid */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: 14 }}
          className="feat-main-grid"
        >
          {/* Agenda — big card */}
          <Card hover style={{ padding: 26, position: "relative", overflow: "hidden" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: "linear-gradient(135deg, rgba(251,15,5,0.18), rgba(251,15,5,0.06))",
                border: "1px solid rgba(251,15,5,0.28)",
                display: "grid",
                placeItems: "center",
                color: "#fb0f05",
                marginBottom: 12,
              }}
            >
              <IconCalendar size={18} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 4 }}>
              Agenda inteligente
            </div>
            <div style={{ fontSize: 13, color: "var(--fg-dim)", lineHeight: 1.5, marginBottom: 16 }}>
              Reservas 24/7 desde tu link público. Tus clientes eligen, confirman y pagan solos.
            </div>
            {/* Calendar mini */}
            <div
              style={{
                padding: 14,
                background: "var(--bg-elev)",
                borderRadius: 10,
                border: "1px solid var(--line)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span className="mono" style={{ fontSize: 10, color: "var(--fg-mute)" }}>
                  tuyo.zyncra.com
                </span>
                <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 7px",
                    borderRadius: 999,
                    background: "rgba(52,211,153,0.12)",
                    color: "var(--green)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  ● en línea
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, fontSize: 10 }}>
                {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                  <div key={i} style={{ textAlign: "center", color: "var(--fg-mute)", paddingBottom: 2 }}>
                    {d}
                  </div>
                ))}
                {Array.from({ length: 21 }).map((_, i) => {
                  const taken = [1, 3, 4, 6, 9, 10, 13, 15, 16, 18].includes(i);
                  const today = i === 8;
                  return (
                    <div
                      key={i}
                      style={{
                        aspectRatio: "1",
                        borderRadius: 5,
                        display: "grid",
                        placeItems: "center",
                        fontSize: 10,
                        background: today
                          ? "linear-gradient(135deg, #fb0f05, #0027fe)"
                          : taken
                            ? "rgba(0,39,254,0.12)"
                            : "transparent",
                        color: today ? "white" : taken ? "var(--fg-dim)" : "var(--fg-mute)",
                        border: "1px solid " + (today ? "transparent" : taken ? "rgba(0,39,254,0.22)" : "var(--line)"),
                      }}
                    >
                      {i + 1}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* 2×2 compact grid */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 14 }}
            className="feat-compact-grid"
          >
            {compactFeatures.map((f, i) => (
              <Card
                key={i}
                hover
                style={{ padding: 18, display: "flex", flexDirection: "column", gap: 0, position: "relative", overflow: "hidden" }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: `${f.color}1a`,
                    border: `1px solid ${f.color}33`,
                    display: "grid",
                    placeItems: "center",
                    color: f.color,
                    marginBottom: 10,
                    flexShrink: 0,
                  }}
                >
                  {f.icon}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.015em", marginBottom: 4, lineHeight: 1.3 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--fg-dim)", lineHeight: 1.45, flex: 1 }}>
                  {f.desc}
                </div>
                <div
                  style={{
                    marginTop: 12,
                    display: "inline-flex",
                    alignSelf: "flex-start",
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                    fontWeight: 500,
                    padding: "3px 8px",
                    borderRadius: 999,
                    background: `${f.color}15`,
                    color: f.color,
                    border: `1px solid ${f.color}28`,
                  }}
                >
                  {f.metric}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Row 2: Reportes — full-width horizontal strip */}
        <div style={{ marginTop: 14 }}>
          <Card hover style={{ padding: "22px 26px", display: "flex", alignItems: "center", gap: 32, overflow: "hidden", position: "relative" }} className="feat-report-strip">
            {/* Left: text */}
            <div style={{ flex: "0 0 auto", maxWidth: 280 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: "rgba(251,146,60,0.14)",
                  border: "1px solid rgba(251,146,60,0.28)",
                  display: "grid",
                  placeItems: "center",
                  color: "#FB923C",
                  marginBottom: 12,
                }}
              >
                <IconChart size={18} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 4 }}>
                Reportes en tiempo real
              </div>
              <div style={{ fontSize: 13, color: "var(--fg-dim)", lineHeight: 1.5 }}>
                Mira qué servicios y profesionales generan más. Toma decisiones con datos, no con intuición.
              </div>
            </div>

            {/* Right: chart */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  padding: "12px 16px",
                  background: "var(--bg-elev)",
                  borderRadius: 10,
                  border: "1px solid var(--line)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 10, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>
                    INGRESOS · 30D
                  </span>
                  <span style={{ fontSize: 10, color: "var(--green)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                    ↑ +22%
                  </span>
                </div>
                <svg width="100%" height="52" viewBox="0 0 300 52" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="sparkfill2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0027fe" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#0027fe" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,40 L25,33 L50,37 L75,22 L100,30 L125,20 L150,24 L175,12 L200,15 L225,7 L250,10 L275,4 L300,7 L300,52 L0,52 Z"
                    fill="url(#sparkfill2)"
                  />
                  <path
                    d="M0,40 L25,33 L50,37 L75,22 L100,30 L125,20 L150,24 L175,12 L200,15 L225,7 L250,10 L275,4 L300,7"
                    stroke="#0027fe"
                    strokeWidth="1.8"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </section>
  );
}

// ── ProcessSteps ──
export function ProcessSteps() {
  const steps = [
    {
      n: "01",
      title: "Configura en minutos",
      desc: "Agrega tus servicios, equipo, precios y horarios. Sube tu logo. Activa tu agenda pública.",
      color: "#fb0f05",
      icon: <IconBolt size={20} />,
    },
    {
      n: "02",
      title: "Comparte tu enlace",
      desc: "tuyo.zyncra.com — tus clientes reservan en segundos, sin apps, sin descargas.",
      color: "#0027fe",
      icon: <IconGlobe size={20} />,
    },
    {
      n: "03",
      title: "Crece sin estrés",
      desc: "Recordatorios automáticos, POS integrado y dashboards en tiempo real. Tú haces tu arte.",
      color: "#FB923C",
      icon: <IconChart size={20} />,
    },
  ];
  return (
    <section
      style={{ padding: "72px 0", position: "relative", overflowX: "clip" }}
    >
      <GradientOrb color="#fb0f05" size={500} x="60%" y="20%" opacity={0.12} />
      <Container max={1240}>
        <SectionTitle
          eyebrow="Proceso"
          title={
            <>
              De cero a operando,{" "}
              <span className="gradient-text">en 5 minutos.</span>
            </>
          }
          sub="Sin instalaciones. Sin tarjeta. Sin llamadas con vendedores."
          align="center"
        />
        <div style={{ position: "relative" }}>
          <div
            style={{
              position: "absolute",
              top: 40,
              left: "12%",
              right: "12%",
              height: 1,
              background:
                "linear-gradient(90deg, transparent, var(--line-strong), var(--line-strong), transparent)",
              zIndex: 0,
            }}
            className="process-line"
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 30,
              position: "relative",
              zIndex: 1,
            }}
            className="process-grid"
          >
            {steps.map((s, i) => (
              <div key={i} style={{ textAlign: "left" }}>
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 20,
                    background: `linear-gradient(135deg, ${s.color}22, ${s.color}05)`,
                    border: `1px solid ${s.color}44`,
                    display: "grid",
                    placeItems: "center",
                    marginBottom: 24,
                    position: "relative",
                  }}
                >
                  <span
                    className="mono"
                    style={{ fontSize: 24, fontWeight: 500, color: s.color }}
                  >
                    {s.n}
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      width: 26,
                      height: 26,
                      borderRadius: 8,
                      background: "var(--bg)",
                      border: `1px solid ${s.color}44`,
                      display: "grid",
                      placeItems: "center",
                      color: s.color,
                    }}
                  >
                    {s.icon}
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: 22,
                    margin: 0,
                    marginBottom: 10,
                    letterSpacing: "-0.02em",
                    fontWeight: 500,
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    color: "var(--fg-dim)",
                    fontSize: 14.5,
                    lineHeight: 1.55,
                    maxWidth: 320,
                  }}
                >
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
