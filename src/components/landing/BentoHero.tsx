"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconArrow,
  IconCalendar,
  IconCheck,
  IconGlobe,
  IconPlay,
  IconStar,
  IconWhatsapp,
} from "./icons";
import {
  Container,
  GradientOrb,
  GridBackdrop,
} from "./primitives";
import {
  LineReveal,
  Magnetic,
  Parallax,
  Particles,
  TickerNumber,
  TiltCard,
  motion,
} from "./motion";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* Entrada secuencial del hero (carga de página) */
const HeroFade = ({
  children,
  delay = 0,
  style,
  className,
}: {
  children: ReactNode;
  delay?: number;
  style?: CSSProperties;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    transition={{ duration: 0.7, delay, ease: EASE }}
    style={style}
    className={className}
  >
    {children}
  </motion.div>
);

const BentoHeroTile = ({
  children,
  span = 1,
  rowSpan = 1,
  accent = "#fb0f05",
  style = {},
  padding = 18,
  className,
  index = 0,
}: {
  children: ReactNode;
  span?: number;
  rowSpan?: number;
  accent?: string;
  style?: CSSProperties;
  padding?: number;
  className?: string;
  index?: number;
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 34, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.75, delay: 0.55 + index * 0.09, ease: EASE }}
    style={{
      gridColumn: `span ${span}`,
      gridRow: `span ${rowSpan}`,
      display: "flex",
      minHeight: 160,
    }}
  >
    <TiltCard
      max={4}
      lift={-4}
      spotlight={`${accent}16`}
      className="zn-tile"
      style={{
        flex: 1,
        position: "relative",
        background:
          "linear-gradient(180deg, rgba(20,15,30,0.04) 0%, rgba(20,15,30,0.01) 100%)",
        border: "1px solid var(--line)",
        borderRadius: 18,
        padding,
        overflow: "hidden",
        backdropFilter: "blur(10px)",
        minHeight: 160,
        ...style,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -1,
          left: 12,
          right: 12,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${accent}aa, transparent)`,
        }}
      />
      {children}
    </TiltCard>
  </motion.div>
);

type AgendaItem = { t: string; s: string; c: string; d: number };

const TileAgenda = () => {
  const [items, setItems] = useState<AgendaItem[]>([
    { t: "09:00", s: "Corte + Barba", c: "#fb0f05", d: 45 },
    { t: "10:30", s: "Degradado", c: "#0027fe", d: 30 },
    { t: "13:30", s: "Pack Premium", c: "#FB923C", d: 60 },
  ]);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 2000);
      const candidates: AgendaItem[] = [
        { t: "11:30", s: "Manicure", c: "#22D3EE", d: 30 },
        { t: "15:00", s: "Color", c: "#34D399", d: 60 },
        { t: "16:45", s: "Spa Facial", c: "#FBBF24", d: 45 },
      ];
      const pick = candidates[Math.floor(Math.random() * 3)];
      setItems((prev) =>
        [...prev, pick].sort((a, b) => a.t.localeCompare(b.t)).slice(-4),
      );
      return () => clearTimeout(t);
    }, 5500);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <IconCalendar size={14} style={{ color: "var(--violet-2)" }} />
          <span
            style={{
              fontSize: 12,
              color: "var(--fg-dim)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.05em",
            }}
          >
            AGENDA · HOY
          </span>
        </div>
        {flash && (
          <span
            style={{
              fontSize: 10,
              padding: "3px 8px",
              background: "rgba(52,211,153,0.15)",
              color: "var(--green)",
              borderRadius: 999,
              fontFamily: "var(--font-mono)",
              animation: "fadeUp .3s ease",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span
              style={{
                width: 4,
                height: 4,
                borderRadius: 999,
                background: "var(--green)",
                animation: "pulseGlow 1s infinite",
              }}
            />
            +1 reserva
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((it, idx) => (
          <div
            key={`${it.t}-${idx}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              background: `linear-gradient(90deg, ${it.c}15 0%, transparent 100%)`,
              border: `1px solid ${it.c}33`,
              borderLeft: `3px solid ${it.c}`,
              borderRadius: 8,
              animation: "fadeUp .35s ease",
            }}
          >
            <span
              className="mono"
              style={{ fontSize: 11, color: "var(--fg-mute)", width: 36 }}
            >
              {it.t}
            </span>
            <span style={{ fontSize: 12.5, flex: 1, fontWeight: 500 }}>
              {it.s}
            </span>
            <span
              className="mono"
              style={{ fontSize: 10, color: "var(--fg-mute)" }}
            >
              {it.d}m
            </span>
          </div>
        ))}
      </div>
    </>
  );
};

