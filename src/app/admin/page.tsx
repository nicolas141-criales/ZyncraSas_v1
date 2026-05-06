"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./admin.module.css";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "./admin-context";

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

// ─── Mini sparkline (SVG) ──────────────────────────────────
function Sparkline({ data, color = "#6366f1" }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 80, h = 32;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} style={{ opacity: 0.8 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Bar chart ────────────────────────────────────────────
function BarChart({ data }: { data: { label: string; value: number; color?: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "80px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <div style={{
            width: "100%", borderRadius: "4px 4px 0 0",
            height: `${Math.max((d.value / max) * 70, 4)}px`,
            background: d.color || "linear-gradient(to top, #6366f1, #a78bfa)",
            transition: "height 0.5s ease",
          }} />
          <span style={{ fontSize: "9px", color: "var(--text-secondary)", textAlign: "center" }}>{d.label}</span>
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
  icon: string;
  trend?: "up" | "down" | "neutral";
  trendVal?: string;
  alert?: boolean;
  spark?: number[];
  sparkColor?: string;
}
function MetricCard({ label, value, sub, icon, trend, trendVal, alert, spark, sparkColor }: MetricCardProps) {
  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: "20px",
      padding: "20px 22px",
      boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
      border: alert ? "1px solid rgba(239,68,68,0.35)" : "1px solid var(--border-light)",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      position: "relative",
      overflow: "hidden",
    }}>
      {alert && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg, #ef4444, #f97316)" }} />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: "22px" }}>{icon}</div>
        {spark && <Sparkline data={spark} color={sparkColor} />}
      </div>
      <div style={{ fontSize: "28px", fontWeight: 800, color: alert ? "var(--error)" : "var(--text-primary)", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      {(trendVal || sub) && (
        <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "12px", marginTop: "2px" }}>
          {trendVal && trend && (
            <span style={{ color: trend === "up" ? "var(--success)" : trend === "down" ? "var(--error)" : "var(--text-secondary)", fontWeight: 700 }}>
              {trend === "up" ? "▲" : trend === "down" ? "▼" : "─"} {trendVal}
            </span>
          )}
          {sub && <span style={{ color: "var(--text-secondary)" }}>{sub}</span>}
        </div>
      )}
    </div>
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
  // Quick action modals
  const [showNewAppt, setShowNewAppt] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const [showWA, setShowWA] = useState(false);
  // New appt form
  const [apptClients, setApptClients] = useState<any[]>([]);
  const [apptServices, setApptServices] = useState<any[]>([]);
  const [apptProfs, setApptProfs] = useState<any[]>([]);
  const [apptForm, setApptForm] = useState({ client_id:"", service_id:"", professional_id:"", date:"", time:"" });
  const [apptSaving, setApptSaving] = useState(false);
  const [apptMsg, setApptMsg] = useState("");
  // Block form
  const [blockForm, setBlockForm] = useState({ date:"", start:"", end:"", reason:"" });
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
    else if (f === "custom" && cStart && cEnd) {
      rangeStart = new Date(cStart + "T00:00:00");
      rangeEndStr = cEnd;
    }
    else rangeStart.setDate(now.getDate() - 6); // always pull 7 days for charts if "hoy"

    const weekStart = rangeStart;
    const weekStartStr = weekStart.toISOString().split("T")[0];

    // Fetch ALL appointments in the range
    const { data: weekApts } = await supabase
      .from("appointments")
      .select("id, appointment_date, appointment_time, status, client_id, clients(name, no_shows), services(name, price), professionals(name)")
      .eq("tenant_id", tid)
      .gte("appointment_date", weekStartStr)
      .lte("appointment_date", rangeEndStr)
      .order("appointment_date")
      .order("appointment_time");

    const apts = (weekApts || []) as any[];
    const todayApts = apts.filter(a => f === "custom" ? true : a.appointment_date === todayStr);
    const prevApts = apts.filter(a => f === "custom" ? false : a.appointment_date === prevStr);

    // Revenue
    const calcRevenue = (list: any[]) =>
      list.filter(a => a.status !== "cancelled").reduce((s, a) => s + Number(a.services?.price || 0), 0);

    const todayRevenue = calcRevenue(todayApts);
    const prevDayRevenue = calcRevenue(prevApts);
    const todayCount = todayApts.length;
    const pending = todayApts.filter(a => a.status === "pending").length;

    // No-show rate from clients
    const noShows = apts.filter(a => a.clients?.no_shows > 0).length;
    const noShowRate = apts.length > 0 ? (noShows / apts.length) * 100 : 0;

    // Avg ticket
    const paid = apts.filter(a => a.status !== "cancelled" && a.services?.price);
    const avgTicket = paid.length > 0 ? paid.reduce((s, a) => s + Number(a.services.price), 0) / paid.length : 0;

    // Upcoming appointments (today, future)
    const upcomingApts = todayApts
      .filter(a => a.status !== "cancelled")
      .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
      .slice(0, 8);

    // Staff performance
    const staffMap: Record<string, { count: number; revenue: number }> = {};
    apts.forEach(a => {
      const name = a.professionals?.name || "Sin asignar";
      if (!staffMap[name]) staffMap[name] = { count: 0, revenue: 0 };
      staffMap[name].count++;
      staffMap[name].revenue += Number(a.services?.price || 0);
    });
    const staffPerf = Object.entries(staffMap)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue);

    // Top services
    const svcMap: Record<string, number> = {};
    apts.forEach(a => {
      const name = a.services?.name || "Sin servicio";
      svcMap[name] = (svcMap[name] || 0) + 1;
    });
    const topServices = Object.entries(svcMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Hourly distribution (today)
    const hours = ["09", "10", "11", "12", "13", "14", "15", "16", "17", "18"];
    const hourlyData = hours.map(h => ({
      hour: `${h}:00`,
      count: todayApts.filter(a => a.appointment_time?.startsWith(h)).length,
    }));

    // Weekly revenue
    const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
    const weeklyRevenue = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const ds = d.toISOString().split("T")[0];
      const rev = apts.filter(a => a.appointment_date === ds && a.status !== "cancelled")
        .reduce((s, a) => s + Number(a.services?.price || 0), 0);
      return { day: dayNames[d.getDay() === 0 ? 6 : d.getDay() - 1], revenue: rev };
    });

    // New clients today
    const { count: newClientsToday } = await supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tid)
      .gte("created_at", todayStr);

    // Returning clients (>1 appointment)
    const uniqueClients = new Set(apts.map(a => a.client_id)).size;
    const multiVisit = apts.filter((a, _, arr) =>
      arr.filter(b => b.client_id === a.client_id).length > 1
    );
    const returningPct = uniqueClients > 0 ? (new Set(multiVisit.map(a => a.client_id)).size / uniqueClients) * 100 : 0;

    // Occupancy: 10 slots/day, 10h window
    const occupancyRate = Math.min((todayCount / 10) * 100, 100);

    setData({
      todayRevenue, prevDayRevenue, todayCount, pending, noShowRate,
      avgTicket, returningPct, newClientsToday: newClientsToday || 0,
      occupancyRate, upcomingApts, staffPerf, topServices, hourlyData, weeklyRevenue,
    });
    setLoading(false);
  }, []);

  // Load CRM data for new appointment modal
  const openNewAppt = useCallback(async () => {
    if (!tenantId) return;
    const [{ data: cls }, { data: svs }, { data: prs }] = await Promise.all([
      supabase.from("clients").select("id,name,phone").eq("tenant_id", tenantId).order("name"),
      supabase.from("services").select("id,name,price").eq("tenant_id", tenantId).order("name"),
      supabase.from("professionals").select("id,name").eq("tenant_id", tenantId).eq("is_active", true).order("name"),
    ]);
    setApptClients(cls || []);
    setApptServices(svs || []);
    setApptProfs(prs || []);
    setApptForm({ client_id:"", service_id:"", professional_id:"", date:"", time:"" });
    setApptMsg("");
    setShowNewAppt(true);
  }, [tenantId]);

  const handleCreateAppt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setApptSaving(true);
    const { error } = await supabase.from("appointments").insert({
      tenant_id: tenantId,
      client_id: apptForm.client_id,
      service_id: apptForm.service_id || null,
      professional_id: apptForm.professional_id || null,
      appointment_date: apptForm.date,
      appointment_time: apptForm.time,
      status: "confirmed",
    });
    setApptSaving(false);
    if (error) { setApptMsg("❌ " + error.message); }
    else { setApptMsg("✅ Cita creada"); setTimeout(() => { setShowNewAppt(false); fetchAll(tenantId, filter); }, 1200); }
  };

  const handleBlockSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setBlockSaving(true);
    const { error } = await supabase.from("blocked_slots").insert({
      tenant_id: tenantId,
      blocked_date: blockForm.date,
      start_time: blockForm.start,
      end_time: blockForm.end,
      reason: blockForm.reason || null,
    });
    setBlockSaving(false);
    if (error) setBlockMsg("❌ " + error.message);
    else { setBlockMsg("✅ Horario bloqueado"); setTimeout(() => setShowBlock(false), 1200); }
  };

  useEffect(() => {
    if (tenantId) fetchAll(tenantId, filter);
  }, [tenantId, filter, fetchAll]);

  const revDiff = data.todayRevenue - data.prevDayRevenue;
  const revTrend = revDiff > 0 ? "up" : revDiff < 0 ? "down" : "neutral";
  const fmt = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: "16px" }}>
        <div style={{ width: "44px", height: "44px", border: "4px solid var(--border-light)", borderTopColor: "var(--accent-blue)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Cargando panel...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ─── Header ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>Panel de Control</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
            {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Date Filters */}
          {(["hoy", "semana", "mes", "custom"] as const).map(f => (
            <button key={f} onClick={() => {
              setFilter(f);
              if (f !== "custom") fetchAll(tenantId!, f);
            }} style={{
              padding: "7px 16px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
              border: filter === f ? "1px solid var(--accent-blue)" : "1px solid var(--border-light)",
              background: filter === f ? "rgba(99,102,241,0.15)" : "var(--surface)",
              color: filter === f ? "var(--accent-blue)" : "var(--text-secondary)",
              transition: "all 0.2s",
            }}>
              {f === "hoy" ? "Hoy" : f === "semana" ? "7 días" : f === "mes" ? "30 días" : "Personalizado"}
            </button>
          ))}
          {filter === "custom" && (
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid var(--border-light)", background: "var(--bg-base)", color: "var(--text-primary)", fontSize: "12px" }} />
              <span style={{ color: "var(--text-secondary)" }}>-</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid var(--border-light)", background: "var(--bg-base)", color: "var(--text-primary)", fontSize: "12px" }} />
              <button onClick={() => fetchAll(tenantId!, "custom", customStart, customEnd)} disabled={!customStart || !customEnd} style={{ padding: "7px 14px", borderRadius: "8px", border: "none", background: (!customStart || !customEnd) ? "var(--border-light)" : "var(--accent-blue)", color: "#fff", cursor: (!customStart || !customEnd) ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: 600 }}>
                Buscar
              </button>
            </div>
          )}
          <button onClick={() => fetchAll(tenantId!, filter, customStart, customEnd)} style={{ padding: "7px 14px", borderRadius: "10px", border: "1px solid var(--border-light)", background: "var(--surface)", color: "var(--text-primary)", cursor: "pointer", fontSize: "13px" }}>
            ↻
          </button>
        </div>
      </div>

      {/* ─── Primary Metrics (4 cards) ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        <MetricCard
          icon="💰"
          label="Ingresos de Hoy"
          value={fmt(data.todayRevenue)}
          trendVal={`${Math.abs(revDiff) > 0 ? fmt(Math.abs(revDiff)) : "igual"} vs ayer`}
          trend={revTrend}
          spark={data.weeklyRevenue.map(d => d.revenue)}
          sparkColor="#6366f1"
        />
        <MetricCard
          icon="📅"
          label="Citas Hoy"
          value={String(data.todayCount)}
          sub={`${data.occupancyRate.toFixed(0)}% ocupación`}
          trend={data.todayCount >= 5 ? "up" : "neutral"}
          trendVal={data.todayCount >= 5 ? "buen ritmo" : undefined}
          spark={data.hourlyData.map(h => h.count)}
          sparkColor="#10b981"
        />
        <MetricCard
          icon="⏳"
          label="Pendientes de Confirmar"
          value={String(data.pending)}
          sub="requieren acción"
          alert={data.pending > 3}
          trend={data.pending > 0 ? "down" : "neutral"}
          trendVal={data.pending > 3 ? "¡Atención!" : undefined}
        />
        <MetricCard
          icon="🚫"
          label="Tasa de Inasistencia"
          value={`${data.noShowRate.toFixed(1)}%`}
          sub="en los últimos 7 días"
          alert={data.noShowRate > 15}
          trend={data.noShowRate > 10 ? "down" : "up"}
          trendVal={data.noShowRate > 15 ? "Alta — activa depósitos" : "Bajo control"}
        />
      </div>

      {/* ─── Secondary Metrics (4 cards) ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px" }}>
        <MetricCard icon="🧾" label="Ticket Promedio" value={fmt(data.avgTicket)} sub="por servicio" trend="neutral" />
        <MetricCard icon="🔁" label="Clientes Recurrentes" value={`${data.returningPct.toFixed(0)}%`} sub="de la semana" trend={data.returningPct > 50 ? "up" : "neutral"} />
        <MetricCard icon="🆕" label="Nuevos Clientes Hoy" value={String(data.newClientsToday)} sub="registrados hoy" />
        <MetricCard icon="📊" label="Ocupación del Día" value={`${data.occupancyRate.toFixed(0)}%`} sub="de slots usados" trend={data.occupancyRate > 70 ? "up" : "neutral"} />
      </div>

      {/* ─── Charts + Top Services ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>
        {/* Revenue weekly trend */}
        <div className={styles.listCard} style={{ padding: "22px" }}>
          <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "16px" }}>📈 Ingresos (7 días)</div>
          <BarChart data={data.weeklyRevenue.map(d => ({ label: d.day, value: d.revenue }))} />
        </div>

        {/* Hourly bar chart */}
        <div className={styles.listCard} style={{ padding: "22px" }}>
          <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "16px" }}>⏰ Citas por Hora (Hoy)</div>
          <BarChart data={data.hourlyData.map(h => ({
            label: h.hour.replace(":00", "h"),
            value: h.count,
            color: "linear-gradient(to top, #10b981, #6ee7b7)",
          }))} />
        </div>

        {/* Top services */}
        <div className={styles.listCard} style={{ padding: "22px" }}>
          <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "16px" }}>✂️ Top Servicios (7 días)</div>
          {data.topServices.length === 0 ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Sin datos aún.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {data.topServices.map((s, i) => {
                const maxCount = data.topServices[0].count;
                return (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "130px" }}>{s.name}</span>
                      <span style={{ color: "var(--text-secondary)" }}>{s.count} citas</span>
                    </div>
                    <div style={{ height: "6px", borderRadius: "3px", background: "var(--border-light)", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", width: `${(s.count / maxCount) * 100}%`,
                        background: `linear-gradient(90deg, #6366f1, #a78bfa)`,
                        borderRadius: "3px", transition: "width 0.6s ease",
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Upcoming Appointments + Staff Performance ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "20px" }}>

        {/* Upcoming Appointments */}
        <div className={styles.listCard} style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 700, fontSize: "14px" }}>📋 Citas de Hoy</span>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{data.todayCount} agendadas</span>
          </div>
          <div>
            {data.upcomingApts.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)", fontSize: "14px" }}>
                Sin citas para hoy. 🎉
              </div>
            ) : (
              data.upcomingApts.map((apt, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 22px", borderBottom: "1px solid var(--border-light)" }}>
                  <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                    <div style={{ fontWeight: 800, fontSize: "13px", color: "var(--accent-blue)", minWidth: "54px" }}>{apt.appointment_time}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "14px" }}>{apt.clients?.name || "—"}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        {apt.services?.name || "—"} · {apt.professionals?.name || "Cualquiera"}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700,
                    background: apt.status === "confirmed" ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                    color: apt.status === "confirmed" ? "var(--success)" : "var(--warning)",
                  }}>
                    {apt.status === "confirmed" ? "Confirmada" : "Pendiente"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Staff Performance */}
        <div className={styles.listCard} style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border-light)" }}>
            <span style={{ fontWeight: 700, fontSize: "14px" }}>🧑‍💼 Rendimiento del Equipo</span>
          </div>
          {data.staffPerf.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)", fontSize: "14px" }}>
              Sin datos aún.
            </div>
          ) : (
            data.staffPerf.map((s, i) => (
              <div key={i} style={{ padding: "12px 22px", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <div style={{
                    width: "34px", height: "34px", borderRadius: "50%",
                    background: "linear-gradient(135deg, #6366f1, #a78bfa)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 700, fontSize: "12px", flexShrink: 0,
                  }}>
                    {s.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "13px" }}>{s.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{s.count} citas esta semana</div>
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--accent-blue)" }}>{fmt(s.revenue)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Quick Actions ─── */}
      <div className={styles.listCard} style={{ padding: "22px" }}>
        <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "16px" }}>⚡ Acciones Rápidas</div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {[
            { icon: "➕", label: "Nueva Cita", color: "#6366f1", onClick: openNewAppt },
            { icon: "🚫", label: "Bloquear Horario", color: "#64748b", onClick: () => { setBlockMsg(""); setBlockForm({ date:"",start:"",end:"",reason:"" }); setShowBlock(true); } },
            { icon: "💬", label: "Recordatorio WhatsApp", color: "#25D366", onClick: () => setShowWA(true) },
            { icon: "👤", label: "Nuevo Cliente", color: "#f59e0b", onClick: () => window.location.href = "/admin/clients" },
          ].map((a, i) => (
            <button key={i} onClick={a.onClick} style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "10px 18px", borderRadius: "12px",
              border: `1px solid ${a.color}40`, background: `${a.color}12`,
              color: "var(--text-primary)", cursor: "pointer", fontSize: "13px", fontWeight: 600,
            }}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Modal: Nueva Cita ─── */}
      {showNewAppt && (
        <div style={{ position:"fixed",inset:0,zIndex:300,background:"rgba(10,13,26,0.7)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px" }}
          onClick={e => { if(e.target===e.currentTarget) setShowNewAppt(false); }}>
          <div style={{ background:"var(--surface)",borderRadius:"20px",padding:"28px",width:"100%",maxWidth:"480px",boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
            <h2 style={{ fontSize:"18px",fontWeight:800,marginBottom:"20px" }}>➕ Nueva Cita Manual</h2>
            <form onSubmit={handleCreateAppt}>
              <div style={{ marginBottom:"14px" }}>
                <label style={{ display:"block",fontWeight:600,fontSize:"13px",marginBottom:"6px" }}>Cliente (CRM) *</label>
                <select required value={apptForm.client_id} onChange={e=>setApptForm({...apptForm,client_id:e.target.value})}
                  style={{ width:"100%",padding:"10px 12px",border:"1px solid var(--border-light)",borderRadius:"10px",background:"var(--bg-base)",color:"var(--text-primary)",fontSize:"14px" }}>
                  <option value="">— Seleccionar cliente —</option>
                  {apptClients.map(c=><option key={c.id} value={c.id}>{c.name} · {c.phone}</option>)}
                </select>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"14px" }}>
                <div>
                  <label style={{ display:"block",fontWeight:600,fontSize:"13px",marginBottom:"6px" }}>Servicio</label>
                  <select value={apptForm.service_id} onChange={e=>setApptForm({...apptForm,service_id:e.target.value})}
                    style={{ width:"100%",padding:"10px 12px",border:"1px solid var(--border-light)",borderRadius:"10px",background:"var(--bg-base)",color:"var(--text-primary)",fontSize:"14px" }}>
                    <option value="">— Cualquiera —</option>
                    {apptServices.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:"block",fontWeight:600,fontSize:"13px",marginBottom:"6px" }}>Profesional</label>
                  <select value={apptForm.professional_id} onChange={e=>setApptForm({...apptForm,professional_id:e.target.value})}
                    style={{ width:"100%",padding:"10px 12px",border:"1px solid var(--border-light)",borderRadius:"10px",background:"var(--bg-base)",color:"var(--text-primary)",fontSize:"14px" }}>
                    <option value="">— Cualquiera —</option>
                    {apptProfs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"20px" }}>
                <div>
                  <label style={{ display:"block",fontWeight:600,fontSize:"13px",marginBottom:"6px" }}>Fecha *</label>
                  <input required type="date" value={apptForm.date} onChange={e=>setApptForm({...apptForm,date:e.target.value})}
                    style={{ width:"100%",padding:"10px 12px",border:"1px solid var(--border-light)",borderRadius:"10px",background:"var(--bg-base)",color:"var(--text-primary)",fontSize:"14px",boxSizing:"border-box" }} />
                </div>
                <div>
                  <label style={{ display:"block",fontWeight:600,fontSize:"13px",marginBottom:"6px" }}>Hora *</label>
                  <input required type="time" value={apptForm.time} onChange={e=>setApptForm({...apptForm,time:e.target.value})}
                    style={{ width:"100%",padding:"10px 12px",border:"1px solid var(--border-light)",borderRadius:"10px",background:"var(--bg-base)",color:"var(--text-primary)",fontSize:"14px",boxSizing:"border-box" }} />
                </div>
              </div>
              {apptMsg && <p style={{ fontSize:"13px",marginBottom:"12px",color:apptMsg.startsWith("✅")?"var(--success)":"var(--error)" }}>{apptMsg}</p>}
              <div style={{ display:"flex",gap:"10px",justifyContent:"flex-end" }}>
                <button type="button" className="btn-secondary" onClick={()=>setShowNewAppt(false)} disabled={apptSaving}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={apptSaving}>{apptSaving?"Guardando...":"Confirmar Cita"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal: Bloquear Horario ─── */}
      {showBlock && (
        <div style={{ position:"fixed",inset:0,zIndex:300,background:"rgba(10,13,26,0.7)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px" }}
          onClick={e => { if(e.target===e.currentTarget) setShowBlock(false); }}>
          <div style={{ background:"var(--surface)",borderRadius:"20px",padding:"28px",width:"100%",maxWidth:"420px",boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
            <h2 style={{ fontSize:"18px",fontWeight:800,marginBottom:"20px" }}>🚫 Bloquear Horario</h2>
            <p style={{ color:"var(--text-secondary)",fontSize:"13px",marginBottom:"20px" }}>El rango bloqueado no estará disponible para reservas.</p>
            <form onSubmit={handleBlockSlot}>
              <div style={{ marginBottom:"14px" }}>
                <label style={{ display:"block",fontWeight:600,fontSize:"13px",marginBottom:"6px" }}>Fecha *</label>
                <input required type="date" value={blockForm.date} onChange={e=>setBlockForm({...blockForm,date:e.target.value})}
                  style={{ width:"100%",padding:"10px 12px",border:"1px solid var(--border-light)",borderRadius:"10px",background:"var(--bg-base)",color:"var(--text-primary)",fontSize:"14px",boxSizing:"border-box" }} />
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"14px" }}>
                <div>
                  <label style={{ display:"block",fontWeight:600,fontSize:"13px",marginBottom:"6px" }}>Desde *</label>
                  <input required type="time" value={blockForm.start} onChange={e=>setBlockForm({...blockForm,start:e.target.value})}
                    style={{ width:"100%",padding:"10px 12px",border:"1px solid var(--border-light)",borderRadius:"10px",background:"var(--bg-base)",color:"var(--text-primary)",fontSize:"14px",boxSizing:"border-box" }} />
                </div>
                <div>
                  <label style={{ display:"block",fontWeight:600,fontSize:"13px",marginBottom:"6px" }}>Hasta *</label>
                  <input required type="time" value={blockForm.end} onChange={e=>setBlockForm({...blockForm,end:e.target.value})}
                    style={{ width:"100%",padding:"10px 12px",border:"1px solid var(--border-light)",borderRadius:"10px",background:"var(--bg-base)",color:"var(--text-primary)",fontSize:"14px",boxSizing:"border-box" }} />
                </div>
              </div>
              <div style={{ marginBottom:"20px" }}>
                <label style={{ display:"block",fontWeight:600,fontSize:"13px",marginBottom:"6px" }}>Motivo (opcional)</label>
                <input type="text" value={blockForm.reason} onChange={e=>setBlockForm({...blockForm,reason:e.target.value})} placeholder="Ej. Reunión, descanso..." 
                  style={{ width:"100%",padding:"10px 12px",border:"1px solid var(--border-light)",borderRadius:"10px",background:"var(--bg-base)",color:"var(--text-primary)",fontSize:"14px",boxSizing:"border-box" }} />
              </div>
              {blockMsg && <p style={{ fontSize:"13px",marginBottom:"12px",color:blockMsg.startsWith("✅")?"var(--success)":"var(--error)" }}>{blockMsg}</p>}
              <div style={{ display:"flex",gap:"10px",justifyContent:"flex-end" }}>
                <button type="button" className="btn-secondary" onClick={()=>setShowBlock(false)} disabled={blockSaving}>Cancelar</button>
                <button type="submit" style={{ padding:"10px 20px",borderRadius:"10px",background:"#64748b",color:"#fff",border:"none",fontWeight:700,cursor:"pointer" }} disabled={blockSaving}>{blockSaving?"Bloqueando...":"Bloquear Horario"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal: WhatsApp Recordatorio ─── */}
      {showWA && (
        <div style={{ position:"fixed",inset:0,zIndex:300,background:"rgba(10,13,26,0.7)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px" }}
          onClick={e => { if(e.target===e.currentTarget) setShowWA(false); }}>
          <div style={{ background:"var(--surface)",borderRadius:"20px",padding:"28px",width:"100%",maxWidth:"400px",boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
            <h2 style={{ fontSize:"18px",fontWeight:800,marginBottom:"12px" }}>💬 Recordatorio WhatsApp</h2>
            <p style={{ color:"var(--text-secondary)",fontSize:"13px",marginBottom:"16px" }}>Envía un recordatorio manual a un cliente desde WhatsApp Web.</p>
            <div style={{ background:"rgba(37,211,102,0.08)",border:"1px solid rgba(37,211,102,0.25)",borderRadius:"12px",padding:"16px",marginBottom:"20px" }}>
              <p style={{ fontSize:"13px",marginBottom:"8px",fontWeight:600 }}>📋 Mensaje sugerido:</p>
              <p style={{ fontSize:"12px",color:"var(--text-secondary)",lineHeight:1.6,fontStyle:"italic" }}>"Hola [Nombre], te recordamos que tienes una cita mañana a las [Hora] en [Salón]. ¡Te esperamos!"</p>
            </div>
            <p style={{ fontSize:"12px",color:"var(--text-secondary)",marginBottom:"16px" }}>💡 <strong>Tip:</strong> Para automatizar recordatorios, integra Twilio o la API de WhatsApp Business en Configuración.</p>
            <div style={{ display:"flex",gap:"10px",justifyContent:"flex-end" }}>
              <button className="btn-secondary" onClick={()=>setShowWA(false)}>Cerrar</button>
              <button style={{ padding:"10px 20px",borderRadius:"10px",background:"#25D366",color:"#fff",border:"none",fontWeight:700,cursor:"pointer" }}
                onClick={()=>window.open("https://wa.me/?text=Hola%2C+te+recordamos+tu+cita+de+ma%C3%B1ana.","_blank")}>
                Abrir WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
