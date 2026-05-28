"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  IconBrush,
  IconHand,
  IconScissors,
  IconSpa,
} from "./icons";
import {
  Container,
  GradientOrb,
  SectionTitle,
} from "./primitives";

type City = { name: string; x: number; y: number; weight: number };

const CITIES: City[] = [
  { name: "Bogotá", x: 55, y: 56, weight: 1.0 },
  { name: "Medellín", x: 41, y: 42, weight: 0.9 },
  { name: "Cali", x: 33, y: 64, weight: 0.85 },
  { name: "Barranquilla", x: 44, y: 14, weight: 0.7 },
  { name: "Cartagena", x: 38, y: 17, weight: 0.6 },
  { name: "Bucaramanga", x: 56, y: 33, weight: 0.65 },
  { name: "Pereira", x: 38, y: 53, weight: 0.55 },
  { name: "Manizales", x: 39, y: 49, weight: 0.5 },
  { name: "Santa Marta", x: 49, y: 10, weight: 0.45 },
  { name: "Cúcuta", x: 65, y: 28, weight: 0.5 },
  { name: "Ibagué", x: 47, y: 56, weight: 0.45 },
  { name: "Villavicencio", x: 60, y: 60, weight: 0.4 },
  { name: "Armenia", x: 38, y: 56, weight: 0.4 },
  { name: "Neiva", x: 47, y: 65, weight: 0.4 },
  { name: "Pasto", x: 28, y: 79, weight: 0.4 },
];

type Biz = { label: string; icon: ReactNode; c: string };
const BIZ_TYPES: Biz[] = [
  { label: "Barbería", icon: <IconScissors size={11} />, c: "#fb0f05" },
  { label: "Salón", icon: <IconBrush size={11} />, c: "#0027fe" },
  { label: "Spa", icon: <IconSpa size={11} />, c: "#22D3EE" },
  { label: "Manicure", icon: <IconHand size={11} />, c: "#FB923C" },
  { label: "Tatuajes", icon: <IconBrush size={11} />, c: "#34D399" },
];

const FIRST_NAMES = [
  "Camila",
  "Juan",
  "Andrés",
  "María",
  "Carlos",
  "Diana",
  "Laura",
  "Pedro",
  "Sara",
  "Miguel",
  "Valentina",
  "Daniel",
  "Sofía",
  "Felipe",
  "Catalina",
];

type Booking = {
  id: string;
  city: City;
  biz: Biz;
  name: string;
  when: string;
};

const randomBooking = (): Booking => {
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];
  const biz = BIZ_TYPES[Math.floor(Math.random() * BIZ_TYPES.length)];
  return {
    id: Math.random().toString(36).slice(2),
    city,
    biz,
    name: FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)],
    when: `hace ${Math.floor(Math.random() * 50) + 5}s`,
  };
};

const ColombiaMap = ({ lastPing }: { lastPing: Booking | null }) => (
  <div
    style={{
      position: "relative",
      width: "100%",
      aspectRatio: "0.85",
      maxWidth: 460,
      margin: "0 auto",
    }}
  >
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: "15%",
        background:
          "radial-gradient(circle, rgba(251,15,5,0.25), transparent 70%)",
        filter: "blur(40px)",
      }}
    />
    <svg
      viewBox="0 0 100 117"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <defs>
        <linearGradient id="comap" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(251,15,5,0.20)" />
          <stop offset="100%" stopColor="rgba(0,39,254,0.10)" />
        </linearGradient>
      </defs>
      <path
        d="M48,5 L52,8 L56,9 L55,13 L52,15 L48,14 L45,17 L42,18 L38,18 L36,21 L35,24 L37,27 L40,28 L43,30 L46,32 L48,35 L52,33 L55,32 L58,33 L62,32 L65,33 L68,32 L70,35 L68,38 L65,40 L63,43 L62,47 L60,50 L58,53 L55,56 L52,60 L50,64 L52,67 L54,71 L55,75 L52,78 L48,80 L46,83 L48,87 L46,90 L43,92 L40,94 L36,95 L33,93 L31,88 L29,84 L27,79 L25,73 L23,67 L21,60 L20,53 L21,46 L23,40 L26,34 L28,29 L30,25 L31,21 L32,17 L33,13 L35,9 L40,7 Z"
        fill="url(#comap)"
        stroke="rgba(251,15,5,0.4)"
        strokeWidth="0.4"
      />
    </svg>
    {CITIES.map((c) => {
      const isLast = lastPing && lastPing.city.name === c.name;
      return (
        <div
          key={c.name}
          style={{
            position: "absolute",
            left: `${c.x}%`,
            top: `${c.y}%`,
            width: 8 + c.weight * 8,
            height: 8 + c.weight * 8,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "rgba(251,15,5,0.9)",
              boxShadow: "0 0 12px rgba(251,15,5,0.8)",
            }}
          />
          {isLast && (
            <>
              <div
                style={{
                  position: "absolute",
                  inset: -8,
                  borderRadius: "50%",
                  border: "2px solid #0027fe",
                  animation: "pingRing 1.6s ease-out infinite",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: -16,
                  borderRadius: "50%",
                  border: "1px solid rgba(0,39,254,0.5)",
                  animation: "pingRing 1.6s ease-out 0.4s infinite",
                }}
              />
            </>
          )}
        </div>
      );
    })}
  </div>
);