const TileWa = () => (
  <>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #25D366, #128C7E)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <IconWhatsapp size={12} style={{ color: "white" }} />
      </div>
      <span
        style={{
          fontSize: 12,
          color: "var(--fg-dim)",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.05em",
        }}
      >
        WHATSAPP BOT
      </span>
      <span
        style={{
          marginLeft: "auto",
          fontSize: 10,
          color: "var(--green)",
          fontFamily: "var(--font-mono)",
        }}
      >
        ● activo
      </span>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          alignSelf: "flex-start",
          maxWidth: "85%",
          background: "var(--wa-bubble-in)",
          color: "var(--wa-text-in)",
          padding: "7px 10px",
          borderRadius: "10px 10px 10px 3px",
          fontSize: 11.5,
          lineHeight: 1.35,
          border: "1px solid rgba(52,211,153,0.25)",
        }}
      >
        Hola Camila 👋 Tu cita es mañana 10:30.
      </div>
      <div
        style={{
          alignSelf: "flex-start",
          display: "flex",
          gap: 5,
          marginTop: 2,
        }}
      >
        <span
          style={{
            fontSize: 10,
            padding: "4px 8px",
            background: "rgba(37,211,102,0.12)",
            border: "1px solid rgba(37,211,102,0.3)",
            color: "var(--wa-online)",
            borderRadius: 999,
            fontFamily: "var(--font-mono)",
          }}
        >
          Confirmar ✓
        </span>
        <span
          style={{
            fontSize: 10,
            padding: "4px 8px",
            background: "rgba(20,15,30,0.04)",
            border: "1px solid var(--line)",
            color: "var(--fg-mute)",
            borderRadius: 999,
            fontFamily: "var(--font-mono)",
          }}
        >
          Reprogramar
        </span>
      </div>
      <div
        style={{
          alignSelf: "flex-end",
          maxWidth: "70%",
          background: "linear-gradient(135deg, #15A85A, #0E7A40)",
          color: "white",
          padding: "7px 10px",
          borderRadius: "10px 10px 3px 10px",
          fontSize: 11.5,
          marginTop: 6,
        }}
      >
        Confirmar ✓
      </div>
    </div>
  </>
);

