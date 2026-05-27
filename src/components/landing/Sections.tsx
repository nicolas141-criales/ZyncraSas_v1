"use client";

import type { CSSProperties, ReactNode } from "react";
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
  Counter,
  Eyebrow,
  GradientOrb,
  SectionTitle,
} from "./primitives";

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
    <section style={{ padding: "60px 0 100px", position: "relative" }}>
      <Container max={1240}>
        <div
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
            <div
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
                <Counter
                  to={s.val}
                  prefix={s.prefix}
                  suffix={s.suffix}
                  decimals={s.decimals || 0}
                  duration={1800}
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
            </div>
          ))}
        </div>
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
    <section id="industrias" style={{ padding: "80px 0", position: "relative" }}>
      <Container max={1240}>
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
      </Container>
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
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 22px",
                border: "1px solid var(--line)",
                borderRadius: 999,
                background: "rgba(20,15,30,0.025)",
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
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 22px",
                  border: "1px solid var(--line)",
                  borderRadius: 999,
                  background: "rgba(20,15,30,0.025)",
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
    </section>
  );
}

// ── CtaSection ──
export function CtaSection() {
  return (
    <section
      id="cta"
      style={{ padding: "120px 0", position: "relative", overflow: "hidden" }}
    >
      <Container max={1240}>
        <div
          style={{
            position: "relative",
            padding: "80px 60px",
            borderRadius: 28,
            background:
              "linear-gradient(135deg, rgba(167,139,250,0.18) 0%, rgba(236,72,153,0.12) 50%, rgba(251,146,60,0.08) 100%)",
            border: "1px solid rgba(167,139,250,0.3)",
            overflow: "hidden",
            textAlign: "center",
            boxShadow: "0 40px 100px -30px rgba(236,72,153,0.4)",
          }}
          className="cta-wrap"
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
          <GradientOrb color="#A78BFA" size={400} x="-10%" y="-30%" opacity={0.4} />
          <GradientOrb color="#EC4899" size={400} x="70%" y="60%" opacity={0.35} />

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
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/register"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 22px",
                  borderRadius: 14,
                  background:
                    "linear-gradient(135deg, #A78BFA 0%, #EC4899 60%, #FB923C 100%)",
                  color: "white",
                  fontSize: 16,
                  fontWeight: 500,
                  fontFamily: "var(--font-sans)",
                  letterSpacing: "-0.01em",
                  textDecoration: "none",
                  boxShadow:
                    "0 8px 30px -10px rgba(167,139,250,0.55), inset 0 1px 0 rgba(255,255,255,0.25)",
                }}
              >
                <span>Empezar gratis</span>
                <IconArrow size={16} />
              </Link>
              <a
                href="https://wa.me/573001234567?text=Hola%2C+me+interesa+Zyncra"
                target="_blank"
                rel="noopener noreferrer"
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
            </div>
            <div
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
      </Container>
    </section>
  );
}

// ── FeaturesGrid ──
type Feature = {
  icon: ReactNode;
  title: string;
  desc: string;
  color: string;
  span?: number;
  visual?: ReactNode;
};

