"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./admin.module.css";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "./admin-context";
import {
  IconBanknotes, IconCalendar, IconBell, IconUsers, IconChartBar,
  IconCreditCard, IconTrendUp, IconTrendDown, IconClock, IconPercent,
  IconRefresh, IconPlus, IconZap, IconChat,
} from "./ZyncraIcons";

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
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: s.bg, color: s.color }}>
      {s.label}
    </span>
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
    const todayStr = now.toISOString().split("T")[0];
    const prevDate = new Date(now); prevDate.setDate(prevDate.getDate() - 1);
    const prevStr = prevDate.toISOString().split("T")[0];
    let rangeStart = new Date(now);
    let rangeEndStr = todayStr;
    if (f === "semana") rangeStart.setDate(now.getDate() - 6);
    else if (f === "mes") rangeStart.setDate(now.getDate() - 29);
    else if (f === "custom" && cStart && cEnd) { rangeStart = new Date(cStart + "T00:00:00"); rangeEndStr = cEnd; }
    else rangeStart.setDate(now.getDate() - 6);
    const weekStart = rangeStart;
    const weekStartStr = weekStart.toISOString().split("T")[0];

    const { data: weekApts } = await supabase
      .from("appointments")
      .select("id, appointment_date, appointment_time, status, client_id, clients(name, no_shows), services(name, price), professionals(name)")
      .eq("tenant_id", tid)
      .gte("appointment_date", weekStartStr)
      .lte("appointment_date", rangeEndStr)
      .order("appointment_date").order("appointment_time");

    const apts = (weekApts || []) as any[];
    const todayApts = apts.filter(a => f === "custom" ? true : a.appointment_date === todayStr);
    const prevApts = apts.filter(a => f === "custom" ? false : a.appointment_date === prevStr);
    const calcRevenue = (list: any[]) => list.filter(a => a.status !== "cancelled").reduce((s, a) => s + Number(a.services?.price || 0), 0);
    const todayRevenue = calcRevenue(todayApts);
    const prevDayRevenue = calcRevenue(prevApts);
    const todayCount = todayApts.length;
    const pending = todayApts.filter(a => a.status === "pending").length;
    const noShows = apts.filter(a => a.clients?.no_shows > 0).length;
    const noShowRate = apts.length > 0 ? (noShows / apts.length) * 100 : 0;
    const paid = apts.filter(a => a.status !== "cancelled" && a.services?.price);
    const avgTicket = paid.length > 0 ? paid.reduce((s, a) => s + Number(a.services.price), 0) / paid.length : 0;
    const upcomingApts = todayApts.filter(a => a.status !== "cancelled").sort((a, b) => a.appointment_time.localeCompare(b.appointment_time)).slice(0, 8);
    const staffMap: Record<string, { count: number; revenue: number }> = {};
    apts.forEach(a => {
      const name = a.professionals?.name || "Sin asignar";
      if (!staffMap[name]) staffMap[name] = { count: 0, revenue: 0 };
      staffMap[name].count++;
      staffMap[name].revenue += Number(a.services?.price || 0);
    });
    const staffPerf = Object.entries(staffMap).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue);
    const svcMap: Record<string, number> = {};
    apts.forEach(a => { const name = a.services?.name || "Sin servicio"; svcMap[name] = (svcMap[name] || 0) + 1; });
    const topServices = Object.entries(svcMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5);
    const hours = ["09", "10", "11", "12", "13", "14", "15", "16", "17", "18"];
    const hourlyData = hours.map(h => ({ hour: `${h}:00`, count: todayApts.filter(a => a.appointment_time?.startsWith(h)).length }));
    const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const weeklyRevenue = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
      const ds = d.toISOString().split("T")[0];
      const rev = apts.filter(a => a.appointment_date === ds && a.status !== "cancelled").reduce((s, a) => s + Number(a.services?.price || 0), 0);
      return { day: dayNames[d.getDay() === 0 ? 6 : d.getDay() - 1], revenue: rev };
    });
    const { count: newClientsToday } = await supabase.from("clients").select("id", { count: "exact", head: true }).eq("tenant_id", tid).gte("created_at", todayStr);
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

  const revDiff = data.todayRevenue - data.prevDayRevenue;
  const revTrend = revDiff > 0 ? "up" : revDiff < 0 ? "down" : "neutral";
  const fmt = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

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
          {(["hoy", "semana", "mes", "custom"] as const).map(f => (
            <FilterBtn key={f} active={filter === f} onClick={() => { setFilter(f); if (f !== "custom") fetchAll(tenantId!, f); }}>
              {f === "hoy" ? "Hoy" : f === "semana" ? "7 días" : f === "mes" ? "30 días" : "Rango"}
            </FilterBtn>
          ))}
          {filter === "custom" && (
            <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ ...inputSt, width: "auto", padding: "6px 10px", fontSize: "12px" }} />
              <span style={{ color: "#8E879B", fontSize: "12px" }}>—</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ ...inputSt, width: "auto", padding: "6px 10px", fontSize: "12px" }} />
              <button onClick={() => fetchAll(tenantId!, "custom", customStart, customEnd)} disabled={!customStart || !customEnd}
                style={{ padding: "7px 14px", borderRadius: "9px", border: "none", background: (!customStart || !customEnd) ? "rgba(20,15,30,0.08)" : "#fb0f05", color: "#fff", cursor: (!customStart || !customEnd) ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: 600 }}>
                Buscar
              </button>
            </div>
          )}
          <button onClick={() => fetchAll(tenantId!, filter, customStart, customEnd)}
            style={{ width: "34px", height: "34px", borderRadius: "9px", border: "1.5px solid #e8e6e2", background: "white", color: "#564E66", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IconRefresh size={15} />
          </button>
        </div>
      </div>

      {/* ─── Primary Metrics ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "14px" }}>
        <MetricCard
          icon={<IconBanknotes size={20} />} iconColor="#fb0f05"
          label="Ingresos de hoy"
          value={fmt(data.todayRevenue)}
          trendVal={`${Math.abs(revDiff) > 0 ? fmt(Math.abs(revDiff)) : "igual"} vs ayer`}
          trend={revTrend}
          spark={data.weeklyRevenue.map(d => d.revenue)}
        />
        <MetricCard
          icon={<IconCalendar size={20} />} iconColor="#fb0f05"
          label="Citas hoy"
          value={String(data.todayCount)}
          sub={`${data.occupancyRate.toFixed(0)}% ocupación`}
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
          label="No-shows"
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

        {/* Citas de Hoy */}
        <div style={{ background: "white", borderRadius: "18px", border: "1px solid #e8e6e2", overflow: "hidden" }}>
          <SectionHeader title="Citas de hoy" sub={`${data.todayCount} agendadas`} icon={<IconCalendar size={16} />} />
          <div>
            {data.upcomingApts.length === 0 ? (
              <div style={{ padding: "36px 20px", textAlign: "center", color: "#8E879B", fontSize: "14px" }}>
                Sin citas para hoy.
              </div>
            ) : (
              data.upcomingApts.map((apt, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: i < data.upcomingApts.length - 1 ? "1px solid #f0eeeb" : "none" }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    {/* Time badge */}
                    <div style={{ background: "rgba(251,15,5,0.07)", borderRadius: "9px", padding: "6px 10px", minWidth: "52px", textAlign: "center" }}>
                      <div style={{ fontWeight: 800, fontSize: "12px", color: "#fb0f05", lineHeight: 1 }}>{apt.appointment_time}</div>
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
      {showNewAppt && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(17,17,24,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={e => { if (e.target === e.currentTarget) setShowNewAppt(false); }}>
          <div style={{ background: "white", borderRadius: "22px", padding: "28px", width: "100%", maxWidth: "480px", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "22px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05" }}>
                <IconPlus size={18} />
              </div>
              <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#14111C" }}>Nueva Cita Manual</h2>
            </div>
            <form onSubmit={handleCreateAppt}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: "12px", color: "#564E66", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Cliente *</label>
                <select required value={apptForm.client_id} onChange={e => setApptForm({ ...apptForm, client_id: e.target.value })} style={inputSt}>
                  <option value="">— Seleccionar cliente —</option>
                  {apptClients.map(c => <option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontWeight: 600, fontSize: "12px", color: "#564E66", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Servicio</label>
                  <select value={apptForm.service_id} onChange={e => setApptForm({ ...apptForm, service_id: e.target.value })} style={inputSt}>
                    <option value="">— Cualquiera —</option>
                    {apptServices.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: 600, fontSize: "12px", color: "#564E66", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Profesional</label>
                  <select value={apptForm.professional_id} onChange={e => setApptForm({ ...apptForm, professional_id: e.target.value })} style={inputSt}>
                    <option value="">— Cualquiera —</option>
                    {apptProfs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "22px" }}>
                <div>
                  <label style={{ display: "block", fontWeight: 600, fontSize: "12px", color: "#564E66", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Fecha *</label>
                  <input required type="date" value={apptForm.date} onChange={e => setApptForm({ ...apptForm, date: e.target.value })} style={inputSt} />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: 600, fontSize: "12px", color: "#564E66", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Hora *</label>
                  <input required type="time" value={apptForm.time} onChange={e => setApptForm({ ...apptForm, time: e.target.value })} style={inputSt} />
                </div>
              </div>
              {apptMsg && <p style={{ fontSize: "13px", marginBottom: "12px", color: apptMsg.startsWith("Error") ? "#ef4444" : "#10b981", fontWeight: 600 }}>{apptMsg}</p>}
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowNewAppt(false)} disabled={apptSaving}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={apptSaving}>{apptSaving ? "Guardando..." : "Confirmar Cita"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
