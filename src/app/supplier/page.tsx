"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

interface Stats {
  pendingOrders: number;
  confirmedOrders: number;
  totalRevenue: number;
  activeProducts: number;
  recentOrders: RecentOrder[];
}

interface RecentOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  tenant_name: string;
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: "Pendiente",   color: "#fbbf24", bg: "rgba(251,186,36,0.12)" },
  confirmed:  { label: "Confirmado",  color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  preparing:  { label: "Preparando",  color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  shipped:    { label: "Enviado",     color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  delivered:  { label: "Entregado",   color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  cancelled:  { label: "Cancelado",   color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

export default function SupplierDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: supplier } = await supabase
        .from("suppliers").select("id").eq("user_id", session.user.id).maybeSingle();
      if (!supplier) return;

      const sid = supplier.id;

      const [
        { count: pending },
        { count: confirmed },
        { data: orders },
        { count: products },
      ] = await Promise.all([
        supabase.from("supplier_orders").select("id", { count: "exact", head: true }).eq("supplier_id", sid).eq("status", "pending"),
        supabase.from("supplier_orders").select("id", { count: "exact", head: true }).eq("supplier_id", sid).in("status", ["confirmed", "preparing", "shipped", "delivered"]),
        supabase.from("supplier_orders").select("id, order_number, status, total, created_at, tenants(name)").eq("supplier_id", sid).in("payment_status", ["confirmed"]).order("created_at", { ascending: false }).limit(6),
        supabase.from("supplier_products").select("id", { count: "exact", head: true }).eq("supplier_id", sid).eq("is_active", true),
      ]);

      const revenueOrders = await supabase.from("supplier_orders")
        .select("total").eq("supplier_id", sid).eq("payment_status", "confirmed");

      const totalRevenue = (revenueOrders.data ?? []).reduce((s: number, o: { total: number | null }) => s + (o.total ?? 0), 0);

      const recentOrders: RecentOrder[] = (orders ?? []).map((o: Record<string, unknown>) => ({
        id: o.id as string,
        order_number: o.order_number as string,
        status: o.status as string,
        total: o.total as number,
        created_at: o.created_at as string,
        tenant_name: (o.tenants as Record<string, string> | null)?.name ?? "—",
      }));

      setStats({
        pendingOrders: pending ?? 0,
        confirmedOrders: confirmed ?? 0,
        totalRevenue,
        activeProducts: products ?? 0,
        recentOrders,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <Spinner />;

  const s = stats!;

  const kpis = [
    { label: "Pedidos pendientes", value: s.pendingOrders, icon: "⏳", accent: "#fbbf24" },
    { label: "En proceso / activos", value: s.confirmedOrders, icon: "🔄", accent: "#60a5fa" },
    { label: "Productos activos", value: s.activeProducts, icon: "📦", accent: "#a78bfa" },
    { label: "Ingresos confirmados", value: fmt(s.totalRevenue), icon: "💰", accent: "#34d399", big: true },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "white", margin: 0, letterSpacing: "-0.5px" }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "4px 0 0" }}>Resumen de tu actividad como proveedor</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 32 }}>
        {kpis.map(k => (
          <div key={k.label} style={{
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: "18px 20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>{k.icon}</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{k.label}</span>
            </div>
            <div style={{ fontSize: k.big ? 18 : 28, fontWeight: 800, color: k.accent, letterSpacing: "-0.5px" }}>
              {k.value}
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>Pedidos recientes</span>
        </div>
        {s.recentOrders.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 13 }}>
            Aún no hay pedidos con pago confirmado
          </div>
        ) : (
          <div>
            {s.recentOrders.map(order => {
              const st = STATUS_LABEL[order.status] ?? STATUS_LABEL.pending;
              return (
                <div key={order.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: 2 }}>
                      {order.order_number}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                      {order.tenant_name} · {new Date(order.created_at).toLocaleDateString("es-CO")}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
                      {fmt(order.total)}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
                      background: st.bg, color: st.color,
                    }}>
                      {st.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      <div style={{ width: 32, height: 32, border: "3px solid rgba(255,255,255,0.06)", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