export function FeaturesGrid() {
  const features: Feature[] = [
    {
      icon: <IconCalendar size={22} />,
      title: "Agenda inteligente",
      desc: "Reservas 24/7 desde tu link público. Tus clientes eligen, confirman y pagan solos.",
      color: "#A78BFA",
      span: 2,
      visual: (
        <div
          style={{
            padding: 16,
            marginTop: 14,
            background: "rgba(20,15,30,0.02)",
            borderRadius: 12,
            border: "1px solid var(--line)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}
          >
            <span
              className="mono"
              style={{ fontSize: 10, color: "var(--fg-mute)" }}
            >
              tuyo.zyncra.com
            </span>
            <span
              style={{ flex: 1, height: 1, background: "var(--line)" }}
            />
            <span
              style={{
                fontSize: 10,
                padding: "2px 8px",
                borderRadius: 999,
                background: "rgba(52,211,153,0.15)",
                color: "var(--green)",
                fontFamily: "var(--font-mono)",
              }}
            >
              ● online
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 4,
              fontSize: 10,
            }}
          >
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
              <div
                key={i}
                style={{ textAlign: "center", color: "var(--fg-mute)" }}
              >
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
                    borderRadius: 6,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 11,
                    background: today
                      ? "linear-gradient(135deg, #A78BFA, #EC4899)"
                      : taken
                        ? "rgba(167,139,250,0.18)"
                        : "rgba(255,255,255,0.03)",
                    color: today ? "white" : "var(--fg-dim)",
                    border:
                      "1px solid " +
                      (taken && !today
                        ? "rgba(167,139,250,0.3)"
                        : "var(--line)"),
                  }}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>
        </div>
      ),
    },
    {
      icon: <IconWhatsapp size={22} />,
      title: "Marketing WhatsApp",
      desc: "Campañas segmentadas, recordatorios y reseñas automáticas.",
      color: "#34D399",
    },
    {
      icon: <IconCard size={22} />,
      title: "POS + DIAN",
      desc: "Cobra con Nequi, Daviplata, efectivo o tarjeta. CUFE y XML automáticos.",
      color: "#EC4899",
    },
    {
      icon: <IconStar size={22} />,
      title: "Reseñas Google",
      desc: "Solicita reseñas después de cada visita. Tu ranking sube solo.",
      color: "#FBBF24",
    },
    {
      icon: <IconUsers size={22} />,
      title: "Comisiones",
      desc: "Liquida comisiones de tu equipo en un clic. Sin disputas, sin errores.",
      color: "#22D3EE",
    },
    {
      icon: <IconChart size={22} />,
      title: "Reportes en tiempo real",
      desc: "Mira qué servicios y profesionales generan más. Decide con datos.",
      color: "#FB923C",
      span: 2,
      visual: (
        <div
          style={{
            padding: 16,
            marginTop: 14,
            background: "rgba(20,15,30,0.02)",
            borderRadius: 12,
            border: "1px solid var(--line)",
            position: "relative",
            height: 110,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "var(--fg-mute)",
                fontFamily: "var(--font-mono)",
              }}
            >
              INGRESOS · 30D
            </span>
            <span
              style={{
                fontSize: 11,
                color: "var(--green)",
                fontFamily: "var(--font-mono)",
              }}
            >
              ↑ +22%
            </span>
          </div>
          <svg
            width="100%"
            height="70"
            viewBox="0 0 300 70"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FB923C" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#FB923C" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0,50 L25,42 L50,46 L75,30 L100,38 L125,28 L150,32 L175,18 L200,22 L225,12 L250,16 L275,8 L300,12 L300,70 L0,70 Z"
              fill="url(#sparkfill)"
            />
            <path
              d="M0,50 L25,42 L50,46 L75,30 L100,38 L125,28 L150,32 L175,18 L200,22 L225,12 L250,16 L275,8 L300,12"
              stroke="#FB923C"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ),
    },
  ];
  return (
    <section id="funciones" style={{ padding: "120px 0", position: "relative" }}>
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
          className="feat-grid"
        >
          {features.map((f, i) => (
            <Card
              key={i}
              hover
              style={{
                padding: 24,
                gridColumn: f.span === 2 ? "span 2" : "span 1",
                height: "100%",
                position: "relative",
                overflow: "hidden",
              }}
              className={f.span === 2 ? "feat-card feat-wide" : "feat-card"}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${f.color}33, ${f.color}11)`,
                  border: `1px solid ${f.color}44`,
                  display: "grid",
                  placeItems: "center",
                  color: f.color,
                  marginBottom: 16,
                }}
              >
                {f.icon}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                  marginBottom: 6,
                }}
              >
                {f.title}
              </div>
              <div
                style={{
                  fontSize: 13.5,
                  color: "var(--fg-dim)",
                  lineHeight: 1.5,
                }}
              >
                {f.desc}
              </div>
              {f.visual}
            </Card>
          ))}
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
      color: "#A78BFA",
      icon: <IconBolt size={20} />,
    },
    {
      n: "02",
      title: "Comparte tu enlace",
      desc: "tuyo.zyncra.com — tus clientes reservan en segundos, sin apps, sin descargas.",
      color: "#EC4899",
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
      style={{ padding: "120px 0", position: "relative", overflow: "hidden" }}
    >
      <GradientOrb color="#A78BFA" size={500} x="60%" y="20%" opacity={0.12} />
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
