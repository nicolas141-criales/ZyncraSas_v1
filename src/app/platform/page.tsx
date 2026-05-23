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
  pendingAmount: number;
  pendingCount: number;
  newThisMonth: number;
}

interface RecentEvent {
  type: "new_client" | "payment" | "overdue";
  label: string;
  sub: string;
  time: string;
  color: string;
}

function fmt(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", { month: "short", day: "numeric", year: "numeric" });
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent, icon }: {
  label: string; value: string; sub: string; accent: string; icon: string;
}) {
  return (
    <div style={{ background: "#1e293b", borderRadius: 16, padding: "22px 24px", border: `1px solid rgba(255,255,255,0.05)` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
        <span style={{ fontSize: 20, opacity: 0.7 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: accent, lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#475569" }}>{sub}</div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function PlatformDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [overdueList, setOverdueList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Load all subscriptions + tenant info
      const [{ data: subs }, { data: payments }, { data: newTenants }] = await Promise.all([
        supabase.from("saas_subscriptions").select("*, tenants(name, created_at)"),
        supabase.from("saas_payments").select("*").eq("status", "pending"),
        supabase.from("tenants").select("id, name, created_at").gte("created_at", startOfMonth).order("created_at", { ascending: false }),
      ]);

      const subsData = (subs ?? []) as any[];
      const paymentsData = (payments ?? []) as any[];

      const s: Stats = {
        total: subsData.length,
        active: subsData.filter(s => s.status === "active").length,
        trial: subsData.filter(s => s.status === "trial").length,
        overdue: subsData.filter(s => s.status === "overdue").length,
        suspended: subsData.filter(s => s.status === "suspended").length,
        mrr: subsData.filter(s => s.status === "active").reduce((acc, s) => acc + (s.amount ?? 0), 0),
        pendingAmount: paymentsData.reduce((acc, p) => acc + (p.amount ?? 0), 0),
        pendingCount: paymentsData.length,
        newThisMonth: (newTenants ?? []).length,
      };

      setStats(s);
      setRecentClients((newTenants ?? []).slice(0, 5));
      setOverdueList(subsData.filter(s => s.status === "overdue").slice(0, 5));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <div style={{ width: 36, height: 36, border: "3px solid #1e293b", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>Dashboard</h1>
        <p style={{ color: "#475569", fontSize: 14, margin: "4px 0 0" }}>
          Vista general de la plataforma Zyncra
        </p>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 28 }}>
        <KpiCard label="MRR" value={fmt(stats?.mrr ?? 0)} sub="ingresos mensuales recurrentes" accent="#a78bfa" icon="💰" />
        <KpiCard label="Clientes activos" value={String(stats?.active ?? 0)} sub={`de ${stats?.total ?? 0} totales`} accent="#34d399" icon="✅" />
        <KpiCard label="En trial" value={String(stats?.trial ?? 0)} sub="período de prueba" accent="#fbbf24" icon="⏳" />
        <KpiCard label="Cuentas vencidas" value={String(stats?.overdue ?? 0)} sub="requieren atención" accent="#f87171" icon="⚠️" />
        <KpiCard label="Cobros pendientes" value={fmt(stats?.pendingAmount ?? 0)} sub={`${stats?.pendingCount ?? 0} facturas`} accent="#fb923c" icon="📋" />
        <KpiCard label="Nuevos este mes" value={String(stats?.newThisMonth ?? 0)} sub="clientes registrados" accent="#60a5fa" icon="🆕" />
      </div>

      {/* Two columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Cuentas vencidas */}
        <div style={{ background: "#1e293b", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>Cuentas vencidas</h3>
            <a href="/platform/billing" style={{ fontSize: 12, color: "#7c3aed", textDecoration: "none", fontWeight: 600 }}>Ver todas →</a>
          </div>
          {overdueList.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#475569" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 13 }}>Sin cuentas vencidas</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {overdueList.map((s: any) => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.15)" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#f1f5f9" }}>{s.tenants?.name ?? "—"}</div>
                    <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>Vencida · {fmt(s.amount)}/mes</div>
                  </div>
                  <a href="/platform/billing" style={{ fontSize: 12, color: "#f87171", fontWeight: 600, textDecoration: "none" }}>Gestionar</a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nuevos clientes */}
        <div style={{ background: "#1e293b", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>Últimos registros</h3>
            <a href="/platform/clients" style={{ fontSize: 12, color: "#7c3aed", textDecoration: "none", fontWeight: 600 }}>Ver todos →</a>
          </div>
          {recentClients.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#475569" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>👥</div>
              <div style={{ fontSize: 13 }}>Sin clientes este mes</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentClients.map((t: any) => (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(124,58,237,0.06)", borderRadius: 10, border: "1px solid rgba(124,58,237,0.1)" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#f1f5f9" }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{fmtDate(t.created_at)}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>Trial</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumen de estado */}
        <div style={{ background: "#1e293b", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.05)", gridColumn: "1 / -1" }}>
          <h3 style={{ margin: "0 0 18px", fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>Distribución de clientes</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[
              { label: "Activos",    value: stats?.active ?? 0,    color: "#34d399", bg: "rgba(52,211,153,0.1)"  },
              { label: "Trial",      value: stats?.trial ?? 0,     color: "#fbbf24", bg: "rgba(251,191,36,0.1)"  },
              { label: "Vencidos",   value: stats?.overdue ?? 0,   color: "#f87171", bg: "rgba(248,113,113,0.1)" },
              { label: "Suspendidos",value: stats?.suspended ?? 0, color: "#94a3b8", bg: "rgba(148,163,184,0.1)" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} style={{ background: bg, borderRadius: 12, padding: "16px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{label}</div>
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
