"use client";

import { useEffect, useRef, useState } from "react";
import { IconCheck, IconX } from "./icons";
import {
  Container,
  GradientOrb,
  SectionTitle,
} from "./primitives";
import { AnimatePresence, Reveal, motion } from "./motion";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const TIMELINE = [
  {
    hour: "07:30",
    without: {
      title: "Llegas estresada",
      text: "14 WhatsApps sin responder de anoche. Tres clientes piden cita, no sabes si tienes cupo.",
    },
    with: {
      title: "Café tranquila",
      text: "Tu agenda ya tiene 4 reservas que entraron mientras dormías. Cero mensajes pendientes.",
    },
  },
  {
    hour: "09:00",
    without: {
      title: "Suena el teléfono",
      text: "Cliente quiere reservar, pero estás cortando. Lo pones en espera, se aburre, cuelga.",
    },
    with: {
      title: "Atiende a tu cliente",
      text: "Las reservas entran solas por tu link. Te llega notificación, sigues con tu trabajo.",
    },
  },
  {
    hour: "11:00",
    without: {
      title: "No-show #1",
      text: "Cliente de las 10:30 no llegó, no avisó. 45 min perdidos. $35.000 que no entran.",
    },
    with: {
      title: "Confirmaciones automáticas",
      text: "Bot ya recordó a todos por WhatsApp. 95% confirma. Los que no, liberan el cupo automáticamente.",
    },
  },
  {
    hour: "13:30",
    without: {
      title: "Excel del demonio",
      text: "Cliente pregunta cuánto gastó este mes. Buscas en Excel. No cuadra. Vergüenza ajena.",
    },
    with: {
      title: "1 clic, todo el historial",
      text: "Buscas el cliente, ves cada visita, cada compra, sus servicios favoritos. Te ve como una pro.",
    },
  },
  {
    hour: "15:00",
    without: {
      title: "Caja descuadrada",
      text: "$240.000 que no sabes de dónde salieron. ¿Quién cobró qué? El equipo se mira.",
    },
    with: {
      title: "POS + Caja sincronizados",
      text: "Cada cobro queda registrado por profesional, método de pago y servicio. Caja cuadra sola.",
    },
  },
  {
    hour: "17:00",
    without: {
      title: "Comisiones a mano",
      text: "Sentada con calculadora, sumando servicios por cada profesional. 2 horas. Y aún hay errores.",
    },
    with: {
      title: "Comisiones automáticas",
      text: "Reporte por profesional listo. Click. Pagas. Cero disputas, cero noches sumando.",
    },
  },
  {
    hour: "19:30",
    without: {
      title: "Cierras agotada",
      text: "Sin idea de cuánto facturaste. Mañana, lo mismo. Sin reseñas nuevas. Sin clientes nuevos.",
    },
    with: {
      title: "Cierras con datos",
      text: "$1.2M facturados. +12 reseñas Google. 3 clientes reactivados. Te vas a casa. A descansar.",
    },
  },
];

