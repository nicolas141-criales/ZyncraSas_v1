"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const Icon = ({ children, size = 20, style = {}, strokeWidth = 1.6 }: {
  children: React.ReactNode; size?: number; style?: React.CSSProperties; strokeWidth?: number;
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {children}
  </svg>
);

const IconCheck = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M4 12.5l5 5L20 6.5" /></Icon>;
const IconArrow = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M5 12h14M13 5l7 7-7 7" /></Icon>;

function RoiSection() {
  const [clientsWeek, setClientsWeek] = useState(50);
  const [avgTicket, setAvgTicket] = useState(45000);
  const [team, setTeam] = useState(3);
  const [shownCurrent, setShownCurrent] = useState(0);
  const [shownZyncra, setShownZyncra] = useState(0);

  const currentMonthly = clientsWeek * avgTicket * 4.33;
  const zyncraMonthly = currentMonthly * 1.38;
  const lift = zyncraMonthly - currentMonthly;
  const annualLift = lift * 12;

  useEffect(() => {
    const steps = 24;
    const dur = 600;
    const stepDur = Math.max(16, Math.floor(dur / steps));
    const startC = shownCurrent;
    const startZ = shownZyncra;
    let i = 0;
    const id = setInterval(() => {
      i++;
      const k = Math.min(i / steps, 1);
      const eased = 1 - Math.pow(1 - k, 3);
      setShownCurrent(startC + (currentMonthly - startC) * eased);
      setShownZyncra(startZ + (zyncraMonthly - startZ) * eased);
      if (k >= 1) clearInterval(id);
    }, stepDur);
    return () => clearInterval(id);
  }, [currentMonthly, zyncraMonthly]);

  const fmtMoney = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${Math.round(n)}`;
  };

  interface SliderProps {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min: number;
    max: number;
    step?: number;
    format?: (v: number) => string;
    accent?: string;
  }

  const Slider = ({ label, value, onChange, min, max, step = 1, format, accent = "#A78BFA" }: SliderProps) => {
    const pct = ((value - min) / (max - min)) * 100;
    return (
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: "var(--fg-dim)", fontWeight: 500 }}>{label}</span>
          <span style={{ fontSize: 18, fontWeight: 500, color: "var(--fg)", letterSpacing: "-0.01em", fontFamily: "var(--font-mono)" }}>
            {format ? format(value) : value}
          </span>
        </div>
        <div style={{ position: "relative", height: 28, display: "flex", alignItems: "center" }}>
          <div style={{ position: "absolute", left: 0, right: 0, height: 6, borderRadius: 999, background: "rgba(20,15,30,0.06)", border: "1px solid var(--line)" }}>
            <div style={{ position: "absolute", left: 0, top: -1, bottom: -1, width: `${pct}%`, background: `linear-gradient(90deg, ${accent}aa, ${accent})`, borderRadius: 999, boxShadow: `0 0 16px ${accent}66` }} />
          </div>
          <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: "pointer", margin: 0 }} />
          <div style={{ position: "absolute", left: `calc(${pct}% - 9px)`, width: 18, height: 18, borderRadius: "50%", background: "white", border: `2px solid ${accent}`, boxShadow: `0 0 0 4px ${accent}33, 0 4px 12px ${accent}44`, pointerEvents: "none" }} />
        </div>
      </div>
    );
  };

  return (
    <section style={{ padding: "120px 0", position: "relative", overflow: "hidden" }}>
      <div aria-hidden style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, #FB923C 0%, transparent 65%)", filter: "blur(120px)", opacity: 0.10, left: "80%", top: "20%", pointerEvents: "none" }} />
      <div aria-hidden style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, #EC4899 0%, transparent 65%)", filter: "blur(120px)", opacity: 0.10, left: "-15%", top: "60%", pointerEvents: "none" }} />
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, border: "1px solid var(--line-strong)", background: "rgba(167,139,250,0.08)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500, color: "var(--violet-2)", fontFamily: "var(--font-mono)" }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--violet-2)", boxShadow: "0 0 10px var(--violet-2)", animation: "pulseGlow 1.8s ease-in-out infinite" }} />
              Calculadora de impacto
            </div>
          </div>
          <h2 style={{ fontSize: "clamp(34px, 4.6vw, 56px)", lineHeight: 1.04, letterSpacing: "-0.035em", margin: "0 0 18px", fontWeight: 500 }}>
            Cuánta plata estás{" "}
            <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", background: "var(--gradient)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>dejando en la mesa.</span>
          </h2>
          <p style={{ fontSize: "clamp(15px, 1.4vw, 18px)", lineHeight: 1.55, color: "var(--fg-dim)", margin: 0, maxWidth: 620, marginLeft: "auto", marginRight: "auto" }}>
            Mueve los controles. Te decimos exactamente cuánto deja de crecer tu negocio sin Zyncra.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 28, alignItems: "stretch" }} className="roi-grid">
          {/* Inputs */}
          <div style={{ padding: 32, background: "linear-gradient(180deg, rgba(20,15,30,0.03), rgba(20,15,30,0.01))", border: "1px solid var(--line)", borderRadius: 22 }}>
            <div style={{ fontSize: 12, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 24 }}>Tu negocio hoy</div>
            <Slider label="Clientes por semana" value={clientsWeek} onChange={setClientsWeek} min={10} max={300} step={5} accent="#A78BFA" />
            <Slider label="Ticket promedio (COP)" value={avgTicket} onChange={setAvgTicket} min={15000} max={200000} step={5000} format={(v) => `$${(v / 1000).toFixed(0)}.000`} accent="#EC4899" />
            <Slider label="Profesionales en tu equipo" value={team} onChange={setTeam} min={1} max={20} step={1} accent="#FB923C" />
            <div style={{ marginTop: 24, padding: 14, background: "rgba(20,15,30,0.02)", border: "1px dashed var(--line)", borderRadius: 12, fontSize: 12, color: "var(--fg-mute)", lineHeight: 1.5 }}>
              Cálculo basado en datos reales de 500+ negocios en Zyncra: reducción de no-shows (−60%), reactivación (+18%) y nuevos clientes por reseñas (+8%).
            </div>
          </div>

          {/* Output */}
          <div style={{ padding: 32, background: "linear-gradient(180deg, rgba(167,139,250,0.10), rgba(236,72,153,0.04))", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 22, boxShadow: "0 30px 80px -30px rgba(167,139,250,0.4)", display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 12, color: "var(--violet-2)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 24 }}>Proyección con Zyncra</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
              <div>
                <div style={{ fontSize: 11.5, color: "var(--fg-mute)", marginBottom: 6 }}>Hoy / mes</div>
                <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--fg-dim)", fontFamily: "var(--font-mono)" }}>{fmtMoney(shownCurrent)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11.5, color: "var(--violet-2)", marginBottom: 6 }}>Con Zyncra / mes</div>
                <div style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1, background: "var(--gradient)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", fontFamily: "var(--font-mono)" }}>{fmtMoney(shownZyncra)}</div>
              </div>
            </div>
            <div style={{ marginBottom: 28 }}>
              <div style={{ position: "relative", height: 14, background: "rgba(20,15,30,0.04)", border: "1px solid var(--line)", borderRadius: 999, overflow: "hidden", marginBottom: 6 }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${(currentMonthly / zyncraMonthly) * 100}%`, background: "rgba(20,15,30,0.18)", transition: "width .6s ease" }} />
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "100%", background: "linear-gradient(90deg, #A78BFA 0%, #EC4899 60%, #FB923C 100%)", opacity: 0.85, clipPath: `inset(0 0 0 ${(currentMonthly / zyncraMonthly) * 100}%)`, transition: "clip-path .6s ease" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>
                <span>0</span><span>{fmtMoney(zyncraMonthly)}</span>
              </div>
            </div>
            <div style={{ padding: 22, background: "linear-gradient(135deg, #A78BFA22, #EC489922)", border: "1px solid rgba(167,139,250,0.4)", borderRadius: 14, marginBottom: 22 }}>
              <div style={{ fontSize: 11.5, color: "var(--violet-2)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Plata extra al año</div>
              <div style={{ fontSize: "clamp(38px, 4.5vw, 56px)", fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1, fontFamily: "var(--font-mono)" }}>+{fmtMoney(annualLift)}</div>
              <div style={{ fontSize: 12.5, color: "var(--fg-dim)", marginTop: 8 }}>ROI proyectado · 12 meses</div>
            </div>
            <Link href="/register" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 16, padding: "14px 22px", borderRadius: 14, background: "linear-gradient(135deg, #A78BFA 0%, #EC4899 60%, #FB923C 100%)", color: "white", fontFamily: "var(--font-sans)", fontWeight: 500, boxShadow: "0 8px 30px -10px rgba(167,139,250,0.55)", textDecoration: "none" }}>
              Quiero esa plata extra <IconArrow size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PricingPage() {
  const [yearly, setYearly] = useState(true);

  const plans = [
    {
      name: "Starter", sub: "Para empezar tu negocio", monthly: 49000, yearly: 39000, accent: "#22D3EE",
      features: ["Agenda online ilimitada", "1 profesional", "Recordatorios WhatsApp", "POS básico", "Link público de reservas"],
      cta: "Empezar gratis",
    },
    {
      name: "Pro", sub: "Lo más vendido en Colombia", monthly: 89000, yearly: 69000, accent: "#EC4899", featured: true,
      features: ["Todo lo de Starter +", "Hasta 5 profesionales", "Marketing WhatsApp (campañas)", "POS + Factura DIAN", "Reseñas Google automáticas", "Comisiones automatizadas", "Soporte prioritario"],
      cta: "Probar Pro 14 días gratis",
    },
    {
      name: "Business", sub: "Para cadenas y multi-sede", monthly: 189000, yearly: 149000, accent: "#FB923C",
      features: ["Todo lo de Pro +", "Profesionales ilimitados", "Multi-sede", "API + integraciones", "Gerente de cuenta dedicado", "SLA 99.9%"],
      cta: "Hablar con ventas",
    },
  ];

  const fmt = (n: number) => `$${(n / 1000).toFixed(0)}.000`;

  return (
    <>
      {/* Page Hero */}
      <section style={{ position: "relative", paddingTop: 150, paddingBottom: 60, overflow: "hidden", textAlign: "center" }}>
        <div aria-hidden style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, #EC4899 0%, transparent 65%)", filter: "blur(120px)", opacity: 0.25, left: "-10%", top: "-30%", pointerEvents: "none" }} />
        <div aria-hidden style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, #A78BFA 0%, transparent 65%)", filter: "blur(120px)", opacity: 0.18, left: "75%", top: "-10%", pointerEvents: "none" }} />
        <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(20,15,30,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(20,15,30,0.04) 1px, transparent 1px)", backgroundSize: "64px 64px", maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)", WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)", pointerEvents: "none", opacity: 0.5 } as React.CSSProperties} />
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 28px", position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, border: "1px solid var(--line-strong)", background: "rgba(167,139,250,0.08)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500, color: "var(--violet-2)", fontFamily: "var(--font-mono)" }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--violet-2)", boxShadow: "0 0 10px var(--violet-2)", animation: "pulseGlow 1.8s ease-in-out infinite" }} />
              Precios
            </div>
          </div>
          <h1 style={{ fontSize: "clamp(42px, 6.4vw, 88px)", lineHeight: 0.96, letterSpacing: "-0.045em", fontWeight: 500, margin: 0, marginBottom: 22, textWrap: "balance" }}>
            Económico,{" "}
            <span style={{ background: "var(--gradient)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>honesto.</span>
          </h1>
          <p style={{ fontSize: "clamp(15px, 1.3vw, 18px)", lineHeight: 1.55, color: "var(--fg-dim)", margin: "0 auto", maxWidth: 600 }}>
            Más barato que la competencia gringa. Sin trucos, sin precios en dólares, sin sorpresas.
          </p>
        </div>
      </section>

      {/* Pricing Plans */}
      <section style={{ padding: "60px 0 80px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px" }}>
          {/* Toggle */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 40 }}>
            <div style={{ display: "inline-flex", padding: 5, background: "rgba(20,15,30,0.04)", border: "1px solid var(--line)", borderRadius: 12, gap: 4 }}>
              {([["Mensual", false], ["Anual · ahorra 20%", true]] as [string, boolean][]).map(([l, v], i) => (
                <button key={i} onClick={() => setYearly(v)} style={{ padding: "8px 16px", background: yearly === v ? "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(236,72,153,0.15))" : "transparent", border: yearly === v ? "1px solid var(--line-strong)" : "1px solid transparent", borderRadius: 8, color: yearly === v ? "var(--fg)" : "var(--fg-dim)", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="pricing-grid">
            {plans.map((p, i) => (
              <div key={p.name} style={{ padding: 28, borderRadius: 22, position: "relative", background: (p as { featured?: boolean }).featured ? "linear-gradient(180deg, rgba(167,139,250,0.10) 0%, rgba(236,72,153,0.03) 100%)" : "rgba(255,255,255,0.02)", border: (p as { featured?: boolean }).featured ? "1px solid rgba(167,139,250,0.4)" : "1px solid var(--line)", height: "100%", display: "flex", flexDirection: "column", boxShadow: (p as { featured?: boolean }).featured ? "0 30px 80px -30px rgba(167,139,250,0.4)" : "none" }}>
                {(p as { featured?: boolean }).featured && (
                  <div style={{ position: "absolute", top: -12, right: 24, padding: "5px 12px", background: "linear-gradient(135deg, #A78BFA, #EC4899)", color: "white", fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 500, letterSpacing: "0.06em", borderRadius: 999, textTransform: "uppercase", boxShadow: "0 8px 20px -4px rgba(236,72,153,0.5)" }}>Más popular</div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: p.accent, boxShadow: `0 0 12px ${p.accent}` }} />
                  <span style={{ fontSize: 14, color: "var(--fg-dim)", fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>{p.name.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: 15, color: "var(--fg-mute)", marginBottom: 20 }}>{p.sub}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 42, fontWeight: 500, letterSpacing: "-0.03em", fontFamily: "var(--font-mono)" }}>{fmt(yearly ? p.yearly : p.monthly)}</span>
                  <span style={{ color: "var(--fg-mute)", fontSize: 14 }}>/ mes</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--fg-mute)", marginBottom: 24, fontFamily: "var(--font-mono)" }}>
                  {yearly ? `Facturado anual · ${fmt(p.yearly * 12)} COP` : "Facturado mensual"}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                  {p.features.map((f, j) => (
                    <div key={j} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13.5 }}>
                      <IconCheck size={14} style={{ color: p.accent, marginTop: 3, flexShrink: 0 }} />
                      <span style={{ color: "var(--fg-dim)" }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14.5, padding: "11px 18px", borderRadius: 12, background: (p as { featured?: boolean }).featured ? "linear-gradient(135deg, #A78BFA 0%, #EC4899 60%, #FB923C 100%)" : "rgba(20,15,30,0.06)", color: (p as { featured?: boolean }).featured ? "white" : "var(--fg)", border: (p as { featured?: boolean }).featured ? "none" : "1px solid var(--line-strong)", fontFamily: "var(--font-sans)", fontWeight: 500, textDecoration: "none", boxShadow: (p as { featured?: boolean }).featured ? "0 8px 30px -10px rgba(167,139,250,0.55)" : "none" }}>
                  {p.cta} <IconArrow size={14} />
                </Link>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 32, color: "var(--fg-mute)", fontSize: 13 }}>
            14 días gratis · Sin tarjeta · Cancela cuando quieras · Soporte 100% en español
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <RoiSection />

      {/* CTA */}
      <section style={{ padding: "0 0 120px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px" }}>
          <div style={{ position: "relative", padding: "80px 60px", borderRadius: 28, background: "linear-gradient(135deg, rgba(167,139,250,0.18) 0%, rgba(236,72,153,0.12) 50%, rgba(251,146,60,0.08) 100%)", border: "1px solid rgba(167,139,250,0.3)", overflow: "hidden", textAlign: "center" }} className="cta-wrap">
            <div aria-hidden style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, #A78BFA 0%, transparent 65%)", filter: "blur(80px)", opacity: 0.4, left: "-10%", top: "-30%", pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <h2 style={{ fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1.02, letterSpacing: "-0.04em", fontWeight: 500, margin: "0 0 18px" }}>Empieza gratis hoy.</h2>
              <p style={{ fontSize: 17, color: "var(--fg-dim)", margin: "0 auto 32px", maxWidth: 480, lineHeight: 1.55 }}>14 días con todas las funciones. Sin tarjeta, sin compromisos. Cancela cuando quieras.</p>
              <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 16, padding: "14px 22px", borderRadius: 14, background: "linear-gradient(135deg, #A78BFA 0%, #EC4899 60%, #FB923C 100%)", color: "white", fontFamily: "var(--font-sans)", fontWeight: 500, boxShadow: "0 8px 30px -10px rgba(167,139,250,0.55)", textDecoration: "none" }}>
                Empezar gratis <IconArrow size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