const TileRevenue = () => {
  const [r, setR] = useState(2840);
  useEffect(() => {
    const id = setInterval(
      () => setR((v) => v + Math.floor(Math.random() * 60) + 20),
      1500,
    );
    return () => clearInterval(id);
  }, []);
  return (
    <>
      <div
        style={{
          fontSize: 11,
          color: "var(--fg-mute)",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.05em",
          marginBottom: 8,
        }}
      >
        INGRESOS HOY
      </div>
      <div
        className="mono gradient-text"
        style={{
          fontSize: "clamp(28px, 3vw, 38px)",
          fontWeight: 500,
          letterSpacing: "-0.03em",
          lineHeight: 1,
        }}
      >
        $<TickerNumber value={r} />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 6,
          marginTop: 6,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 11.5,
            color: "var(--green)",
            fontFamily: "var(--font-mono)",
          }}
        >
          ↑ +22%
        </span>
        <span style={{ fontSize: 11.5, color: "var(--fg-mute)" }}>vs ayer</span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 3,
          height: 32,
        }}
      >
        {[40, 55, 35, 65, 50, 75, 60, 85, 70, 90, 80, 95].map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${h}%`,
              background:
                i === 11
                  ? "linear-gradient(180deg, #0027fe, #fb0f05)"
                  : "rgba(0,39,254,0.25)",
              borderRadius: 2,
              transformOrigin: "bottom",
              animation: `znBarGrow .7s ${1.1 + i * 0.05}s cubic-bezier(.22,1,.36,1) both`,
            }}
          />
        ))}
      </div>
    </>
  );
};

const TilePos = () => (
  <>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: 10,
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: "var(--fg-mute)",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.05em",
        }}
      >
        VENTA #2841
      </span>
      <span
        style={{
          fontSize: 9.5,
          padding: "2px 7px",
          borderRadius: 999,
          background: "rgba(52,211,153,0.15)",
          color: "var(--green)",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.06em",
        }}
      >
        PAGADO
      </span>
    </div>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        marginBottom: 10,
        fontSize: 11.5,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          color: "var(--fg-dim)",
        }}
      >
        <span>Corte + Barba</span>
        <span className="mono">$35.000</span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          color: "var(--fg-dim)",
        }}
      >
        <span>Color</span>
        <span className="mono">$60.000</span>
      </div>
    </div>
    <div
      style={{
        paddingTop: 8,
        borderTop: "1px dashed var(--line)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 8,
      }}
    >
      <span style={{ fontSize: 10.5, color: "var(--fg-mute)" }}>TOTAL</span>
      <span
        className="mono"
        style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-0.02em" }}
      >
        $95.000
      </span>
    </div>
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {["Nequi", "DIAN ✓"].map((m) => (
        <span
          key={m}
          style={{
            fontSize: 9.5,
            padding: "3px 7px",
            borderRadius: 6,
            border: "1px solid var(--line)",
            color: "var(--fg-dim)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {m}
        </span>
      ))}
    </div>
  </>
);

const TileReviews = () => (
  <>
    <div
      style={{
        fontSize: 11,
        color: "var(--fg-mute)",
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.05em",
        marginBottom: 8,
      }}
    >
      RESEÑAS GOOGLE
    </div>
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 8,
        marginBottom: 6,
      }}
    >
      <span
        className="mono"
        style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em" }}
      >
        4.9
      </span>
      <div style={{ display: "flex", gap: 2 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0, rotate: -30 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 1.4 + i * 0.1, duration: 0.45, ease: EASE }}
            style={{ display: "inline-flex" }}
          >
            <IconStar
              size={11}
              style={{ color: "var(--amber)", fill: "var(--amber)" } as CSSProperties}
            />
          </motion.span>
        ))}
      </div>
    </div>
    <div style={{ fontSize: 11.5, color: "var(--fg-dim)", marginBottom: 10 }}>
      +47 reseñas este mes
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {[5, 4, 3, 2, 1].map((s) => {
        const w = s === 5 ? 92 : s === 4 ? 6 : s === 3 ? 2 : 0;
        return (
          <div
            key={s}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <span
              className="mono"
              style={{ fontSize: 9, color: "var(--fg-mute)", width: 8 }}
            >
              {s}
            </span>
            <div
              style={{
                flex: 1,
                height: 3,
                borderRadius: 999,
                background: "rgba(20,15,30,0.05)",
                overflow: "hidden",
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${w}%` }}
                transition={{ delay: 1.5, duration: 0.9, ease: EASE }}
                style={{
                  height: "100%",
                  background: "var(--amber)",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  </>
);

const TileCta = () => (
  <Link
    href="/register"
    style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      height: "100%",
      textDecoration: "none",
      color: "white",
    }}
  >
    <div>
      <div
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.85)",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.05em",
          marginBottom: 10,
        }}
      >
        EMPEZAR AHORA
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 500,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
        }}
      >
        14 días gratis
        <br />
        Sin tarjeta.
      </div>
    </div>
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        background: "rgba(20,15,30,0.12)",
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 500,
        backdropFilter: "blur(10px)",
        alignSelf: "flex-start",
      }}
    >
      Crear cuenta <IconArrow size={14} />
    </div>
  </Link>
);

