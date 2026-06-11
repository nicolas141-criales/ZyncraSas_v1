"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "./admin-context";
import {
  IconCalendar, IconBell, IconUsers, IconChartBar,
  IconCreditCard, IconTrendUp, IconTrendDown, IconClock, IconPercent,
  IconRefresh, IconPlus, IconDownload,
} from "./ZyncraIcons";
import NewAppointmentModal from "./NewAppointmentModal";
import {
  Spark, AreaChart, Bars, Donut, RankBars, Empty, Skel, useCountUp,
  MONO, SANS, SERIF, INK, DIM, MUTE, LINE, RED, GRAD,
} from "./charts";

// ─── Types ───────────────────────────────────────────────
interface DashboardData {
  todayRevenue: number;
  prevDayRevenue: number;
  todayCount: number;
  pending: number;
  noShowRate: number;
  avgTicket: number;
  returningPct: number;
  newClientsToday: number;
  occupancyRate: number;
  upcomingApts: any[];
  staffPerf: { name: string; count: number; revenue: number }[];
  topServices: { name: string; count: number }[];
  hourlyData: { hour: string; count: number }[];
  weeklyRevenue: { day: string; revenue: number }[];
  paymentData: { method: string; label: string; color: string; amount: number; count: number }[];
  clientSegments: { nuevos: number; recurrentes: number; perdidos: number };
  retentionCurve: number[];
  retentionCohorts: { cohortLabel: string; cohortMonth: string; baseCount: number; retention: number[] }[];
}

const EMPTY: DashboardData = {
  todayRevenue: 0, prevDayRevenue: 0, todayCount: 0, pending: 0,
  noShowRate: 0, avgTicket: 0, returningPct: 0, newClientsToday: 0,
  occupancyRate: 0, upcomingApts: [], staffPerf: [], topServices: [],
  hourlyData: [], weeklyRevenue: [], paymentData: [],
  clientSegments: { nuevos: 0, recurrentes: 0, perdidos: 0 },
  retentionCurve: [], retentionCohorts: [],
};

