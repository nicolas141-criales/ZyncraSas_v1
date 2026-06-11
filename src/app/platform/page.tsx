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
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", { month: "short", day: "numeric", year: "numeric" });
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${Math.max(1, mins)}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
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

function KpiCard({ label, value, sub, accent, icon, tag }: {
  label: string; value: string; sub: string; accent: string; icon: string; tag?: string;
}) {
  return (
    <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 16, padding: "22px 24px", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.42)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
          {tag && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 5, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.28)", letterSpacing: "0.08em", fontFamily: "var(--font-jetbrains-mono),'JetBrains Mono',monospace" }}>
              {tag}
            </span>
          )}
        </div>
        <span style={{ fontSize: 20, opacity: 0.7 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: accent, lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.32)" }}>{sub}</div>
    </div>
  );
}

function MiniBar({ data, valueKey, color }: { data: MonthBar[]; valueKey: "signups" | "revenue"; color: string }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 50, marginTop: 8 }}>
      {data.map((d, i) => {
        const h = Math.max(3, (d[valueKey] / max) * 46);
        const isLast = i === data.length - 1;
        return (
          <div key={d.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{ width: "100%", height: h, background: color, borderRadius: "3px 3px 0 0", opacity: isLast ? 1 : 0.45 }} />
            <div style={{ fontSize: 8, color: "rgba(255,255,255,0.28)", whiteSpace: "nowrap" }}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function PlatformDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [overdueList, setOverdueList] = useState<any[]>([]);
  const [trialsExpiring, setTrialsExpiring] = useState<TrialExpiring[]>([]);
  const [tenantStatusMap, setTenantStatusMap] = useState<Map<string, string>>(new Map());
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthBar[]>([]);
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

      // Status map
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

      // Monthly trend (last 6 months)
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

      // Activity feed (most recent events combined)
      const signupEvents: ActivityEvent[] = allTenantsData.slice(0, 8).map((t: any) => ({
        id: `s-${t.id}`,
        icon: "🏪",
        text: `Nuevo registro: ${t.name}`,
        sub: "Cliente nuevo",
        time: t.created_at,
        color: "#60a5fa",
      }));
      const payEvents: ActivityEvent[] = (recentPaid ?? []).map((p: any) => ({
        id: `p-${p.id ?? p.paid_at}`,
        icon: "💳",
        text: `Pago recibido: ${(p.tenants as any)?.name ?? "—"}`,
        sub: fmt(p.amount ?? 0),
        time: p.paid_at ?? "",
        color: "#34d399",
      }));
      const combined = [...signupEvents, ...payEvents]
        .filter(e => e.time)
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 10);
      setActivityFeed(combined);

      setStats({
        total: allTenantsData.length,
        active: activeSubs.length,
        trial: trialCount,
        overdue: allStatuses.filter(s => s === "overdue").length,
        suspended: allStatuses.filter(s => s === "suspended").length,
        mrr,
        arr: mrr * 12,
        pendingAmount: paymentsData.reduce((acc, p) => acc + (p.amount ?? 0), 0),
        pendingCount: paymentsData.length,
        newThisMonth: (newTenants ?? []).length,
        conversionRate,
        trialsExpiringSoon: expiringSoon.length,
      });
      setRecentClients((newTenants ?? []).slice(0, 5));
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
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "rgba(255,255,255,0.94)", margin: 0 }}>Dashboard</h1>
        <p style={{ color: "rgba(255,255,255,0.32)", fontSize: 14, margin: "4px 0 0" }}>Vista general de la plataforma Zyncra</p>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14, marginBottom: 28 }}>
        <KpiCard label="Ingreso mensual"    value={fmt(stats?.mrr ?? 0)}                sub="suscripciones activas"           accent="#ff7d72" icon="💰" tag="MRR" />
        <KpiCard label="Proyección anual"   value={fmt(stats?.arr ?? 0)}                sub="ingreso mensual × 12"            accent="#f97316" icon="📈" tag="ARR" />
        <KpiCard label="Clientes activos"   value={String(stats?.active ?? 0)}          sub={`de ${stats?.total ?? 0} totales`} accent="#34d399" icon="✅" />
        <KpiCard label="En trial"           value={String(stats?.trial ?? 0)}           sub="período de prueba"               accent="#fbbf24" icon="⏳" />
        <KpiCard label="Conversión"         value={`${stats?.conversionRate ?? 0}%`}    sub="trial → activo"                  accent="#a78bfa" icon="🎯" />
        <KpiCard label="Cuentas vencidas"   value={String(stats?.overdue ?? 0)}         sub="requieren atención"              accent="#f87171" icon="⚠️" />
        <KpiCard label="Cobros pendientes"  value={fmt(stats?.pendingAmount ?? 0)}      sub={`${stats?.pendingCount ?? 0} facturas`} accent="#fb923c" icon="📋" />
        <KpiCard label="Nuevos este mes"    value={String(stats?.newThisMonth ?? 0)}    sub="clientes registrados"            accent="#60a5fa" icon="🆕" />
      </div>

      {/* Trials expiring alert */}
      {trialsExpiring.length > 0 && (
        <div style={{ background: "rgba(251,191,36,0.06)", borderRadius: 16, padding: 24, border: "1px solid rgba(251,191,36,0.22)", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fbbf24" }}>⏳ Trials por vencer ({trialsExpiring.length})</h3>
            <a href="/platform/clients" style={{ fontSize: 12, color: "#fb0f05", textDecoration: "none", fontWeight: 600 }}>Gestionar →</a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {trialsExpiring.map((t, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(251,191,36,0.07)", borderRadius: 10, border: "1px solid rgba(251,191,36,0.15)" }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "rgba(255,255,255,0.94)" }}>{t.tenantName}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.42)" }}>Vence {fmtDate(t.trial_ends_at)}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: t.daysLeft <= 1 ? "rgba(248,113,113,.2)" : "rgba(251,191,36,.15)", color: t.daysLeft <= 1 ? "#f87171" : "#fbbf24" }}>
                    {t.daysLeft === 0 ? "Hoy" : t.daysLeft === 1 ? "Mañana" : `${t.daysLeft} días`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend bars */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px 24px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.94)" }}>Registros por mes</span>
            <a href="/platform/analytics" style={{ fontSize: 12, color: "#fb0f05", textDecoration: "none", fontWeight: 600 }}>Ver analytics →</a>
          </div>
          <MiniBar data={monthlyTrend} valueKey="signups" color="#60a5fa" />
        </div>
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px 24px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.94)" }}>Ingresos por mes</span>
            <a href="/platform/analytics" style={{ fontSize: 12, color: "#fb0f05", textDecoration: "none", fontWeight: 600 }}>Ver analytics →</a>
          </div>
          <MiniBar data={monthlyTrend} valueKey="revenue" color="#ff7d72" />
        </div>
      </div>

      {/* Two columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

        {/* Cuentas vencidas */}
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.94)" }}>Cuentas vencidas</h3>
            <a href="/platform/billing" style={{ fontSize: 12, color: "#fb0f05", textDecoration: "none", fontWeight: 600 }}>Ver todas →</a>
          </div>
          {overdueList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "rgba(255,255,255,0.32)" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 13 }}>Sin cuentas vencidas</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {overdueList.map((s: any) => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.15)" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "rgba(255,255,255,0.94)" }}>{s.tenants?.name ?? "—"}</div>
                    <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>Vencida · {fmt(s.amount)}/mes</div>
                  </div>
                  <a href="/platform/billing" style={{ fontSize: 12, color: "#f87171", fontWeight: 600, textDecoration: "none" }}>Gestionar</a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nuevos clientes */}
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.94)" }}>Últimos registros</h3>
            <a href="/platform/clients" style={{ fontSize: 12, color: "#fb0f05", textDecoration: "none", fontWeight: 600 }}>Ver todos →</a>
          </div>
          {recentClients.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "rgba(255,255,255,0.32)" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>👥</div>
              <div style={{ fontSize: 13 }}>Sin clientes este mes</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentClients.map((t: any) => {
                const status = tenantStatusMap.get(t.id) ?? "trial";
                const badge = STATUS_BADGE[status] ?? STATUS_BADGE.trial;
                return (
                  <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(251,15,5,0.07)", borderRadius: 10, border: "1px solid rgba(251,15,5,0.10)" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "rgba(255,255,255,0.94)" }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", marginTop: 2 }}>{fmtDate(t.created_at)}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Activity feed */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

        {/* Feed */}
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.05)" }}>
          <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.94)" }}>Actividad reciente</h3>
          {activityFeed.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "rgba(255,255,255,0.32)", fontSize: 13 }}>Sin actividad reciente</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {activityFeed.map((e, i) => (
                <div key={e.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: i < activityFeed.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                    {e.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.87)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.text}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 2, alignItems: "center" }}>
                      {e.sub && <span style={{ fontSize: 11, fontWeight: 700, color: e.color }}>{e.sub}</span>}
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>{timeAgo(e.time)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Client distribution */}
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.05)" }}>
          <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.94)" }}>Distribución de clientes</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Activos",     value: stats?.active ?? 0,    color: "#34d399", bg: "rgba(52,211,153,0.1)"  },
              { label: "Trial",       value: stats?.trial ?? 0,     color: "#fbbf24", bg: "rgba(251,191,36,0.1)"  },
              { label: "Vencidos",    value: stats?.overdue ?? 0,   color: "#f87171", bg: "rgba(248,113,113,0.1)" },
              { label: "Suspendidos", value: stats?.suspended ?? 0, color: "rgba(255,255,255,0.55)", bg: "rgba(148,163,184,0.1)" },
            ].map(({ label, value, color, bg }) => {
              const pct = stats?.total ? Math.round((value / stats.total) * 100) : 0;
              return (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color }}>{value} <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.28)" }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height: 5, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width .4s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick actions */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Acciones rápidas</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[
                { label: "Nuevo cobro", href: "/platform/billing", color: "#ff7d72" },
                { label: "Ver clientes", href: "/platform/clients", color: "#60a5fa" },
                { label: "Analytics", href: "/platform/analytics", color: "#a78bfa" },
                { label: "Planes", href: "/platform/plans", color: "#34d399" },
              ].map(a => (
                <a key={a.label} href={a.href} style={{ fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 7, textDecoration: "none", background: "rgba(255,255,255,0.06)", color: a.color, border: "1px solid rgba(255,255,255,0.08)", whiteSpace: "nowrap" }}>
                  {a.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
