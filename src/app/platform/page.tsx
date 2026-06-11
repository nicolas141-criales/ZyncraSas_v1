"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Stats {
  total: number;
  active: number;
  trial: number;
  overdue: number;
  suspended: number;
  mrr: number;
  arr: number;
  pendingAmount: number;
  pendingCount: number;
  newThisMonth: number;
  conversionRate: number;
  trialsExpiringSoon: number;
}

interface TrialExpiring {
  tenantName: string;
  trial_ends_at: string;
  daysLeft: number;
}

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

function KpiCard({ label, value, sub, accent, icon }: {
  label: string; value: string; sub: string; accent: string; icon: string;
}) {
  return (
    <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 16, padding: "22px 24px", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.42)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
        <span style={{ fontSize: 20, opacity: 0.7 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: accent, lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.32)" }}>{sub}</div>
    </div>
  );
}

export default function PlatformDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [overdueList, setOverdueList] = useState<any[]>([]);
  const [trialsExpiring, setTrialsExpiring] = useState<TrialExpiring[]>([]);
  const [tenantStatusMap, setTenantStatusMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const [{ data: subs }, { data: payments }, { data: newTenants }] = await Promise.all([
        supabase.from("saas_subscriptions").select("*, tenants(name, created_at)"),
        supabase.from("saas_payments").select("*").eq("status", "pending"),
        supabase.from("tenants").select("id, name, created_at").gte("created_at", startOfMonth).order("created_at", { ascending: false }),
      ]);

      const subsData = (subs ?? []) as any[];
      const paymentsData = (payments ?? []) as any[];

      const statusMap = new Map<string, string>(subsData.map((s: any) => [s.tenant_id, s.status]));
      setTenantStatusMap(statusMap);

      const activeSubs = subsData.filter(s => s.status === "active");
      const trialSubs  = subsData.filter(s => s.status === "trial");
      const mrr = activeSubs.reduce((acc, s) => acc + (s.amount ?? 0), 0);

      const totalForConversion = activeSubs.length + trialSubs.length;
      const conversionRate = totalForConversion > 0
        ? Math.round((activeSubs.length / totalForConversion) * 100)
        : 0;

      const expiringSoon: TrialExpiring[] = subsData
        .filter((s: any) => s.status === "trial" && s.trial_ends_at && s.trial_ends_at >= now.toISOString() && s.trial_ends_at <= in7days)
        .map((s: any) => {
          const daysLeft = Math.max(0, Math.ceil((new Date(s.trial_ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
          return { tenantName: s.tenants?.name ?? "—", trial_ends_at: s.trial_ends_at, daysLeft };
        })
        .sort((a: TrialExpiring, b: TrialExpiring) => a.daysLeft - b.daysLeft);

      setStats({
        total: subsData.length,
        active: activeSubs.length,
        trial: trialSubs.length,
        overdue: subsData.filter(s => s.status === "overdue").length,
        suspended: subsData.filter(s => s.status === "suspended").length,
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
        <p style={{ color: "rgba(255,255,255,0.32)", fontSize: 14, margin: "4px 0 0" }}>
          Vista general de la plataforma Zyncra
        </p>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14, marginBottom: 28 }}>
        <KpiCard label="MRR"              value={fmt(stats?.mrr ?? 0)}          sub="ingresos mensuales recurrentes" accent="#ff7d72" icon="💰" />
        <KpiCard label="ARR"              value={fmt(stats?.arr ?? 0)}          sub="ingresos anuales proyectados"   accent="#f97316" icon="📈" />
        <KpiCard label="Clientes activos" value={String(stats?.active ?? 0)}    sub={`de ${stats?.total ?? 0} totales`} accent="#34d399" icon="✅" />
        <KpiCard label="En trial"         value={String(stats?.trial ?? 0)}     sub="período de prueba"              accent="#fbbf24" icon="⏳" />
        <KpiCard label="Conversión"       value={`${stats?.conversionRate ?? 0}%`} sub="trial → activo"             accent="#a78bfa" icon="🎯" />
        <KpiCard label="Cuentas vencidas" value={String(stats?.overdue ?? 0)}   sub="requieren atención"             accent="#f87171" icon="⚠️" />
        <KpiCard label="Cobros pendientes" value={fmt(stats?.pendingAmount ?? 0)} sub={`${stats?.pendingCount ?? 0} facturas`} accent="#fb923c" icon="📋" />
        <KpiCard label="Nuevos este mes"  value={String(stats?.newThisMonth ?? 0)} sub="clientes registrados"       accent="#60a5fa" icon="🆕" />
      </div>

      {/* Trials expiring alert */}
      {trialsExpiring.length > 0 && (
        <div style={{ background: "rgba(251,191,36,0.06)", borderRadius: 16, padding: 24, border: "1px solid rgba(251,191,36,0.22)", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#fbbf24" }}>
              ⏳ Trials por vencer ({trialsExpiring.length})
            </h3>
            <a href="/platform/clients" style={{ fontSize: 12, color: "#fb0f05", textDecoration: "none", fontWeight: 600 }}>Gestionar →</a>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {trialsExpiring.map((t, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(251,191,36,0.07)", borderRadius: 10, border: "1px solid rgba(251,191,36,0.15)" }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "rgba(255,255,255,0.94)" }}>{t.tenantName}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.42)" }}>Vence {fmtDate(t.trial_ends_at)}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
                    background: t.daysLeft <= 1 ? "rgba(248,113,113,.2)" : "rgba(251,191,36,.15)",
                    color: t.daysLeft <= 1 ? "#f87171" : "#fbbf24",
                  }}>
                    {t.daysLeft === 0 ? "Hoy" : t.daysLeft === 1 ? "Mañana" : `${t.daysLeft} días`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

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

        {/* Distribución de clientes */}
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.05)", gridColumn: "1 / -1" }}>
          <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.94)" }}>Distribución de clientes</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { label: "Activos",     value: stats?.active ?? 0,    color: "#34d399", bg: "rgba(52,211,153,0.1)"  },
              { label: "Trial",       value: stats?.trial ?? 0,     color: "#fbbf24", bg: "rgba(251,191,36,0.1)"  },
              { label: "Vencidos",    value: stats?.overdue ?? 0,   color: "#f87171", bg: "rgba(248,113,113,0.1)" },
              { label: "Suspendidos", value: stats?.suspended ?? 0, color: "rgba(255,255,255,0.55)", bg: "rgba(148,163,184,0.1)" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ background: bg, borderRadius: 12, padding: "16px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", marginTop: 4 }}>{label}</div>
                {stats?.total ? (
                  <div style={{ fontSize: 11, color, marginTop: 2, fontWeight: 600 }}>
                    {Math.round((value / stats.total) * 100)}%
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
