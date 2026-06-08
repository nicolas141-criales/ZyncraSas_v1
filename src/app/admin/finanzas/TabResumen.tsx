"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";
import { IconTrendUp, IconBanknotes, IconCreditCard, IconChartBar, IconRefresh } from "../ZyncraIcons";

interface Sale {
  id: string; total: number; payment_method: string; created_at: string;
  clients: { name: string } | null;
  pos_sale_items: { name: string; quantity: number; price: number }[];
}
interface Session { id: string; opening_amount: number; opened_at: string; }

const FONT = "var(--font-space-grotesk),'Space Grotesk',sans-serif";
const GRAD = "linear-gradient(135deg,#fb0f05,#0027fe)";

const PM_COLOR: Record<string, string> = {
  efectivo: "#10b981", tarjeta: "#6366f1", nequi: "#0027fe", daviplata: "#f59e0b",
};

function kpiCard(label: string, value: string, sub: string, gradient = false) {
  return (
    <div style={{ background: "white", borderRadius: 16, border: "1px solid #e8e6e2", padding: "20px 22px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#8E879B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{label}</div>
      <div style={{
        fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 4,
        ...(gradient
          ? { background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }
          : { color: "#14111C" }),
      }}>{value}</div>
      <div style={{ fontSize: 12, color: "#8E879B" }}>{sub}</div>
    </div>
  );
}

// Bar chart with flex divs — no external library
function BarChart({ days, fmt }: { days: { label: string; value: number }[]; fmt: (n: number) => string }) {
  const max = Math.max(...days.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 80, padding: "0 4px" }}>
      {days.map((d, i) => (
        <div key={i} title={`${d.label}: ${fmt(d.value)}`} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <div style={{
            width: "100%", minHeight: 2,
            height: `${Math.max((d.value / max) * 68, d.value > 0 ? 4 : 1)}px`,
            background: d.value > 0 ? GRAD : "#f0eff8",
            borderRadius: "3px 3px 0 0", transition: "height 0.4s",
          }} />
          <div style={{ fontSize: 8, color: "#a0a0b0", textAlign: "center", lineHeight: 1 }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

// Horizontal payment method bars
function PayBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#14111C" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: "#f0eff8", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.5s" }} />
      </div>
    </div>
  );
}

export default function TabResumen() {
  const { tenantId, currency, locale } = useAdmin();
  const fmt = (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  const [loading, setLoading] = useState(true);
  const [sales30, setSales30] = useState<Sale[]>([]);
  const [openSession, setOpenSession] = useState<Session | null>(null);
  const [sessionBalance, setSessionBalance] = useState(0);

  const load = async () => {
    if (!tenantId) return;
    setLoading(true);

    const ago30 = new Date(); ago30.setDate(ago30.getDate() - 30);

    const [{ data: salesData }, { data: sess }] = await Promise.all([
      supabase.from("pos_sales")
        .select("id, total, payment_method, created_at, clients(name), pos_sale_items(name, quantity, price)")
        .eq("tenant_id", tenantId)
        .gte("created_at", ago30.toISOString())
        .order("created_at", { ascending: false }),
      supabase.from("cash_sessions")
        .select("id, opening_amount, opened_at")
        .eq("tenant_id", tenantId)
        .is("closed_at", null)
        .order("opened_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    setSales30((salesData as unknown as Sale[]) || []);
    setOpenSession(sess || null);

    if (sess) {
      const { data: movs } = await supabase.from("cash_movements")
        .select("type, amount").eq("session_id", sess.id);
      const ingresos = (movs || []).filter((m: any) => m.type === "ingreso").reduce((s: number, m: any) => s + Number(m.amount), 0);
      const egresos  = (movs || []).filter((m: any) => m.type === "egreso").reduce((s: number, m: any) => s + Number(m.amount), 0);
      setSessionBalance(Number(sess.opening_amount) + ingresos - egresos);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [tenantId]); // eslint-disable-line

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
      <div style={{ width: 36, height: 36, border: "3px solid #e8e6e2", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Derived metrics ──
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const todaySales = sales30.filter(s => s.created_at.slice(0, 10) === todayStr);
  const weekSales  = sales30.filter(s => new Date(s.created_at) >= weekAgo);
  const monthSales = sales30.filter(s => new Date(s.created_at) >= monthStart);

  const sum = (arr: Sale[]) => arr.reduce((s, x) => s + Number(x.total), 0);

  // Daily chart — last 14 days
  const chartDays: { label: string; value: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dStr = d.toISOString().slice(0, 10);
    const daySales = sales30.filter(s => s.created_at.slice(0, 10) === dStr);
    chartDays.push({ label: `${d.getDate()}`, value: sum(daySales) });
  }

  // Payment method breakdown (last 30 days)
  const pmTotals: Record<string, number> = {};
  sales30.forEach(s => {
    const pm = s.payment_method || "efectivo";
    pmTotals[pm] = (pmTotals[pm] || 0) + Number(s.total);
  });
  const pmTotal = Object.values(pmTotals).reduce((a, b) => a + b, 0);

  // Top 5 services
  const svcMap: Record<string, number> = {};
  sales30.forEach(s => s.pos_sale_items?.forEach((item: any) => {
    svcMap[item.name] = (svcMap[item.name] || 0) + Number(item.price) * Number(item.quantity);
  }));
  const topServices = Object.entries(svcMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxSvc = topServices[0]?.[1] || 1;

  const recentSales = sales30.slice(0, 8);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── KPI cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {kpiCard("Ingresos hoy", fmt(sum(todaySales)), `${todaySales.length} venta${todaySales.length !== 1 ? "s" : ""}`)}
        {kpiCard("Esta semana", fmt(sum(weekSales)), `${weekSales.length} ventas`, false)}
        {kpiCard("Este mes", fmt(sum(monthSales)), `${monthSales.length} ventas`, false)}
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #e8e6e2", padding: "20px 22px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#8E879B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Caja</div>
          {openSession ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 0 2px rgba(16,185,129,.2)" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#10b981" }}>Abierta</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#14111C", letterSpacing: "-0.5px" }}>{fmt(sessionBalance)}</div>
              <div style={{ fontSize: 11, color: "#8E879B", marginTop: 2 }}>balance actual</div>
            </>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#ef4444" }}>Cerrada</span>
              </div>
              <div style={{ fontSize: 13, color: "#8E879B" }}>Abre la caja desde la pestaña Caja.</div>
            </>
          )}
        </div>
      </div>

      {/* ── Chart + payment methods ── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        {/* Bar chart */}
        <div style={{ background: "white", borderRadius: 18, border: "1px solid #e8e6e2", padding: "20px 22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#14111C" }}>Ingresos últimos 14 días</div>
              <div style={{ fontSize: 12, color: "#8E879B", marginTop: 2 }}>Ventas del POS por día</div>
            </div>
            <button onClick={load} style={{ background: "none", border: "none", cursor: "pointer", color: "#8E879B", padding: 4 }}>
              <IconRefresh size={15} />
            </button>
          </div>
          <BarChart days={chartDays} fmt={fmt} />
        </div>

        {/* Payment methods */}
        <div style={{ background: "white", borderRadius: 18, border: "1px solid #e8e6e2", padding: "20px 22px" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#14111C", marginBottom: 4 }}>Método de pago</div>
          <div style={{ fontSize: 12, color: "#8E879B", marginBottom: 16 }}>Últimos 30 días · {fmt(pmTotal)}</div>
          {Object.entries(pmTotals).length === 0
            ? <div style={{ fontSize: 13, color: "#8E879B" }}>Sin ventas registradas.</div>
            : Object.entries(pmTotals).sort((a, b) => b[1] - a[1]).map(([pm, val]) => (
              <PayBar key={pm} label={pm.charAt(0).toUpperCase() + pm.slice(1)} value={val} total={pmTotal} color={PM_COLOR[pm] || "#8E879B"} />
            ))}
        </div>
      </div>

      {/* ── Top services + recent sales ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Top services */}
        <div style={{ background: "white", borderRadius: 18, border: "1px solid #e8e6e2", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e8e6e2" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#14111C" }}>Top servicios</div>
            <div style={{ fontSize: 12, color: "#8E879B", marginTop: 2 }}>Por ingresos · últimos 30 días</div>
          </div>
          <div style={{ padding: "4px 0" }}>
            {topServices.length === 0
              ? <div style={{ padding: "24px 20px", color: "#8E879B", fontSize: 13 }}>Sin datos disponibles.</div>
              : topServices.map(([name, val], i) => (
                <div key={name} style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: i < topServices.length - 1 ? "1px solid #f7f7fa" : "none" }}>
                  <div style={{ width: 24, height: 24, borderRadius: 8, background: "linear-gradient(135deg,rgba(251,15,5,.08),rgba(0,39,254,.08))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#564E66", flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#14111C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                    <div style={{ height: 4, background: "#f0eff8", borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(val / maxSvc) * 100}%`, background: GRAD, borderRadius: 2 }} />
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#14111C", flexShrink: 0 }}>{fmt(val)}</div>
                </div>
              ))}
          </div>
        </div>

        {/* Recent sales */}
        <div style={{ background: "white", borderRadius: 18, border: "1px solid #e8e6e2", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e8e6e2" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#14111C" }}>Ventas recientes</div>
            <div style={{ fontSize: 12, color: "#8E879B", marginTop: 2 }}>Últimas 8 transacciones</div>
          </div>
          <div>
            {recentSales.length === 0
              ? <div style={{ padding: "24px 20px", color: "#8E879B", fontSize: 13 }}>Sin ventas recientes.</div>
              : recentSales.map((s, i) => {
                const pm = s.payment_method || "efectivo";
                const time = new Date(s.created_at).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
                const clientName = (s.clients as any)?.name || "Sin cliente";
                return (
                  <div key={s.id} style={{ padding: "11px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: i < recentSales.length - 1 ? "1px solid #f7f7fa" : "none" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#14111C" }}>{clientName}</div>
                      <div style={{ fontSize: 11, color: "#8E879B", marginTop: 2, display: "flex", gap: 6, alignItems: "center" }}>
                        <span>{time}</span>
                        <span style={{ padding: "1px 7px", borderRadius: 20, background: `${PM_COLOR[pm] || "#8E879B"}15`, color: PM_COLOR[pm] || "#8E879B", fontWeight: 700, fontSize: 10 }}>
                          {pm.charAt(0).toUpperCase() + pm.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: "#14111C" }}>{fmt(Number(s.total))}</div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
