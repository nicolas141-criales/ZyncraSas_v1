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
}

const EMPTY: DashboardData = {
  todayRevenue: 0, prevDayRevenue: 0, todayCount: 0, pending: 0,
  noShowRate: 0, avgTicket: 0, returningPct: 0, newClientsToday: 0,
  occupancyRate: 0, upcomingApts: [], staffPerf: [], topServices: [],
  hourlyData: [], weeklyRevenue: [],
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
function BarChart({ data }: { data: { label: string; value: number; color?: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "5px", height: "72px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
          <div style={{
            width: "100%", borderRadius: "5px 5px 0 0",
            height: `${Math.max((d.value / max) * 60, 3)}px`,
            background: d.color || "linear-gradient(to top, #fb0f05, #0027fe)",
            transition: "height 0.5s ease",
          }} />
          <span style={{ fontSize: "9px", color: "#8E879B", textAlign: "center", lineHeight: 1 }}>{d.label}</span>
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
  const { tenantId } = useAdmin();
  const [data, setData] = useState<DashboardData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"hoy" | "semana" | "mes" | "custom">("hoy");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showNewAppt, setShowNewAppt] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const [showWA, setShowWA] = useState(false);
  const [showRangePicker, setShowRangePicker] = useState(false);
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

  const fetchAll = useCallback(async (tid: string, f: "hoy" | "semana" | "mes" | "custom" = "hoy", cStart?: string, cEnd?: string) => {
    setLoading(true);
    const now = new Date();
    const todayStr = toISO(now);
    const prevDate = new Date(now); prevDate.setDate(prevDate.getDate() - 1);
    const prevStr = toISO(prevDate);
    let rangeStart = new Date(now);
    let rangeEndStr = todayStr;
    if (f === "semana") rangeStart.setDate(now.getDate() - 6);
    else if (f === "mes") rangeStart.setDate(now.getDate() - 29);
    else if (f === "custom" && cStart && cEnd) { rangeStart = new Date(cStart + "T00:00:00"); rangeEndStr = cEnd; }
    else rangeStart = new Date(now); // "hoy": rango = solo hoy
    const weekStart = rangeStart;
    const weekStartStr = toISO(weekStart);

    const { data: weekApts } = await supabase
      .from("appointments")
      .select("id, appointment_date, appointment_time, status, client_id, clients(name, no_shows), services(name, price), professionals(name)")
      .eq("tenant_id", tid)
      .gte("appointment_date", weekStartStr)
      .lte("appointment_date", rangeEndStr)
      .order("appointment_date").order("appointment_time");

    const apts = (weekApts || []) as any[];
    // filteredApts: "hoy" = solo hoy; semana/mes/custom = todo el rango
    const filteredApts = f === "hoy"
      ? apts.filter(a => a.appointment_date === todayStr)
      : apts;
    const prevApts = f === "hoy"
      ? apts.filter(a => a.appointment_date === prevStr)
      : [];
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
    // Hourly chart always shows today's appointments (granularidad diaria no aplica para horas)
    const todayApts = apts.filter(a => a.appointment_date === todayStr);
    const hours = ["09", "10", "11", "12", "13", "14", "15", "16", "17", "18"];
    const hourlyData = hours.map(h => ({ hour: `${h}:00`, count: todayApts.filter(a => a.appointment_time?.startsWith(h)).length }));
    const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const weeklyRevenue = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
      const ds = toISO(d);
      const rev = apts.filter(a => a.appointment_date === ds && a.status !== "cancelled").reduce((s, a) => s + Number(a.services?.price || 0), 0);
      return { day: dayNames[d.getDay() === 0 ? 6 : d.getDay() - 1], revenue: rev };
    });
    const { count: newClientsToday } = await supabase.from("clients").select("id", { count: "exact", head: true }).eq("tenant_id", tid).gte("created_at", todayStr).lte("created_at", todayStr + "T23:59:59");
    const uniqueClients = new Set(apts.map(a => a.client_id)).size;
    const multiVisit = apts.filter((a, _, arr) => arr.filter(b => b.client_id === a.client_id).length > 1);
    const returningPct = uniqueClients > 0 ? (new Set(multiVisit.map(a => a.client_id)).size / uniqueClients) * 100 : 0;
    const occupancyRate = Math.min((todayCount / 10) * 100, 100);
    setData({ todayRevenue, prevDayRevenue, todayCount, pending, noShowRate, avgTicket, returningPct, newClientsToday: newClientsToday || 0, occupancyRate, upcomingApts, staffPerf, topServices, hourlyData, weeklyRevenue });
    setLoading(false);
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
    else { setApptMsg("Cita creada con éxito"); setTimeout(() => { setShowNewAppt(false); fetchAll(tenantId, filter); }, 1200); }
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
    if (tenantId) fetchAll(tenantId, filter);
  }, [tenantId, filter, fetchAll]);

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
  const fmt = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

  const periodLabel = filter === "hoy" ? "Hoy" : filter === "semana" ? "Últimos 7 días" : filter === "mes" ? "Últimos 30 días" : `${customStart} — ${customEnd}`;

  const downloadHTML = () => {
    const now = new Date();
    const generated = now.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const statusLabel: Record<string, string> = { confirmed: "Confirmada", pending: "Pendiente", completed: "Completada", cancelled: "Cancelada", no_show: "No se presentó" };
    const cancelledCount = data.upcomingApts.filter((a: any) => a.status === "cancelled").length;
    const noShowCount    = data.upcomingApts.filter((a: any) => a.status === "no_show").length;
    const completedCount = data.upcomingApts.filter((a: any) => a.status === "completed").length;
    const confirmedCount = data.upcomingApts.filter((a: any) => a.status === "confirmed").length;
    const maxHour = Math.max(...data.hourlyData.map(h => h.count), 1);
    const maxDay  = Math.max(...data.weeklyRevenue.map(d => d.revenue), 1);
    const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>Reporte Zyncra — ${periodLabel}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:'Segoe UI',Arial,sans-serif;margin:0;color:#111;background:#f0eff5;print-color-adjust:exact;-webkit-print-color-adjust:exact}
  .page{max-width:900px;margin:0 auto;padding:36px 32px}
  .header{background:linear-gradient(135deg,#14111C 0%,#2a1a1a 100%);border-radius:16px;padding:28px 32px;margin-bottom:28px;display:flex;justify-content:space-between;align-items:center}
  .header h1{color:white;margin:0;font-size:22px;font-weight:800;letter-spacing:-0.5px}
  .header-meta{text-align:right}
  .header-meta .period{color:#fb0f05;font-weight:800;font-size:14px}
  .header-meta .date{color:rgba(255,255,255,.5);font-size:11px;margin-top:4px}
  .print-btn{background:#fb0f05;color:white;border:none;padding:8px 18px;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;margin-top:10px}
  h2{font-size:11px;color:#8E879B;margin:24px 0 10px;text-transform:uppercase;letter-spacing:.08em;font-weight:700}
  .metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:0}
  .metrics-sm{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
  .metric{background:white;border-radius:12px;padding:14px 18px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
  .metric-value{font-size:22px;font-weight:800;background:linear-gradient(135deg,#fb0f05,#0027fe);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
  .metric-value.alert{background:none;-webkit-text-fill-color:#ef4444;color:#ef4444}
  .metric-label{font-size:10px;color:#8E879B;text-transform:uppercase;letter-spacing:.06em;margin-top:3px}
  .metric-sub{font-size:11px;color:#b0abc0;margin-top:2px}
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .card{background:white;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06)}
  .card-title{padding:12px 16px;border-bottom:1px solid #f0eeeb;font-size:11px;font-weight:700;color:#3a3548;text-transform:uppercase;letter-spacing:.06em}
  table{width:100%;border-collapse:collapse}
  th{background:#f8f7fb;padding:9px 14px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#8E879B;font-weight:700;border-bottom:1px solid #f0eeeb}
  td{padding:9px 14px;font-size:12px;border-bottom:1px solid #f8f7fb;color:#3a3548}
  tr:last-child td{border-bottom:none}
  tr:hover td{background:#fafafa}
  .badge{display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700}
  .pending{background:rgba(245,158,11,.12);color:#d97706}
  .confirmed{background:rgba(16,185,129,.12);color:#059669}
  .cancelled{background:rgba(239,68,68,.12);color:#dc2626}
  .completed{background:rgba(100,116,139,.12);color:#475569}
  .no_show{background:rgba(220,38,38,.1);color:#b91c1c}
  .bar-wrap{padding:12px 16px 16px}
  .bar-row{display:flex;align-items:center;gap:8px;margin-bottom:7px}
  .bar-label{font-size:11px;color:#8E879B;width:32px;text-align:right;flex-shrink:0}
  .bar-track{flex:1;background:#f0eff5;border-radius:4px;height:10px;overflow:hidden}
  .bar-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,#fb0f05,#0027fe)}
  .bar-val{font-size:11px;font-weight:700;color:#3a3548;width:48px;text-align:right;flex-shrink:0}
  .status-row{display:flex;gap:8px;flex-wrap:wrap;padding:14px 16px}
  .stat-pill{padding:5px 12px;border-radius:20px;font-size:11px;font-weight:700}
  .footer{margin-top:28px;text-align:center;font-size:11px;color:#b0abc0}
  @media print{.print-btn{display:none}.page{padding:0}}
</style></head>
<body>
<div class="page">

  <div class="header">
    <div>
      <h1>Reporte Zyncra</h1>
      <div style="color:rgba(255,255,255,.4);font-size:12px;margin-top:4px">Panel de gestión del negocio</div>
    </div>
    <div class="header-meta">
      <div class="period">${periodLabel}</div>
      <div class="date">Generado: ${generated}</div>
      <button class="print-btn" onclick="window.print()">Imprimir / PDF</button>
    </div>
  </div>

  <h2>Resumen del período</h2>
  <div class="metrics">
    <div class="metric"><div class="metric-value">${fmt(data.todayRevenue)}</div><div class="metric-label">Ingresos totales</div>${filter === "hoy" && data.prevDayRevenue > 0 ? `<div class="metric-sub">${data.todayRevenue >= data.prevDayRevenue ? "▲" : "▼"} ${fmt(Math.abs(data.todayRevenue - data.prevDayRevenue))} vs ayer</div>` : ""}</div>
    <div class="metric"><div class="metric-value">${data.todayCount}</div><div class="metric-label">Total de citas</div><div class="metric-sub">${data.occupancyRate.toFixed(0)}% ocupación</div></div>
    <div class="metric"><div class="metric-value">${fmt(data.avgTicket)}</div><div class="metric-label">Ticket promedio</div><div class="metric-sub">por servicio cobrado</div></div>
    <div class="metric"><div class="metric-value ${data.noShowRate > 15 ? "alert" : ""}">${data.noShowRate.toFixed(1)}%</div><div class="metric-label">Inasistencias</div><div class="metric-sub">${noShowCount} sin presentarse</div></div>
  </div>

  <h2 style="margin-top:14px">Indicadores adicionales</h2>
  <div class="metrics-sm">
    <div class="metric"><div class="metric-value">${data.pending}</div><div class="metric-label">Pendientes</div><div class="metric-sub">requieren acción</div></div>
    <div class="metric"><div class="metric-value">${data.returningPct.toFixed(0)}%</div><div class="metric-label">Clientes recurrentes</div></div>
    <div class="metric"><div class="metric-value">${data.newClientsToday}</div><div class="metric-label">Nuevos clientes</div></div>
    <div class="metric">
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:2px">
        <span class="badge confirmed">${confirmedCount} confirmadas</span>
        <span class="badge completed">${completedCount} completadas</span>
        <span class="badge cancelled">${cancelledCount} canceladas</span>
        <span class="badge no_show">${noShowCount} inasistencias</span>
      </div>
      <div class="metric-label" style="margin-top:6px">Estados de citas</div>
    </div>
  </div>

  <h2>Distribución por hora — hoy</h2>
  <div class="card">
    <div class="bar-wrap">
      ${data.hourlyData.map(h => `<div class="bar-row">
        <span class="bar-label">${h.hour.replace(":00","h")}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${(h.count/maxHour)*100}%"></div></div>
        <span class="bar-val">${h.count} cita${h.count !== 1 ? "s" : ""}</span>
      </div>`).join("")}
    </div>
  </div>

  <h2>Ingresos — últimos 7 días</h2>
  <div class="card">
    <div class="bar-wrap">
      ${data.weeklyRevenue.map(d => `<div class="bar-row">
        <span class="bar-label">${d.day}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${(d.revenue/maxDay)*100}%"></div></div>
        <span class="bar-val" style="width:90px">${fmt(d.revenue)}</span>
      </div>`).join("")}
    </div>
  </div>

  <div class="two-col" style="margin-top:20px">
    <div>
      <h2>Rendimiento del equipo</h2>
      <div class="card">
        <table>
          <tr><th>Colaborador</th><th>Citas</th><th>Ingresos</th><th>Ticket prom.</th></tr>
          ${data.staffPerf.map((s: any) => `<tr>
            <td style="font-weight:600">${s.name}</td>
            <td>${s.count}</td>
            <td style="color:#fb0f05;font-weight:700">${fmt(s.revenue)}</td>
            <td>${s.count > 0 ? fmt(s.revenue / s.count) : "—"}</td>
          </tr>`).join("")}
        </table>
      </div>
    </div>
    <div>
      <h2>Top servicios</h2>
      <div class="card">
        <table>
          <tr><th>Servicio</th><th>Citas</th><th>% del total</th></tr>
          ${data.topServices.map((s: any) => `<tr>
            <td style="font-weight:600">${s.name}</td>
            <td>${s.count}</td>
            <td>${data.todayCount > 0 ? ((s.count/data.todayCount)*100).toFixed(0) + "%" : "—"}</td>
          </tr>`).join("")}
        </table>
      </div>
    </div>
  </div>

  <h2>Detalle de citas</h2>
  <div class="card">
    <table>
      <tr><th>Fecha</th><th>Hora</th><th>Cliente</th><th>Servicio</th><th>Valor</th><th>Colaborador</th><th>Estado</th></tr>
      ${data.upcomingApts.map((a: any) => `<tr>
        <td>${a.appointment_date ?? "—"}</td>
        <td style="font-weight:700;color:#fb0f05">${a.appointment_time?.slice(0,5) ?? "—"}</td>
        <td style="font-weight:600">${a.clients?.name ?? "—"}</td>
        <td>${a.services?.name ?? "—"}</td>
        <td style="font-weight:700">${a.services?.price ? fmt(Number(a.services.price)) : "—"}</td>
        <td>${a.professionals?.name ?? "Sin asignar"}</td>
        <td><span class="badge ${a.status}">${statusLabel[a.status as string] ?? a.status}</span></td>
      </tr>`).join("")}
    </table>
  </div>

  <div class="footer">Reporte generado por Zyncra &nbsp;·&nbsp; ${generated}</div>
</div>
</body></html>`;
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
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

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
            <FilterBtn key={f} active={filter === f} onClick={() => { setFilter(f); setShowRangePicker(false); fetchAll(tenantId!, f); }}>
              {f === "hoy" ? "Hoy" : f === "semana" ? "7 días" : "30 días"}
            </FilterBtn>
          ))}

          {/* Rango personalizado — botón + popup */}
          <div ref={rangePickerRef} style={{ position: "relative" }}>
            <FilterBtn active={filter === "custom"} onClick={() => { setFilter("custom"); setShowRangePicker(s => !s); }}>
              {customStart && customEnd ? `${customStart.slice(5)} → ${customEnd.slice(5)}` : "Rango"}
            </FilterBtn>
            {showRangePicker && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 200 }}>
                <DateRangePicker
                  start={customStart}
                  end={customEnd}
                  onApply={(s, e) => {
                    setCustomStart(s); setCustomEnd(e);
                    fetchAll(tenantId!, "custom", s, e);
                    setShowRangePicker(false);
                  }}
                />
              </div>
            )}
          </div>

          <button onClick={() => fetchAll(tenantId!, filter, customStart, customEnd)}
            style={{ width: "34px", height: "34px", borderRadius: "9px", border: "1.5px solid #e8e6e2", background: "white", color: "#564E66", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconRefresh size={15} />
          </button>
          <button onClick={downloadHTML}
            style={{ height: "34px", padding: "0 14px", borderRadius: "9px", border: "1.5px solid #e8e6e2", background: "white", color: "#564E66", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif" }}>
            ⬇ HTML
          </button>
        </div>
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
          sub="últimos 7 días"
          alert={data.noShowRate > 15}
          trend={data.noShowRate > 10 ? "down" : "up"}
          trendVal={data.noShowRate > 15 ? "Alto — activa depósitos" : "Bajo control"}
        />
      </div>

      {/* ─── Secondary Metrics ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "14px" }}>
        <MetricCard icon={<IconCreditCard size={18} />} iconColor="#fb0f05" label="Ticket promedio" value={fmt(data.avgTicket)} sub="por servicio" />
        <MetricCard icon={<IconRefresh size={18} />} iconColor="#fb0f05" label="Clientes recurrentes" value={`${data.returningPct.toFixed(0)}%`} sub="de la semana" trend={data.returningPct > 50 ? "up" : "neutral"} />
        <MetricCard icon={<IconUsers size={18} />} iconColor="#10b981" label="Nuevos hoy" value={String(data.newClientsToday)} sub="registrados hoy" />
        <MetricCard icon={<IconChartBar size={18} />} iconColor="#fb0f05" label="Ocupación del día" value={`${data.occupancyRate.toFixed(0)}%`} sub="slots usados" trend={data.occupancyRate > 70 ? "up" : "neutral"} />
      </div>

      {/* ─── Charts Row ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
        <div style={{ background: "white", borderRadius: "18px", border: "1px solid #e8e6e2", overflow: "hidden" }}>
          <SectionHeader title="Ingresos — 7 días" icon={<IconBanknotes size={16} />} />
          <div style={{ padding: "16px 20px 20px" }}>
            <BarChart data={data.weeklyRevenue.map(d => ({ label: d.day, value: d.revenue }))} />
          </div>
        </div>

        <div style={{ background: "white", borderRadius: "18px", border: "1px solid #e8e6e2", overflow: "hidden" }}>
          <SectionHeader title="Citas por hora — hoy" icon={<IconClock size={16} />} />
          <div style={{ padding: "16px 20px 20px" }}>
            <BarChart data={data.hourlyData.map(h => ({
              label: h.hour.replace(":00", "h"),
              value: h.count,
              color: "linear-gradient(to top, #10b981, #6ee7b7)",
            }))} />
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