export default function LivePulseSection() {
  const [bookings, setBookings] = useState<Booking[]>(() =>
    Array.from({ length: 6 }).map(randomBooking),
  );
  const [lastPing, setLastPing] = useState<Booking | null>(null);
  const [counter, setCounter] = useState(1248);

  useEffect(() => {
    setLastPing(bookings[bookings.length - 1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const nb = randomBooking();
      setBookings((prev) => [nb, ...prev].slice(0, 8));
      setLastPing(nb);
      setCounter((c) => c + 1);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      style={{ padding: "120px 0", position: "relative", overflowX: "clip" }}
    >
      <GradientOrb color="#fb0f05" size={600} x="-20%" y="20%" opacity={0.12} />
      <GradientOrb color="#0027fe" size={500} x="80%" y="60%" opacity={0.10} />
      <Container max={1240}>
        <SectionTitle
          eyebrow="Pulso en vivo"
          title={
            <>
              Mientras lees esto, alguien reserva en{" "}
              <span className="gradient-text">Zyncra.</span>
            </>
          }
          sub="Más de 500 negocios en 24 ciudades de Colombia. El mapa se actualiza en tiempo real."
          align="center"
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 36,
            alignItems: "center",
          }}
          className="pulse-grid"
        >
          <div
            style={{
              padding: 36,
              background:
                "linear-gradient(180deg, rgba(20,15,30,0.03), rgba(20,15,30,0.005))",
              border: "1px solid var(--line)",
              borderRadius: 24,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 20,
                left: 20,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                background: "rgba(52,211,153,0.10)",
                border: "1px solid rgba(52,211,153,0.3)",
                borderRadius: 999,
                fontSize: 11,
                color: "var(--green)",
                fontFamily: "var(--font-mono)",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: "var(--green)",
                  animation: "pulseGlow 1s infinite",
                }}
              />
              EN VIVO · COLOMBIA
            </div>
            <div
              style={{
                position: "absolute",
                top: 20,
                right: 20,
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--fg-mute)",
              }}
            >
              {lastPing && `→ ${lastPing.city.name}`}
            </div>
            <ColombiaMap lastPing={lastPing} />
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--fg-mute)",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.05em",
                  marginBottom: 4,
                }}
              >
                RESERVAS HOY
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 36,
                  fontWeight: 500,
                  letterSpacing: "-0.03em",
                }}
              >
                {counter.toLocaleString("es-CO")}
              </div>
            </div>
          </div>

          <div>
            <div
              style={{
                fontSize: 12,
                color: "var(--fg-mute)",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 16,
              }}
            >
              Feed de reservas
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                maxHeight: 520,
                overflow: "hidden",
                position: "relative",
                maskImage:
                  "linear-gradient(180deg, black 0%, black 85%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(180deg, black 0%, black 85%, transparent 100%)",
              }}
            >
              {bookings.map((b, i) => (
                <div
                  key={b.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    background:
                      i === 0
                        ? `linear-gradient(90deg, ${b.biz.c}1a, transparent)`
                        : "rgba(20,15,30,0.025)",
                    border:
                      "1px solid " +
                      (i === 0 ? `${b.biz.c}55` : "var(--line)"),
                    borderRadius: 12,
                    animation: i === 0 ? "fadeUp .35s ease" : "none",
                    opacity: Math.max(0.4, 1 - i * 0.08),
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: `${b.biz.c}22`,
                      border: `1px solid ${b.biz.c}55`,
                      display: "grid",
                      placeItems: "center",
                      color: b.biz.c,
                    }}
                  >
                    {b.biz.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {b.name} reservó · {b.biz.label}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: "var(--fg-mute)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {b.city.name} · {b.when}
                    </div>
                  </div>
                  {i === 0 && (
                    <span
                      style={{
                        fontSize: 9.5,
                        padding: "3px 7px",
                        background: "rgba(52,211,153,0.15)",
                        color: "var(--green)",
                        borderRadius: 999,
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      NUEVO
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
