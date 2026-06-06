"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import styles from "./admin.module.css";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "./admin-context";
import {
  IconBanknotes, IconCalendar, IconBell, IconUsers, IconChartBar,
  IconCreditCard, IconTrendUp, IconTrendDown, IconClock, IconPercent,
  IconRefresh, IconPlus, IconZap, IconChat,
} from "./ZyncraIcons";
import NewAppointmentModal from "./NewAppointmentModal";

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
}

const EMPTY: DashboardData = {
  todayRevenue: 0, prevDayRevenue: 0, todayCount: 0, pending: 0,
  noShowRate: 0, avgTicket: 0, returningPct: 0, newClientsToday: 0,
  occupancyRate: 0, upcomingApts: [], staffPerf: [], topServices: [],
  hourlyData: [], weeklyRevenue: [], paymentData: [],
};

// ─── Date helpers ─────────────────────────────────────────
const toISO = (dt: Date) =>
  `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;

// ─── Sparkline ────────────────────────────────────────────
function Sparkline({ data, color = "#fb0f05" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 72, h = 28;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 2) - 1}`).join(" ");
  return (
    <svg width={w} height={h} style={{ opacity: 0.7 }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#0027fe" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none"
        stroke={`url(#sg-${color.replace("#","")})`}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Bar Chart ────────────────────────────────────────────
function BarChart({ data, fmtVal }: {
  data: { label: string; value: number; color?: string }[];
  fmtVal?: (v: number) => string;
}) {
  const max = Math.max(...data.map(d => d.value), 1);
  const [hov, setHov] = useState<number | null>(null);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "5px", height: "72px" }}>
      {data.map((d, i) => (
        <div
          key={i}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", position: "relative" }}
          onMouseEnter={() => d.value > 0 && setHov(i)}
          onMouseLeave={() => setHov(null)}
        >
          {hov === i && (
            <div style={{
              position: "absolute", bottom: "calc(100% - 18px)", left: "50%",
              transform: "translateX(-50%)",
              background: "#14111C", color: "white",
              fontSize: "11px", fontWeight: 700, letterSpacing: "-0.2px",
              padding: "4px 9px", borderRadius: "7px",
              whiteSpace: "nowrap", pointerEvents: "none", zIndex: 20,
              boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
            }}>
              {fmtVal ? fmtVal(d.value) : String(d.value)}
              {/* Caret */}
              <div style={{
                position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
                width: 0, height: 0,
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: "5px solid #14111C",
              }} />
            </div>
          )}
          <div style={{
            width: "100%", borderRadius: "5px 5px 0 0",
            height: `${Math.max((d.value / max) * 60, 3)}px`,
            background: hov === i
              ? (d.color?.includes("gradient") ? d.color : d.color ? d.color : "linear-gradient(to top, #fb0f05, #0027fe)")
              : (d.color || "linear-gradient(to top, #fb0f05, #0027fe)"),
            opacity: hov !== null && hov !== i ? 0.45 : 1,
            transition: "opacity 0.15s, height 0.5s ease",
            cursor: "pointer",
          }} />
          <span style={{ fontSize: "9px", color: hov === i ? "#14111C" : "#8E879B", fontWeight: hov === i ? 700 : 400, textAlign: "center", lineHeight: 1, transition: "color 0.15s" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Metric Card ─────────────────────────────────────────
interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  iconColor?: string;
  trend?: "up" | "down" | "neutral";
  trendVal?: string;
  alert?: boolean;
  spark?: number[];
  gradient?: boolean;
}

function MetricCard({ label, value, sub, icon, iconColor = "#fb0f05", trend, trendVal, alert, spark, gradient = true }: MetricCardProps) {
  const bg = iconColor === "#fb0f05" ? "rgba(251,15,5,0.08)"
    : iconColor === "#10b981" ? "rgba(16,185,129,0.1)"
    : iconColor === "#f59e0b" ? "rgba(245,158,11,0.1)"
    : "rgba(251,15,5,0.08)";

  return (
    <div style={{
      background: "white",
      borderRadius: "18px",
      padding: "20px 22px",
      border: alert ? "1px solid rgba(251,15,5,0.3)" : "1px solid #e8e6e2",
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      position: "relative",
      overflow: "hidden",
      transition: "box-shadow 0.2s",
    }}>
      {alert && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, #fb0f05, #f97316)" }} />}

      {/* Icon + Sparkline row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "11px",
          background: bg,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          color: iconColor,
        }}>
          {icon}
        </div>
        {spark && <Sparkline data={spark} color={iconColor} />}
      </div>

      {/* Value */}
      <div style={gradient ? {
        fontSize: "28px", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-1px",
        background: alert ? "#ef4444" : "linear-gradient(135deg, #fb0f05 0%, #0027fe 100%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
      } : {
        fontSize: "28px", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-1px",
        color: alert ? "var(--error)" : "#14111C",
      }}>
        {value}
      </div>

      {/* Label */}
      <div style={{ fontSize: "12px", fontWeight: 600, color: "#8E879B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>

      {/* Trend / sub */}
      {(trendVal || sub) && (
        <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "12px", marginTop: "2px", flexWrap: "wrap" }}>
          {trendVal && trend && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "3px",
              color: trend === "up" ? "#10b981" : trend === "down" ? "#ef4444" : "#8E879B",
              fontWeight: 700,
            }}>
              {trend === "up" ? <IconTrendUp size={13} color="#10b981" /> : trend === "down" ? <IconTrendDown size={13} color="#ef4444" /> : "—"}
              {trendVal}
            </span>
          )}
          {sub && <span style={{ color: "#8E879B" }}>{sub}</span>}
        </div>
      )}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────
function SectionHeader({ title, sub, icon }: { title: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px 20px", borderBottom: "1px solid #e8e6e2" }}>
      {icon && (
        <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05", flexShrink: 0 }}>
          {icon}
        </div>
      )}
      <div>
        <div style={{ fontWeight: 700, fontSize: "13px", color: "#14111C" }}>{title}</div>
        {sub && <div style={{ fontSize: "11px", color: "#8E879B", marginTop: "1px" }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Status Pill ─────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    confirmed: { bg: "rgba(16,185,129,0.1)", color: "#10b981", label: "Confirmada" },
    pending:   { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", label: "Pendiente" },
    completed: { bg: "rgba(100,116,139,0.1)", color: "#64748b", label: "Completada" },
    cancelled: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", label: "Cancelada" },
    no_show:   { bg: "rgba(239,68,68,0.08)", color: "#dc2626", label: "No se presentó" },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

// ─── Date Range Picker ────────────────────────────────────
const MONTHS_CAL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_CAL   = ["Lu","Ma","Mi","Ju","Vi","Sá","Do"];
const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

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
  const fmtDisplay = (iso: string) => {
    const [y, m, d] = iso.split("-");
    return `${parseInt(d)} ${MONTHS_SHORT[parseInt(m) - 1]} ${y}`;
  };

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

  return (
    <div style={{ background: "white", border: "1px solid #e8e6e2", borderRadius: 18, padding: "16px 18px", display: "inline-block", boxShadow: "0 12px 40px rgba(0,0,0,0.12)", marginTop: 8 }}>

      {/* Month nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <button onClick={prevMo} style={{ background: "none", border: "1.5px solid #e8e6e2", borderRadius: 9, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#3a3548", display:"flex",alignItems:"center",justifyContent:"center" }}>‹</button>
        <span style={{ fontWeight: 800, fontSize: 14, color: "#14111C", letterSpacing: "-0.3px" }}>{MONTHS_CAL[cm]} {cy}</span>
        <button onClick={nextMo} style={{ background: "none", border: "1.5px solid #e8e6e2", borderRadius: 9, width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "#3a3548", display:"flex",alignItems:"center",justifyContent:"center" }}>›</button>
      </div>

      {/* Day headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
        {DAYS_CAL.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "#8E879B", padding: "2px 0" }}>{d}</div>
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
                background: mid ? "rgba(251,15,5,0.09)" : "transparent",
                borderRadius: start ? "8px 0 0 8px" : end ? "0 8px 8px 0" : 0,
              }}>
              <button
                onClick={() => handleClick(iso)}
                onMouseEnter={() => !de && ds && setHov(iso)}
                onMouseLeave={() => setHov("")}
                style={{
                  width: "100%", padding: "7px 0", border: "none",
                  borderRadius: isEdge ? 8 : 0,
                  background: isEdge ? "#fb0f05" : "transparent",
                  color: isEdge ? "white" : isToday ? "#fb0f05" : "#14111C",
                  fontSize: 13, fontWeight: isEdge ? 800 : isToday ? 700 : 400,
                  cursor: "pointer",
                  outline: isToday && !isEdge ? "2px solid rgba(251,15,5,0.35)" : "none",
                  outlineOffset: -2,
                  transition: "background 0.1s",
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
          style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #e8e6e2", background: "white", color: "#8E879B", fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif" }}>
          Limpiar
        </button>
        <button onClick={() => canApply && onApply(ds, de)} disabled={!canApply}
          style={{ flex: 1, padding: "7px 14px", borderRadius: 8, border: "none", background: canApply ? "linear-gradient(135deg,#fb0f05,#0027fe)" : "rgba(20,15,30,.07)", color: canApply ? "white" : "#8E879B", fontWeight: 700, fontSize: 12, cursor: canApply ? "pointer" : "not-allowed", fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif" }}>
          Aplicar
        </button>
      </div>
    </div>
  );
}

// ─── Filter Button ────────────────────────────────────────
function FilterBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 16px", borderRadius: "9px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
      border: active ? "1.5px solid rgba(251,15,5,0.4)" : "1.5px solid #e8e6e2",
      background: active ? "rgba(251,15,5,0.06)" : "white",
      color: active ? "#fb0f05" : "#564E66",
      transition: "all 0.15s",
    }}>
      {children}
    </button>
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
  const [showBlock, setShowBlock] = useState(false);
  const [showWA, setShowWA] = useState(false);
  const [showRangePicker, setShowRangePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedOnce = useRef(false);
  const rangePickerRef = useRef<HTMLDivElement>(null);
  const [apptClients, setApptClients] = useState<any[]>([]);
  const [apptServices, setApptServices] = useState<any[]>([]);
  const [apptProfs, setApptProfs] = useState<any[]>([]);
  const [apptForm, setApptForm] = useState({ client_id: "", service_id: "", professional_id: "", date: "", time: "" });
  const [apptSaving, setApptSaving] = useState(false);
  const [apptMsg, setApptMsg] = useState("");
  const [blockForm, setBlockForm] = useState({ date: "", start: "", end: "", reason: "" });
  const [blockSaving, setBlockSaving] = useState(false);
  const [blockMsg, setBlockMsg] = useState("");
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
    setData({ todayRevenue, prevDayRevenue, todayCount, pending, noShowRate, avgTicket, returningPct, newClientsToday: newClientsToday || 0, occupancyRate, upcomingApts, staffPerf, topServices, hourlyData, weeklyRevenue, paymentData });
    hasLoadedOnce.current = true;
    setLoading(false);
    setRefreshing(false);
  }, []);

  const openNewAppt = useCallback(async () => {
    if (!tenantId) return;
    const [{ data: cls }, { data: svs }, { data: prs }] = await Promise.all([
      supabase.from("clients").select("id,name,phone").eq("tenant_id", tenantId).order("name"),
      supabase.from("services").select("id,name,price").eq("tenant_id", tenantId).order("name"),
      supabase.from("professionals").select("id,name").eq("tenant_id", tenantId).eq("is_active", true).order("name"),
    ]);
    setApptClients(cls || []); setApptServices(svs || []); setApptProfs(prs || []);
    setApptForm({ client_id: "", service_id: "", professional_id: "", date: "", time: "" });
    setApptMsg(""); setShowNewAppt(true);
  }, [tenantId]);

  const handleCreateAppt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setApptSaving(true);
    const { error } = await supabase.from("appointments").insert({ tenant_id: tenantId, client_id: apptForm.client_id, service_id: apptForm.service_id || null, professional_id: apptForm.professional_id || null, appointment_date: apptForm.date, appointment_time: apptForm.time, status: "confirmed" });
    setApptSaving(false);
    if (error) { setApptMsg("Error: " + error.message); }
    else { setApptMsg("Cita creada con éxito"); setTimeout(() => { setShowNewAppt(false); fetchAll(tenantId, filter, customStart, customEnd, profFilter); }, 1200); }
  };

  const handleBlockSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setBlockSaving(true);
    const { error } = await supabase.from("blocked_slots").insert({ tenant_id: tenantId, blocked_date: blockForm.date, start_time: blockForm.start, end_time: blockForm.end, reason: blockForm.reason || null });
    setBlockSaving(false);
    if (error) setBlockMsg("Error: " + error.message);
    else { setBlockMsg("Horario bloqueado"); setTimeout(() => setShowBlock(false), 1200); }
  };

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
    const MONS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

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
            : `<rect x="${x}" y="${BH - 2}" width="${BW}" height="2" rx="1" fill="#e8e6e2"/>`) +
          (item.value > 0
            ? `<text x="${x + BW / 2}" y="${BH - bh - 5}" text-anchor="middle" font-size="9" fill="#8E879B" font-family="Segoe UI,sans-serif">${fmtV(item.value)}</text>`
            : "") +
          `<text x="${x + BW / 2}" y="${BH + 14}" text-anchor="middle" font-size="10" fill="#64748b" font-family="Segoe UI,sans-serif" font-weight="600">${item.label}</text>` +
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
            `<div style="font-size:10px;color:#64748b;font-weight:700;white-space:nowrap">${DOW_LABELS[dow]}</div>` +
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
      { label: "Completada",    count: completedCount, color: "#64748b" },
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
        `<span style="font-size:13px;font-weight:800;color:#14111C;margin-left:6px">${si.count}</span>` +
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
  .hdr h1{color:white;font-size:20px;font-weight:800;letter-spacing:-.5px}
  .hdr-sub{color:rgba(255,255,255,.4);font-size:11px;margin-top:2px}
  .hdr-right{text-align:right}
  .period-pill{display:inline-block;background:#fb0f05;color:white;padding:3px 11px;border-radius:20px;font-size:10px;font-weight:800;letter-spacing:.04em;margin-bottom:5px}
  .date-txt{color:rgba(255,255,255,.4);font-size:10px}
  .print-btn{background:rgba(255,255,255,.1);color:rgba(255,255,255,.85);border:1px solid rgba(255,255,255,.18);padding:5px 13px;border-radius:7px;font-size:11px;font-weight:600;cursor:pointer;margin-top:7px;display:inline-block}
  .st{font-size:10px;color:#8E879B;text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin:18px 0 7px}
  .g4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
  .g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .metric{background:white;border-radius:11px;padding:13px 16px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
  .mv{font-size:20px;font-weight:800;background:linear-gradient(135deg,#fb0f05,#0027fe);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1.15}
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
  .completed{background:rgba(100,116,139,.12);color:#475569}
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
    <div class="card"><div class="ct">Barras de ingresos diarios</div>${vBars(revBarsData, "#fb0f05", "#0027fe", "rg1", v => v >= 1000000 ? (v/1000000).toFixed(1)+"M" : v >= 1000 ? (v/1000).toFixed(0)+"k" : String(v))}</div>
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

  const inputSt: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #e8e6e2", borderRadius: "10px", fontSize: "14px", background: "rgba(20,15,30,0.025)", color: "#14111C", boxSizing: "border-box", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: "16px" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid #e8e6e2", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "#8E879B", fontSize: "13px", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>Cargando panel...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif", position: "relative" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes progress { 0%{width:0%} 80%{width:85%} 100%{width:100%} }
      `}</style>
      {/* Barra de progreso sutil al refrescar — no borra el contenido */}
      {refreshing && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "3px", zIndex: 9999, overflow: "hidden" }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg,#fb0f05,#0027fe)", animation: "progress 1.2s ease-out forwards" }} />
        </div>
      )}

      {/* ─── Header ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 800, margin: 0, letterSpacing: "-0.5px", color: "#14111C" }}>
            Buen día 👋
          </h1>
          <p style={{ color: "#8E879B", fontSize: "13px", marginTop: "3px", textTransform: "capitalize" }}>
            {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
          {(["hoy", "semana", "mes"] as const).map(f => (
            <FilterBtn key={f} active={filter === f} onClick={() => { setFilter(f); setShowRangePicker(false); fetchAll(tenantId!, f, undefined, undefined, profFilter); }}>
              {f === "hoy" ? "Hoy" : f === "semana" ? "7 días" : "30 días"}
            </FilterBtn>
          ))}

          {/* Rango personalizado — botón + popup */}
          <div ref={rangePickerRef} style={{ position: "relative" }}>
            <FilterBtn active={filter === "custom"} onClick={() => { setFilter("custom"); setShowRangePicker(s => !s); if (customStart && customEnd) fetchAll(tenantId!, "custom", customStart, customEnd, profFilter); }}>
              {customStart && customEnd ? `${customStart.slice(5)} → ${customEnd.slice(5)}` : "Rango"}
            </FilterBtn>
            {showRangePicker && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 200 }}>
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

          <button onClick={() => fetchAll(tenantId!, filter, customStart, customEnd, profFilter)}
            style={{ width: "34px", height: "34px", borderRadius: "9px", border: "1.5px solid #e8e6e2", background: "white", color: "#564E66", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconRefresh size={15} />
          </button>
          <button onClick={downloadHTML}
            style={{ height: "34px", padding: "0 14px", borderRadius: "9px", border: "1.5px solid #e8e6e2", background: "white", color: "#564E66", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif" }}>
            ⬇ HTML
          </button>
        </div>

        {/* Filtro de miembro */}
        {profOptions.length > 0 && (
          <select
            value={profFilter}
            onChange={e => { setProfFilter(e.target.value); fetchAll(tenantId!, filter, customStart, customEnd, e.target.value); }}
            style={{
              height: "34px", padding: "0 12px", borderRadius: "9px",
              border: profFilter ? "1.5px solid rgba(251,15,5,0.4)" : "1.5px solid #e8e6e2",
              background: profFilter ? "rgba(251,15,5,0.06)" : "white",
              color: profFilter ? "#fb0f05" : "#564E66",
              fontSize: "13px", fontWeight: 600, cursor: "pointer",
              fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif",
              outline: "none",
            }}>
            <option value="">Todo el equipo</option>
            {profOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>

      {/* ─── Primary Metrics ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "14px" }}>
        <MetricCard
          icon={<IconBanknotes size={20} />} iconColor="#fb0f05"
          label={filter === "hoy" ? "Ingresos de hoy" : "Ingresos del período"}
          value={fmt(data.todayRevenue)}
          trendVal={filter === "hoy" ? `${Math.abs(revDiff) > 0 ? fmt(Math.abs(revDiff)) : "igual"} vs ayer` : undefined}
          trend={filter === "hoy" ? revTrend : undefined}
          spark={data.weeklyRevenue.map(d => d.revenue)}
        />
        <MetricCard
          icon={<IconCalendar size={20} />} iconColor="#fb0f05"
          label={filter === "hoy" ? "Citas hoy" : "Total de citas"}
          value={String(data.todayCount)}
          sub={filter === "hoy" ? `${data.occupancyRate.toFixed(0)}% ocupación` : periodLabel}
          trend={data.todayCount >= 5 ? "up" : "neutral"}
          trendVal={data.todayCount >= 5 ? "buen ritmo" : undefined}
          spark={data.hourlyData.map(h => h.count)}
        />
        <MetricCard
          icon={<IconBell size={20} />} iconColor={data.pending > 3 ? "#ef4444" : "#f59e0b"}
          label="Pendientes"
          value={String(data.pending)}
          sub="requieren acción"
          alert={data.pending > 3}
          trend={data.pending > 0 ? "down" : "neutral"}
          trendVal={data.pending > 3 ? "Atención" : undefined}
        />
        <MetricCard
          icon={<IconPercent size={20} />} iconColor={data.noShowRate > 15 ? "#ef4444" : "#fb0f05"}
          label="Inasistencias"
          value={`${data.noShowRate.toFixed(1)}%`}
          sub={periodLabel.toLowerCase()}
          alert={data.noShowRate > 15}
          trend={data.noShowRate > 10 ? "down" : "up"}
          trendVal={data.noShowRate > 15 ? "Alto — activa depósitos" : "Bajo control"}
        />
      </div>

      {/* ─── Secondary Metrics ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "14px" }}>
        <MetricCard icon={<IconCreditCard size={18} />} iconColor="#fb0f05" label="Ticket promedio" value={fmt(data.avgTicket)} sub="por servicio" />
        <MetricCard icon={<IconRefresh size={18} />} iconColor="#fb0f05" label="Clientes recurrentes" value={`${data.returningPct.toFixed(0)}%`} sub={periodLabel.toLowerCase()} trend={data.returningPct > 50 ? "up" : "neutral"} />
        <MetricCard icon={<IconUsers size={18} />} iconColor="#10b981" label={filter === "hoy" ? "Nuevos hoy" : "Nuevos clientes"} value={String(data.newClientsToday)} sub={filter === "hoy" ? "registrados hoy" : "en el período"} />
        <MetricCard icon={<IconChartBar size={18} />} iconColor="#fb0f05" label="Ocupación" value={`${data.occupancyRate.toFixed(0)}%`} sub={`capacidad ${periodLabel.toLowerCase()}`} trend={data.occupancyRate > 70 ? "up" : "neutral"} />
      </div>

      {/* ─── Charts Row ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
        <div style={{ background: "white", borderRadius: "18px", border: "1px solid #e8e6e2", overflow: "hidden" }}>
          <SectionHeader title={filter === "hoy" ? "Ingresos por hora — hoy" : `Ingresos — ${periodLabel.toLowerCase()}`} icon={<IconBanknotes size={16} />} />
          <div style={{ padding: "16px 20px 20px" }}>
            <BarChart
              data={data.weeklyRevenue.map(d => ({ label: d.day, value: d.revenue }))}
              fmtVal={v => v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + "M" : v >= 1_000 ? (v / 1_000).toFixed(0) + "k" : fmt(v)}
            />
          </div>
        </div>

        <div style={{ background: "white", borderRadius: "18px", border: "1px solid #e8e6e2", overflow: "hidden" }}>
          <SectionHeader title={filter === "hoy" ? "Citas por hora — hoy" : "Citas por hora del período"} icon={<IconClock size={16} />} />
          <div style={{ padding: "16px 20px 20px" }}>
            <BarChart
              data={data.hourlyData.map(h => ({ label: h.hour.replace(":00", "h"), value: h.count, color: "linear-gradient(to top, #10b981, #6ee7b7)" }))}
              fmtVal={v => `${v} cita${v !== 1 ? "s" : ""}`}
            />
          </div>
        </div>

        <div style={{ background: "white", borderRadius: "18px", border: "1px solid #e8e6e2", overflow: "hidden" }}>
          <SectionHeader title="Top servicios" icon={<IconChartBar size={16} />} />
          <div style={{ padding: "16px 20px 20px" }}>
            {data.topServices.length === 0 ? (
              <p style={{ color: "#8E879B", fontSize: "13px" }}>Sin datos aún.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {data.topServices.map((s, i) => {
                  const maxCount = data.topServices[0].count;
                  return (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                        <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "130px", color: "#3a3548" }}>{s.name}</span>
                        <span style={{ color: "#8E879B", fontWeight: 500 }}>{s.count}</span>
                      </div>
                      <div style={{ height: "5px", borderRadius: "3px", background: "rgba(20,15,30,0.04)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(s.count / maxCount) * 100}%`, background: "linear-gradient(90deg, #fb0f05, #0027fe)", borderRadius: "3px", transition: "width 0.6s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Medios de pago */}
        <div style={{ background: "white", borderRadius: "18px", border: "1px solid #e8e6e2", overflow: "hidden" }}>
          <SectionHeader title="Medios de pago" icon={<IconCreditCard size={16} />} />
          <div style={{ padding: "16px 20px 20px" }}>
            {data.paymentData.length === 0 ? (
              <p style={{ color: "#8E879B", fontSize: "13px" }}>Sin ventas POS en este período.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {data.paymentData.map((pm, i) => {
                  const maxAmt = data.paymentData[0].amount;
                  return (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", marginBottom: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: pm.color, flexShrink: 0 }} />
                          <span style={{ fontWeight: 600, color: "#3a3548" }}>{pm.label}</span>
                        </div>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={{ color: "#8E879B", fontSize: "11px" }}>{pm.count} venta{pm.count !== 1 ? "s" : ""}</span>
                          <span style={{ fontWeight: 700, color: pm.color }}>{fmt(pm.amount)}</span>
                        </div>
                      </div>
                      <div style={{ height: "5px", borderRadius: "3px", background: "rgba(20,15,30,0.04)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(pm.amount / maxAmt) * 100}%`, background: pm.color, borderRadius: "3px", transition: "width 0.6s ease" }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop: "4px", fontSize: "11px", color: "#8E879B", borderTop: "1px solid #f0eeeb", paddingTop: "8px" }}>
                  Total POS: <strong style={{ color: "#14111C" }}>{fmt(data.paymentData.reduce((s, p) => s + p.amount, 0))}</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Appointments + Staff ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "14px" }}>

        {/* Citas del período */}
        <div style={{ background: "white", borderRadius: "18px", border: "1px solid #e8e6e2", overflow: "hidden" }}>
          <SectionHeader
            title={filter === "hoy" ? "Citas de hoy" : "Citas del período"}
            sub={`${data.todayCount} agendada${data.todayCount !== 1 ? "s" : ""}`}
            icon={<IconCalendar size={16} />}
          />
          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {data.upcomingApts.length === 0 ? (
              <div style={{ padding: "36px 20px", textAlign: "center", color: "#8E879B", fontSize: "14px" }}>
                Sin citas en este período.
              </div>
            ) : (
              data.upcomingApts.map((apt, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 20px", borderBottom: i < data.upcomingApts.length - 1 ? "1px solid #f0eeeb" : "none" }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    {/* Date + time badge */}
                    <div style={{ background: "rgba(251,15,5,0.07)", borderRadius: "9px", padding: "6px 10px", minWidth: "52px", textAlign: "center" }}>
                      {filter !== "hoy" && (
                        <div style={{ fontSize: "10px", color: "#8E879B", lineHeight: 1, marginBottom: "2px" }}>
                          {apt.appointment_date?.slice(5).replace("-", "/")}
                        </div>
                      )}
                      <div style={{ fontWeight: 800, fontSize: "12px", color: "#fb0f05", lineHeight: 1 }}>
                        {apt.appointment_time?.slice(0, 5)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "13px", color: "#14111C" }}>{apt.clients?.name || "—"}</div>
                      <div style={{ fontSize: "11px", color: "#8E879B", marginTop: "2px" }}>
                        {apt.services?.name || "—"} · {apt.professionals?.name || "Cualquiera"}
                      </div>
                    </div>
                  </div>
                  <StatusPill status={apt.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Rendimiento del Equipo */}
        <div style={{ background: "white", borderRadius: "18px", border: "1px solid #e8e6e2", overflow: "hidden" }}>
          <SectionHeader title="Rendimiento del equipo" icon={<IconUsers size={16} />} />
          {data.staffPerf.length === 0 ? (
            <div style={{ padding: "36px 20px", textAlign: "center", color: "#8E879B", fontSize: "14px" }}>Sin datos aún.</div>
          ) : (
            data.staffPerf.map((s, i) => (
              <div key={i} style={{ padding: "12px 20px", borderBottom: i < data.staffPerf.length - 1 ? "1px solid #f0eeeb" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <div style={{
                    width: "34px", height: "34px", borderRadius: "50%",
                    background: "linear-gradient(135deg, #fb0f05, #0027fe)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 800, fontSize: "11px", flexShrink: 0,
                  }}>
                    {s.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "13px", color: "#14111C" }}>{s.name}</div>
                    <div style={{ fontSize: "11px", color: "#8E879B", marginTop: "1px" }}>{s.count} citas</div>
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: "13px", color: "#fb0f05" }}>{fmt(s.revenue)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Quick Actions ─── */}
      <div style={{ background: "white", borderRadius: "18px", border: "1px solid #e8e6e2", overflow: "hidden" }}>
        <SectionHeader title="Acciones rápidas" icon={<IconZap size={16} />} />
        <div style={{ padding: "16px 20px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {[
            { icon: <IconPlus size={15} />, label: "Nueva Cita", color: "#fb0f05", bg: "rgba(251,15,5,0.08)", onClick: openNewAppt },
            { icon: <IconCalendar size={15} />, label: "Bloquear Horario", color: "#64748b", bg: "rgba(100,116,139,0.08)", onClick: () => { setBlockMsg(""); setBlockForm({ date: "", start: "", end: "", reason: "" }); setShowBlock(true); } },
            { icon: <IconChat size={15} />, label: "Recordatorio WhatsApp", color: "#25D366", bg: "rgba(37,211,102,0.08)", onClick: () => setShowWA(true) },
            { icon: <IconUsers size={15} />, label: "Nuevo Cliente", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", onClick: () => window.location.href = "/admin/clients" },
          ].map((a, i) => (
            <button key={i} onClick={a.onClick} style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "9px 16px", borderRadius: "10px",
              border: `1.5px solid ${a.color}30`, background: a.bg,
              color: a.color, cursor: "pointer", fontSize: "13px", fontWeight: 600,
              fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
              transition: "all 0.15s",
            }}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Modal: Nueva Cita ─── */}
      <NewAppointmentModal
        tenantId={tenantId ?? ""}
        open={showNewAppt}
        onClose={() => setShowNewAppt(false)}
        onCreated={() => fetchAll(tenantId!, filter)}
      />

      {/* ─── Modal: Bloquear Horario ─── */}
      {showBlock && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(17,17,24,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={e => { if (e.target === e.currentTarget) setShowBlock(false); }}>
          <div style={{ background: "white", borderRadius: "22px", padding: "28px", width: "100%", maxWidth: "420px", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "22px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(100,116,139,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                <IconCalendar size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#14111C" }}>Bloquear Horario</h2>
                <p style={{ color: "#8E879B", fontSize: "12px", marginTop: "2px" }}>El rango no estará disponible para reservas.</p>
              </div>
            </div>
            <form onSubmit={handleBlockSlot}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: "12px", color: "#564E66", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Fecha *</label>
                <input required type="date" value={blockForm.date} onChange={e => setBlockForm({ ...blockForm, date: e.target.value })} style={inputSt} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontWeight: 600, fontSize: "12px", color: "#564E66", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Desde *</label>
                  <input required type="time" value={blockForm.start} onChange={e => setBlockForm({ ...blockForm, start: e.target.value })} style={inputSt} />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: 600, fontSize: "12px", color: "#564E66", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Hasta *</label>
                  <input required type="time" value={blockForm.end} onChange={e => setBlockForm({ ...blockForm, end: e.target.value })} style={inputSt} />
                </div>
              </div>
              <div style={{ marginBottom: "22px" }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: "12px", color: "#564E66", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Motivo (opcional)</label>
                <input type="text" value={blockForm.reason} onChange={e => setBlockForm({ ...blockForm, reason: e.target.value })} placeholder="Ej. Reunión, descanso..." style={inputSt} />
              </div>
              {blockMsg && <p style={{ fontSize: "13px", marginBottom: "12px", color: blockMsg.startsWith("Error") ? "#ef4444" : "#10b981", fontWeight: 600 }}>{blockMsg}</p>}
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowBlock(false)} disabled={blockSaving}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={blockSaving}>{blockSaving ? "Bloqueando..." : "Bloquear"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal: WhatsApp ─── */}
      {showWA && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(17,17,24,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={e => { if (e.target === e.currentTarget) setShowWA(false); }}>
          <div style={{ background: "white", borderRadius: "22px", padding: "28px", width: "100%", maxWidth: "400px", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(37,211,102,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconChat size={18} color="#25D366" />
              </div>
              <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#14111C" }}>Recordatorio WhatsApp</h2>
            </div>
            <p style={{ color: "#564E66", fontSize: "13px", marginBottom: "16px", lineHeight: 1.6 }}>Envía un recordatorio manual a un cliente desde WhatsApp Web.</p>
            <div style={{ background: "rgba(20,15,30,0.025)", border: "1px solid #e8e6e2", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
              <p style={{ fontSize: "12px", marginBottom: "8px", fontWeight: 700, color: "#3a3548", textTransform: "uppercase", letterSpacing: "0.05em" }}>Mensaje sugerido</p>
              <p style={{ fontSize: "13px", color: "#564E66", lineHeight: 1.65, fontStyle: "italic" }}>"Hola [Nombre], te recordamos que tienes una cita mañana a las [Hora]. ¡Te esperamos!"</p>
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button className="btn-secondary" onClick={() => setShowWA(false)}>Cerrar</button>
              <button style={{ padding: "10px 20px", borderRadius: "10px", background: "#25D366", color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", fontSize: "13px", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}
                onClick={() => window.open("https://wa.me/?text=Hola%2C+te+recordamos+tu+cita+de+ma%C3%B1ana.", "_blank")}>
                Abrir WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