const TileBookingLink = () => (
  <>
    <div
      style={{
        fontSize: 11,
        color: "var(--fg-mute)",
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.05em",
        marginBottom: 10,
      }}
    >
      TU LINK PÚBLICO
    </div>
    <div
      style={{
        padding: "10px 12px",
        background: "rgba(20,15,30,0.06)",
        border: "1px solid var(--line)",
        borderRadius: 10,
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
      }}
    >
      <IconGlobe size={12} style={{ color: "var(--violet-2)" }} />
      <span style={{ color: "var(--fg-mute)" }}>tuyo</span>
      <span>.zyncra.com</span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 38,
          height: 38,
          background: "white",
          borderRadius: 6,
          padding: 4,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundImage:
              "radial-gradient(circle, #000 30%, transparent 30%)",
            backgroundSize: "5px 5px",
          }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 500 }}>Reservas 24/7</div>
        <div style={{ fontSize: 10.5, color: "var(--fg-mute)" }}>
          Sin app, sin formulario
        </div>
      </div>
    </div>
  </>
);

export default function BentoHero() {
  return (
    <section
      id="top"
      className="bento-section"
      style={{
        position: "relative",
        paddingTop: 96,
        paddingBottom: 56,
        overflowX: "clip",
        minHeight: 900,
      }}
    >
      <GradientOrb color="#fb0f05" size={900} x="-15%" y="-30%" opacity={0.28} />
      <div className="zn-orb-drift" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <GradientOrb color="#0027fe" size={700} x="70%" y="0%" opacity={0.22} />
      </div>
      <div className="zn-orb-drift-2" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <GradientOrb color="#0027fe" size={500} x="40%" y="60%" opacity={0.08} />
      </div>
      <GridBackdrop style={{ opacity: 0.5 }} />
      <Particles count={24} />

      <Container max={1240}>
        <div
          style={{
            textAlign: "center",
            marginBottom: 56,
            position: "relative",
            zIndex: 2,
          }}
        >
          <HeroFade delay={0.05}>
            <div
              className="hero-chip"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 6px 6px 14px",
                border: "1px solid var(--line-strong)",
                background: "rgba(0,39,254,0.06)",
                borderRadius: 999,
                fontSize: 12.5,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.02em",
              }}
            >
              <span style={{ color: "var(--violet-2)" }}>
                ● Zyncra Business Suite · 2026
              </span>
              <span
                style={{
                  padding: "3px 9px",
                  background: "rgba(20,15,30,0.08)",
                  borderRadius: 999,
                  fontSize: 10.5,
                  color: "var(--fg-dim)",
                }}
              >
                NUEVO
              </span>
            </div>
          </HeroFade>

          <h1
            style={{
              fontSize: "clamp(44px, 7.2vw, 104px)",
              lineHeight: 1.0,
              letterSpacing: "-0.05em",
              fontWeight: 500,
              margin: 0,
              marginTop: 28,
              marginBottom: 26,
              maxWidth: 1100,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <LineReveal delay={0.12}>Tu negocio,</LineReveal>{" "}
            <LineReveal delay={0.22}>
              <span className="gradient-text-animated">en piloto</span>
            </LineReveal>{" "}
            <LineReveal delay={0.32}>
              <span className="gradient-text-animated">automático.</span>
            </LineReveal>
            <br />
            <LineReveal delay={0.48}>
              <span className="serif" style={{ fontWeight: 400, opacity: 0.92 }}>
                Tú, libre.
              </span>
            </LineReveal>
          </h1>

          <HeroFade delay={0.55}>
            <p
              style={{
                fontSize: "clamp(16px, 1.4vw, 19px)",
                lineHeight: 1.5,
                color: "var(--fg-dim)",
                maxWidth: 620,
                margin: "0 auto 32px",
              }}
            >
              Agenda, marketing por WhatsApp, POS y facturación DIAN — todo en una
              sola plataforma. Pensada para barberías, spas, salones y profesionales
              que viven de sus citas.
            </p>
          </HeroFade>

          <HeroFade delay={0.68}>
            <div
              className="hero-actions"
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 12,
                marginBottom: 18,
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
                    boxShadow:
                      "0 8px 30px -10px rgba(0,39,254,0.45), inset 0 1px 0 rgba(255,255,255,0.25)",
                    letterSpacing: "-0.01em",
                    textDecoration: "none",
                  }}
                >
                  <span>Empezar gratis</span>
                  <IconArrow size={16} />
                </Link>
              </Magnetic>
              <Magnetic strength={0.2}>
                <a
                  href="#demo"
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
                    letterSpacing: "-0.01em",
                    textDecoration: "none",
                  }}
                >
                  <IconPlay size={13} />
                  <span>Ver demo en vivo</span>
                </a>
              </Magnetic>
            </div>
          </HeroFade>

          <div
            className="hero-trust"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 22,
              color: "var(--fg-mute)",
              fontSize: 13,
              flexWrap: "wrap",
            }}
          >
            {["Sin tarjeta", "Setup en 5 min", "14 días gratis", "Soporte 🇨🇴"].map(
              (t, i) => (
                <motion.span
                  key={t}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.85 + i * 0.08, duration: 0.5, ease: EASE }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <IconCheck size={14} style={{ color: "var(--green)" }} />
                  {t}
                </motion.span>
              ),
            )}
          </div>
        </div>

        <Parallax speed={0.05} style={{ position: "relative", zIndex: 2 }}>
          <div className="zn-float-soft" style={{ position: "relative" }}>
            {/* Glow dinámico detrás del producto */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: "-8% -4%",
                background:
                  "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(0,39,254,0.14), rgba(251,15,5,0.07) 50%, transparent 75%)",
                filter: "blur(48px)",
                animation: "znGlowPulse 7s ease-in-out infinite",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(12, 1fr)",
                gridAutoRows: "minmax(160px, auto)",
                gap: 16,
                position: "relative",
              }}
              className="bento-hero"
            >
              <BentoHeroTile span={5} rowSpan={2} accent="#fb0f05" index={0}>
                <TileAgenda />
              </BentoHeroTile>
              <BentoHeroTile span={4} rowSpan={2} accent="#34D399" index={1}>
                <TileWa />
              </BentoHeroTile>
              <BentoHeroTile span={3} rowSpan={2} accent="#fb0f05" index={2}>
                <TileRevenue />
              </BentoHeroTile>

              <BentoHeroTile span={3} rowSpan={2} accent="#0027fe" className="bento-hide-mobile" index={3}>
                <TilePos />
              </BentoHeroTile>
              <BentoHeroTile span={3} rowSpan={2} accent="#FBBF24" className="bento-hide-mobile" index={4}>
                <TileReviews />
              </BentoHeroTile>
              <BentoHeroTile span={3} rowSpan={2} accent="#22D3EE" className="bento-hide-mobile" index={5}>
                <TileBookingLink />
              </BentoHeroTile>
              <BentoHeroTile
                span={3}
                rowSpan={2}
                accent="#fff"
                index={6}
                style={{
                  background:
                    "linear-gradient(135deg, #fb0f05 0%, #0027fe 100%)",
                  backgroundSize: "180% 180%",
                  animation: "znGradientShift 8s ease infinite",
                  border: "1px solid rgba(20,15,30,0.2)",
                  boxShadow: "0 20px 60px -20px rgba(0,39,254,0.5)",
                }}
                padding={22}
              >
                <TileCta />
              </BentoHeroTile>
            </div>
          </div>
        </Parallax>
      </Container>
    </section>
  );
}
