"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Stats {
  total: number; active: number; trial: number; overdue: number; suspended: number;
  mrr: number; arr: number; pendingAmount: number; pendingCount: number;
  newThisMonth: number; conversionRate: number; trialsExpiringSoon: number;
}
interface TrialExpiring { tenantName: string; trial_ends_at: string; daysLeft: number; }
interface ActivityEvent { id: string; icon: string; text: string; sub: string; time: string; color: string; }
interface MonthBar { label: string; signups: number; revenue: number; }

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  active:    { label: "Activo",     bg: "rgba(52,211,153,.15)",  color: "#34d399" },
  trial:     { label: "Trial",      bg: "rgba(251,191,36,.15)",  color: "#fbbf24" },
  overdue:   { label: "Vencido",    bg: "rgba(248,113,113,.15)", color: "#f87171" },
  suspended: { label: "Suspendido", bg: "rgba(148,163,184,.1)",  color: "rgba(255,255,255,0.5)" },
  cancelled: { label: "Cancelado",  bg: "rgba(148,163,184,.1)",  color: "rgba(255,255,255,0.5)" },
};

function fmt(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}
function fmtCompact(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return fmt(n);
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", { month: "short", day: "numeric", year: "numeric" });
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "ahora mismo";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;
  return fmtDate(iso);
}
function getLast6Months(): { key: string; label: string }[] {
  const out = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("es-CO", { month: "short" }),
    });
  }
  return out;
}

// ── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, accent, icon, tag, size = "normal",
}: {
  label: string; value: string; sub: string; accent: string;
  icon: string; tag?: string; size?: "normal" | "large";
}) {
  return (
    <div style={{
      position: "relative", overflow: "hidden",
      background: "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
      backdropFilter: "blur(20px) saturate(180%)",
      WebkitBackdropFilter: "blur(20px) saturate(180%)",
      boxShadow: "0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.07)",
      borderRadius: 18,
      padding: size === "large" ? "26px 28px" : "20px 22px",
      border: "1px solid rgba(255,255,255,0.09)",
      borderLeft: `3px solid ${accent}`,
    }}>
      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: -20, left: -10, width: 100, height: 100,
        borderRadius: "50%", background: accent, opacity: 0.07, filter: "blur(28px)",
        pointerEvents: "none",
      }} />
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
            {tag && (
              <span style={{
                fontSize: 8.5, fontWeight: 700, padding: "1px 5px", borderRadius: 4,
                background: `${accent}22`, color: accent, letterSpacing: "0.07em",
                fontFamily: "var(--font-jetbrains-mono),'JetBrains Mono',monospace",
              }}>{tag}</span>
            )}
          </div>
          <span style={{ fontSize: size === "large" ? 22 : 18, opacity: 0.6 }}>{icon}</span>
        </div>
        <div style={{
          fontSize: size === "large" ? 34 : 28, fontWeight: 800, color: accent,
          lineHeight: 1, marginBottom: 6, letterSpacing: "-0.02em",
        }}>{value}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", fontWeight: 500 }}>{sub}</div>
      </div>
    </div>
  );
}

// ── Trend chart ────────────────────────────────────────────────────────────