// ─── Date helpers ─────────────────────────────────────────
const toISO = (dt: Date) =>
  `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
const toYM  = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
const addMonths = (ym: string, n: number) => {
  const d = new Date(parseInt(ym.slice(0,4)), parseInt(ym.slice(5,7)) - 1 + n, 1);
  return toYM(d);
};

// ─── Layout CSS (grids responsivas + hover de filas) ─────
const PAGE_CSS = `
.znGridHero{display:grid;gap:14px;grid-template-columns:repeat(2,minmax(0,1fr))}
@media(min-width:1140px){.znGridHero{grid-template-columns:1.6fr 1fr 1fr 1fr}}
@media(max-width:620px){.znGridHero{grid-template-columns:1fr}}
.znGridCharts{display:grid;gap:14px;grid-template-columns:1fr}
@media(min-width:1020px){.znGridCharts{grid-template-columns:1.65fr 1fr}}
.znGridSplit{display:grid;gap:14px;grid-template-columns:1fr}
@media(min-width:1020px){.znGridSplit{grid-template-columns:1fr 1fr}}
.znGridLists{display:grid;gap:14px;grid-template-columns:1fr}
@media(min-width:1020px){.znGridLists{grid-template-columns:1.5fr 1fr}}
.znClientGrid{display:grid;grid-template-columns:200px 1fr}
@media(max-width:700px){.znClientGrid{grid-template-columns:1fr}}
.znClientGrid>div:last-child{border-left:1px solid rgba(20,15,30,.06)}
@media(max-width:700px){.znClientGrid>div:last-child{border-left:none;border-top:1px solid rgba(20,15,30,.06)}}
.znStrip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));overflow:hidden}
@media(max-width:860px){.znStrip{grid-template-columns:repeat(2,minmax(0,1fr))}}
.znStrip>div{border-left:1px solid rgba(20,15,30,.06);border-top:1px solid rgba(20,15,30,.06);margin-left:-1px;margin-top:-1px}
.znRow{transition:background .13s ease}
.znRow:hover{background:rgba(20,15,30,.022)}
`;

// ─── Primitivas de tarjeta ────────────────────────────────
function Card({ children, style, delay = 0 }: { children: React.ReactNode; style?: React.CSSProperties; delay?: number }) {
  return (
    <div style={{
      background: "white", borderRadius: 16, border: `1px solid ${LINE}`,
      boxShadow: "0 1px 2px rgba(20,15,30,0.03)", overflow: "hidden",
      animation: `znFadeUp .5s cubic-bezier(.22,1,.36,1) both ${delay}s`,
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardHead({ title, sub, aside }: { title: string; sub?: string; aside?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: `1px solid ${LINE}` }}>
      <span style={{ width: 7, height: 7, borderRadius: 2.5, background: GRAD, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: INK, letterSpacing: "-0.01em" }}>{title}</div>
        {sub && <div style={{ fontSize: 10.5, color: MUTE, marginTop: 1 }}>{sub}</div>}
      </div>
      {aside && (
        <div style={{ flexShrink: 0, fontFamily: MONO, fontSize: 9.5, fontWeight: 600, color: MUTE, textTransform: "uppercase", letterSpacing: ".09em" }}>
          {aside}
        </div>
      )}
    </div>
  );
}

function TrendChip({ trend, children }: { trend: "up" | "down" | "neutral"; children: React.ReactNode }) {
  const tone = trend === "up"
    ? { bg: "rgba(16,185,129,0.09)", color: "#059669" }
    : trend === "down"
      ? { bg: "rgba(239,68,68,0.08)", color: "#dc2626" }
      : { bg: "rgba(20,15,30,0.05)", color: MUTE };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "2.5px 8px",
      borderRadius: 6, fontSize: 10.5, fontWeight: 600, fontFamily: MONO,
      background: tone.bg, color: tone.color, whiteSpace: "nowrap",
    }}>
      {trend === "up" ? <IconTrendUp size={11} /> : trend === "down" ? <IconTrendDown size={11} /> : null}
      {children}
    </span>
  );
}

// ─── Metric Card ─────────────────────────────────────────
interface MetricCardProps {
  label: string;
  raw: number;
  fmt: (n: number) => string;
  sub?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendVal?: string;
  alert?: boolean;
  spark?: number[];
  delay?: number;
}

function MetricCard({ label, raw, fmt, sub, icon, trend, trendVal, alert, spark, delay = 0 }: MetricCardProps) {
  const [hov, setHov] = useState(false);
  const v = useCountUp(raw);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: "white", borderRadius: 16, padding: "16px 18px 15px",
        border: alert ? "1px solid rgba(251,15,5,0.32)" : `1px solid ${LINE}`,
        position: "relative", overflow: "hidden",
        boxShadow: hov ? "0 12px 32px rgba(20,15,30,0.09)" : "0 1px 2px rgba(20,15,30,0.03)",
        transform: hov ? "translateY(-2px)" : "none",
        transition: "transform .2s ease, box-shadow .2s ease",
        animation: `znFadeUp .5s cubic-bezier(.22,1,.36,1) both ${delay}s`,
        display: "flex", flexDirection: "column",
      }}>
      {alert && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2.5, background: "linear-gradient(90deg,#fb0f05,#f97316)" }} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 600, color: MUTE, textTransform: "uppercase", letterSpacing: ".1em" }}>
          {label}
        </span>
        <span style={{ color: alert ? RED : "#c4bfce", display: "inline-flex", flexShrink: 0 }}>{icon}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10, marginTop: 11 }}>
        <span style={{
          fontSize: 25, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.8px",
          color: alert ? "#dc2626" : INK, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
        }}>
          {fmt(v)}
        </span>
        {spark && spark.some(s => s > 0) && <Spark data={spark} w={76} h={26} />}
      </div>

      {(trendVal || sub) && (
        <div style={{ display: "flex", gap: 7, alignItems: "center", marginTop: 10, flexWrap: "wrap", minHeight: 18 }}>
          {trendVal && trend && <TrendChip trend={trend}>{trendVal}</TrendChip>}
          {sub && <span style={{ color: MUTE, fontSize: 11.5 }}>{sub}</span>}
        </div>
      )}
    </div>
  );
}

// ─── Hero Card (ingresos) ─────────────────────────────────
function HeroCard({ label, raw, fmt, trend, trendVal, sub, spark, tag }: {
  label: string; raw: number; fmt: (n: number) => string;
  trend?: "up" | "down" | "neutral"; trendVal?: string; sub?: string;
  spark: number[]; tag: string;
}) {
  const v = useCountUp(raw, 800);
  return (
    <div style={{
      background: "#0C0C14", borderRadius: 16, padding: "18px 20px 17px",
      position: "relative", overflow: "hidden", color: "white",
      animation: "znFadeUp .5s cubic-bezier(.22,1,.36,1) both",
      display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 132,
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: GRAD }} />
      <div style={{ position: "absolute", right: -70, top: -70, width: 230, height: 230, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,39,254,0.42), transparent 65%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: -50, bottom: -80, width: 190, height: 190, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,15,5,0.22), transparent 65%)", pointerEvents: "none" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
        <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 600, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: ".12em" }}>
          {label}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: ".1em", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 5, padding: "2px 7px" }}>
          {tag}
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, position: "relative", marginTop: 14 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: "clamp(26px, 2.6vw, 33px)", fontWeight: 700, lineHeight: 1,
            letterSpacing: "-1.2px", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
          }}>
            {fmt(v)}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
            {trendVal && trend && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4, padding: "2.5px 8px", borderRadius: 6,
                fontSize: 10.5, fontWeight: 600, fontFamily: MONO,
                background: trend === "down" ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.16)",
                color: trend === "down" ? "#fca5a5" : "#6ee7b7",
              }}>
                {trend === "up" ? <IconTrendUp size={11} /> : trend === "down" ? <IconTrendDown size={11} /> : null}
                {trendVal}
              </span>
            )}
            {sub && <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11.5 }}>{sub}</span>}
          </div>
        </div>
        {spark.some(s => s > 0) && <Spark data={spark} w={104} h={34} light />}
      </div>
    </div>
  );
}

// ─── Status Pill ─────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    confirmed: { bg: "rgba(16,185,129,0.1)", color: "#059669", label: "Confirmada" },
    pending:   { bg: "rgba(245,158,11,0.12)", color: "#b45309", label: "Pendiente" },
    completed: { bg: "rgba(100,116,139,0.1)", color: "#564E66", label: "Completada" },
    cancelled: { bg: "rgba(239,68,68,0.1)", color: "#dc2626", label: "Cancelada" },
    no_show:   { bg: "rgba(239,68,68,0.08)", color: "#b91c1c", label: "No se presentó" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px",
      borderRadius: 20, fontSize: 10.5, fontWeight: 600, background: s.bg, color: s.color, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

// ─── Date Range Picker ────────────────────────────────────
const MONTHS_CAL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_CAL   = ["Lu","Ma","Mi","Ju","Vi","Sá","Do"];

function DateRangePicker({ start, end, onApply }: {
  start: string; end: string; onApply: (s: string, e: string) => void;
}) {
  const today = new Date();
  const [ds, setDs] = useState(start);
  const [de, setDe] = useState(end);
  const [hov, setHov] = useState("");
  const [cy, setCy] = useState(today.getFullYear());
  const [cm, setCm] = useState(today.getMonth());

  const isoOf = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const rawFirst  = new Date(cy, cm, 1).getDay();
  const firstDay  = rawFirst === 0 ? 6 : rawFirst - 1;
  const daysInMon = new Date(cy, cm + 1, 0).getDate();
  const todayISO  = toISO(today);

  const handleClick = (iso: string) => {
    if (!ds || (ds && de)) { setDs(iso); setDe(""); }
    else if (iso >= ds)    { setDe(iso); }
    else                   { setDs(iso); setDe(""); }
  };

  const effectiveEnd = de || (ds && hov >= ds ? hov : "");
  const rangeStart = ds && effectiveEnd && ds <= effectiveEnd ? ds : effectiveEnd;
  const rangeEnd   = ds && effectiveEnd && ds <= effectiveEnd ? effectiveEnd : ds;

  const isStart  = (iso: string) => iso === ds && !!ds;
  const isEnd    = (iso: string) => iso === de && !!de;
  const inRange  = (iso: string) => !!rangeStart && !!rangeEnd && iso > rangeStart && iso < rangeEnd;
  const canApply = ds && de;

  const prevMo = () => { if (cm === 0) { setCy(y => y-1); setCm(11); } else setCm(m => m-1); };
  const nextMo = () => { if (cm === 11) { setCy(y => y+1); setCm(0); } else setCm(m => m+1); };

  const navBtn: React.CSSProperties = {
    background: "white", border: `1px solid ${LINE}`, borderRadius: 9, width: 30, height: 30,
    cursor: "pointer", fontSize: 15, color: DIM, display: "flex", alignItems: "center", justifyContent: "center",
    transition: "border-color .15s, color .15s",
  };

  return (
    <div style={{
      background: "rgba(255,255,255,0.82)",
      backdropFilter: "blur(24px) saturate(1.6)", WebkitBackdropFilter: "blur(24px) saturate(1.6)",
      border: "1px solid rgba(255,255,255,0.7)", borderRadius: 16, padding: "15px 16px",
      display: "inline-block", boxShadow: "0 16px 48px rgba(20,15,30,0.16)", marginTop: 8,
      animation: "znFadeUp .22s cubic-bezier(.22,1,.36,1) both",
    }}>
      {/* Month nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <button onClick={prevMo} style={navBtn}>‹</button>
        <span style={{ fontWeight: 700, fontSize: 13.5, color: INK, letterSpacing: "-0.3px" }}>{MONTHS_CAL[cm]} {cy}</span>
        <button onClick={nextMo} style={navBtn}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
        {DAYS_CAL.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 9, fontWeight: 600, fontFamily: MONO, color: MUTE, padding: "2px 0", textTransform: "uppercase" }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMon }, (_, i) => i + 1).map(day => {
          const iso     = isoOf(cy, cm, day);
          const start   = isStart(iso);
          const end     = isEnd(iso);
          const mid     = inRange(iso);
          const isToday = iso === todayISO;
          const isEdge  = start || end;

          return (
            <div key={day}
              style={{
                background: mid ? "rgba(20,15,30,0.05)" : "transparent",
                borderRadius: start ? "8px 0 0 8px" : end ? "0 8px 8px 0" : 0,
              }}>
              <button
                onClick={() => handleClick(iso)}
                onMouseEnter={() => !de && ds && setHov(iso)}
                onMouseLeave={() => setHov("")}
                style={{
                  width: "100%", padding: "7px 0", border: "none",
                  borderRadius: isEdge ? 8 : 0,
                  background: isEdge ? INK : "transparent",
                  color: isEdge ? "white" : isToday ? RED : INK,
                  fontSize: 12.5, fontFamily: MONO,
                  fontWeight: isEdge ? 700 : isToday ? 700 : 400,
                  cursor: "pointer",
                  outline: isToday && !isEdge ? "1.5px solid rgba(251,15,5,0.4)" : "none",
                  outlineOffset: -2,
                  transition: "background 0.12s",
                }}>
                {day}
              </button>
            </div>
          );
        })}
      </div>

      {/* Apply / Clear */}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button onClick={() => { setDs(""); setDe(""); setHov(""); }}
          style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${LINE}`, background: "white", color: MUTE, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: SANS }}>
          Limpiar
        </button>
        <button onClick={() => canApply && onApply(ds, de)} disabled={!canApply}
          style={{ flex: 1, padding: "7px 14px", borderRadius: 8, border: "none", background: canApply ? GRAD : "rgba(20,15,30,.07)", color: canApply ? "white" : MUTE, fontWeight: 700, fontSize: 12, cursor: canApply ? "pointer" : "not-allowed", fontFamily: SANS, boxShadow: canApply ? "0 4px 14px rgba(0,39,254,0.25)" : "none", transition: "box-shadow .2s" }}>
          Aplicar
        </button>
      </div>
    </div>
  );
}

// ─── Controles del encabezado ─────────────────────────────
function SegBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      padding: "6px 13px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
      border: "none", fontFamily: SANS, whiteSpace: "nowrap",
      background: active ? INK : hov ? "rgba(20,15,30,0.05)" : "transparent",
      color: active ? "white" : DIM,
      transition: "background .16s ease, color .16s ease",
    }}>
      {children}
    </button>
  );
}

function ToolBtn({ onClick, title, children, label }: { onClick: () => void; title: string; children: React.ReactNode; label?: string }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      height: 34, padding: label ? "0 13px" : 0, width: label ? undefined : 34,
      borderRadius: 9, border: `1px solid ${hov ? "rgba(20,15,30,0.22)" : LINE}`,
      background: "white", color: hov ? INK : DIM, cursor: "pointer",
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
      fontSize: 12, fontWeight: 600, fontFamily: SANS,
      transition: "border-color .15s ease, color .15s ease",
    }}>
      {children}
      {label}
    </button>
  );
}

// ─── Retention helpers ────────────────────────────────────
function retColor(pct: number): { bg: string; fg: string } {
  if (pct >= 60) return { bg: "rgba(16,185,129,0.12)", fg: "#059669" };
  if (pct >= 35) return { bg: "rgba(16,185,129,0.07)", fg: "#10b981" };
  if (pct >= 20) return { bg: "rgba(245,158,11,0.12)", fg: "#b45309" };
  if (pct >= 8)  return { bg: "rgba(249,115,22,0.10)", fg: "#c2410c" };
  return              { bg: "rgba(239,68,68,0.09)",  fg: "#dc2626" };
}

