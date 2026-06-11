"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface MonthData {
  key: string;
  label: string;
  year: number;
  signups: number;
  revenue: number;
  cumRevenue: number;
  cumSignups: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}
function fmtShort(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return fmt(n);
}

function getLast12Months(): { key: string; label: string; year: number }[] {
  const out = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("es-CO", { month: "short" }),
      year: d.getFullYear(),
    });
  }
  return out;
}

function BarChart({
  data,
  valueKey,
  color,
  formatValue,
  height = 160,
}: {
  data: MonthData[];
  valueKey: "signups" | "revenue";
  color: string;
  formatValue: (n: number) => string;
  height?: number;
}) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  const now = new Date();
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height, paddingBottom: 24, position: "relative" }}>
      {/* Y axis guides */}
      {[0.25, 0.5, 0.75, 1].map(pct => (
        <div key={pct} style={{
          position: "absolute", left: 0, right: 0,
          bottom: 24 + (pct * (height - 24)),
          borderTop: "1px dashed rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center",
        }}>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", marginLeft: 0, whiteSpace: "nowrap" }}>
            {formatValue(max * pct)}
          </span>
        </div>
      ))}

      {data.map((d, i) => {
        const barH = Math.max(2, (d[valueKey] / max) * (height - 28));
        const isCurrent = d.key === currentKey;
        const isLast = i === data.length - 1;
        return (
          <div key={d.key} title={`${d.label}: ${formatValue(d[valueKey])}`}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, position: "relative" }}>
            <div style={{
              width: "100%", height: barH,
              background: isCurrent ? color : `${color}66`,
              borderRadius: "4px 4px 0 0",
              cursor: "default",
              outline: isCurrent ? `1px solid ${color}` : "none",
            }} />
            <div style={{
              fontSize: 9, color: isCurrent ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.22)",
              position: "absolute", bottom: 0, whiteSpace: "nowrap", fontWeight: isCurrent ? 700 : 400,
            }}>
              {d.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PlatformAnalyticsPage() {
  const [data, setData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSignups, setTotalSignups] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalActive, setTotalActive] = useState(0);
  const [totalTrial, setTotalTrial] = useState(0);
  const [avgRevPerClient, setAvgRevPerClient] = useState(0);
  const [churnRate, setChurnRate] = useState(0);
  const [activeTab, setActiveTab] = useState<"signups" | "revenue">("signups");

  useEffect(() => {
    async function load() {
      const months12 = getLast12Months();
      const from = months12[0].key + "-01";

      const [
        { data: tenants },
        { data: payments },
        { data: allSubs },
        { data: allTenants },
      ] = await Promise.all([
        supabase.from("tenants").select("id, created_at").gte("created_at", from),
        supabase.from("saas_payments").select("amount, paid_at").eq("status", "paid").gte("paid_at", from),
        supabase.from("saas_subscriptions").select("status, amount"),
        supabase.from("tenants").select("id"),
      ]);

      const signupsByMonth = new Map<string, number>();
      (tenants ?? []).forEach((t: any) => {
        if (!t.created_at) return;
        const k = t.created_at.slice(0, 7);
        signupsByMonth.set(k, (signupsByMonth.get(k) ?? 0) + 1);
      });

      const revenueByMonth = new Map<string, number>();
      (payments ?? []).forEach((p: any) => {
        if (!p.paid_at) return;
        const k = p.paid_at.slice(0, 7);
        revenueByMonth.set(k, (revenueByMonth.get(k) ?? 0) + (p.amount ?? 0));
      });

      let cumRev = 0;
      let cumSig = 0;
      const rows: MonthData[] = months12.map(m => {
        const s = signupsByMonth.get(m.key) ?? 0;
        const r = revenueByMonth.get(m.key) ?? 0;
        cumSig += s;
        cumRev += r;
        return { ...m, signups: s, revenue: r, cumRevenue: cumRev, cumSignups: cumSig };
      });
      setData(rows);

      const subsData = (allSubs ?? []) as any[];
      const active = subsData.filter(s => s.status === "active").length;
      const trial = (allTenants ?? []).length - subsData.filter(s => s.status !== "trial").length;
      const mrr = subsData.filter(s => s.status === "active").reduce((acc, s) => acc + (s.amount ?? 0), 0);
      const overdue = subsData.filter(s => s.status === "overdue").length;
      const totalT = (allTenants ?? []).length;

      setTotalSignups((allTenants ?? []).length);
      setTotalRevenue((payments ?? []).reduce((acc: number, p: any) => acc + (p.amount ?? 0), 0));
      setTotalActive(active);
      setTotalTrial(trial > 0 ? trial : 0);
      setAvgRevPerClient(active > 0 ? Math.round(mrr / active) : 0);
      setChurnRate(totalT > 0 ? Math.round((overdue / totalT) * 100) : 0);
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

  const totSignupsYear = data.reduce((acc, d) => acc + d.signups, 0);
  const totRevYear = data.reduce((acc, d) => acc + d.revenue, 0);
  const thisMonth = data[data.length - 1];
  const lastMonth = data[data.length - 2];
  const signupGrowth = lastMonth?.signups > 0 ? Math.round(((thisMonth.signups - lastMonth.signups) / lastMonth.signups) * 100) : 0;
  const revenueGrowth = lastMonth?.revenue > 0 ? Math.round(((thisMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100) : 0;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "rgba(255,255,255,0.94)", margin: 0 }}>Analytics</h1>
        <p style={{ color: "rgba(255,255,255,0.32)", fontSize: 14, margin: "4px 0 0" }}>Métricas de crecimiento · últimos 12 meses</p>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Clientes totales",    value: String(totalSignups),    color: "#60a5fa", sub: `${totalActive} activos` },
          { label: "Revenue último año",  value: fmtShort(totRevYear),    color: "#ff7d72", sub: `${data.length} meses` },
          { label: "Ingreso por cliente", value: fmtShort(avgRevPerClient), color: "#34d399", sub: "promedio mensual" },
          { label: "Clientes activos",    value: String(totalActive),     color: "#a78bfa", sub: "con suscripción" },
          { label: "En trial",            value: String(totalTrial),      color: "#fbbf24", sub: "sin convertir" },
          { label: "Tasa de vencimiento", value: `${churnRate}%`,         color: churnRate > 10 ? "#f87171" : "#34d399", sub: "cuentas vencidas" },
        ].map(k => (
          <div key={k.label} style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", boxShadow: "0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 20px", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.32)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Main chart */}
      <div style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", boxShadow: "0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.07)", borderRadius: 18, padding: "24px 28px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "rgba(255,255,255,0.94)", marginBottom: 4 }}>
              {activeTab === "signups" ? "Nuevos clientes por mes" : "Ingresos por mes"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.42)" }}>
                Este mes: <strong style={{ color: activeTab === "signups" ? "#60a5fa" : "#ff7d72" }}>
                  {activeTab === "signups" ? `${thisMonth.signups} clientes` : fmt(thisMonth.revenue)}
                </strong>
              </span>
              {(activeTab === "signups" ? signupGrowth : revenueGrowth) !== 0 && (
                <span style={{ fontSize: 12, fontWeight: 700, color: (activeTab === "signups" ? signupGrowth : revenueGrowth) > 0 ? "#34d399" : "#f87171" }}>
                  {(activeTab === "signups" ? signupGrowth : revenueGrowth) > 0 ? "↑" : "↓"}{Math.abs(activeTab === "signups" ? signupGrowth : revenueGrowth)}% vs mes anterior
                </span>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {(["signups", "revenue"] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                background: activeTab === tab ? (tab === "signups" ? "#60a5fa" : "#ff7d72") : "rgba(255,255,255,0.08)",
                color: activeTab === tab ? "#10101B" : "rgba(255,255,255,0.42)",
              }}>
                {tab === "signups" ? "Registros" : "Ingresos"}
              </button>
            ))}
          </div>
        </div>

        <BarChart
          data={data}
          valueKey={activeTab}
          color={activeTab === "signups" ? "#60a5fa" : "#ff7d72"}
          formatValue={activeTab === "signups" ? n => String(Math.round(n)) : fmtShort}
          height={180}
        />
      </div>

      {/* Monthly breakdown table */}
      <div style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", boxShadow: "0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06)", borderRadius: 18, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.94)" }}>Desglose mensual</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.2)" }}>
                {["Mes", "Nuevos clientes", "Ingresos", "Clientes acumulados", "Revenue acumulado"].map(h => (
                  <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.32)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((d, i) => {
                const isCurrentMonth = d.key === getLast12Months()[11].key;
                return (
                  <tr key={d.key} style={{ borderTop: "1px solid rgba(255,255,255,0.04)", background: isCurrentMonth ? "rgba(251,15,5,0.05)" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                    <td style={{ padding: "12px 20px", fontSize: 13, fontWeight: isCurrentMonth ? 700 : 500, color: isCurrentMonth ? "rgba(255,255,255,0.94)" : "rgba(255,255,255,0.55)", whiteSpace: "nowrap" }}>
                      {d.label} {d.year}
                      {isCurrentMonth && <span style={{ marginLeft: 8, fontSize: 10, padding: "1px 7px", borderRadius: 10, background: "rgba(251,15,5,0.2)", color: "#ff7d72", fontWeight: 700 }}>HOY</span>}
                    </td>
                    <td style={{ padding: "12px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: d.signups > 0 ? "#60a5fa" : "rgba(255,255,255,0.2)" }}>{d.signups}</span>
                        {d.signups > 0 && <div style={{ width: Math.min(60, (d.signups / Math.max(...data.map(x => x.signups), 1)) * 60), height: 4, borderRadius: 2, background: "#60a5fa40" }} />}
                      </div>
                    </td>
                    <td style={{ padding: "12px 20px", fontSize: 13, fontWeight: 700, color: d.revenue > 0 ? "#ff7d72" : "rgba(255,255,255,0.2)" }}>
                      {d.revenue > 0 ? fmt(d.revenue) : "—"}
                    </td>
                    <td style={{ padding: "12px 20px", fontSize: 12, color: "rgba(255,255,255,0.42)" }}>{d.cumSignups}</td>
                    <td style={{ padding: "12px 20px", fontSize: 12, color: "rgba(255,255,255,0.42)" }}>{d.cumRevenue > 0 ? fmt(d.cumRevenue) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