function TrendChart({ data, tab }: { data: MonthBar[]; tab: "signups" | "revenue" }) {
  const values = data.map(d => d[tab]);
  const max = Math.max(...values, 1);
  const color = tab === "signups" ? "#60a5fa" : "#ff7d72";
  const total = values.reduce((a, b) => a + b, 0);
  const thisMonth = values[values.length - 1] ?? 0;
  const lastMonth = values[values.length - 2] ?? 0;
  const growth = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;

  return (
    <div>
      {/* Summary row */}
      <div style={{ display: "flex", gap: 28, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Este mes</div>
          <div style={{ fontSize: 22, fontWeight: 800, color }}>
            {tab === "signups" ? thisMonth : fmtCompact(thisMonth)}
          </div>
        </div>
        {growth !== 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>vs mes anterior</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: growth > 0 ? "#34d399" : "#f87171" }}>
              {growth > 0 ? "+" : ""}{growth}%
            </div>
          </div>
        )}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Últimos 6 meses</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "rgba(255,255,255,0.55)" }}>
            {tab === "signups" ? total : fmtCompact(total)}
          </div>
        </div>
      </div>

      {/* Bars */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100, paddingBottom: 28, position: "relative" }}>
        {/* Horizontal guide lines */}
        {[0.5, 1].map(pct => (
          <div key={pct} style={{
            position: "absolute", left: 0, right: 0,
            bottom: 28 + pct * 72,
            borderTop: "1px dashed rgba(255,255,255,0.06)",
          }} />
        ))}

        {data.map((d, i) => {
          const v = d[tab];
          const h = Math.max(4, (v / max) * 72);
          const isLast = i === data.length - 1;
          return (
            <div key={d.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 0, position: "relative" }}>
              {/* Value label above bar */}
              {v > 0 && (
                <div style={{
                  position: "absolute",
                  bottom: 28 + h + 4,
                  fontSize: 9, fontWeight: 700,
                  color: isLast ? color : "rgba(255,255,255,0.25)",
                  whiteSpace: "nowrap",
                }}>
                  {tab === "signups" ? v : fmtCompact(v)}
                </div>
              )}
              <div style={{
                width: "100%", height: h,
                background: isLast
                  ? color
                  : `linear-gradient(180deg, ${color}88 0%, ${color}44 100%)`,
                borderRadius: "5px 5px 0 0",
                position: "absolute", bottom: 28,
              }} />
              <div style={{
                position: "absolute", bottom: 6,
                fontSize: 9.5, fontWeight: isLast ? 700 : 400,
                color: isLast ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)",
                whiteSpace: "nowrap",
              }}>
                {d.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export default function PlatformDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [overdueList, setOverdueList] = useState<any[]>([]);
  const [trialsExpiring, setTrialsExpiring] = useState<TrialExpiring[]>([]);
  const [tenantStatusMap, setTenantStatusMap] = useState<Map<string, string>>(new Map());
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthBar[]>([]);
  const [trendTab, setTrendTab] = useState<"signups" | "revenue">("signups");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const months6ago = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();

      const [
        { data: subs },
        { data: payments },
        { data: newTenants },
        { data: allTenants },
        { data: recentPaid },
        { data: paidForTrend },
      ] = await Promise.all([
        supabase.from("saas_subscriptions").select("*, tenants(name, created_at)"),
        supabase.from("saas_payments").select("*").eq("status", "pending"),
        supabase.from("tenants").select("id, name, created_at").gte("created_at", startOfMonth).order("created_at", { ascending: false }),
        supabase.from("tenants").select("id, name, created_at").order("created_at", { ascending: false }),
        supabase.from("saas_payments").select("amount, paid_at, tenants(name)").eq("status", "paid").order("paid_at", { ascending: false }).limit(10),
        supabase.from("saas_payments").select("amount, paid_at").eq("status", "paid").gte("paid_at", months6ago),
      ]);

      const subsData = (subs ?? []) as any[];
      const paymentsData = (payments ?? []) as any[];
      const allTenantsData = (allTenants ?? []) as any[];

      const subsMap = new Map<string, string>(subsData.map((s: any) => [s.tenant_id, s.status]));
      const statusMap = new Map<string, string>(allTenantsData.map((t: any) => [t.id, subsMap.get(t.id) ?? "trial"]));
      setTenantStatusMap(statusMap);

      const allStatuses = allTenantsData.map((t: any) => subsMap.get(t.id) ?? "trial");
      const activeSubs = subsData.filter(s => s.status === "active");
      const trialCount = allStatuses.filter(s => s === "trial").length;
      const mrr = activeSubs.reduce((acc, s) => acc + (s.amount ?? 0), 0);
      const totalForConversion = activeSubs.length + trialCount;
      const conversionRate = totalForConversion > 0 ? Math.round((activeSubs.length / totalForConversion) * 100) : 0;

      const expiringSoon: TrialExpiring[] = subsData
        .filter((s: any) => s.status === "trial" && s.trial_ends_at && s.trial_ends_at >= now.toISOString() && s.trial_ends_at <= in7days)
        .map((s: any) => ({
          tenantName: s.tenants?.name ?? "—",
          trial_ends_at: s.trial_ends_at,
          daysLeft: Math.max(0, Math.ceil((new Date(s.trial_ends_at).getTime() - now.getTime()) / 86400000)),
        }))
        .sort((a: TrialExpiring, b: TrialExpiring) => a.daysLeft - b.daysLeft);

      // Monthly trend
      const months6 = getLast6Months();
      const signupsByMonth = new Map<string, number>();
      const revenueByMonth = new Map<string, number>();
      allTenantsData.forEach((t: any) => {
        if (!t.created_at) return;
        const k = t.created_at.slice(0, 7);
        signupsByMonth.set(k, (signupsByMonth.get(k) ?? 0) + 1);
      });
      (paidForTrend ?? []).forEach((p: any) => {
        if (!p.paid_at) return;
        const k = p.paid_at.slice(0, 7);
        revenueByMonth.set(k, (revenueByMonth.get(k) ?? 0) + (p.amount ?? 0));
      });
      setMonthlyTrend(months6.map(m => ({
        label: m.label,
        signups: signupsByMonth.get(m.key) ?? 0,
        revenue: revenueByMonth.get(m.key) ?? 0,
      })));

      // Activity feed
      const signupEvents: ActivityEvent[] = allTenantsData.slice(0, 8).map((t: any) => ({
        id: `s-${t.id}`,
        icon: "🏪",
        text: t.name,
        sub: "Nuevo registro",
        time: t.created_at,
        color: "#60a5fa",
      }));
      const payEvents: ActivityEvent[] = (recentPaid ?? []).map((p: any) => ({
        id: `p-${p.paid_at}`,
        icon: "💳",
        text: (p.tenants as any)?.name ?? "—",
        sub: fmt(p.amount ?? 0),
        time: p.paid_at ?? "",
        color: "#34d399",
      }));
      setActivityFeed(
        [...signupEvents, ...payEvents]
          .filter(e => e.time)
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
          .slice(0, 12),
      );

      setStats({
        total: allTenantsData.length,
        active: activeSubs.length,
        trial: trialCount,
        overdue: allStatuses.filter(s => s === "overdue").length,
        suspended: allStatuses.filter(s => s === "suspended").length,
        mrr, arr: mrr * 12,
        pendingAmount: paymentsData.reduce((acc, p) => acc + (p.amount ?? 0), 0),
        pendingCount: paymentsData.length,
        newThisMonth: (newTenants ?? []).length,
        conversionRate,
        trialsExpiringSoon: expiringSoon.length,
      });
      setRecentClients((newTenants ?? []).slice(0, 6));
      setOverdueList(subsData.filter(s => s.status === "overdue").slice(0, 5));
      setTrialsExpiring(expiringSoon);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <div style={{ width: 36, height: 36, border: "3px solid #181824", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "rgba(255,255,255,0.94)", margin: 0, letterSpacing: "-0.02em" }}>Dashboard</h1>
          <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 13, margin: "3px 0 0" }}>
            {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        {stats && stats.overdue > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(248,113,113,0.1)", borderRadius: 10, padding: "7px 14px", border: "1px solid rgba(248,113,113,0.2)" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#f87171", animation: "pulse 2s infinite" }} />
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#f87171" }}>{stats.overdue} cuenta{stats.overdue > 1 ? "s" : ""} vencida{stats.overdue > 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {/* ── Row 1: Hero KPIs ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KpiCard label="Ingreso mensual"  value={fmtCompact(stats?.mrr ?? 0)}             sub="suscripciones activas"            accent="#ff7d72" icon="💰" tag="MRR" size="large" />
        <KpiCard label="Clientes activos" value={String(stats?.active ?? 0)}               sub={`de ${stats?.total ?? 0} totales`} accent="#34d399" icon="✅" size="large" />
        <KpiCard label="En trial"         value={String(stats?.trial ?? 0)}                sub="período de prueba activo"         accent="#fbbf24" icon="⏳" size="large" />
        <KpiCard label="Conversión"       value={`${stats?.conversionRate ?? 0}%`}         sub="trial → activo"                   accent="#a78bfa" icon="🎯" size="large" />
      </div>

      {/* ── Row 2: Secondary KPIs ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KpiCard label="Proyección anual"  value={fmtCompact(stats?.arr ?? 0)}             sub="ingreso mensual × 12"             accent="#f97316" icon="📈" tag="ARR" />
        <KpiCard label="Cobros pendientes" value={fmtCompact(stats?.pendingAmount ?? 0)}   sub={`${stats?.pendingCount ?? 0} facturas sin cobrar`} accent="#fb923c" icon="📋" />
        <KpiCard label="Cuentas vencidas"  value={String(stats?.overdue ?? 0)}             sub="requieren atención"               accent="#f87171" icon="⚠️" />
        <KpiCard label="Nuevos este mes"   value={String(stats?.newThisMonth ?? 0)}        sub="registros del mes"                accent="#60a5fa" icon="🆕" />
      </div>

      {/* ── Trials expiring (solo cuando hay) ── */}
      {trialsExpiring.length > 0 && (
        <div style={{ background: "rgba(251,191,36,0.05)", borderRadius: 16, padding: "18px 22px", border: "1px solid rgba(251,191,36,0.18)" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>
            ⏳ Trials por vencer esta semana — {trialsExpiring.length} cliente{trialsExpiring.length > 1 ? "s" : ""}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {trialsExpiring.map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", background: "rgba(251,191,36,0.08)", borderRadius: 10, border: "1px solid rgba(251,191,36,0.12)" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,0.9)" }}>{t.tenantName}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>Vence {fmtDate(t.trial_ends_at)}</div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap",
                  background: t.daysLeft <= 1 ? "rgba(248,113,113,.2)" : "rgba(251,191,36,.15)",
                  color: t.daysLeft <= 1 ? "#f87171" : "#fbbf24",
                }}>
                  {t.daysLeft === 0 ? "Hoy" : t.daysLeft === 1 ? "Mañana" : `${t.daysLeft}d`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Trend chart (full width) ── */}
      <div style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", boxShadow: "0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.07)", borderRadius: 18, padding: "24px 28px", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.01em" }}>
            {trendTab === "signups" ? "Nuevos registros" : "Ingresos cobrados"} — últimos 6 meses
          </span>
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 4 }}>
            {(["signups", "revenue"] as const).map(tab => (
              <button key={tab} onClick={() => setTrendTab(tab)} style={{
                padding: "5px 14px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                background: trendTab === tab ? (tab === "signups" ? "#60a5fa" : "#ff7d72") : "transparent",
                color: trendTab === tab ? "#10101B" : "rgba(255,255,255,0.35)",
                transition: "all .15s",
              }}>
                {tab === "signups" ? "Registros" : "Ingresos"}
              </button>
            ))}
          </div>
        </div>
        <TrendChart data={monthlyTrend} tab={trendTab} />
      </div>

      {/* ── Bottom grid: Activity | Clients | Distribution ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>

        {/* Actividad reciente */}
        <div style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", boxShadow: "0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.07)", borderRadius: 18, padding: "22px 24px", border: "1px solid rgba(255,255,255,0.08)", gridColumn: "span 1" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginBottom: 18, letterSpacing: "-0.01em" }}>Actividad reciente</div>
          {activityFeed.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>Sin actividad</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
              {/* Timeline vertical line */}
              <div style={{ position: "absolute", left: 13, top: 14, bottom: 14, width: 1, background: "rgba(255,255,255,0.05)" }} />
              {activityFeed.slice(0, 8).map((e, i) => (
                <div key={e.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "9px 0", position: "relative" }}>
                  {/* Timeline dot */}
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: `${e.color}18`,
                    border: `1.5px solid ${e.color}44`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, flexShrink: 0, position: "relative", zIndex: 1,
                  }}>
                    {e.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.82)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.text}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 1, alignItems: "center" }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: e.color }}>{e.sub}</span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)" }}>·</span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)" }}>{timeAgo(e.time)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimos registros */}
        <div style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", boxShadow: "0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.07)", borderRadius: 18, padding: "22px 24px", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginBottom: 18, letterSpacing: "-0.01em" }}>Últimos registros</div>
          {recentClients.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "rgba(255,255,255,0.25)" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>👥</div>
              <div style={{ fontSize: 12 }}>Sin registros este mes</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentClients.map((t: any) => {
                const status = tenantStatusMap.get(t.id) ?? "trial";
                const badge = STATUS_BADGE[status] ?? STATUS_BADGE.trial;
                return (
                  <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: "rgba(255,255,255,0.87)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{timeAgo(t.created_at)}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: badge.bg, color: badge.color, whiteSpace: "nowrap", marginLeft: 8 }}>
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Distribución + cuentas vencidas */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Distribución */}
          <div style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", boxShadow: "0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.07)", borderRadius: 18, padding: "22px 24px", border: "1px solid rgba(255,255,255,0.08)", flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginBottom: 16, letterSpacing: "-0.01em" }}>Distribución</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Activos",     value: stats?.active ?? 0,    color: "#34d399" },
                { label: "Trial",       value: stats?.trial ?? 0,     color: "#fbbf24" },
                { label: "Vencidos",    value: stats?.overdue ?? 0,   color: "#f87171" },
                { label: "Suspendidos", value: stats?.suspended ?? 0, color: "rgba(255,255,255,0.3)" },
              ].map(({ label, value, color }) => {
                const pct = stats?.total ? Math.round((value / stats.total) * 100) : 0;
                return (
                  <div key={label}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.42)" }}>{label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color }}>
                        {value} <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.2)" }}>({pct}%)</span>
                      </span>
                    </div>
                    <div style={{ height: 4, borderRadius: 3, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width .5s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cuentas vencidas */}
          {overdueList.length > 0 && (
            <div style={{ background: "rgba(248,113,113,0.06)", borderRadius: 18, padding: "18px 20px", border: "1px solid rgba(248,113,113,0.15)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#f87171", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>⚠️ Vencidas</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {overdueList.map((s: any) => (
                  <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.75)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{s.tenants?.name ?? "—"}</span>
                    <span style={{ fontSize: 11, color: "#f87171", fontWeight: 700 }}>{fmt(s.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
