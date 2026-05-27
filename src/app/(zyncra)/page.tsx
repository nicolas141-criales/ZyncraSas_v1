"use client";
import { useState, useEffect, useRef } from "react";

// ─── SVG Icons ─────────────────────────────────────────────────────────────
const Icon = ({ children, size = 20, style = {}, strokeWidth = 1.6 }: {
  children: React.ReactNode; size?: number; style?: React.CSSProperties; strokeWidth?: number;
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {children}
  </svg>
);
const IconCalendar = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /><circle cx="8" cy="14" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" /><circle cx="16" cy="14" r="1" fill="currentColor" stroke="none" /></Icon>;
const IconWhatsapp = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M21 12a9 9 0 0 1-13.5 7.8L3 21l1.3-4.5A9 9 0 1 1 21 12z" /><path d="M9 9.5c0-.5.4-1 1-1h.5c.3 0 .6.2.7.5l.6 1.5c.1.3 0 .6-.2.8L11 12c.6 1.2 1.6 2.2 2.8 2.8l.7-.6c.2-.2.5-.3.8-.2l1.5.6c.3.1.5.4.5.7v.5c0 .6-.4 1-1 1-3.5 0-6.5-3-6.5-6.5 0 0-.5-1.3-.8-.8z" /></Icon>;
const IconStar = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.8 6.6 19.5l1.2-6L3.3 9.3l6.1-.7L12 3z" /></Icon>;
const IconGlobe = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></Icon>;
const IconArrow = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M5 12h14M13 5l7 7-7 7" /></Icon>;
const IconPlay = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M7 4.5v15l13-7.5-13-7.5z" fill="currentColor" /></Icon>;
const IconCheck = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M4 12.5l5 5L20 6.5" /></Icon>;
const IconX = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M6 6l12 12M18 6L6 18" /></Icon>;
const IconCard = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><rect x="2.5" y="6" width="19" height="13" rx="2" /><path d="M2.5 10h19M6 15h3" /></Icon>;
const IconShield = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" /></Icon>;
const IconChart = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M3 21V3M3 21h18" /><path d="M7 17V10M11 17V7M15 17V12M19 17V5" /></Icon>;
const IconSparkle = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></Icon>;
const IconScissors = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M20 4L8.5 15.5M20 20L8.5 8.5M14 12l6 0" /></Icon>;
const IconBrush = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M16 3l5 5-11 11H5v-5L16 3z" /><path d="M14 5l5 5M5 19l-2 2" /></Icon>;
const IconSpa = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M12 22c0-5 0-9 0-9M7 13c0-3 2-5 5-5s5 2 5 5" /><path d="M12 8c-2-2-5-2-7 0 2 3 5 4 7 4M12 8c2-2 5-2 7 0-2 3-5 4-7 4" /></Icon>;
const IconHand = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M8 11V5a1.5 1.5 0 0 1 3 0v6M11 9V4a1.5 1.5 0 0 1 3 0v7M14 9V5a1.5 1.5 0 0 1 3 0v9c0 3.5-2 7-6 7-3 0-5-2-6-4l-3-5c-.5-1 .5-2 1.5-1.5L8 13" /></Icon>;
const IconHeart = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M12 21s-8-5-8-11a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 6-8 11-8 11z" /></Icon>;
const IconLotus = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M12 21c-5 0-9-3-9-3s2-5 6-5M12 21c5 0 9-3 9-3s-2-5-6-5M12 21V8M12 8c-2 0-4 2-4 5M12 8c2 0 4 2 4 5M12 8c0-3 2-5 2-5s-1 2-1 5M12 8c0-3-2-5-2-5s1 2 1 5" /></Icon>;
const IconCamera = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M3 8h4l2-3h6l2 3h4v11H3z" /><circle cx="12" cy="13" r="3.5" /></Icon>;
const IconEye = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></Icon>;
const IconChat = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M21 12a8 8 0 0 1-11.5 7.2L4 21l1.8-5.5A8 8 0 1 1 21 12z" /></Icon>;
const IconUsers = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.6" /><path d="M16 14.2c2.8.5 5 2.8 5 5.8" /></Icon>;
const IconTooth = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M7 4c-2 0-3 1.5-3 4 0 2 .5 3 1 5l1 5c.3 1.5 1.5 3 3 3 1 0 1.5-1 2-3l1-3 1 3c.5 2 1 3 2 3 1.5 0 2.7-1.5 3-3l1-5c.5-2 1-3 1-5 0-2.5-1-4-3-4-1.5 0-3 1-5 1S8.5 4 7 4z" /></Icon>;
const IconPaw = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><circle cx="6" cy="10" r="2" /><circle cx="10" cy="6" r="2" /><circle cx="14" cy="6" r="2" /><circle cx="18" cy="10" r="2" /><path d="M8 18c0-2 1.8-4 4-4s4 2 4 4c0 1.6-1.4 3-3 3h-2c-1.6 0-3-1.4-3-3z" /></Icon>;

function ZyncraMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <defs>
        <linearGradient id="zgrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="55%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#FB923C" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="32" height="32" rx="8" fill="url(#zgrad)" />
      <path d="M9 10h14l-9 12h9" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Bento Tile Wrapper ─────────────────────────────────────────────────────
function BentoTile({ children, span = 1, rowSpan = 1, accent = "#A78BFA", style = {}, padding = 18 }: {
  children: React.ReactNode; span?: number; rowSpan?: number; accent?: string; style?: React.CSSProperties; padding?: number;
}) {
  return (
    <div style={{
      gridColumn: `span ${span}`,
      gridRow: `span ${rowSpan}`,
      position: "relative",
      background: "linear-gradient(180deg, rgba(20,15,30,0.04) 0%, rgba(20,15,30,0.01) 100%)",
      border: "1px solid var(--line)",
      borderRadius: 18,
      padding,
      overflow: "hidden",
      backdropFilter: "blur(10px)",
      ...style,
    }}>
      <div aria-hidden style={{ position: "absolute", top: -1, left: 12, right: 12, height: 1, background: `linear-gradient(90deg, transparent, ${accent}aa, transparent)` }} />
      {children}
    </div>
  );
}

// ─── Bento: Agenda Tile ─────────────────────────────────────────────────────
function TileAgenda() {
  const [items, setItems] = useState([
    { t: "09:00", s: "Corte + Barba", c: "#A78BFA", d: 45 },
    { t: "10:30", s: "Degradado", c: "#EC4899", d: 30 },
    { t: "13:30", s: "Pack Premium", c: "#FB923C", d: 60 },
  ]);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setFlash(true);
      setTimeout(() => setFlash(false), 2000);
      const candidates = [
        { t: "11:30", s: "Manicure", c: "#22D3EE", d: 30 },
        { t: "15:00", s: "Color", c: "#34D399", d: 60 },
        { t: "16:45", s: "Spa Facial", c: "#FBBF24", d: 45 },
      ];
      const pick = candidates[Math.floor(Math.random() * 3)];
      setItems((prev) => {
        const next = [...prev, pick].sort((a, b) => a.t.localeCompare(b.t));
        return next.slice(-4);
      });
    }, 5500);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <IconCalendar size={14} style={{ color: "var(--violet-2)" }} />
          <span style={{ fontSize: 12, color: "var(--fg-dim)", fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>AGENDA · HOY</span>
        </div>
        {flash && (
          <span style={{ fontSize: 10, padding: "3px 8px", background: "rgba(52,211,153,0.15)", color: "var(--green)", borderRadius: 999, fontFamily: "var(--font-mono)", animation: "fadeUp .3s ease", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 4, height: 4, borderRadius: 999, background: "var(--green)", animation: "pulseGlow 1s infinite" }} />
            +1 reserva
          </span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {items.map((it, idx) => (
          <div key={`${it.t}-${idx}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: `linear-gradient(90deg, ${it.c}15 0%, transparent 100%)`, border: `1px solid ${it.c}33`, borderLeft: `3px solid ${it.c}`, borderRadius: 8, animation: "fadeUp .35s ease" }}>
            <span style={{ fontSize: 11, color: "var(--fg-mute)", width: 36, fontFamily: "var(--font-mono)" }}>{it.t}</span>
            <span style={{ fontSize: 12.5, flex: 1, fontWeight: 500 }}>{it.s}</span>
            <span style={{ fontSize: 10, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>{it.d}m</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Bento: WA Tile ─────────────────────────────────────────────────────────
function TileWa() {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg, #25D366, #128C7E)", display: "grid", placeItems: "center" }}>
          <IconWhatsapp size={12} style={{ color: "white" }} />
        </div>
        <span style={{ fontSize: 12, color: "var(--fg-dim)", fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>WHATSAPP BOT</span>
        <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--green)", fontFamily: "var(--font-mono)" }}>● activo</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ alignSelf: "flex-start", maxWidth: "85%", background: "#E9F1ED", color: "#0F3A2A", padding: "7px 10px", borderRadius: "10px 10px 10px 3px", fontSize: 11.5, lineHeight: 1.35, border: "1px solid rgba(52,211,153,0.25)" }}>
          Hola Camila tu cita es mañana 10:30.
        </div>
        <div style={{ alignSelf: "flex-start", display: "flex", gap: 5, marginTop: 2 }}>
          <span style={{ fontSize: 10, padding: "4px 8px", background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.3)", color: "#5EDB8B", borderRadius: 999, fontFamily: "var(--font-mono)" }}>Confirmar</span>
          <span style={{ fontSize: 10, padding: "4px 8px", background: "rgba(20,15,30,0.04)", border: "1px solid var(--line)", color: "var(--fg-mute)", borderRadius: 999, fontFamily: "var(--font-mono)" }}>Reprogramar</span>
        </div>
        <div style={{ alignSelf: "flex-end", maxWidth: "70%", background: "linear-gradient(135deg, #15A85A, #0E7A40)", color: "white", padding: "7px 10px", borderRadius: "10px 10px 3px 10px", fontSize: 11.5, marginTop: 6 }}>
          Confirmar
        </div>
      </div>
    </>
  );
}

// ─── Bento: Revenue Tile ────────────────────────────────────────────────────
function TileRevenue() {
  const [r, setR] = useState(2840);
  useEffect(() => {
    const id = setInterval(() => setR((v) => v + Math.floor(Math.random() * 60) + 20), 1500);
    return () => clearInterval(id);
  }, []);
  return (
    <>
      <div style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", letterSpacing: "0.05em", marginBottom: 8 }}>INGRESOS HOY</div>
      <div style={{ fontSize: "clamp(28px, 3vw, 38px)", fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1, fontFamily: "var(--font-mono)", background: "var(--gradient)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
        ${Math.floor(r / 1000)}.{String(r % 1000).padStart(3, "0")}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6, marginBottom: 12 }}>
        <span style={{ fontSize: 11.5, color: "var(--green)", fontFamily: "var(--font-mono)" }}>↑ +22%</span>
        <span style={{ fontSize: 11.5, color: "var(--fg-mute)" }}>vs ayer</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 32 }}>
        {[40, 55, 35, 65, 50, 75, 60, 85, 70, 90, 80, 95].map((h, i) => (
          <div key={i} style={{ flex: 1, height: `${h}%`, background: i === 11 ? "linear-gradient(180deg, #EC4899, #A78BFA)" : "rgba(167,139,250,0.25)", borderRadius: 2 }} />
        ))}
      </div>
    </>
  );
}

// ─── Bento: POS Tile ────────────────────────────────────────────────────────
function TilePos() {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>VENTA #2841</span>
        <span style={{ fontSize: 9.5, padding: "2px 7px", borderRadius: 999, background: "rgba(52,211,153,0.15)", color: "var(--green)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>PAGADO</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10, fontSize: 11.5 }}>
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--fg-dim)" }}><span>Corte + Barba</span><span style={{ fontFamily: "var(--font-mono)" }}>$35.000</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "var(--fg-dim)" }}><span>Color</span><span style={{ fontFamily: "var(--font-mono)" }}>$60.000</span></div>
      </div>
      <div style={{ paddingTop: 8, borderTop: "1px dashed var(--line)", display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontSize: 10.5, color: "var(--fg-mute)" }}>TOTAL</span>
        <span style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-0.02em", fontFamily: "var(--font-mono)" }}>$95.000</span>
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {["Nequi", "DIAN"].map((m) => (
          <span key={m} style={{ fontSize: 9.5, padding: "3px 7px", borderRadius: 6, border: "1px solid var(--line)", color: "var(--fg-dim)", fontFamily: "var(--font-mono)" }}>{m}</span>
        ))}
      </div>
    </>
  );
}

// ─── Bento: Reviews Tile ────────────────────────────────────────────────────
function TileReviews() {
  return (
    <>
      <div style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", letterSpacing: "0.05em", marginBottom: 8 }}>RESEÑAS GOOGLE</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em", fontFamily: "var(--font-mono)" }}>4.9</span>
        <div style={{ display: "flex", gap: 2 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <IconStar key={i} size={11} style={{ color: "var(--amber)" } as React.CSSProperties} />
          ))}
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--fg-dim)", marginBottom: 10 }}>+47 reseñas este mes</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {[5, 4, 3, 2, 1].map((s) => {
          const w = s === 5 ? 92 : s === 4 ? 6 : s === 3 ? 2 : 0;
          return (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 9, color: "var(--fg-mute)", width: 8, fontFamily: "var(--font-mono)" }}>{s}</span>
              <div style={{ flex: 1, height: 3, borderRadius: 999, background: "rgba(20,15,30,0.05)", overflow: "hidden" }}>
                <div style={{ width: `${w}%`, height: "100%", background: "var(--amber)" }} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Bento: Booking Link Tile ───────────────────────────────────────────────
function TileBookingLink() {
  return (
    <>
      <div style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", letterSpacing: "0.05em", marginBottom: 10 }}>TU LINK PÚBLICO</div>
      <div style={{ padding: "10px 12px", background: "rgba(20,15,30,0.06)", border: "1px solid var(--line)", borderRadius: 10, fontFamily: "var(--font-mono)", fontSize: 12, display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <IconGlobe size={12} style={{ color: "var(--violet-2)" }} />
        <span style={{ color: "var(--fg-mute)" }}>tuyo</span><span>.zyncra.com</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 38, height: 38, background: "white", borderRadius: 6, padding: 4 }}>
          <div style={{ width: "100%", height: "100%", backgroundImage: "radial-gradient(circle, #000 30%, transparent 30%)", backgroundSize: "5px 5px" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 500 }}>Reservas 24/7</div>
          <div style={{ fontSize: 10.5, color: "var(--fg-mute)" }}>Sin app, sin formulario</div>
        </div>
      </div>
    </>
  );
}

// ─── Bento: CTA Tile ────────────────────────────────────────────────────────
function TileCta() {
  return (
    <a href="/register" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", textDecoration: "none", color: "white" }}>
      <div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-mono)", letterSpacing: "0.05em", marginBottom: 10 }}>EMPEZAR AHORA</div>
        <div style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.05, letterSpacing: "-0.02em" }}>14 días gratis<br />Sin tarjeta.</div>
      </div>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "rgba(20,15,30,0.06)", borderRadius: 10, fontSize: 13, fontWeight: 500, backdropFilter: "blur(10px)", alignSelf: "flex-start" }}>
        Crear cuenta <IconArrow size={14} />
      </div>
    </a>
  );
}

// ─── BentoHero ──────────────────────────────────────────────────────────────
function BentoHero() {
  return (
    <section style={{ position: "relative", paddingTop: 130, paddingBottom: 80, overflow: "hidden" }}>
      {/* gradient orbs */}
      <div aria-hidden style={{ position: "absolute", width: 900, height: 900, borderRadius: "50%", background: "radial-gradient(circle, #8B5CF6 0%, transparent 65%)", filter: "blur(120px)", opacity: 0.28, left: "-15%", top: "-30%", pointerEvents: "none" }} />
      <div aria-hidden style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, #EC4899 0%, transparent 65%)", filter: "blur(120px)", opacity: 0.22, left: "70%", top: "0%", pointerEvents: "none" }} />
      <div aria-hidden style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, #FB923C 0%, transparent 65%)", filter: "blur(120px)", opacity: 0.08, left: "40%", top: "60%", pointerEvents: "none" }} />
      {/* grid backdrop */}
      <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(20,15,30,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(20,15,30,0.04) 1px, transparent 1px)", backgroundSize: "64px 64px", maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)", WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)", pointerEvents: "none", opacity: 0.5 }} />

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px" }}>
        {/* Header copy */}
        <div style={{ textAlign: "center", marginBottom: 56, position: "relative", zIndex: 2 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "6px 6px 6px 14px", border: "1px solid var(--line-strong)", background: "rgba(167,139,250,0.06)", borderRadius: 999, fontSize: 12.5, marginBottom: 28, fontFamily: "var(--font-mono)", letterSpacing: "0.02em" }}>
            <span style={{ color: "var(--violet-2)" }}>● Zyncra Business Suite · 2026</span>
            <span style={{ padding: "3px 9px", background: "rgba(20,15,30,0.08)", borderRadius: 999, fontSize: 10.5, color: "var(--fg-dim)" }}>NUEVO</span>
          </div>

          <h1 style={{ fontSize: "clamp(48px, 7.2vw, 104px)", lineHeight: 0.94, letterSpacing: "-0.05em", fontWeight: 500, margin: 0, marginBottom: 26, textWrap: "balance", maxWidth: 1100, marginLeft: "auto", marginRight: "auto" }}>
            Tu negocio,{" "}
            <span style={{ background: "var(--gradient)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>en piloto</span>{" "}
            <span style={{ background: "var(--gradient)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>automático.</span>
            <br />
            <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400, opacity: 0.92 }}>Tú, libre.</span>
          </h1>

          <p style={{ fontSize: "clamp(16px, 1.4vw, 19px)", lineHeight: 1.5, color: "var(--fg-dim)", maxWidth: 620, margin: "0 auto 32px", textWrap: "pretty" }}>
            Agenda, marketing por WhatsApp, POS y facturación DIAN — todo en una sola plataforma. Pensada para barberías, spas, salones y profesionales que viven de sus citas.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
            <a href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 16, padding: "14px 22px", borderRadius: 14, background: "linear-gradient(135deg, #A78BFA 0%, #EC4899 60%, #FB923C 100%)", color: "white", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 500, boxShadow: "0 8px 30px -10px rgba(167,139,250,0.55), inset 0 1px 0 rgba(255,255,255,0.25)", textDecoration: "none" }}>
              Empezar gratis <IconArrow size={16} />
            </a>
            <a href="#demo" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 16, padding: "14px 22px", borderRadius: 14, background: "rgba(20,15,30,0.06)", color: "var(--fg)", border: "1px solid var(--line-strong)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 500, textDecoration: "none" }}>
              <IconPlay size={13} /> Ver demo en vivo
            </a>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 22, color: "var(--fg-mute)", fontSize: 13, flexWrap: "wrap" }}>
            {["Sin tarjeta", "Setup en 5 min", "14 días gratis", "Soporte en Colombia"].map((t, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <IconCheck size={14} style={{ color: "var(--green)" }} />
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Bento grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gridAutoRows: "120px", gap: 12, position: "relative", zIndex: 2 }} className="bento-hero">
          <BentoTile span={5} rowSpan={2} accent="#A78BFA"><TileAgenda /></BentoTile>
          <BentoTile span={4} rowSpan={2} accent="#34D399"><TileWa /></BentoTile>
          <BentoTile span={3} rowSpan={2} accent="#FB923C"><TileRevenue /></BentoTile>
          <BentoTile span={3} rowSpan={2} accent="#EC4899"><TilePos /></BentoTile>
          <BentoTile span={3} rowSpan={2} accent="#FBBF24"><TileReviews /></BentoTile>
          <BentoTile span={3} rowSpan={2} accent="#22D3EE"><TileBookingLink /></BentoTile>
          <BentoTile span={3} rowSpan={2} accent="#fff" style={{ background: "linear-gradient(135deg, #A78BFA 0%, #EC4899 60%, #FB923C 100%)", border: "1px solid rgba(20,15,30,0.2)", boxShadow: "0 20px 60px -20px rgba(236,72,153,0.5)" }} padding={22}>
            <TileCta />
          </BentoTile>
        </div>
      </div>
    </section>
  );
}

// ─── StatsBar ───────────────────────────────────────────────────────────────
function Counter({ to, prefix = "", suffix = "", decimals = 0 }: { to: number; prefix?: string; suffix?: string; decimals?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const steps = 40;
    const dur = 1800;
    const stepDur = Math.max(16, Math.floor(dur / steps));
    let i = 0;
    const id = setInterval(() => {
      i++;
      const k = Math.min(i / steps, 1);
      const eased = 1 - Math.pow(1 - k, 3);
      const cur = to * eased;
      setVal(decimals === 0 ? Math.round(cur) : Number(cur.toFixed(decimals)));
      if (k >= 1) clearInterval(id);
    }, stepDur);
    return () => clearInterval(id);
  }, [to, decimals]);
  const fmt = decimals === 0 ? val.toLocaleString("es-CO") : val.toFixed(decimals);
  return <span>{prefix}{fmt}{suffix}</span>;
}

function StatsBar() {
  const stats = [
    { val: 500, prefix: "", suffix: "+", label: "Negocios activos", sub: "En 24 ciudades de Colombia" },
    { val: 1, prefix: "", suffix: "M+", label: "Citas gestionadas", sub: "Y subiendo todos los días" },
    { val: 60, prefix: "−", suffix: "%", label: "Menos no-shows", sub: "Promedio en 90 días" },
    { val: 4.9, prefix: "", suffix: "★", label: "Valoración", sub: "548 reseñas verificadas", decimals: 1 },
  ];
  return (
    <section style={{ padding: "60px 0 100px", position: "relative" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, background: "linear-gradient(180deg, rgba(20,15,30,0.025) 0%, rgba(20,15,30,0.005) 100%)", border: "1px solid var(--line)", borderRadius: 22, overflow: "hidden" }} className="stats-grid">
          {stats.map((s, i) => (
            <div key={i} style={{ padding: "32px 28px", borderRight: i < 3 ? "1px solid var(--line)" : "none", position: "relative" }} className="stats-cell">
              <div style={{ fontSize: "clamp(34px, 4vw, 52px)", fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 10, fontFamily: "var(--font-mono)" }}>
                <Counter to={s.val} prefix={s.prefix} suffix={s.suffix} decimals={(s as { decimals?: number }).decimals || 0} />
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--fg)", marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: "var(--fg-mute)" }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Live Pulse Section ─────────────────────────────────────────────────────
const CITIES = [
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
const BIZ_TYPES = [
  { label: "Barbería", c: "#A78BFA" },
  { label: "Salón", c: "#EC4899" },
  { label: "Spa", c: "#22D3EE" },
  { label: "Manicure", c: "#FB923C" },
  { label: "Tatuajes", c: "#34D399" },
];
const FIRST_NAMES = ["Camila", "Juan", "Andrés", "María", "Carlos", "Diana", "Laura", "Pedro", "Sara", "Miguel", "Valentina", "Daniel", "Sofía", "Felipe", "Catalina"];

function randomBooking() {
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];
  const biz = BIZ_TYPES[Math.floor(Math.random() * BIZ_TYPES.length)];
  return {
    id: Math.random().toString(36).slice(2),
    city,
    biz,
    name: FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)],
    when: `hace ${Math.floor(Math.random() * 50) + 5}s`,
  };
}

type Booking = ReturnType<typeof randomBooking>;

function LivePulseSection() {
  const [bookings, setBookings] = useState<Booking[]>(() => Array.from({ length: 6 }).map(randomBooking));
  const [lastPing, setLastPing] = useState<Booking>(bookings[bookings.length - 1]);
  const [counter, setCounter] = useState(1248);

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
    <section style={{ padding: "120px 0", position: "relative", overflow: "hidden" }}>
      <div aria-hidden style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, #A78BFA 0%, transparent 65%)", filter: "blur(120px)", opacity: 0.12, left: "-20%", top: "20%", pointerEvents: "none" }} />
      <div aria-hidden style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, #EC4899 0%, transparent 65%)", filter: "blur(120px)", opacity: 0.10, left: "80%", top: "60%", pointerEvents: "none" }} />
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px" }}>
        <div style={{ textAlign: "center", marginBottom: 56, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, border: "1px solid var(--line-strong)", background: "rgba(167,139,250,0.08)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500, color: "var(--violet-2)", fontFamily: "var(--font-mono)" }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--violet-2)", boxShadow: "0 0 10px var(--violet-2)", animation: "pulseGlow 1.8s ease-in-out infinite" }} />
            Pulso en vivo
          </div>
          <h2 style={{ fontSize: "clamp(34px, 4.6vw, 56px)", lineHeight: 1.04, letterSpacing: "-0.035em", margin: 0, fontWeight: 500, maxWidth: 820, textWrap: "balance" }}>
            Mientras lees esto, alguien reserva en{" "}
            <span style={{ background: "var(--gradient)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Zyncra.</span>
          </h2>
          <p style={{ fontSize: "clamp(15px, 1.4vw, 18px)", lineHeight: 1.55, color: "var(--fg-dim)", margin: 0, maxWidth: 620 }}>
            Más de 500 negocios en 24 ciudades de Colombia. El mapa se actualiza en tiempo real.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36, alignItems: "center" }} className="pulse-grid">
          {/* Map */}
          <div style={{ padding: 36, background: "linear-gradient(180deg, rgba(20,15,30,0.03), rgba(20,15,30,0.005))", border: "1px solid var(--line)", borderRadius: 24, position: "relative" }}>
            <div style={{ position: "absolute", top: 20, left: 20, display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "rgba(52,211,153,0.10)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 999, fontSize: 11, color: "var(--green)", fontFamily: "var(--font-mono)" }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--green)", animation: "pulseGlow 1s infinite" }} />
              EN VIVO · COLOMBIA
            </div>
            <div style={{ position: "absolute", top: 20, right: 20, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-mute)" }}>
              → {lastPing.city.name}
            </div>

            {/* Colombia map */}
            <div style={{ position: "relative", width: "100%", aspectRatio: "0.85", maxWidth: 460, margin: "0 auto", paddingTop: 40 }}>
              <div aria-hidden style={{ position: "absolute", inset: "15%", background: "radial-gradient(circle, rgba(167,139,250,0.25), transparent 70%)", filter: "blur(40px)" }} />
              <svg viewBox="0 0 100 117" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
                <defs>
                  <linearGradient id="comap" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="rgba(167,139,250,0.20)" />
                    <stop offset="100%" stopColor="rgba(236,72,153,0.10)" />
                  </linearGradient>
                </defs>
                <path d="M48,5 L52,8 L56,9 L55,13 L52,15 L48,14 L45,17 L42,18 L38,18 L36,21 L35,24 L37,27 L40,28 L43,30 L46,32 L48,35 L52,33 L55,32 L58,33 L62,32 L65,33 L68,32 L70,35 L68,38 L65,40 L63,43 L62,47 L60,50 L58,53 L55,56 L52,60 L50,64 L52,67 L54,71 L55,75 L52,78 L48,80 L46,83 L48,87 L46,90 L43,92 L40,94 L36,95 L33,93 L31,88 L29,84 L27,79 L25,73 L23,67 L21,60 L20,53 L21,46 L23,40 L26,34 L28,29 L30,25 L31,21 L32,17 L33,13 L35,9 L40,7 Z" fill="url(#comap)" stroke="rgba(167,139,250,0.4)" strokeWidth="0.4" />
              </svg>
              {CITIES.map((c) => {
                const isLast = lastPing.city.name === c.name;
                return (
                  <div key={c.name} style={{ position: "absolute", left: `${c.x}%`, top: `${c.y}%`, width: 8 + c.weight * 8, height: 8 + c.weight * 8, transform: "translate(-50%, -50%)" }}>
                    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(167,139,250,0.9)", boxShadow: "0 0 12px rgba(167,139,250,0.8)" }} />
                    {isLast && (
                      <>
                        <div style={{ position: "absolute", inset: -8, borderRadius: "50%", border: "2px solid #EC4899", animation: "pingRing 1.6s ease-out infinite" }} />
                        <div style={{ position: "absolute", inset: -16, borderRadius: "50%", border: "1px solid rgba(236,72,153,0.5)", animation: "pingRing 1.6s ease-out 0.4s infinite" }} />
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: "center", marginTop: 16 }}>
              <div style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", letterSpacing: "0.05em", marginBottom: 4 }}>RESERVAS HOY</div>
              <div style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-0.03em", fontFamily: "var(--font-mono)" }}>{counter.toLocaleString("es-CO")}</div>
            </div>
          </div>

          {/* Live feed */}
          <div>
            <div style={{ fontSize: 12, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>Feed de reservas</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 520, overflow: "hidden", maskImage: "linear-gradient(180deg, black 0%, black 85%, transparent 100%)", WebkitMaskImage: "linear-gradient(180deg, black 0%, black 85%, transparent 100%)" }}>
              {bookings.map((b, i) => (
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: i === 0 ? `linear-gradient(90deg, ${b.biz.c}1a, transparent)` : "rgba(255,255,255,0.025)", border: "1px solid " + (i === 0 ? `${b.biz.c}55` : "var(--line)"), borderRadius: 12, animation: i === 0 ? "fadeUp .35s ease" : "none", opacity: Math.max(0.4, 1 - i * 0.08) }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${b.biz.c}22`, border: `1px solid ${b.biz.c}55`, display: "grid", placeItems: "center", color: b.biz.c, fontSize: 12, fontWeight: 600 }}>
                    {b.biz.label.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name} reservó · {b.biz.label}</div>
                    <div style={{ fontSize: 11.5, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>{b.city.name} · {b.when}</div>
                  </div>
                  {i === 0 && (
                    <span style={{ fontSize: 9.5, padding: "3px 7px", background: "rgba(52,211,153,0.15)", color: "var(--green)", borderRadius: 999, fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>NUEVO</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Demos Section ──────────────────────────────────────────────────────────
function DemoAgenda() {
  const [appointments, setAppointments] = useState([
    { id: 1, time: "09:00", dur: 45, service: "Corte + Barba", client: "Juan García", stylist: "Carlos", color: "#A78BFA", status: "confirmed" },
    { id: 2, time: "10:30", dur: 30, service: "Degradado", client: "Miguel Ríos", stylist: "Carlos", color: "#EC4899", status: "confirmed" },
    { id: 3, time: "13:30", dur: 60, service: "Pack Premium", client: "Andrés Polo", stylist: "Diana", color: "#FB923C", status: "confirmed" },
    { id: 4, time: "15:00", dur: 45, service: "Color + Corte", client: "Sara López", stylist: "Diana", color: "#22D3EE", status: "confirmed" },
  ]);
  const [pulseId, setPulseId] = useState<number | null>(null);
  const [bookingFlash, setBookingFlash] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setBookingFlash(true);
      setTimeout(() => setBookingFlash(false), 2200);
      const newAppt = {
        id: Date.now(),
        time: ["11:30", "14:15", "16:30", "17:00"][Math.floor(Math.random() * 4)],
        dur: [30, 45, 60][Math.floor(Math.random() * 3)],
        service: ["Manicure", "Corte clásico", "Spa facial", "Tinte"][Math.floor(Math.random() * 4)],
        client: ["Laura M.", "Pedro V.", "Carmen R.", "Daniela T."][Math.floor(Math.random() * 4)],
        stylist: ["Carlos", "Diana"][Math.floor(Math.random() * 2)],
        color: ["#A78BFA", "#EC4899", "#FB923C", "#22D3EE"][Math.floor(Math.random() * 4)],
        status: "new",
      };
      setPulseId(newAppt.id);
      setAppointments((prev) => {
        const next = [...prev, newAppt].sort((a, b) => a.time.localeCompare(b.time));
        return next.slice(-6);
      });
      setTimeout(() => setPulseId(null), 2500);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  const hours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

  return (
    <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 220px", gap: 20, height: "100%" }} className="demo-agenda-grid">
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.02em" }}>Lunes, 19 de Mayo</div>
            <div style={{ fontSize: 12, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>{appointments.length} citas · 2 profesionales</div>
          </div>
          {bookingFlash && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", color: "var(--green)", padding: "6px 12px", borderRadius: 999, fontSize: 12, fontFamily: "var(--font-mono)", animation: "fadeUp .4s ease" }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--green)", animation: "pulseGlow 1s infinite" }} />
              Nueva reserva · WhatsApp
            </div>
          )}
        </div>
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "50px 1fr 1fr", gap: 0, fontSize: 12 }}>
          <div /><div style={{ padding: "8px 12px", borderBottom: "1px solid var(--line)", color: "var(--fg-dim)", fontWeight: 500 }}>Carlos</div>
          <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--line)", color: "var(--fg-dim)", fontWeight: 500 }}>Diana</div>
          {hours.map((h) => (
            <>
              <div key={h} style={{ padding: "6px 8px", color: "var(--fg-mute)", fontSize: 11, borderTop: "1px solid var(--line)", height: 52, fontFamily: "var(--font-mono)" }}>{h}</div>
              {["Carlos", "Diana"].map((stylist) => (
                <div key={`${h}-${stylist}`} style={{ borderTop: "1px solid var(--line)", borderLeft: "1px solid var(--line)", height: 52, position: "relative" }}>
                  {appointments.filter((a) => a.stylist === stylist && a.time.startsWith(h.split(":")[0])).map((a) => {
                    const minOffset = parseInt(a.time.split(":")[1]);
                    const top = (minOffset / 60) * 52;
                    const height = (a.dur / 60) * 52 - 2;
                    return (
                      <div key={a.id} style={{ position: "absolute", top, left: 4, right: 4, height, background: `linear-gradient(135deg, ${a.color}22 0%, ${a.color}11 100%)`, border: `1px solid ${a.color}55`, borderLeft: `3px solid ${a.color}`, borderRadius: 6, padding: "4px 8px", fontSize: 11.5, animation: pulseId === a.id ? "fadeUp .5s ease" : "none", boxShadow: pulseId === a.id ? `0 0 30px ${a.color}66` : "none", overflow: "hidden" }}>
                        <div style={{ fontWeight: 500 }}>{a.service}</div>
                        <div style={{ fontSize: 10.5, color: "var(--fg-dim)" }}>{a.client}</div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }} className="demo-agenda-side">
        <div style={{ padding: 14, background: "rgba(20,15,30,0.025)", borderRadius: 12, border: "1px solid var(--line)" }}>
          <div style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Hoy</div>
          <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.02em", fontFamily: "var(--font-mono)" }}>{appointments.length}</div>
          <div style={{ fontSize: 11.5, color: "var(--fg-dim)" }}>citas agendadas</div>
        </div>
        <div style={{ padding: 14, background: "linear-gradient(135deg, rgba(167,139,250,0.08), rgba(236,72,153,0.04))", borderRadius: 12, border: "1px solid rgba(167,139,250,0.3)" }}>
          <div style={{ fontSize: 11, color: "var(--violet-2)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Ingresos</div>
          <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em", fontFamily: "var(--font-mono)" }}>$840K</div>
          <div style={{ fontSize: 11.5, color: "var(--green)" }}>↑ +22% vs ayer</div>
        </div>
        <div style={{ padding: 14, background: "rgba(20,15,30,0.025)", borderRadius: 12, border: "1px solid var(--line)" }}>
          <div style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>No-shows</div>
          <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em", fontFamily: "var(--font-mono)", color: "var(--green)" }}>−60%</div>
          <div style={{ fontSize: 11.5, color: "var(--fg-dim)" }}>con recordatorios</div>
        </div>
      </div>
    </div>
  );
}

function DemoWhatsapp() {
  const conversation = [
    { from: "bot", text: "Hola Camila! Te recuerdo que tu cita es mañana a las 10:30 con Diana.", t: "09:30", actions: ["Confirmar", "Reprogramar"] },
    { from: "user", text: "Confirmar", t: "09:31" },
    { from: "bot", text: "¡Listo! Te esperamos mañana.", t: "09:31" },
    { from: "user", text: "Gracias!", t: "09:32" },
    { from: "bot", text: "Después de tu cita, ¿nos ayudas con una reseña en Google? Te enviamos el link automáticamente", t: "12:15" },
  ];
  const [visible, setVisible] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const advance = (i: number) => {
      if (i >= conversation.length) {
        timeouts.push(setTimeout(() => { setVisible(0); advance(0); }, 5000));
        return;
      }
      const msg = conversation[i];
      if (msg.from === "bot") {
        setTyping(true);
        timeouts.push(setTimeout(() => {
          setTyping(false);
          setVisible((v) => v + 1);
          timeouts.push(setTimeout(() => advance(i + 1), 1200));
        }, 1100));
      } else {
        setVisible((v) => v + 1);
        timeouts.push(setTimeout(() => advance(i + 1), 1400));
      }
    };
    advance(0);
    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24, height: "100%" }} className="demo-wa-grid">
      <div style={{ background: "#F1F7F2", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 20, padding: 16, height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, borderBottom: "1px solid rgba(20,15,30,0.06)" }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #25D366, #128C7E)", display: "grid", placeItems: "center" }}>
            <IconWhatsapp size={18} style={{ color: "white" }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Studio V · Manizales</div>
            <div style={{ fontSize: 11, color: "var(--green)" }}>● en línea — Zyncra Bot</div>
          </div>
        </div>
        <div style={{ flex: 1, padding: "12px 4px", display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" }}>
          {conversation.slice(0, visible).map((m, i) => (
            <div key={i} style={{ alignSelf: m.from === "user" ? "flex-end" : "flex-start", maxWidth: "85%", animation: "fadeUp .35s ease" }}>
              <div style={{ background: m.from === "user" ? "linear-gradient(135deg, #15A85A, #0E7A40)" : "#E9F1ED", color: m.from === "user" ? "white" : "#0F3A2A", padding: "9px 12px", borderRadius: m.from === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", fontSize: 13, lineHeight: 1.4 }}>
                {m.text}
              </div>
              {(m as { actions?: string[] }).actions && (
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  {(m as { actions: string[] }).actions.map((a) => (
                    <span key={a} style={{ padding: "5px 10px", background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.3)", color: "#5EDB8B", borderRadius: 999, fontSize: 11, fontFamily: "var(--font-mono)" }}>{a}</span>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 9.5, color: "rgba(0,0,0,0.35)", marginTop: 3, textAlign: m.from === "user" ? "right" : "left", fontFamily: "var(--font-mono)" }}>
                {m.t} {m.from === "user" && "✓✓"}
              </div>
            </div>
          ))}
          {typing && (
            <div style={{ alignSelf: "flex-start", background: "#E9F1ED", padding: "10px 12px", borderRadius: "14px 14px 14px 4px", display: "flex", gap: 4 }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ width: 5, height: 5, borderRadius: 999, background: "rgba(20,15,30,0.5)", animation: `pulseGlow 1s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Campaña actual</div>
          <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.02em" }}>Reactivación · Clientes inactivos +60d</div>
        </div>
        <div style={{ padding: 16, background: "linear-gradient(135deg, rgba(52,211,153,0.08), transparent)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: "var(--fg-dim)" }}>Enviados</span>
            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)" }}>342</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "var(--fg-dim)" }}>Leídos</span>
            <span style={{ fontSize: 12, color: "var(--green)", fontFamily: "var(--font-mono)" }}>318 · 93%</span>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: "rgba(20,15,30,0.05)", overflow: "hidden", marginBottom: 14 }}>
            <div style={{ width: "93%", height: "100%", background: "linear-gradient(90deg, var(--green), #6EE7B7)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "var(--fg-dim)" }}>Citas reservadas</span>
            <span style={{ fontSize: 18, fontWeight: 500, color: "var(--green)", fontFamily: "var(--font-mono)" }}>+47</span>
          </div>
        </div>
        <div style={{ padding: 14, background: "rgba(20,15,30,0.025)", border: "1px solid var(--line)", borderRadius: 12 }}>
          <div style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", marginBottom: 6 }}>ROI estimado</div>
          <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em", fontFamily: "var(--font-mono)" }}>$2.8M</div>
          <div style={{ fontSize: 11.5, color: "var(--fg-dim)" }}>en clientes recuperados</div>
        </div>
      </div>
    </div>
  );
}

function DemoPos() {
  const services = [
    { name: "Corte clásico", price: 25000, c: "#A78BFA" },
    { name: "Corte + Barba", price: 35000, c: "#EC4899" },
    { name: "Degradado", price: 30000, c: "#FB923C" },
    { name: "Color", price: 60000, c: "#22D3EE" },
    { name: "Manicure", price: 28000, c: "#34D399" },
    { name: "Pack premium", price: 85000, c: "#FBBF24" },
  ];
  type Service = (typeof services)[0];
  const [cart, setCart] = useState<Service[]>([]);
  const [paid, setPaid] = useState(false);
  const [method, setMethod] = useState("Nequi");

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const loop = () => {
      setCart([]);
      setPaid(false);
      timeouts.push(setTimeout(() => setCart((c) => [...c, services[1]]), 1200));
      timeouts.push(setTimeout(() => setCart((c) => [...c, services[3]]), 2600));
      timeouts.push(setTimeout(() => setCart((c) => [...c, services[4]]), 4000));
      timeouts.push(setTimeout(() => { setMethod("Nequi"); setPaid(true); }, 5800));
      timeouts.push(setTimeout(loop, 11000));
    };
    loop();
    return () => timeouts.forEach(clearTimeout);
  }, []);

  const total = cart.reduce((s, x) => s + x.price, 0);

  return (
    <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20, height: "100%" }} className="demo-pos-grid">
      <div>
        <div style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Servicios</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {services.map((s, i) => {
            const inCart = cart.includes(s);
            return (
              <div key={i} style={{ padding: "14px 12px", borderRadius: 12, border: `1px solid ${inCart ? s.c + "88" : "var(--line)"}`, background: inCart ? `linear-gradient(135deg, ${s.c}22, ${s.c}05)` : "rgba(255,255,255,0.025)", position: "relative", overflow: "hidden", transition: "all .35s ease", transform: inCart ? "scale(1.02)" : "scale(1)", boxShadow: inCart ? `0 0 30px ${s.c}44` : "none" }}>
                <div style={{ position: "absolute", top: 8, right: 8, width: 7, height: 7, borderRadius: 999, background: s.c, boxShadow: `0 0 10px ${s.c}`, opacity: inCart ? 1 : 0.4 }} />
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{s.name}</div>
                <div style={{ fontSize: 14, color: "var(--fg-dim)", fontFamily: "var(--font-mono)" }}>${(s.price / 1000).toFixed(0)}.000</div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #FBF8F2 100%)", border: "1px solid var(--line-strong)", borderRadius: 14, padding: 18, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>VENTA #2841</span>
          <span style={{ fontSize: 10, padding: "3px 9px", background: paid ? "rgba(52,211,153,0.15)" : "rgba(251,191,36,0.15)", color: paid ? "var(--green)" : "var(--amber)", borderRadius: 999, fontFamily: "var(--font-mono)", fontWeight: 500 }}>{paid ? "PAGADO" : "EN CURSO"}</span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {cart.length === 0 && <div style={{ color: "var(--fg-mute)", fontSize: 13, padding: "12px 0", textAlign: "center", fontStyle: "italic" }}>Esperando servicios…</div>}
          {cart.map((s, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px dashed var(--line)", animation: "fadeUp .35s ease", fontSize: 13 }}>
              <span>{s.name}</span><span style={{ fontFamily: "var(--font-mono)" }}>${(s.price / 1000).toFixed(0)}.000</span>
            </div>
          ))}
        </div>
        <div style={{ paddingTop: 10, borderTop: "1px solid var(--line)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: "var(--fg-mute)" }}>TOTAL</span>
            <span style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em", background: "var(--gradient)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", fontFamily: "var(--font-mono)" }}>${(total / 1000).toFixed(0)}.000</span>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {["Nequi", "Daviplata", "Efectivo", "Tarjeta"].map((m) => (
              <span key={m} style={{ fontSize: 11, padding: "5px 9px", borderRadius: 8, border: method === m && paid ? "1px solid var(--violet-2)" : "1px solid var(--line)", background: method === m && paid ? "rgba(167,139,250,0.12)" : "transparent", color: method === m && paid ? "var(--violet-2)" : "var(--fg-dim)", fontFamily: "var(--font-mono)" }}>{m}</span>
            ))}
          </div>
          {paid && (
            <div style={{ padding: "10px 12px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: 10, fontSize: 11.5, color: "var(--green)", fontFamily: "var(--font-mono)", display: "flex", alignItems: "center", gap: 8, animation: "fadeUp .4s ease" }}>
              <IconCheck size={14} />
              DIAN · CUFE emitido · XML enviado
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DemosSection() {
  const tabs = [
    { id: "agenda", label: "Agenda en vivo", icon: <IconCalendar size={16} />, sub: "Mira cómo entran citas por WhatsApp en tiempo real", node: <DemoAgenda /> },
    { id: "wa", label: "Marketing WhatsApp", icon: <IconWhatsapp size={16} />, sub: "Bot que confirma, recuerda y reactiva clientes solo", node: <DemoWhatsapp /> },
    { id: "pos", label: "POS + Factura DIAN", icon: <IconCard size={16} />, sub: "Cobra y factura en segundos, sin doble registro", node: <DemoPos /> },
  ];
  const [active, setActive] = useState(0);

  return (
    <section id="demo" style={{ padding: "120px 0", position: "relative", overflow: "hidden" }}>
      <div aria-hidden style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, #EC4899 0%, transparent 65%)", filter: "blur(120px)", opacity: 0.16, left: "-15%", top: "40%", pointerEvents: "none" }} />
      <div aria-hidden style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, #A78BFA 0%, transparent 65%)", filter: "blur(120px)", opacity: 0.14, left: "80%", top: "10%", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px" }}>
        <div style={{ textAlign: "center", marginBottom: 56, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, border: "1px solid var(--line-strong)", background: "rgba(167,139,250,0.08)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500, color: "var(--violet-2)", fontFamily: "var(--font-mono)" }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--violet-2)", boxShadow: "0 0 10px var(--violet-2)", animation: "pulseGlow 1.8s ease-in-out infinite" }} />
            Demos en vivo
          </div>
          <h2 style={{ fontSize: "clamp(34px, 4.6vw, 56px)", lineHeight: 1.04, letterSpacing: "-0.035em", margin: 0, fontWeight: 500, maxWidth: 820 }}>
            El producto funciona,{" "}
            <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}>no solo se ve bonito.</span>
          </h2>
          <p style={{ fontSize: "clamp(15px, 1.4vw, 18px)", lineHeight: 1.55, color: "var(--fg-dim)", margin: 0, maxWidth: 620 }}>
            Mira cada herramienta en acción. Sin instalar nada, sin registrarte. Solo dale play.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", padding: 6, background: "rgba(20,15,30,0.04)", border: "1px solid var(--line)", borderRadius: 14, gap: 4 }} className="demo-tabs">
            {tabs.map((t, i) => (
              <button key={t.id} onClick={() => setActive(i)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: active === i ? "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(236,72,153,0.15))" : "transparent", border: active === i ? "1px solid var(--line-strong)" : "1px solid transparent", borderRadius: 10, color: active === i ? "var(--fg)" : "var(--fg-dim)", fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)", transition: "all .25s ease" }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Browser frame */}
        <div style={{ position: "relative", background: "linear-gradient(180deg, rgba(20,15,30,0.03) 0%, rgba(20,15,30,0.01) 100%)", border: "1px solid var(--line-strong)", borderRadius: 24, minHeight: 560, overflow: "hidden", boxShadow: "0 40px 80px -30px rgba(20,15,30,0.10), 0 0 100px -40px rgba(167,139,250,0.3)" }}>
          <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 14, background: "rgba(20,15,30,0.02)" }}>
            <div style={{ display: "flex", gap: 6 }}>
              {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
                <span key={c} style={{ width: 10, height: 10, borderRadius: 999, background: c }} />
              ))}
            </div>
            <div style={{ flex: 1, background: "rgba(20,15,30,0.04)", border: "1px solid var(--line)", padding: "4px 12px", borderRadius: 8, fontSize: 11.5, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", display: "flex", alignItems: "center", gap: 8 }}>
              <IconShield size={11} style={{ color: "var(--green)" }} />
              app.zyncra.com/{tabs[active].id}
            </div>
            <span style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>● en vivo</span>
          </div>
          <div style={{ minHeight: 510 }}>{tabs[active].node}</div>
        </div>

        <div style={{ textAlign: "center", marginTop: 24, color: "var(--fg-mute)", fontSize: 13, fontStyle: "italic" }}>
          {tabs[active].sub}
        </div>
      </div>
    </section>
  );
}

// ─── Industries Marquee ─────────────────────────────────────────────────────
function IndustriesMarquee() {
  const items = [
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
    <section style={{ padding: "80px 0", position: "relative" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px" }}>
        <div style={{ textAlign: "center", marginBottom: 56, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, border: "1px solid var(--line-strong)", background: "rgba(167,139,250,0.08)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500, color: "var(--violet-2)", fontFamily: "var(--font-mono)" }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--violet-2)", boxShadow: "0 0 10px var(--violet-2)", animation: "pulseGlow 1.8s ease-in-out infinite" }} />
            Diseñado para ti
          </div>
          <h2 style={{ fontSize: "clamp(34px, 4.6vw, 56px)", lineHeight: 1.04, letterSpacing: "-0.035em", margin: 0, fontWeight: 500, maxWidth: 820 }}>
            Para cualquier negocio{" "}
            <span style={{ background: "var(--gradient)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>que trabaje con citas.</span>
          </h2>
          <p style={{ fontSize: "clamp(15px, 1.4vw, 18px)", lineHeight: 1.55, color: "var(--fg-dim)", margin: 0, maxWidth: 620 }}>
            Si tu calendario es tu activo más importante, Zyncra es para ti. Pensado para profesionales, no para corporaciones.
          </p>
        </div>
      </div>

      <div style={{ position: "relative", maskImage: "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)", overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 14, width: "max-content", animation: "scrollX 40s linear infinite", padding: "8px 0" }}>
          {row.map((it, i) => (
            <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 22px", border: "1px solid var(--line)", borderRadius: 999, background: "rgba(20,15,30,0.025)", fontSize: 14.5, whiteSpace: "nowrap", color: "var(--fg-dim)" }}>
              <span style={{ color: "var(--violet-2)" }}>{it.icon}</span>
              {it.label}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 14, width: "max-content", animation: "scrollX 50s linear infinite reverse", padding: "8px 0", marginTop: 14 }}>
          {row.slice().reverse().map((it, i) => (
            <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 22px", border: "1px solid var(--line)", borderRadius: 999, background: "rgba(20,15,30,0.025)", fontSize: 14.5, whiteSpace: "nowrap", color: "var(--fg-dim)" }}>
              <span style={{ color: "var(--magenta)" }}>{it.icon}</span>
              {it.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Scroll Story Section ───────────────────────────────────────────────────
const TIMELINE = [
  { hour: "07:30", without: { title: "Llegas estresada", text: "14 WhatsApps sin responder de anoche. Tres clientes piden cita, no sabes si tienes cupo." }, with: { title: "Café tranquila", text: "Tu agenda ya tiene 4 reservas que entraron mientras dormías. Cero mensajes pendientes." } },
  { hour: "09:00", without: { title: "Suena el teléfono", text: "Cliente quiere reservar, pero estás cortando. Lo pones en espera, se aburre, cuelga." }, with: { title: "Atiende a tu cliente", text: "Las reservas entran solas por tu link. Te llega notificación, sigues con tu trabajo." } },
  { hour: "11:00", without: { title: "No-show #1", text: "Cliente de las 10:30 no llegó, no avisó. 45 min perdidos. $35.000 que no entran." }, with: { title: "Confirmaciones automáticas", text: "Bot ya recordó a todos por WhatsApp. 95% confirma. Los que no, liberan el cupo." } },
  { hour: "13:30", without: { title: "Excel del demonio", text: "Cliente pregunta cuánto gastó este mes. Buscas en Excel. No cuadra. Vergüenza ajena." }, with: { title: "1 clic, todo el historial", text: "Buscas el cliente, ves cada visita, sus servicios favoritos. Te ve como una pro." } },
  { hour: "15:00", without: { title: "Caja descuadrada", text: "$240.000 que no sabes de dónde salieron. ¿Quién cobró qué? El equipo se mira." }, with: { title: "POS + Caja sincronizados", text: "Cada cobro queda registrado por profesional, método de pago y servicio. Caja cuadra sola." } },
  { hour: "17:00", without: { title: "Comisiones a mano", text: "Sentada con calculadora, sumando servicios por cada profesional. 2 horas. Y aún hay errores." }, with: { title: "Comisiones automáticas", text: "Reporte por profesional listo. Click. Pagas. Cero disputas, cero noches sumando." } },
  { hour: "19:30", without: { title: "Cierras agotada", text: "Sin idea de cuánto facturaste. Mañana, lo mismo. Sin reseñas nuevas. Sin clientes nuevos." }, with: { title: "Cierras con datos", text: "$1.2M facturados. +12 reseñas Google. 3 clientes reactivados. Te vas a casa. A descansar." } },
];

function StoryRow({ item, side }: { item: typeof TIMELINE[0]; side: "without" | "with" }) {
  const isWithout = side === "without";
  const content = isWithout ? item.without : item.with;
  return (
    <div style={{ padding: "24px 26px", background: isWithout ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg, rgba(167,139,250,0.10), rgba(236,72,153,0.04))", border: "1px solid " + (isWithout ? "var(--line-strong)" : "rgba(167,139,250,0.4)"), borderRadius: 16, position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        {isWithout ? <IconX size={14} style={{ color: "var(--fg-mute)" }} /> : <IconCheck size={14} style={{ color: "var(--green)" }} />}
        <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: "-0.01em" }}>{content.title}</span>
      </div>
      <p style={{ margin: 0, color: isWithout ? "var(--fg-mute)" : "var(--fg-dim)", fontSize: 13.5, lineHeight: 1.5 }}>{content.text}</p>
    </div>
  );
}

function ScrollStorySection() {
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
      const idx = Math.min(TIMELINE.length - 1, Math.floor(progress * TIMELINE.length));
      setActiveIdx(idx);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section style={{ position: "relative", background: "var(--bg)" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px" }}>
        <div style={{ textAlign: "center", marginBottom: 56, paddingTop: 120, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, border: "1px solid var(--line-strong)", background: "rgba(167,139,250,0.08)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500, color: "var(--violet-2)", fontFamily: "var(--font-mono)" }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--violet-2)", boxShadow: "0 0 10px var(--violet-2)", animation: "pulseGlow 1.8s ease-in-out infinite" }} />
            Un día con/sin Zyncra
          </div>
          <h2 style={{ fontSize: "clamp(34px, 4.6vw, 56px)", lineHeight: 1.04, letterSpacing: "-0.035em", margin: 0, fontWeight: 500, maxWidth: 820 }}>
            Misma persona. Misma jornada.{" "}
            <span style={{ background: "var(--gradient)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Dos universos.</span>
          </h2>
          <p style={{ fontSize: "clamp(15px, 1.4vw, 18px)", lineHeight: 1.55, color: "var(--fg-dim)", margin: 0, maxWidth: 680 }}>
            Haz scroll. Las horas pasan. Mira lo que vives sin Zyncra a la izquierda, y lo que podrías estar viviendo a la derecha.
          </p>
        </div>
      </div>

      <div ref={containerRef} style={{ position: "relative", height: `${TIMELINE.length * 60}vh` }}>
        <div style={{ position: "sticky", top: 0, height: "100vh", display: "grid", placeItems: "center", overflow: "hidden" }}>
          <div aria-hidden style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, #A78BFA 0%, transparent 65%)", filter: "blur(120px)", opacity: 0.10, left: "-15%", top: "20%", pointerEvents: "none" }} />
          <div aria-hidden style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, #EC4899 0%, transparent 65%)", filter: "blur(120px)", opacity: 0.10, left: "75%", top: "60%", pointerEvents: "none" }} />
          <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px", width: "100%" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 1fr", gap: 0, alignItems: "stretch", minHeight: 460 }} className="story-grid">
              {/* Without */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ marginBottom: 20, paddingLeft: 26 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, background: "rgba(20,15,30,0.04)", border: "1px solid var(--line-strong)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--fg-mute)" }} />
                    <span style={{ fontSize: 11.5, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Sin Zyncra</span>
                  </div>
                </div>
                <StoryRow item={TIMELINE[activeIdx]} side="without" />
              </div>

              {/* Time pole */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", paddingTop: 56, position: "relative" }}>
                <div style={{ position: "absolute", top: 56, bottom: 20, width: 2, background: "linear-gradient(180deg, transparent, var(--line-strong) 20%, var(--line-strong) 80%, transparent)" }} />
                {TIMELINE.map((t, i) => {
                  const isActive = i === activeIdx;
                  const isPast = i < activeIdx;
                  return (
                    <div key={t.hour} style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginBottom: 12, opacity: isActive ? 1 : isPast ? 0.5 : 0.3, transition: "opacity .3s ease" }}>
                      <div style={{ width: isActive ? 16 : 8, height: isActive ? 16 : 8, borderRadius: "50%", background: isActive ? "linear-gradient(135deg, #A78BFA, #EC4899)" : isPast ? "var(--violet-2)" : "rgba(0,0,0,0.2)", border: "2px solid var(--bg)", boxShadow: isActive ? "0 0 24px rgba(167,139,250,0.7)" : "none", transition: "all .3s ease" }} />
                      <span style={{ fontSize: isActive ? 13 : 10.5, color: isActive ? "var(--fg)" : "var(--fg-mute)", fontWeight: isActive ? 500 : 400, letterSpacing: "0.04em", fontFamily: "var(--font-mono)", transition: "all .3s ease" }}>{t.hour}</span>
                    </div>
                  );
                })}
              </div>

              {/* With */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ marginBottom: 20, paddingLeft: 26 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.3)" }}>
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--violet-2)", boxShadow: "0 0 8px var(--violet-2)" }} />
                    <span style={{ fontSize: 11.5, color: "var(--violet-2)", fontFamily: "var(--font-mono)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Con Zyncra</span>
                  </div>
                </div>
                <StoryRow item={TIMELINE[activeIdx]} side="with" />
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ maxWidth: 600, margin: "40px auto 0", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", marginBottom: 8 }}>
                <span>{TIMELINE[0].hour}</span>
                <span>SIGUE HACIENDO SCROLL ↓</span>
                <span>{TIMELINE[TIMELINE.length - 1].hour}</span>
              </div>
              <div style={{ height: 4, borderRadius: 999, background: "rgba(20,15,30,0.06)", overflow: "hidden" }}>
                <div style={{ width: `${((activeIdx + 1) / TIMELINE.length) * 100}%`, height: "100%", background: "linear-gradient(90deg, #A78BFA, #EC4899)", transition: "width .4s ease" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CTA Section ────────────────────────────────────────────────────────────
function CtaSection() {
  return (
    <section id="cta" style={{ padding: "120px 0", position: "relative", overflow: "hidden" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px" }}>
        <div style={{ position: "relative", padding: "80px 60px", borderRadius: 28, background: "linear-gradient(135deg, rgba(167,139,250,0.18) 0%, rgba(236,72,153,0.12) 50%, rgba(251,146,60,0.08) 100%)", border: "1px solid rgba(167,139,250,0.3)", overflow: "hidden", textAlign: "center", boxShadow: "0 40px 100px -30px rgba(236,72,153,0.4)" }} className="cta-wrap">
          <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(20,15,30,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(20,15,30,0.04) 1px, transparent 1px)", backgroundSize: "40px 40px", maskImage: "radial-gradient(ellipse at center, black 20%, transparent 70%)", WebkitMaskImage: "radial-gradient(ellipse at center, black 20%, transparent 70%)" }} />
          <div aria-hidden style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, #A78BFA 0%, transparent 65%)", filter: "blur(80px)", opacity: 0.4, left: "-10%", top: "-30%", pointerEvents: "none" }} />
          <div aria-hidden style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, #EC4899 0%, transparent 65%)", filter: "blur(80px)", opacity: 0.35, left: "70%", top: "60%", pointerEvents: "none" }} />

          <div style={{ position: "relative" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, border: "1px solid var(--line-strong)", background: "rgba(167,139,250,0.08)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500, color: "var(--violet-2)", fontFamily: "var(--font-mono)" }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--violet-2)", boxShadow: "0 0 10px var(--violet-2)", animation: "pulseGlow 1.8s ease-in-out infinite" }} />
              Únete a 500+ negocios
            </div>
            <h2 style={{ fontSize: "clamp(36px, 5vw, 64px)", lineHeight: 1.02, letterSpacing: "-0.04em", fontWeight: 500, margin: "20px 0 18px", textWrap: "balance" }}>
              ¿Listo para tu negocio<br />
              <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", background: "var(--gradient)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>en piloto automático?</span>
            </h2>
            <p style={{ fontSize: 17, color: "var(--fg-dim)", margin: "0 auto 32px", maxWidth: 540, lineHeight: 1.55 }}>
              14 días gratis. Sin tarjeta. Si no te sirve, te ayudamos a migrar a otro lado. En serio.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <a href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 16, padding: "14px 22px", borderRadius: 14, background: "linear-gradient(135deg, #A78BFA 0%, #EC4899 60%, #FB923C 100%)", color: "white", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 500, boxShadow: "0 8px 30px -10px rgba(167,139,250,0.55)", textDecoration: "none" }}>
                Empezar gratis <IconArrow size={16} />
              </a>
              <a href="https://wa.me/573000000000" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 16, padding: "14px 22px", borderRadius: 14, background: "rgba(20,15,30,0.06)", color: "var(--fg)", border: "1px solid var(--line-strong)", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 500, textDecoration: "none" }}>
                <IconChat size={15} /> Hablar por WhatsApp
              </a>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 22, marginTop: 28, color: "var(--fg-mute)", fontSize: 13, flexWrap: "wrap" }}>
              {["14 días gratis", "Sin tarjeta", "Cancela cuando quieras", "Soporte en Colombia"].map((t, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <IconCheck size={14} style={{ color: "var(--green)" }} />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
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
