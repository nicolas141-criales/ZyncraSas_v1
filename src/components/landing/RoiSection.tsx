"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrow } from "./icons";
import {
  Container,
  GradientOrb,
  SectionTitle,
} from "./primitives";

const Slider = ({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format,
  accent = "#0027fe",
  suffix = "",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  accent?: string;
  suffix?: string;
}) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 22 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 13, color: "var(--fg-dim)", fontWeight: 500 }}>
          {label}
        </span>
        <span
          className="mono"
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: "var(--fg)",
            letterSpacing: "-0.01em",
          }}
        >
          {format ? format(value) : value}
          {suffix}
        </span>
      </div>
      <div
        style={{
          position: "relative",
          height: 28,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 6,
            borderRadius: 999,
            background: "rgba(20,15,30,0.06)",
            border: "1px solid var(--line)",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: -1,
              bottom: -1,
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${accent}aa, ${accent})`,
              borderRadius: 999,
              boxShadow: `0 0 16px ${accent}66`,
            }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            opacity: 0,
            cursor: "pointer",
            margin: 0,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: `calc(${pct}% - 9px)`,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "white",
            border: `2px solid ${accent}`,
            boxShadow: `0 0 0 4px ${accent}33, 0 4px 12px ${accent}44`,
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
};

export default function RoiSection() {
  const [clientsWeek, setClientsWeek] = useState(50);
  const [avgTicket, setAvgTicket] = useState(45000);
  const [team, setTeam] = useState(3);

  const [shownCurrent, setShownCurrent] = useState(0);
  const [shownZyncra, setShownZyncra] = useState(0);

  const currentMonthly = clientsWeek * avgTicket * 4.33;
  const zyncraBoost = 1.38;
  const zyncraMonthly = currentMonthly * zyncraBoost;
  const lift = zyncraMonthly - currentMonthly;
  const annualLift = lift * 12;

  useEffect(() => {
    const steps = 24;
    const dur = 600;
    const stepDur = Math.max(16, Math.floor(dur / steps));
    let i = 0;
    const startC = shownCurrent;
    const startZ = shownZyncra;
    const id = setInterval(() => {
      i++;
      const k = Math.min(i / steps, 1);
      const eased = 1 - Math.pow(1 - k, 3);
      setShownCurrent(startC + (currentMonthly - startC) * eased);
      setShownZyncra(startZ + (zyncraMonthly - startZ) * eased);
      if (k >= 1) clearInterval(id);
    }, stepDur);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonthly, zyncraMonthly]);

  const fmtMoney = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${Math.round(n)}`;
  };

  return (
    <section style={{ padding: "120px 0", position: "relative", overflow: "hidden" }}>
      <GradientOrb color="#fb0f05" size={500} x="80%" y="20%" opacity={0.10} />
      <GradientOrb color="#0027fe" size={500} x="-15%" y="60%" opacity={0.10} />
      <Container max={1240}>
        <SectionTitle
          eyebrow="Calculadora de impacto"
          title={
            <>
              Cuánto plata estás{" "}
              <span className="serif gradient-text">dejando en la mesa.</span>
            </>
          }
          sub="Mueve los controles. Te decimos exactamente cuánto deja de crecer tu negocio sin Zyncra."
          align="center"
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.1fr",
            gap: 28,
            alignItems: "stretch",
          }}
          className="roi-grid"
        >
          <div
            style={{
              padding: 32,
              background:
                "linear-gradient(180deg, rgba(20,15,30,0.03), rgba(20,15,30,0.01))",
              border: "1px solid var(--line)",
              borderRadius: 22,
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "var(--fg-mute)",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 24,
              }}
            >
              Tu negocio hoy
            </div>
            <Slider
              label="Clientes por semana"
              value={clientsWeek}
              onChange={setClientsWeek}
              min={10}
              max={300}
              step={5}
              accent="#fb0f05"
            />
            <Slider
              label="Ticket promedio (COP)"
              value={avgTicket}
              onChange={setAvgTicket}
              min={15000}
              max={200000}
              step={5000}
              format={(v) => `$${(v / 1000).toFixed(0)}.000`}
              accent="#0027fe"
            />
            <Slider
              label="Profesionales en tu equipo"
              value={team}
              onChange={setTeam}
              min={1}
              max={20}
              step={1}
              accent="#fb0f05"
            />
            <div
              style={{
                marginTop: 24,
                padding: 14,
                background: "rgba(20,15,30,0.02)",
                border: "1px dashed var(--line)",
                borderRadius: 12,
                fontSize: 12,
                color: "var(--fg-mute)",
                lineHeight: 1.5,
              }}
            >
              Cálculo basado en datos reales de 500+ negocios en Zyncra: reducción
              de no-shows (−60%), reactivación de clientes inactivos (+18%) y
              nuevos clientes por reseñas Google (+8%).
            </div>
          </div>

          <div
            style={{
              padding: 32,
              background:
                "linear-gradient(180deg, rgba(251,15,5,0.10), rgba(0,39,254,0.04))",
              border: "1px solid rgba(0,39,254,0.3)",
              borderRadius: 22,
              boxShadow: "0 30px 80px -30px rgba(0,39,254,0.4)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "var(--violet-2)",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 24,
              }}
            >
              Proyección con Zyncra
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 28,
              }}
            >
              <div>
                <div style={{ fontSize: 11.5, color: "var(--fg-mute)", marginBottom: 6 }}>Hoy / mes</div>
                <div
                  className="mono"
                  style={{
                    fontSize: 28,
                    fontWeight: 500,
                    letterSpacing: "-0.02em",
                    color: "var(--fg-dim)",
                  }}
                >
                  {fmtMoney(shownCurrent)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: "var(--violet-2)", marginBottom: 6 }}>Con Zyncra / mes</div>
                <div
                  className="mono gradient-text"
                  style={{
                    fontSize: 36,
                    fontWeight: 500,
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                  }}
                >
                  {fmtMoney(shownZyncra)}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <div
                style={{
                  position: "relative",
                  height: 14,
                  background: "rgba(20,15,30,0.04)",
                  border: "1px solid var(--line)",
                  borderRadius: 999,
                  overflow: "hidden",
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${(currentMonthly / zyncraMonthly) * 100}%`,
                    background: "rgba(20,15,30,0.18)",
                    transition: "width .6s ease",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: "100%",
                    background: "linear-gradient(90deg, #fb0f05 0%, #0027fe 100%)",
                    opacity: 0.85,
                    clipPath: `inset(0 0 0 ${(currentMonthly / zyncraMonthly) * 100}%)`,
                    transition: "clip-path .6s ease",
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 10.5,
                  color: "var(--fg-mute)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <span>0</span>
                <span>{fmtMoney(zyncraMonthly)}</span>
              </div>
            </div>

            <div
              style={{
                padding: 22,
                background: "linear-gradient(135deg, rgba(251,15,5,0.13), rgba(0,39,254,0.13))",
                border: "1px solid rgba(0,39,254,0.4)",
                borderRadius: 14,
                marginBottom: 22,
              }}
            >
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--violet-2)",
                  fontFamily: "var(--font-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 6,
                }}
              >
                Plata extra al año
              </div>
              <div
                className="mono"
                style={{
                  fontSize: "clamp(38px, 4.5vw, 56px)",
                  fontWeight: 500,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                }}
              >
                +{fmtMoney(annualLift)}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--fg-dim)", marginTop: 8 }}>
                ROI proyectado · 12 meses
              </div>
            </div>

            <Link
              href="/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                padding: "14px 22px",
                borderRadius: 14,
                background: "linear-gradient(135deg, #fb0f05 0%, #0027fe 100%)",
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
              <span>Quiero esa plata extra</span>
              <IconArrow size={16} />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