function RetentionChart({
  curve, cohorts,
}: {
  curve: number[];
  cohorts: DashboardData["retentionCohorts"];
}) {
  const hasData = curve.length >= 2;
  const ghostCurve = [100, 65, 42, 28, 18];
  const displayCurve = hasData ? curve : ghostCurve;

  // Compute user counts per month offset
  const monthStats = displayCurve.map((pct, i) => {
    if (!hasData) return { pct, users: Math.round(80 * pct / 100) };
    let totalUsers = 0, totalBase = 0;
    cohorts.forEach(r => {
      if (r.retention[i] !== undefined) {
        totalBase += r.baseCount;
        totalUsers += Math.round(r.baseCount * r.retention[i] / 100);
      }
    });
    return { pct, users: i === 0 ? totalBase : totalUsers };
  });

  // Compact SVG
  const VW = 460, VH = 90;
  const PAD = { t: 12, r: 10, b: 22, l: 30 };
  const cW = VW - PAD.l - PAD.r;
  const cH = VH - PAD.t - PAD.b;
  const n = displayCurve.length;
  const pts = displayCurve.map((v, i) => ({
    x: PAD.l + (n === 1 ? cW / 2 : (i / (n - 1)) * cW),
    y: PAD.t + (1 - v / 100) * cH,
    v,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${pts[n-1].x.toFixed(1)},${(PAD.t + cH).toFixed(1)} L${PAD.l},${(PAD.t + cH).toFixed(1)} Z`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

      {/* Stat pills: M0 → +1m → +2m */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", opacity: hasData ? 1 : 0.22 }}>
        {monthStats.map((s, i) => {
          const { bg, fg } = i === 0 ? { bg: "rgba(20,15,30,0.06)", fg: INK } : retColor(s.pct);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ background: bg, borderRadius: 8, padding: "4px 9px", textAlign: "center", minWidth: 52 }}>
                <div style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 700, color: fg, lineHeight: 1 }}>
                  {i === 0 ? `${s.users}u` : `${s.pct}%`}
                </div>
                <div style={{ fontSize: 8.5, color: MUTE, marginTop: 2, fontFamily: MONO, whiteSpace: "nowrap" }}>
                  {i === 0 ? "Mes 0" : `+${i}m · ${s.users}u`}
                </div>
              </div>
              {i < monthStats.length - 1 && (
                <span style={{ color: MUTE, fontSize: 9, opacity: 0.45 }}>→</span>
              )}
            </div>
          );
        })}
      </div>

      {/* SVG curve */}
      <div style={{ position: "relative" }}>
        <div style={{ background: "rgba(20,15,30,0.018)", borderRadius: 9, border: "1px solid rgba(20,15,30,0.05)", opacity: hasData ? 1 : 0.18 }}>
          <svg viewBox={`0 0 ${VW} ${VH}`} style={{ width: "100%", height: "auto", display: "block" }}>
            <defs>
              <linearGradient id="ret-fill2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.01" />
              </linearGradient>
            </defs>
            {[0, 50, 100].map(v => {
              const y = PAD.t + (1 - v / 100) * cH;
              return (
                <g key={v}>
                  <line x1={PAD.l} y1={y} x2={VW - PAD.r} y2={y} stroke="rgba(20,15,30,0.05)" strokeWidth="1" strokeDasharray={v > 0 ? "3 4" : "none"} />
                  <text x={PAD.l - 5} y={y + 3} textAnchor="end" fontSize="7" fill="#c0bbc8" fontFamily="monospace">{v}%</text>
                </g>
              );
            })}
            <path d={areaPath} fill="url(#ret-fill2)" />
            <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {pts.map((p, i) => (
              <g key={i}>
                <text x={p.x} y={VH - 3} textAnchor="middle" fontSize="7.5" fill="#8E879B" fontFamily="monospace">
                  {i === 0 ? "M0" : `+${i}m`}
                </text>
                <circle cx={p.x} cy={p.y} r="3.5" fill="white" stroke="#10b981" strokeWidth="2" />
                <circle cx={p.x} cy={p.y} r="1.5" fill="#10b981" />
              </g>
            ))}
          </svg>
        </div>
        {!hasData && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 10.5, color: MUTE, textAlign: "center", lineHeight: 1.5, padding: "0 14px" }}>
              Aparece cuando un cliente vuelve en un mes distinto al de su primera visita
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────
export default function AdminOverview() {
  const { tenantId, currency, locale } = useAdmin();
  const [data, setData] = useState<DashboardData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"hoy" | "semana" | "mes" | "custom">("hoy");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showNewAppt, setShowNewAppt] = useState(false);
  const [showRangePicker, setShowRangePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);
  const rangePickerRef = useRef<HTMLDivElement>(null);
  const [profFilter, setProfFilter] = useState("");
  const [profOptions, setProfOptions] = useState<{ id: string; name: string }[]>([]);

  const fetchAll = useCallback(async (tid: string, f: "hoy" | "semana" | "mes" | "custom" = "hoy", cStart?: string, cEnd?: string, profId = "") => {
    if (!hasLoadedOnce.current) setLoading(true);
    else setRefreshing(true);
    const now = new Date();
    const todayStr = toISO(now);
    const prevDate = new Date(now); prevDate.setDate(prevDate.getDate() - 1);
    const prevStr = toISO(prevDate);
    let rangeStart = new Date(now);
    let rangeEndStr = todayStr;
    if (f === "semana") rangeStart.setDate(now.getDate() - 6);
    else if (f === "mes") rangeStart.setDate(now.getDate() - 29);
    else if (f === "custom" && cStart && cEnd) { rangeStart = new Date(cStart + "T00:00:00"); rangeEndStr = cEnd; }
    else rangeStart = new Date(now);
    const weekStart = rangeStart;
    const weekStartStr = toISO(weekStart);

    const baseQ = (supabase as any)
      .from("appointments")
      .select("id, appointment_date, appointment_time, status, client_id, clients(name, no_shows), services(name, price), professionals(name)")
      .eq("tenant_id", tid)
      .gte("appointment_date", weekStartStr)
      .lte("appointment_date", rangeEndStr)
      .order("appointment_date").order("appointment_time");
    const { data: weekApts } = await (profId ? baseQ.eq("professional_id", profId) : baseQ);

    const apts = (weekApts || []) as any[];
    const filteredApts = f === "hoy" ? apts.filter(a => a.appointment_date === todayStr) : apts;
    const prevApts = f === "hoy" ? apts.filter(a => a.appointment_date === prevStr) : [];
    const calcRevenue = (list: any[]) => list.filter(a => a.status !== "cancelled").reduce((s, a) => s + Number(a.services?.price || 0), 0);
    const todayRevenue = calcRevenue(filteredApts);
    const prevDayRevenue = calcRevenue(prevApts);
    const todayCount = filteredApts.length;
    const pending = filteredApts.filter(a => a.status === "pending").length;
    const noShows = filteredApts.filter(a => a.clients?.no_shows > 0).length;
    const noShowRate = filteredApts.length > 0 ? (noShows / filteredApts.length) * 100 : 0;
    const paid = filteredApts.filter(a => a.status !== "cancelled" && a.services?.price);
    const avgTicket = paid.length > 0 ? paid.reduce((s, a) => s + Number(a.services.price), 0) / paid.length : 0;
    const upcomingApts = filteredApts
      .filter(a => a.status !== "cancelled")
      .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date) || a.appointment_time.localeCompare(b.appointment_time))
      .slice(0, 20);
    const staffMap: Record<string, { count: number; revenue: number }> = {};
    filteredApts.forEach(a => {
      const name = a.professionals?.name || "Sin asignar";
      if (!staffMap[name]) staffMap[name] = { count: 0, revenue: 0 };
      staffMap[name].count++;
      staffMap[name].revenue += Number(a.services?.price || 0);
    });
    const staffPerf = Object.entries(staffMap).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue);
    const svcMap: Record<string, number> = {};
    filteredApts.forEach(a => { const name = a.services?.name || "Sin servicio"; svcMap[name] = (svcMap[name] || 0) + 1; });
    const topServices = Object.entries(svcMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
    const hours = ["08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19"];
    const hourlyData = hours.map(h => ({ hour: `${h}:00`, count: filteredApts.filter(a => a.appointment_time?.startsWith(h)).length }));
    const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    // ── Revenue chart alineada al período ──────────────────────────────────
    const dayCount = Math.max(1, Math.round(
      (new Date(rangeEndStr + "T00:00:00").getTime() - new Date(weekStartStr + "T00:00:00").getTime()) / 86400000
    ) + 1);
    let weeklyRevenue: { day: string; revenue: number }[];
    if (f === "hoy") {
      weeklyRevenue = hours.map(h => ({
        day: h + "h",
        revenue: filteredApts.filter(a => a.appointment_time?.startsWith(h) && a.status !== "cancelled").reduce((s, a) => s + Number(a.services?.price || 0), 0),
      }));
    } else if (dayCount <= 14) {
      weeklyRevenue = Array.from({ length: dayCount }, (_, i) => {
        const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
        const ds = toISO(d);
        const rev = apts.filter(a => a.appointment_date === ds && a.status !== "cancelled").reduce((s, a) => s + Number(a.services?.price || 0), 0);
        return { day: dayNames[d.getDay() === 0 ? 6 : d.getDay() - 1] + " " + d.getDate(), revenue: rev };
      });
    } else {
      const MONS_S = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
      const weekCount = Math.ceil(dayCount / 7);
      weeklyRevenue = Array.from({ length: weekCount }, (_, wi) => {
        const wS = new Date(weekStart); wS.setDate(weekStart.getDate() + wi * 7);
        const wE = new Date(wS); wE.setDate(wS.getDate() + 6);
        const wsStr = toISO(wS), weStr = toISO(wE);
        const rev = apts.filter(a => a.appointment_date >= wsStr && a.appointment_date <= weStr && a.status !== "cancelled").reduce((s, a) => s + Number(a.services?.price || 0), 0);
        const label = `${String(wS.getDate()).padStart(2, "0")} ${MONS_S[wS.getMonth()]}`;
        return { day: label, revenue: rev };
      });
    }
    // ── Ocupación dinámica: citas no canceladas / (profesionales × 8 slots × días) ──
    const profCount = profId ? 1 : Math.max(Object.keys(staffMap).length, 1);
    const occupancyRate = Math.min(
      (filteredApts.filter(a => a.status !== "cancelled").length / (profCount * 8 * dayCount)) * 100,
      100
    );
    const [{ count: newClientsToday }, { data: posRaw }] = await Promise.all([
      supabase.from("clients").select("id", { count: "exact", head: true }).eq("tenant_id", tid).gte("created_at", weekStartStr).lte("created_at", rangeEndStr + "T23:59:59"),
      (supabase as any).from("pos_sales").select("payment_method, total").eq("tenant_id", tid).gte("created_at", weekStartStr + "T00:00:00").lte("created_at", rangeEndStr + "T23:59:59"),
    ]);
    const uniqueClients = new Set(apts.map(a => a.client_id)).size;
    const multiVisit = apts.filter((a, _, arr) => arr.filter(b => b.client_id === a.client_id).length > 1);
    const returningPct = uniqueClients > 0 ? (new Set(multiVisit.map(a => a.client_id)).size / uniqueClients) * 100 : 0;
    // ── Medios de pago (pos_sales) ────────────────────────────────────────
    const PM_META: Record<string, { label: string; color: string }> = {
      efectivo:  { label: "Efectivo",   color: "#10b981" },
      tarjeta:   { label: "Tarjeta",    color: "#6366f1" },
      nequi:     { label: "Nequi",      color: "#0027fe" },
      daviplata: { label: "Daviplata",  color: "#f59e0b" },
    };
    const pmMap: Record<string, { amount: number; count: number }> = {};
    ((posRaw as any[]) || []).forEach(s => {
      const pm = s.payment_method || "otro";
      if (!pmMap[pm]) pmMap[pm] = { amount: 0, count: 0 };
      pmMap[pm].amount += Number(s.total || 0);
      pmMap[pm].count++;
    });
    const paymentData = Object.entries(pmMap).map(([method, v]) => ({
      method,
      label: PM_META[method]?.label ?? method,
      color: PM_META[method]?.color ?? "#8E879B",
      ...v,
    })).sort((a, b) => b.amount - a.amount);
    // ── Segmentos de clientes (sobre toda la historia, no el período) ──────
    const [{ data: allClientsRaw }, { data: allAptsRaw }] = await Promise.all([
      supabase.from("clients").select("id").eq("tenant_id", tid),
      supabase.from("appointments").select("client_id,appointment_date").eq("tenant_id", tid).not("status", "eq", "cancelled"),
    ]);
    const thirtyDAgo = toISO(new Date(Date.now() - 30 * 86400000));
    const sixtyDAgo  = toISO(new Date(Date.now() - 60 * 86400000));
    const lastByClient: Record<string, string> = {};
    ((allAptsRaw as any[]) || []).forEach((a: any) => {
      if (!lastByClient[a.client_id] || a.appointment_date > lastByClient[a.client_id])
        lastByClient[a.client_id] = a.appointment_date;
    });
    let segNuevos = 0, segRecurrentes = 0, segPerdidos = 0;
    ((allClientsRaw as any[]) || []).forEach((c: any) => {
      const last = lastByClient[c.id];
      if (last && last >= thirtyDAgo) segRecurrentes++;
      else if (last && last < sixtyDAgo) segPerdidos++;
      else segNuevos++;
    });
    const clientSegments = { nuevos: segNuevos, recurrentes: segRecurrentes, perdidos: segPerdidos };

    // ── Cohortes de retención ──────────────────────────────────────────────
    const now2 = new Date();
    const currentYM = toYM(now2);
    const clientFirst: Record<string, string> = {};
    const clientMonthsMap: Record<string, Set<string>> = {};
    ((allAptsRaw as any[]) || []).forEach((a: any) => {
      const ym = (a.appointment_date as string).slice(0, 7);
      if (!clientMonthsMap[a.client_id]) clientMonthsMap[a.client_id] = new Set();
      clientMonthsMap[a.client_id].add(ym);
      if (!clientFirst[a.client_id] || ym < clientFirst[a.client_id]) clientFirst[a.client_id] = ym;
    });
    const cohortMap: Record<string, string[]> = {};
    Object.entries(clientFirst).forEach(([cid, firstYM]) => {
      if (!cohortMap[firstYM]) cohortMap[firstYM] = [];
      cohortMap[firstYM].push(cid);
    });
    const retentionCohorts: DashboardData["retentionCohorts"] = [];
    for (let i = 5; i >= 0; i--) {
      const cohortMonth = addMonths(currentYM, -i);
      const clients2 = cohortMap[cohortMonth] ?? [];
      if (clients2.length === 0) continue;
      const base = clients2.length;
      const retention: number[] = [100];
      for (let m = 1; m <= 5; m++) {
        const targetYM = addMonths(cohortMonth, m);
        if (targetYM > currentYM) break;
        const returned = clients2.filter(cid => clientMonthsMap[cid]?.has(targetYM)).length;
        retention.push(Math.round((returned / base) * 100));
      }
      const d2 = new Date(parseInt(cohortMonth.slice(0,4)), parseInt(cohortMonth.slice(5,7)) - 1, 1);
      const cohortLabel = d2.toLocaleDateString("es-CO", { month: "short", year: "numeric" });
      retentionCohorts.push({ cohortLabel, cohortMonth, baseCount: base, retention });
    }
    // Weighted-average retention curve
    const maxOff = retentionCohorts.reduce((m, r) => Math.max(m, r.retention.length), 0);
    const retentionCurve: number[] = [];
    for (let i = 0; i < maxOff; i++) {
      let wSum = 0, wTotal = 0;
      retentionCohorts.forEach(r => {
        if (r.retention[i] !== undefined) { wSum += r.retention[i] * r.baseCount; wTotal += r.baseCount; }
      });
      retentionCurve.push(wTotal > 0 ? Math.round(wSum / wTotal) : 0);
    }

    setData({ todayRevenue, prevDayRevenue, todayCount, pending, noShowRate, avgTicket, returningPct, newClientsToday: newClientsToday || 0, occupancyRate, upcomingApts, staffPerf, topServices, hourlyData, weeklyRevenue, paymentData, clientSegments, retentionCurve, retentionCohorts });
    hasLoadedOnce.current = true;
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (tenantId) fetchAll(tenantId, filter, customStart, customEnd, profFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, filter, fetchAll, profFilter]);

  useEffect(() => {
    if (!tenantId) return;
    supabase.from("professionals").select("id, name").eq("tenant_id", tenantId).eq("is_active", true).order("name")
      .then(({ data }) => setProfOptions(data || []));
  }, [tenantId]);

  useEffect(() => {
    if (!showRangePicker) return;
    const onOutside = (e: MouseEvent) => {
      if (rangePickerRef.current && !rangePickerRef.current.contains(e.target as Node))
        setShowRangePicker(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [showRangePicker]);

  const revDiff = data.todayRevenue - data.prevDayRevenue;
  const revTrend = revDiff > 0 ? "up" : revDiff < 0 ? "down" : "neutral";
  const fmt = (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

  const periodLabel = filter === "hoy" ? "Hoy" : filter === "semana" ? "Últimos 7 días" : filter === "mes" ? "Últimos 30 días" : `${customStart} — ${customEnd}`;

  const downloadHTML = () => {
    const now = new Date();
    const generated = now.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const SL: Record<string, string> = { confirmed: "Confirmada", pending: "Pendiente", completed: "Completada", cancelled: "Cancelada", no_show: "No se presentó" };
    const apts = data.upcomingApts as any[];
    const noShowCount    = apts.filter(a => a.status === "no_show").length;
    const completedCount = apts.filter(a => a.status === "completed").length;
    const confirmedCount = apts.filter(a => a.status === "confirmed").length;

    // ── SVG vertical bar chart ──────────────────────────────────────────────
    function vBars(
      items: { label: string; value: number; sub?: string }[],
      c1: string, c2: string, gid: string,
      fmtV: (v: number) => string
    ): string {
      if (!items.length) return '<p style="color:#8E879B;font-size:12px;padding:16px">Sin datos.</p>';
      const max = Math.max(...items.map(i => i.value), 1);
      const BW = 46, BH = 90, GAP = 14;
      const TW = items.length * (BW + GAP);
      const bars = items.map((item, i) => {
        const bh = item.value > 0 ? Math.max((item.value / max) * BH, 4) : 0;
        const x = i * (BW + GAP);
        return (
          (bh > 0
            ? `<rect x="${x}" y="${BH - bh}" width="${BW}" height="${bh}" rx="5" fill="url(#${gid})"/>`
            : `<rect x="${x}" y="${BH - 2}" width="${BW}" height="2" rx="1" fill="rgba(20,15,30,0.08)"/>`) +
          (item.value > 0
            ? `<text x="${x + BW / 2}" y="${BH - bh - 5}" text-anchor="middle" font-size="9" fill="#8E879B" font-family="Segoe UI,sans-serif">${fmtV(item.value)}</text>`
            : "") +
          `<text x="${x + BW / 2}" y="${BH + 14}" text-anchor="middle" font-size="10" fill="#564E66" font-family="Segoe UI,sans-serif" font-weight="600">${item.label}</text>` +
          (item.sub ? `<text x="${x + BW / 2}" y="${BH + 26}" text-anchor="middle" font-size="9" fill="#b0abc0" font-family="Segoe UI,sans-serif">${item.sub}</text>` : "")
        );
      }).join("");
      // Cada ítem ocupa ~80px renderizados; max-width:100% evita overflow horizontal
      const displayW = items.length * 80;
      return (
        `<div style="padding:14px 16px;overflow-x:auto">` +
        `<svg style="display:block;max-width:100%" width="${displayW}" viewBox="0 0 ${TW} ${BH + 40}" xmlns="http://www.w3.org/2000/svg">` +
        `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>` +
        `</linearGradient></defs>${bars}</svg></div>`
      );
    }

    // ── Heat map — acumulado por día de la semana (Lun–Dom) ──────────────
    const HRS = ["08","09","10","11","12","13","14","15","16","17","18","19"];
    // DOW_ORDER: 1=Lun … 6=Sáb, 0=Dom  (getDay() returns 0=Sun…6=Sat)
    const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0];
    const DOW_LABELS: Record<number, string> = { 1:"Lun", 2:"Mar", 3:"Mié", 4:"Jue", 5:"Vie", 6:"Sáb", 0:"Dom" };
    // Accumulate counts: matrix[dayOfWeek][hour] = total citas
    const hmMatrix: Record<number, Record<string, number>> = {};
    DOW_ORDER.forEach(d => { hmMatrix[d] = {}; HRS.forEach(h => { hmMatrix[d][h] = 0; }); });
    apts.forEach(a => {
      if (!a.appointment_date || !a.appointment_time) return;
      const dow = new Date(a.appointment_date + "T12:00:00").getDay();
      const hr  = (a.appointment_time as string).slice(0, 2);
      if (hmMatrix[dow] && hr in hmMatrix[dow]) hmMatrix[dow][hr]++;
    });
    const hmMax = Math.max(...DOW_ORDER.flatMap(d => HRS.map(h => hmMatrix[d][h])), 1);
    const hasHmData = apts.length > 0;
    const heatMapHTML = !hasHmData
      ? '<p style="color:#8E879B;font-size:12px;padding:14px 16px">Sin datos para este período.</p>'
      : (
        `<div style="overflow-x:auto;padding:14px 16px 12px">` +
        `<div style="display:inline-grid;grid-template-columns:44px ${HRS.map(() => "30px").join(" ")};row-gap:5px;column-gap:4px;align-items:center">` +
        `<div style="font-size:9px;color:#b0abc0;font-weight:700;text-transform:uppercase;letter-spacing:.06em"></div>` +
        HRS.map(h => `<div style="text-align:center;font-size:9px;color:#8E879B;font-weight:700">${h}h</div>`).join("") +
        DOW_ORDER.map(dow => {
          return (
            `<div style="font-size:10px;color:#564E66;font-weight:700;white-space:nowrap">${DOW_LABELS[dow]}</div>` +
            HRS.map(h => {
              const cnt = hmMatrix[dow][h];
              const op = cnt === 0 ? 0 : Math.max(0.08, (cnt / hmMax) * 0.92 + 0.08);
              const tc = op > 0.55 ? "white" : "#fb0f05";
              return (
                `<div style="background:rgba(251,15,5,${op.toFixed(2)});border-radius:5px;height:30px;width:30px;` +
                `display:flex;align-items:center;justify-content:center" title="${DOW_LABELS[dow]} ${h}h: ${cnt} cita${cnt !== 1 ? "s" : ""}">` +
                (cnt > 0 ? `<span style="font-size:10px;font-weight:700;color:${tc}">${cnt}</span>` : "") +
                `</div>`
              );
            }).join("")
          );
        }).join("") +
        `</div>` +
        `<div style="display:flex;align-items:center;gap:6px;margin-top:10px">` +
        `<span style="font-size:9px;color:#b0abc0">Sin citas</span>` +
        `<div style="display:flex;gap:2px">` +
        ["0.08","0.25","0.45","0.65","0.85","1.0"].map(op =>
          `<div style="width:14px;height:14px;border-radius:3px;background:rgba(251,15,5,${op})"></div>`
        ).join("") +
        `</div><span style="font-size:9px;color:#b0abc0">Máx. ocupación</span></div>` +
        `</div>`
      );

    // ── Donut de estados ──────────────────────────────────────────────────
    const statusItems = [
      { label: "Confirmada",    count: confirmedCount, color: "#10b981" },
      { label: "Completada",    count: completedCount, color: "#564E66" },
      { label: "Pendiente",     count: data.pending,   color: "#f59e0b" },
      { label: "No se presentó",count: noShowCount,    color: "#dc2626" },
    ].filter(s => s.count > 0);
    const dTotal = statusItems.reduce((s, c) => s + c.count, 0);
    const CX = 65, CY = 65, OR = 50, IR = 28;
    let ang = -Math.PI / 2;
    const donutPaths = dTotal > 0
      ? statusItems.map(si => {
          const a = (si.count / dTotal) * 2 * Math.PI;
          const x1 = CX + OR * Math.cos(ang), y1 = CY + OR * Math.sin(ang);
          const x2 = CX + OR * Math.cos(ang + a), y2 = CY + OR * Math.sin(ang + a);
          const xi1 = CX + IR * Math.cos(ang), yi1 = CY + IR * Math.sin(ang);
          const xi2 = CX + IR * Math.cos(ang + a), yi2 = CY + IR * Math.sin(ang + a);
          const lg = a > Math.PI ? 1 : 0;
          const path = `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${OR} ${OR} 0 ${lg} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} L ${xi2.toFixed(1)} ${yi2.toFixed(1)} A ${IR} ${IR} 0 ${lg} 0 ${xi1.toFixed(1)} ${yi1.toFixed(1)} Z`;
          ang += a;
          return `<path d="${path}" fill="${si.color}" opacity="0.88"/>`;
        }).join("")
      : `<circle cx="${CX}" cy="${CY}" r="${OR}" fill="#f0eeeb"/><circle cx="${CX}" cy="${CY}" r="${IR}" fill="white"/>`;
    const donutHTML =
      `<div style="display:flex;align-items:center;gap:18px;padding:14px 16px 16px;flex-wrap:wrap">` +
      `<svg width="130" height="130" viewBox="0 0 130 130" xmlns="http://www.w3.org/2000/svg">` +
      donutPaths +
      `<text x="${CX}" y="${CY + 6}" text-anchor="middle" font-size="18" font-weight="800" fill="#14111C" font-family="Segoe UI,sans-serif">${dTotal}</text>` +
      `<text x="${CX}" y="${CY + 18}" text-anchor="middle" font-size="9" fill="#8E879B" font-family="Segoe UI,sans-serif">citas</text>` +
      `</svg>` +
      `<div style="display:flex;flex-direction:column;gap:8px">` +
      statusItems.map(si =>
        `<div style="display:flex;align-items:center;gap:8px">` +
        `<div style="width:9px;height:9px;border-radius:50%;background:${si.color};flex-shrink:0"></div>` +
        `<span style="font-size:12px;color:#3a3548">${si.label}</span>` +
        `<span style="font-size:13px;font-weight:700;color:#14111C;margin-left:6px">${si.count}</span>` +
        `<span style="font-size:10px;color:#b0abc0">${dTotal > 0 ? ((si.count / dTotal) * 100).toFixed(0) + "%" : ""}</span>` +
        `</div>`
      ).join("") +
      `</div></div>`;

    // ── Staff rows con mini-barra ─────────────────────────────────────────
    const maxStaffRev = Math.max(...data.staffPerf.map((s: any) => s.revenue), 1);
    const staffRows = data.staffPerf.map((s: any) =>
      `<tr>` +
      `<td style="font-weight:600">${s.name}</td>` +
      `<td>${s.count}</td>` +
      `<td style="color:#fb0f05;font-weight:700">${fmt(s.revenue)}</td>` +
      `<td>${s.count > 0 ? fmt(s.revenue / s.count) : "—"}</td>` +
      `<td style="min-width:80px"><div style="background:#f0eeeb;border-radius:4px;height:6px"><div style="background:linear-gradient(90deg,#fb0f05,#0027fe);height:100%;width:${((s.revenue / maxStaffRev) * 100).toFixed(0)}%;border-radius:4px"></div></div></td>` +
      `</tr>`
    ).join("") || `<tr><td colspan="5" style="text-align:center;color:#8E879B">Sin datos</td></tr>`;

    // ── Datos alineados al filtro ─────────────────────────────────────────
    const revLabel = filter === "hoy" ? "Hoy (y días anteriores)" : filter === "semana" ? "Últimos 7 días" : filter === "mes" ? "Últimos 30 días (desglose semanal)" : `${customStart} → ${customEnd}`;
    const revBarsData = data.weeklyRevenue.map(d => ({
      label: d.day,
      value: d.revenue,
      sub: d.revenue > 0 ? (d.revenue >= 1000000 ? (d.revenue / 1000000).toFixed(1) + "M" : (d.revenue / 1000).toFixed(0) + "k") : "",
    }));
    const svcBarsData = data.topServices.map(s => ({
      label: s.name.length > 7 ? s.name.slice(0, 7) + "…" : s.name,
      value: s.count,
      sub: data.todayCount > 0 ? ((s.count / data.todayCount) * 100).toFixed(0) + "%" : "",
    }));

    const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>Reporte Zyncra — ${periodLabel}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;color:#14111C;background:#f0eff5;print-color-adjust:exact;-webkit-print-color-adjust:exact}
  .page{max-width:960px;margin:0 auto;padding:32px}
  .hdr{background:linear-gradient(135deg,#14111C 0%,#2a1018 100%);border-radius:16px;padding:22px 28px;margin-bottom:22px;display:flex;justify-content:space-between;align-items:center;gap:12px}
  .hdr h1{color:white;font-size:20px;font-weight:700;letter-spacing:-.5px}
  .hdr-sub{color:rgba(255,255,255,.4);font-size:11px;margin-top:2px}
  .hdr-right{text-align:right}
  .period-pill{display:inline-block;background:#fb0f05;color:white;padding:3px 11px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:.04em;margin-bottom:5px}
  .date-txt{color:rgba(255,255,255,.4);font-size:10px}
  .print-btn{background:rgba(255,255,255,.1);color:rgba(255,255,255,.85);border:1px solid rgba(255,255,255,.18);padding:5px 13px;border-radius:7px;font-size:11px;font-weight:600;cursor:pointer;margin-top:7px;display:inline-block}
  .st{font-size:10px;color:#8E879B;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin:18px 0 7px}
  .g4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
  .g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .metric{background:white;border-radius:11px;padding:13px 16px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
  .mv{font-size:20px;font-weight:700;background:linear-gradient(135deg,#fb0f05,#0027fe);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1.15}
  .mv.alert{background:none;-webkit-text-fill-color:#ef4444}
  .ml{font-size:9px;color:#8E879B;text-transform:uppercase;letter-spacing:.06em;margin-top:3px}
  .ms{font-size:10px;color:#b0abc0;margin-top:2px}
  .card{background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06)}
  .ct{padding:10px 16px;border-bottom:1px solid #f0eeeb;font-size:10px;font-weight:700;color:#3a3548;text-transform:uppercase;letter-spacing:.06em}
  table{width:100%;border-collapse:collapse}
  th{background:#f8f7fb;padding:8px 12px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.05em;color:#8E879B;font-weight:700;border-bottom:1px solid #f0eeeb}
  td{padding:8px 12px;font-size:12px;border-bottom:1px solid #f8f7fb;color:#3a3548}
  tr:last-child td{border-bottom:none}
  .badge{display:inline-block;padding:2px 7px;border-radius:20px;font-size:9px;font-weight:700}
  .confirmed{background:rgba(16,185,129,.12);color:#059669}
  .pending{background:rgba(245,158,11,.12);color:#d97706}
  .completed{background:rgba(100,116,139,.12);color:#564E66}
  .cancelled{background:rgba(239,68,68,.12);color:#dc2626}
  .no_show{background:rgba(220,38,38,.1);color:#b91c1c}
  .foot{margin-top:22px;text-align:center;font-size:10px;color:#c0bbc8;padding-bottom:4px}
  @media print{.print-btn{display:none}.page{padding:0}}
</style></head><body><div class="page">

<div class="hdr">
  <div><h1>Reporte Zyncra</h1><div class="hdr-sub">Panel de gestión del negocio</div></div>
  <div class="hdr-right">
    <div class="period-pill">${periodLabel}</div>
    <div class="date-txt">${generated}</div>
    <button class="print-btn" onclick="window.print()">⎙ Imprimir / PDF</button>
  </div>
</div>

<div class="st">Resumen del período</div>
<div class="g4">
  <div class="metric"><div class="mv">${fmt(data.todayRevenue)}</div><div class="ml">Ingresos totales</div>${filter === "hoy" && data.prevDayRevenue > 0 ? `<div class="ms">${data.todayRevenue >= data.prevDayRevenue ? "▲" : "▼"} ${fmt(Math.abs(data.todayRevenue - data.prevDayRevenue))} vs ayer</div>` : ""}</div>
  <div class="metric"><div class="mv">${data.todayCount}</div><div class="ml">Total de citas</div><div class="ms">${data.occupancyRate.toFixed(0)}% ocupación</div></div>
  <div class="metric"><div class="mv">${fmt(data.avgTicket)}</div><div class="ml">Ticket promedio</div></div>
  <div class="metric"><div class="mv${data.noShowRate > 15 ? " alert" : ""}">${data.noShowRate.toFixed(1)}%</div><div class="ml">Inasistencias</div><div class="ms">${noShowCount} sin presentarse</div></div>
</div>
<div class="g4" style="margin-top:10px">
  <div class="metric"><div class="mv">${data.pending}</div><div class="ml">Pendientes</div></div>
  <div class="metric"><div class="mv">${data.returningPct.toFixed(0)}%</div><div class="ml">Clientes recurrentes</div></div>
  <div class="metric"><div class="mv">${data.newClientsToday}</div><div class="ml">Nuevos clientes hoy</div></div>
  <div class="metric"><div class="mv">${data.occupancyRate.toFixed(0)}%</div><div class="ml">Ocupación del día</div></div>
</div>

<div class="g2" style="margin-top:18px">
  <div>
    <div class="st">Estado de citas</div>
    <div class="card"><div class="ct">Distribución por estado</div>${donutHTML}</div>
  </div>
  <div>
    <div class="st">Ingresos por día — ${revLabel}</div>
    <div class="card"><div class="ct">Barras de ingresos diarios</div>${vBars(revBarsData, "#fb0f05", "#0027fe", "rg1", fmt)}</div>
  </div>
</div>

<div class="st">Distribución por hora — Mapa de calor</div>
<div class="card"><div class="ct">Citas por hora y día del período</div>${heatMapHTML}</div>

<div class="st">Top servicios</div>
<div class="card"><div class="ct">Servicios más solicitados</div>${vBars(svcBarsData, "#10b981", "#0ea5e9", "sg1", v => String(v))}</div>

<div class="st" style="margin-top:18px">Rendimiento del equipo</div>
<div class="card">
  <table>
    <tr><th>Colaborador</th><th>Citas</th><th>Ingresos</th><th>Ticket prom.</th><th style="min-width:90px">Participación</th></tr>
    ${staffRows}
  </table>
</div>

<div class="st" style="margin-top:18px">Detalle de citas — ${periodLabel}</div>
<div class="card">
  <table>
    <tr><th>Fecha</th><th>Hora</th><th>Cliente</th><th>Servicio</th><th>Valor</th><th>Colaborador</th><th>Estado</th></tr>
    ${apts.map(a =>
      `<tr>` +
      `<td style="color:#8E879B">${a.appointment_date ?? "—"}</td>` +
      `<td style="font-weight:700;color:#fb0f05">${(a.appointment_time as string)?.slice(0, 5) ?? "—"}</td>` +
      `<td style="font-weight:600">${a.clients?.name ?? "—"}</td>` +
      `<td>${a.services?.name ?? "—"}</td>` +
      `<td style="font-weight:700">${a.services?.price ? fmt(Number(a.services.price)) : "—"}</td>` +
      `<td>${a.professionals?.name ?? "Sin asignar"}</td>` +
      `<td><span class="badge ${a.status}">${SL[a.status as string] ?? a.status}</span></td>` +
      `</tr>`
    ).join("") || `<tr><td colspan="7" style="text-align:center;color:#8E879B;padding:20px">Sin citas en este período</td></tr>`}
  </table>
</div>

<div class="foot">Generado por Zyncra &nbsp;·&nbsp; ${generated}</div>
</div></body></html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `reporte-zyncra-${toISO(now)}.html`; a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Skeleton ───
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: SANS }}>
        <style>{PAGE_CSS}</style>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14 }}>
          <div>
            <Skel w={170} h={26} />
            <Skel w={230} h={14} style={{ marginTop: 9 }} />
          </div>
          <Skel w={330} h={34} r={10} />
        </div>
        <div className="znGridHero">
          {[0, 1, 2, 3].map(i => <Skel key={i} h={132} r={16} />)}
        </div>
        <Skel h={76} r={16} />
        <div className="znGridCharts">
          <Skel h={252} r={16} />
          <Skel h={252} r={16} />
        </div>
        <div className="znGridSplit">
          <Skel h={210} r={16} />
          <Skel h={210} r={16} />
        </div>
      </div>
    );
  }

  const hourNow = new Date().getHours();
  const greeting = hourNow < 12 ? "Buen día" : hourNow < 19 ? "Buena tarde" : "Buena noche";
  const todayRaw = new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
  const todayLong = todayRaw.charAt(0).toUpperCase() + todayRaw.slice(1);
  const periodTag = filter === "hoy" ? "Hoy" : filter === "semana" ? "7 días" : filter === "mes" ? "30 días" : "Rango";
  const maxStaffRev = Math.max(...data.staffPerf.map(s => s.revenue), 1);
  const posTotal = data.paymentData.reduce((s, p) => s + p.amount, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: SANS, position: "relative", color: INK }}>
      <style>{PAGE_CSS}</style>

      {/* Barra de progreso sutil al refrescar — no borra el contenido */}
      {refreshing && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, zIndex: 9999, overflow: "hidden" }}>
          <div style={{ height: "100%", background: GRAD, animation: "znProgress 1.2s ease-out forwards" }} />
        </div>
      )}

      {/* ─── Header ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14, animation: "znFadeUp .45s cubic-bezier(.22,1,.36,1) both", position: "relative", zIndex: 50 }}>
        <div>
          <h1 style={{ fontSize: 23, fontWeight: 700, margin: 0, letterSpacing: "-0.6px", color: INK, lineHeight: 1.15 }}>
            {greeting}
          </h1>
          <p style={{
            fontFamily: SERIF, fontStyle: "italic", fontSize: 15.5, color: DIM,
            margin: "3px 0 0", letterSpacing: "0.01em",
          }}>
            {todayLong}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {/* Segmented period control */}
          <div style={{ display: "flex", gap: 2, padding: 3, background: "white", border: `1px solid ${LINE}`, borderRadius: 11 }}>
            {(["hoy", "semana", "mes"] as const).map(f => (
              <SegBtn key={f} active={filter === f} onClick={() => { setFilter(f); setShowRangePicker(false); fetchAll(tenantId!, f, undefined, undefined, profFilter); }}>
                {f === "hoy" ? "Hoy" : f === "semana" ? "7 días" : "30 días"}
              </SegBtn>
            ))}
            <div ref={rangePickerRef} style={{ position: "relative" }}>
              <SegBtn active={filter === "custom"} onClick={() => { setFilter("custom"); setShowRangePicker(s => !s); if (customStart && customEnd) fetchAll(tenantId!, "custom", customStart, customEnd, profFilter); }}>
                {customStart && customEnd
                  ? <span style={{ fontFamily: MONO, fontSize: 11 }}>{customStart.slice(5)} → {customEnd.slice(5)}</span>
                  : "Rango"}
              </SegBtn>
              {showRangePicker && (
                <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 9999 }}>
                  <DateRangePicker
                    start={customStart}
                    end={customEnd}
                    onApply={(s, e) => {
                      setCustomStart(s); setCustomEnd(e);
                      fetchAll(tenantId!, "custom", s, e, profFilter);
                      setShowRangePicker(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Filtro de miembro */}
          {profOptions.length > 0 && (
            <select
              value={profFilter}
              onChange={e => { setProfFilter(e.target.value); fetchAll(tenantId!, filter, customStart, customEnd, e.target.value); }}
              style={{
                height: 34, padding: "0 11px", borderRadius: 9,
                border: profFilter ? "1px solid rgba(20,15,30,0.3)" : `1px solid ${LINE}`,
                background: "white",
                color: profFilter ? INK : DIM,
                fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                fontFamily: SANS, outline: "none", maxWidth: 170,
              }}>
              <option value="">Todo el equipo</option>
              {profOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}

          <ToolBtn onClick={() => fetchAll(tenantId!, filter, customStart, customEnd, profFilter)} title="Actualizar datos">
            <span style={{ display: "inline-flex", animation: refreshing ? "znSpin .8s linear infinite" : "none" }}>
              <IconRefresh size={15} />
            </span>
          </ToolBtn>
          <ToolBtn onClick={downloadHTML} title="Descargar reporte" label="Reporte">
            <IconDownload size={14} />
          </ToolBtn>

          <button onClick={() => setShowNewAppt(true)} style={{
            height: 34, padding: "0 15px", borderRadius: 9, border: "none",
            background: GRAD, color: "white", cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 12.5, fontWeight: 700, fontFamily: SANS,
            boxShadow: "0 4px 14px rgba(0,39,254,0.28)",
            transition: "transform .15s ease, box-shadow .2s ease",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 7px 20px rgba(0,39,254,0.34)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,39,254,0.28)"; }}>
            <IconPlus size={14} />
            Nueva cita
          </button>
        </div>
      </div>

      {/* ─── Hero + métricas principales ─── */}
      <div className="znGridHero">
        <HeroCard
          label={filter === "hoy" ? "Ingresos de hoy" : "Ingresos del período"}
          raw={data.todayRevenue}
          fmt={fmt}
          tag={periodTag}
          trend={filter === "hoy" ? revTrend : undefined}
          trendVal={filter === "hoy" ? `${Math.abs(revDiff) > 0 ? fmt(Math.abs(revDiff)) : "igual"} vs ayer` : undefined}
          sub={filter !== "hoy" ? periodLabel : undefined}
          spark={data.weeklyRevenue.map(d => d.revenue)}
        />
        <MetricCard
          icon={<IconCalendar size={17} />}
          label={filter === "hoy" ? "Citas hoy" : "Total de citas"}
          raw={data.todayCount} fmt={v => String(Math.round(v))}
          sub={`${data.occupancyRate.toFixed(0)}% ocupación`}
          trend={data.todayCount >= 5 ? "up" : "neutral"}
          trendVal={data.todayCount >= 5 ? "buen ritmo" : undefined}
          spark={data.hourlyData.map(h => h.count)}
          delay={0.05}
        />
        <MetricCard
          icon={<IconBell size={17} />}
          label="Pendientes"
          raw={data.pending} fmt={v => String(Math.round(v))}
          sub="requieren acción"
          alert={data.pending > 3}
          trend={data.pending > 3 ? "down" : "neutral"}
          trendVal={data.pending > 3 ? "atención" : undefined}
          delay={0.1}
        />
        <MetricCard
          icon={<IconPercent size={17} />}
          label="Inasistencias"
          raw={data.noShowRate} fmt={v => `${v.toFixed(1)}%`}
          sub={periodLabel.toLowerCase()}
          alert={data.noShowRate > 15}
          trend={data.noShowRate > 15 ? "down" : "up"}
          trendVal={data.noShowRate > 15 ? "activa depósitos" : "bajo control"}
          delay={0.15}
        />
      </div>

      {/* ─── Strip de métricas secundarias ─── */}
      <Card delay={0.18}>
        <div className="znStrip">
          {[
            { label: "Ticket promedio", value: fmt(data.avgTicket), sub: "por servicio", icon: <IconCreditCard size={15} /> },
            { label: "Recurrentes", value: `${data.returningPct.toFixed(0)}%`, sub: periodLabel.toLowerCase(), pct: data.returningPct, icon: <IconRefresh size={15} /> },
            { label: filter === "hoy" ? "Nuevos hoy" : "Nuevos clientes", value: String(data.newClientsToday), sub: "registrados", icon: <IconUsers size={15} /> },
            { label: "Ocupación", value: `${data.occupancyRate.toFixed(0)}%`, sub: "de capacidad", pct: data.occupancyRate, icon: <IconChartBar size={15} /> },
          ].map((s, i) => (
            <div key={i} style={{ padding: "14px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, color: MUTE, textTransform: "uppercase", letterSpacing: ".1em" }}>{s.label}</span>
                <span style={{ color: "#c4bfce", display: "inline-flex" }}>{s.icon}</span>
              </div>
              <div style={{ fontSize: 19, fontWeight: 700, color: INK, letterSpacing: "-0.5px", marginTop: 7, fontVariantNumeric: "tabular-nums" }}>
                {s.value}
              </div>
              {typeof s.pct === "number" ? (
                <div style={{ height: 3, borderRadius: 2, background: "rgba(20,15,30,0.06)", marginTop: 8, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${Math.min(s.pct, 100)}%`, borderRadius: 2, background: GRAD,
                    animation: "znGrow .8s cubic-bezier(.22,1,.36,1) both .3s", transformOrigin: "left",
                  }} />
                </div>
              ) : (
                <div style={{ fontSize: 10.5, color: MUTE, marginTop: 7 }}>{s.sub}</div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* ─── Gráficas principales ─── */}
      <div className="znGridCharts">
        <Card delay={0.22}>
          <CardHead
            title={filter === "hoy" ? "Ingresos por hora" : "Evolución de ingresos"}
            sub={filter === "hoy" ? "Hoy, por franja horaria" : periodLabel}
            aside={periodTag}
          />
          <div style={{ padding: "14px 16px 10px" }}>
            <AreaChart data={data.weeklyRevenue.map(d => ({ label: d.day, value: d.revenue }))} fmt={fmt} />
          </div>
        </Card>

        <Card delay={0.26}>
          <CardHead title="Citas por hora" sub="Distribución de la agenda" aside={<IconClock size={13} />} />
          <div style={{ padding: "16px 18px 14px" }}>
            <Bars
              data={data.hourlyData.map(h => ({ label: h.hour.replace(":00", "h"), value: h.count }))}
              fmt={v => `${v} cita${v !== 1 ? "s" : ""}`}
              accent="green"
            />
          </div>
        </Card>
      </div>

      <div className="znGridSplit">
        <Card delay={0.3}>
          <CardHead title="Top 5 servicios" sub="Los más solicitados del período" />
          <div style={{ padding: "16px 18px" }}>
            <RankBars
              items={data.topServices.map(s => ({
                label: s.name, value: s.count,
                sub: data.todayCount > 0 ? `${((s.count / data.todayCount) * 100).toFixed(0)}%` : undefined,
              }))}
              fmt={v => `${Math.round(v)}`}
            />
          </div>
        </Card>

        <Card delay={0.34}>
          <CardHead
            title="Medios de pago"
            sub="Ventas POS del período"
            aside={posTotal > 0 ? fmt(posTotal) : undefined}
          />
          <div style={{ padding: "16px 18px" }}>
            <Donut
              data={data.paymentData.map(p => ({ label: p.label, value: p.amount, color: p.color }))}
              fmt={fmt}
              centerLabel="total POS"
            />
          </div>
        </Card>
      </div>

      {/* ─── Segmentos + Retención (sección unificada) ─── */}
      <Card delay={0.36}>
        <CardHead
          title="Clientes"
          sub="Segmentación y retención mensual"
          aside={<IconUsers size={13} />}
        />
        <div className="znClientGrid">

          {/* Left — Segmentos */}
          <div style={{ padding: "14px 18px" }}>
            <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, color: MUTE, textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 10 }}>
              Segmentos
            </div>
            {(() => {
              const seg = data.clientSegments;
              const total = seg.nuevos + seg.recurrentes + seg.perdidos;
              return [
                { label: "Nuevos",       sub: "Primera vez",  value: seg.nuevos,      color: "#0027fe" },
                { label: "Recurrentes",  sub: "30 días",      value: seg.recurrentes, color: "#10b981" },
                { label: "Perdidos",     sub: "+60 días",     value: seg.perdidos,    color: "#ef4444" },
              ].map((s, i) => {
                const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "8px 0",
                    borderBottom: i < 2 ? `1px solid rgba(20,15,30,0.05)` : "none",
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 12.5, color: INK }}>{s.label}</div>
                      <div style={{ fontSize: 10.5, color: MUTE }}>{s.sub}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: INK, lineHeight: 1 }}>{s.value}</div>
                      <div style={{ fontFamily: MONO, fontSize: 10, color: MUTE, marginTop: 2 }}>{pct}%</div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {/* Right — Retención */}
          <div style={{ padding: "14px 18px" }}>
            <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, color: MUTE, textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 10 }}>
              Retención mes a mes
            </div>
            <RetentionChart
              curve={data.retentionCurve}
              cohorts={data.retentionCohorts}
            />
          </div>
        </div>
      </Card>

      {/* ─── Citas + Equipo ─── */}
      <div className="znGridLists">
        <Card delay={0.38}>
          <CardHead
            title={filter === "hoy" ? "Citas de hoy" : "Citas del período"}
            sub={`${data.todayCount} agendada${data.todayCount !== 1 ? "s" : ""}`}
            aside={<IconCalendar size={13} />}
          />
          <div style={{ maxHeight: 372, overflowY: "auto" }}>
            {data.upcomingApts.length === 0 ? (
              <Empty
                msg="Sin citas en este período."
                action={
                  <button onClick={() => setShowNewAppt(true)} style={{
                    padding: "8px 16px", borderRadius: 9, border: "none", background: GRAD, color: "white",
                    fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: SANS,
                    boxShadow: "0 4px 14px rgba(0,39,254,0.25)",
                  }}>
                    + Agendar la primera
                  </button>
                }
              />
            ) : (
              data.upcomingApts.map((apt, i) => (
                <div key={i} className="znRow" style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
                  padding: "10px 18px",
                  borderBottom: i < data.upcomingApts.length - 1 ? `1px solid rgba(20,15,30,0.05)` : "none",
                }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
                    <div style={{ background: INK, color: "white", borderRadius: 9, padding: "6px 9px", minWidth: 52, textAlign: "center", flexShrink: 0 }}>
                      {filter !== "hoy" && (
                        <div style={{ fontSize: 8.5, fontFamily: MONO, color: "rgba(255,255,255,0.55)", lineHeight: 1, marginBottom: 3 }}>
                          {apt.appointment_date?.slice(5).replace("-", "/")}
                        </div>
                      )}
                      <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 11.5, lineHeight: 1 }}>
                        {apt.appointment_time?.slice(0, 5)}
                      </div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{apt.clients?.name || "—"}</div>
                      <div style={{ fontSize: 11, color: MUTE, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {apt.services?.name || "—"} · {apt.professionals?.name || "Cualquiera"}
                      </div>
                    </div>
                  </div>
                  <StatusPill status={apt.status} />
                </div>
              ))
            )}
          </div>
        </Card>

        <Card delay={0.42}>
          <CardHead title="Rendimiento del equipo" sub="Ingresos por colaborador" aside={<IconUsers size={13} />} />
          {data.staffPerf.length === 0 ? (
            <Empty msg="Sin datos del equipo aún." />
          ) : (
            data.staffPerf.map((s, i) => (
              <div key={i} className="znRow" style={{
                padding: "11px 18px",
                borderBottom: i < data.staffPerf.length - 1 ? `1px solid rgba(20,15,30,0.05)` : "none",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                      background: i === 0 ? GRAD : "rgba(20,15,30,0.06)",
                      color: i === 0 ? "white" : DIM,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: 10.5,
                    }}>
                      {s.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 12.5, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                      <div style={{ fontSize: 10.5, color: MUTE, marginTop: 1, fontFamily: MONO }}>{s.count} cita{s.count !== 1 ? "s" : ""}</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 12.5, color: INK, flexShrink: 0 }}>{fmt(s.revenue)}</div>
                </div>
                <div style={{ height: 3, borderRadius: 2, background: "rgba(20,15,30,0.05)", marginTop: 8, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${(s.revenue / maxStaffRev) * 100}%`, borderRadius: 2,
                    background: i === 0 ? GRAD : "rgba(20,15,30,0.2)",
                    animation: `znGrow .7s cubic-bezier(.22,1,.36,1) both ${0.45 + i * 0.06}s`, transformOrigin: "left",
                  }} />
                </div>
              </div>
            ))
          )}
        </Card>
      </div>

      {/* ─── Modal nueva cita ─── */}
      {tenantId && (
        <NewAppointmentModal
          tenantId={tenantId}
          open={showNewAppt}
          onClose={() => setShowNewAppt(false)}
          onCreated={() => { setShowNewAppt(false); fetchAll(tenantId, filter, customStart, customEnd, profFilter); }}
        />
      )}
    </div>
  );
}