const StoryRow = ({
  item,
  active,
  side,
}: {
  item: (typeof TIMELINE)[number];
  active: boolean;
  side: "without" | "with";
}) => {
  const isWithout = side === "without";
  const content = isWithout ? item.without : item.with;
  return (
    <div
      style={{
        padding: "24px 26px",
        background: active
          ? isWithout
            ? "rgba(20,15,30,0.04)"
            : "linear-gradient(135deg, rgba(251,15,5,0.10), rgba(0,39,254,0.04))"
          : "transparent",
        border:
          "1px solid " +
          (active
            ? isWithout
              ? "var(--line-strong)"
              : "rgba(0,39,254,0.4)"
            : "transparent"),
        borderRadius: 16,
        opacity: active ? (isWithout ? 0.92 : 1) : 0.35,
        transform: active ? "scale(1.02)" : "scale(0.98)",
        transition: "all .5s cubic-bezier(.2,.7,.2,1)",
        position: "relative",
        filter: isWithout ? "saturate(0.55)" : "none",
        boxShadow:
          active && !isWithout
            ? "0 24px 70px -28px rgba(0,39,254,0.45), 0 0 50px -24px rgba(251,15,5,0.3)"
            : "none",
        overflow: "hidden",
        minHeight: 132,
      }}
    >
      {!isWithout && active && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -1,
            left: 14,
            right: 14,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(0,39,254,0.7), transparent)",
          }}
        />
      )}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={item.hour}
          initial={{ opacity: 0, y: isWithout ? 14 : 18, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            {isWithout ? (
              <IconX size={14} style={{ color: "var(--fg-mute)" }} />
            ) : (
              <IconCheck size={14} style={{ color: "var(--green)" }} />
            )}
            <span
              style={{
                fontSize: 15,
                fontWeight: 500,
                letterSpacing: "-0.01em",
              }}
            >
              {content.title}
            </span>
          </div>
          <p
            style={{
              margin: 0,
              color: isWithout ? "var(--fg-mute)" : "var(--fg-dim)",
              fontSize: 13.5,
              lineHeight: 1.5,
            }}
          >
            {content.text}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default function ScrollStorySection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      if (total <= 0) return;
      const progress = Math.max(0, Math.min(1, -rect.top / total));
      const idx = Math.min(
        TIMELINE.length - 1,
        Math.floor(progress * TIMELINE.length),
      );
      setActiveIdx(idx);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section style={{ position: "relative", background: "var(--bg)" }}>
      <Container max={1240}>
        <Reveal>
          <SectionTitle
            eyebrow="Un día con/sin Zyncra"
            title={
              <>
                Misma persona. Misma jornada.{" "}
                <span className="gradient-text">Dos universos.</span>
              </>
            }
            sub="Haz scroll. Las horas pasan. Mira lo que vives sin Zyncra a la izquierda, y lo que podrías estar viviendo a la derecha."
            align="center"
          />
        </Reveal>
      </Container>

      <div
        ref={containerRef}
        style={{ position: "relative", height: `${TIMELINE.length * 60}vh` }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
          }}
        >
          <GradientOrb
            color="#fb0f05"
            size={500}
            x="-15%"
            y="20%"
            opacity={0.10}
          />
          <GradientOrb
            color="#0027fe"
            size={500}
            x="75%"
            y="60%"
            opacity={0.10}
          />
          <Container max={1240}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 110px 1fr",
                gap: 0,
                alignItems: "stretch",
                minHeight: 460,
              }}
              className="story-grid"
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ marginBottom: 20, paddingLeft: 26 }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 12px",
                      borderRadius: 999,
                      background: "rgba(20,15,30,0.04)",
                      border: "1px solid var(--line-strong)",
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        background: "var(--fg-mute)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11.5,
                        color: "var(--fg-mute)",
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      Sin Zyncra
                    </span>
                  </div>
                </div>
                <StoryRow item={TIMELINE[activeIdx]} active side="without" />
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  paddingTop: 56,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 56,
                    bottom: 20,
                    width: 2,
                    background:
                      "linear-gradient(180deg, transparent, var(--line-strong) 20%, var(--line-strong) 80%, transparent)",
                  }}
                >
                  <motion.div
                    animate={{
                      height: `${(activeIdx / (TIMELINE.length - 1)) * 100}%`,
                    }}
                    transition={{ duration: 0.55, ease: EASE }}
                    style={{
                      width: "100%",
                      background: "linear-gradient(180deg, #fb0f05, #0027fe)",
                      boxShadow: "0 0 14px rgba(0,39,254,0.5)",
                      borderRadius: 2,
                    }}
                  />
                </div>
                {TIMELINE.map((t, i) => {
                  const isActive = i === activeIdx;
                  const isPast = i < activeIdx;
                  return (
                    <div
                      key={t.hour}
                      style={{
                        position: "relative",
                        zIndex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        marginBottom: 12,
                        opacity: isActive ? 1 : isPast ? 0.5 : 0.3,
                        transition: "opacity .3s ease",
                      }}
                    >
                      <div
                        style={{
                          width: isActive ? 16 : 8,
                          height: isActive ? 16 : 8,
                          borderRadius: "50%",
                          background: isActive
                            ? "linear-gradient(135deg, #fb0f05, #0027fe)"
                            : isPast
                              ? "var(--violet-2)"
                              : "rgba(20,15,30,0.2)",
                          border: "2px solid var(--bg)",
                          boxShadow: isActive
                            ? "0 0 24px rgba(0,39,254,0.6)"
                            : "none",
                          transition: "all .3s ease",
                        }}
                      />
                      <span
                        className="mono"
                        style={{
                          fontSize: isActive ? 13 : 10.5,
                          color: isActive ? "var(--fg)" : "var(--fg-mute)",
                          fontWeight: isActive ? 500 : 400,
                          letterSpacing: "0.04em",
                          transition: "all .3s ease",
                        }}
                      >
                        {t.hour}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ marginBottom: 20, paddingLeft: 26 }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 12px",
                      borderRadius: 999,
                      background: "rgba(0,39,254,0.08)",
                      border: "1px solid rgba(0,39,254,0.3)",
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        background: "var(--violet-2)",
                        boxShadow: "0 0 8px var(--violet-2)",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11.5,
                        color: "var(--violet-2)",
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      Con Zyncra
                    </span>
                  </div>
                </div>
                <StoryRow item={TIMELINE[activeIdx]} active side="with" />
              </div>
            </div>

            <div
              style={{
                maxWidth: 600,
                margin: "40px auto 0",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 11,
                  color: "var(--fg-mute)",
                  fontFamily: "var(--font-mono)",
                  marginBottom: 8,
                }}
              >
                <span>{TIMELINE[0].hour}</span>
                <span>SIGUE HACIENDO SCROLL ↓</span>
                <span>{TIMELINE[TIMELINE.length - 1].hour}</span>
              </div>
              <div
                style={{
                  height: 4,
                  borderRadius: 999,
                  background: "rgba(20,15,30,0.06)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${((activeIdx + 1) / TIMELINE.length) * 100}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #fb0f05, #0027fe)",
                    transition: "width .5s cubic-bezier(.22,1,.36,1)",
                    boxShadow: "0 0 16px rgba(0,39,254,0.55)",
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
          </Container>
        </div>
      </div>
    </section>
  );
}
