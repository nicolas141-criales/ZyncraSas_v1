"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";
import { IconRefresh } from "../ZyncraIcons";
import { AreaChart, Donut, RankBars, Empty, Skel, useCountUp, MONO, SANS, INK, DIM, MUTE, LINE, GRAD } from "../charts";

interface Sale {
  id: string; total: number; payment_method: string; created_at: string;
  clients: { name: string } | null;
  pos_sale_items: { name: string; quantity: number; price: number }[];
}
interface Session { id: string; opening_amount: number; opened_at: string; }

const PM_COLOR: Record<string, string> = {
  efectivo: "#10b981", tarjeta: "#6366f1", nequi: "#0027fe", daviplata: "#f59e0b",
};

function KpiCard({ label, raw, fmt, sub, delay = 0 }: {
  label: string; raw: number; fmt: (n: number) => string; sub: string; delay?: number;
}) {
  const [hov, setHov] = useState(false);
  const v = useCountUp(raw);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background: "white", borderRadius: 16, border: `1px solid ${LINE}`, padding: "16px 18px",
      boxShadow: hov ? "0 12px 32px rgba(20,15,30,0.09)" : "0 1px 2px rgba(20,15,30,0.03)",
      transform: hov ? "translateY(-2px)" : "none",
      transition: "transform .2s ease, box-shadow .2s ease",
      animation: `znFadeUp .5s cubic-bezier(.22,1,.36,1) both ${delay}s`,
    }}>
      <div style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 600, color: MUTE, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 23, fontWeight: 700, letterSpacing: "-0.7px", color: INK, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{fmt(v)}</div>
      <div style={{ fontSize: 11.5, color: MUTE, marginTop: 7 }}>{sub}</div>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: SANS }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
        {[0, 1, 2, 3].map(i => <Skel key={i} h={106} r={16} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
        <Skel h={250} r={16} />
        <Skel h={250} r={16} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Skel h={220} r={16} />
        <Skel h={220} r={16} />
      </div>
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
  const pmData = Object.entries(pmTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([pm, val]) => ({
      label: pm.charAt(0).toUpperCase() + pm.slice(1),
      value: val,
      color: PM_COLOR[pm] || "#8E879B",
    }));

  // Top 5 services
  const svcMap: Record<string, number> = {};
  sales30.forEach(s => s.pos_sale_items?.forEach((item: any) => {
    svcMap[item.name] = (svcMap[item.name] || 0) + Number(item.price) * Number(item.quantity);
  }));
  const topServices = Object.entries(svcMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const recentSales = sales30.slice(0, 8);

  const cardSt: React.CSSProperties = {
    background: "white", borderRadius: 16, border: `1px solid ${LINE}`,
    boxShadow: "0 1px 2px rgba(20,15,30,0.03)", overflow: "hidden",
  };
  const headSt: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: `1px solid ${LINE}`,
  };

  const head = (title: string, sub: string, aside?: React.ReactNode) => (
    <div style={headSt}>
      <span style={{ width: 7, height: 7, borderRadius: 2.5, background: GRAD, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: INK }}>{title}</div>
        <div style={{ fontSize: 10.5, color: MUTE, marginTop: 1 }}>{sub}</div>
      </div>
      {aside}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: SANS }}>

      {/* ── KPI cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
        <KpiCard label="Ingresos hoy" raw={sum(todaySales)} fmt={fmt} sub={`${todaySales.length} venta${todaySales.length !== 1 ? "s" : ""}`} />
        <KpiCard label="Esta semana" raw={sum(weekSales)} fmt={fmt} sub={`${weekSales.length} ventas`} delay={0.05} />
        <KpiCard label="Este mes" raw={sum(monthSales)} fmt={fmt} sub={`${monthSales.length} ventas`} delay={0.1} />

        {/* Estado de caja */}
        <div style={{ ...cardSt, padding: "16px 18px", overflow: "visible", animation: "znFadeUp .5s cubic-bezier(.22,1,.36,1) both .15s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 600, color: MUTE, textTransform: "uppercase", letterSpacing: ".1em" }}>Caja</span>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5, padding: "2.5px 8px", borderRadius: 20,
              fontSize: 10, fontWeight: 700, fontFamily: MONO, textTransform: "uppercase", letterSpacing: ".05em",
              background: openSession ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.08)",
              color: openSession ? "#059669" : "#dc2626",
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: "50%", background: "currentcolor",
                animation: openSession ? "znPulse 1.6s ease-in-out infinite" : "none",
              }} />
              {openSession ? "Abierta" : "Cerrada"}
            </span>
          </div>
          {openSession ? (
            <>
              <div style={{ fontSize: 23, fontWeight: 700, color: INK, letterSpacing: "-0.7px", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{fmt(sessionBalance)}</div>
              <div style={{ fontSize: 11.5, color: MUTE, marginTop: 7 }}>balance actual</div>
            </>
          ) : (
            <div style={{ fontSize: 12.5, color: MUTE, lineHeight: 1.5 }}>Abre la caja desde la pestaña <strong style={{ color: DIM }}>Caja</strong>.</div>
          )}
        </div>
      </div>

      {/* ── Chart + payment methods ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 }}>
        <div style={{ ...cardSt, animation: "znFadeUp .5s cubic-bezier(.22,1,.36,1) both .18s" }}>
          {head("Ingresos últimos 14 días", "Ventas del POS por día",
            <button onClick={load} title="Actualizar" style={{ background: "none", border: "none", cursor: "pointer", color: MUTE, padding: 4, display: "inline-flex" }}>
              <IconRefresh size={14} />
            </button>
          )}
          <div style={{ padding: "14px 16px 10px" }}>
            <AreaChart data={chartDays} fmt={fmt} height={185} />
          </div>
        </div>

        <div style={{ ...cardSt, animation: "znFadeUp .5s cubic-bezier(.22,1,.36,1) both .22s" }}>
          {head("Medios de pago", `Últimos 30 días · ${fmt(pmTotal)}`)}
          <div style={{ padding: "16px 18px" }}>
            <Donut data={pmData} fmt={fmt} centerLabel="total" />
          </div>
        </div>
      </div>

      {/* ── Top services + recent sales ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 }}>
        <div style={{ ...cardSt, animation: "znFadeUp .5s cubic-bezier(.22,1,.36,1) both .26s" }}>
          {head("Top servicios", "Por ingresos · últimos 30 días")}
          <div style={{ padding: "16px 18px" }}>
            <RankBars items={topServices.map(([name, val]) => ({ label: name, value: val }))} fmt={fmt} />
          </div>
        </div>

        <div style={{ ...cardSt, animation: "znFadeUp .5s cubic-bezier(.22,1,.36,1) both .3s" }}>
          {head("Ventas recientes", "Últimas 8 transacciones")}
          <div>
            {recentSales.length === 0
              ? <Empty msg="Sin ventas recientes." />
              : recentSales.map((s, i) => {
                const pm = s.payment_method || "efectivo";
                const time = new Date(s.created_at).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
                const clientName = (s.clients as any)?.name || "Sin cliente";
                return (
                  <div key={s.id} style={{
                    padding: "10px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
                    borderBottom: i < recentSales.length - 1 ? "1px solid rgba(20,15,30,0.05)" : "none",
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clientName}</div>
                      <div style={{ fontSize: 11, color: MUTE, marginTop: 2, display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontFamily: MONO }}>{time}</span>
                        <span style={{
                          padding: "1px 7px", borderRadius: 20, fontWeight: 600, fontSize: 9.5,
                          fontFamily: MONO, textTransform: "uppercase", letterSpacing: ".04em",
                          background: `${PM_COLOR[pm] || "#8E879B"}15`, color: PM_COLOR[pm] || "#8E879B",
                        }}>
                          {pm}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontFamily: MONO, fontWeight: 600, fontSize: 13, color: INK, flexShrink: 0 }}>{fmt(Number(s.total))}</div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
