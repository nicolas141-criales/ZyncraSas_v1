"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";

interface Sale {
  id: string; total: number; payment_method: string; created_at: string;
  pos_sale_items: { name: string; quantity: number; price: number }[];
}
interface SaleWithPro {
  id: string; total: number; created_at: string;
  appointments: { professionals: { name: string } | null } | null;
}

const PM_COLOR: Record<string, string> = {
  efectivo: "#10b981", tarjeta: "#6366f1", nequi: "#0027fe", daviplata: "#f59e0b",
};
const GRAD = "linear-gradient(135deg,#fb0f05,#0027fe)";
const FONT = "var(--font-space-grotesk),'Space Grotesk',sans-serif";

function BarChart({ days, fmt }: { days: { label: string; value: number }[]; fmt: (n: number) => string }) {
  const max = Math.max(...days.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 120, padding: "0 4px" }}>
      {days.map((d, i) => (
        <div key={i} title={`${d.label}: ${fmt(d.value)}`}
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{
            width: "100%", minHeight: 2,
            height: `${Math.max((d.value / max) * 104, d.value > 0 ? 4 : 1)}px`,
            background: d.value > 0 ? GRAD : "#f0eff8",
            borderRadius: "3px 3px 0 0", transition: "height .4s",
          }} />
          <div style={{ fontSize: 7, color: "#a0a0b0", textAlign: "center", lineHeight: 1, writingMode: "horizontal-tb" }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(20,15,30,0.08)" }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#14111C" }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: "#8E879B", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function TabReportes() {
  const { tenantId, currency, locale } = useAdmin();
  const fmt = (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

  const [period, setPeriod] = useState<"7" | "30" | "90">("30");
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesPro, setSalesPro] = useState<SaleWithPro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      setLoading(true);
      const ago = new Date(); ago.setDate(ago.getDate() - parseInt(period));
      const [{ data: s1 }, { data: s2 }] = await Promise.all([
        supabase.from("pos_sales")
          .select("id, total, payment_method, created_at, pos_sale_items(name, quantity, price)")
          .eq("tenant_id", tenantId).gte("created_at", ago.toISOString()).order("created_at"),
        supabase.from("pos_sales")
          .select("id, total, created_at, appointments(professionals(name))")
          .eq("tenant_id", tenantId).gte("created_at", ago.toISOString())
          .not("appointment_id", "is", null),
      ]);
      setSales((s1 as unknown as Sale[]) || []);
      setSalesPro((s2 as unknown as SaleWithPro[]) || []);
      setLoading(false);
    })();
  }, [tenantId, period]);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
      <div style={{ width: 36, height: 36, border: "3px solid rgba(20,15,30,0.08)", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Daily chart ──
  const numDays = parseInt(period);
  const chartDays: { label: string; value: number }[] = [];
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dStr = d.toISOString().slice(0, 10);
    const val = sales.filter(s => s.created_at.slice(0, 10) === dStr).reduce((a, s) => a + Number(s.total), 0);
    const label = numDays <= 14 ? `${d.getDate()}` : numDays <= 30 ? (i % 5 === 0 ? `${d.getDate()}` : "") : (i % 10 === 0 ? `${d.getDate()}/${d.getMonth() + 1}` : "");
    chartDays.push({ label, value: val });
  }

  // ── KPIs ──
  const totalRevenue = sales.reduce((a, s) => a + Number(s.total), 0);
  const avgTicket = sales.length > 0 ? totalRevenue / sales.length : 0;
  const bestDay = chartDays.reduce((best, d) => d.value > best.value ? d : best, { label: "", value: 0 });

  // ── Payment methods ──
  const pmMap: Record<string, number> = {};
  sales.forEach(s => { const pm = s.payment_method || "efectivo"; pmMap[pm] = (pmMap[pm] || 0) + Number(s.total); });
  const pmTotal = Object.values(pmMap).reduce((a, b) => a + b, 0);
  const pmSorted = Object.entries(pmMap).sort((a, b) => b[1] - a[1]);

  // ── Top services ──
  const svcMap: Record<string, { revenue: number; qty: number }> = {};
  sales.forEach(s => s.pos_sale_items?.forEach((item: any) => {
    if (!svcMap[item.name]) svcMap[item.name] = { revenue: 0, qty: 0 };
    svcMap[item.name].revenue += Number(item.price) * Number(item.quantity);
    svcMap[item.name].qty += Number(item.quantity);
  }));
  const topSvc = Object.entries(svcMap).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 8);
  const maxSvc = topSvc[0]?.[1].revenue || 1;

  // ── Revenue by professional ──
  const proMap: Record<string, { revenue: number; sales: number }> = {};
  salesPro.forEach(s => {
    const proName = (s.appointments as any)?.professionals?.name || null;
    if (!proName) return;
    if (!proMap[proName]) proMap[proName] = { revenue: 0, sales: 0 };
    proMap[proName].revenue += Number(s.total);
    proMap[proName].sales += 1;
  });
  const proList = Object.entries(proMap).sort((a, b) => b[1].revenue - a[1].revenue);
  const maxPro = proList[0]?.[1].revenue || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: FONT }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Period selector */}
      <div style={{ display: "flex", gap: 4, background: "rgba(20,15,30,.04)", padding: 4, borderRadius: 12, width: "fit-content" }}>
        {(["7", "30", "90"] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{ padding: "8px 20px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", fontFamily: FONT, transition: "all .15s", background: period === p ? "#14111C" : "transparent", color: period === p ? "#fff" : "#564E66", boxShadow: period === p ? "0 2px 8px rgba(20,15,30,0.18)" : "none" }}>
            {p === "7" ? "7 días" : p === "30" ? "30 días" : "90 días"}
          </button>
        ))}
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {[
          ["Ingresos totales", fmt(totalRevenue), `${sales.length} ventas en ${period} días`],
          ["Ticket promedio",  fmt(avgTicket),    "Por transacción"],
          ["Mejor día",        fmt(bestDay.value), `Día ${bestDay.label}`],
        ].map(([l, v, s]) => (
          <div key={l} style={{ background: "white", borderRadius: 16, border: "1px solid rgba(20,15,30,0.08)", padding: "20px 22px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#8E879B", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{l}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#14111C", letterSpacing: "-0.5px", marginBottom: 4, background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{v}</div>
            <div style={{ fontSize: 12, color: "#8E879B" }}>{s}</div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div style={{ background: "white", borderRadius: 18, border: "1px solid rgba(20,15,30,0.08)", padding: "20px 22px" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#14111C", marginBottom: 4 }}>Ingresos por día</div>
        <div style={{ fontSize: 12, color: "#8E879B", marginBottom: 16 }}>Últimos {period} días · total {fmt(totalRevenue)}</div>
        <BarChart days={chartDays} fmt={fmt} />
      </div>

      {/* Bottom grid: services + payment + professional */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Top services */}
        <div style={{ background: "white", borderRadius: 18, border: "1px solid rgba(20,15,30,0.08)", overflow: "hidden" }}>
          <SectionTitle title="Top servicios por ingresos" sub={`Últimos ${period} días`} />
          <div style={{ padding: "8px 0" }}>
            {topSvc.length === 0
              ? <div style={{ padding: "24px 20px", color: "#8E879B", fontSize: 13 }}>Sin datos.</div>
              : topSvc.map(([name, data], i) => (
                <div key={name} style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: i < topSvc.length - 1 ? "1px solid #f7f7fa" : "none" }}>
                  <div style={{ width: 22, height: 22, borderRadius: 7, background: "linear-gradient(135deg,rgba(251,15,5,.08),rgba(0,39,254,.08))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#564E66", flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#14111C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                    <div style={{ marginTop: 3, height: 4, background: "#f0eff8", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(data.revenue / maxSvc) * 100}%`, background: GRAD, borderRadius: 2 }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#14111C" }}>{fmt(data.revenue)}</div>
                    <div style={{ fontSize: 10, color: "#8E879B" }}>{data.qty} und</div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Right column: payment methods + professionals */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Payment methods */}
          <div style={{ background: "white", borderRadius: 18, border: "1px solid rgba(20,15,30,0.08)", overflow: "hidden" }}>
            <SectionTitle title="Métodos de pago" sub={`Total ${fmt(pmTotal)}`} />
            <div style={{ padding: "16px 20px" }}>
              {pmSorted.length === 0
                ? <div style={{ color: "#8E879B", fontSize: 13 }}>Sin datos.</div>
                : pmSorted.map(([pm, val]) => {
                  const pct = pmTotal > 0 ? Math.round((val / pmTotal) * 100) : 0;
                  const color = PM_COLOR[pm] || "#8E879B";
                  return (
                    <div key={pm} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#14111C" }}>{pm.charAt(0).toUpperCase() + pm.slice(1)}</span>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>
                          <span style={{ color }}>{pct}%</span>
                          <span style={{ color: "#8E879B", fontWeight: 500, fontSize: 11, marginLeft: 6 }}>{fmt(val)}</span>
                        </span>
                      </div>
                      <div style={{ height: 6, background: "#f0eff8", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width .5s" }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Revenue by professional */}
          <div style={{ background: "white", borderRadius: 18, border: "1px solid rgba(20,15,30,0.08)", overflow: "hidden" }}>
            <SectionTitle title="Revenue por profesional" sub="Ventas vinculadas a citas" />
            <div style={{ padding: "8px 0" }}>
              {proList.length === 0
                ? <div style={{ padding: "16px 20px", color: "#8E879B", fontSize: 13 }}>Sin datos (las ventas deben estar vinculadas a citas).</div>
                : proList.map(([name, data], i) => (
                  <div key={name} style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: i < proList.length - 1 ? "1px solid #f7f7fa" : "none" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: GRAD, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                      {name.substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#14111C" }}>{name}</div>
                      <div style={{ marginTop: 3, height: 4, background: "#f0eff8", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${(data.revenue / maxPro) * 100}%`, background: GRAD, borderRadius: 2 }} />
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#14111C" }}>{fmt(data.revenue)}</div>
                      <div style={{ fontSize: 10, color: "#8E879B" }}>{data.sales} venta{data.sales !== 1 ? "s" : ""}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
