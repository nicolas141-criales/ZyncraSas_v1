"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  product_price: number;
  subtotal: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_address: string | null;
  notes: string | null;
  payment_method: string | null;
  payment_proof_url: string | null;
  created_at: string;
  tenant_name: string;
  items?: OrderItem[];
}

const STATUS_FLOW: Record<string, string> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "shipped",
  shipped: "delivered",
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "Pendiente",   color: "#fbbf24", bg: "rgba(251,186,36,0.12)" },
  confirmed: { label: "Confirmado",  color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  preparing: { label: "Preparando",  color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  shipped:   { label: "Enviado",     color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  delivered: { label: "Entregado",   color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  cancelled: { label: "Cancelado",   color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

const PAY_META: Record<string, { label: string; color: string }> = {
  pending:        { label: "Sin pago",       color: "rgba(255,255,255,0.3)" },
  proof_uploaded: { label: "Comprobante",    color: "#fbbf24" },
  confirmed:      { label: "Pago confirmado",color: "#34d399" },
  refunded:       { label: "Reembolsado",    color: "#f87171" },
};

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

type Filter = "all" | "pending" | "confirmed" | "preparing" | "shipped" | "delivered" | "cancelled";

export default function SupplierOrdersPage() {
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: s } = await supabase.from("suppliers").select("id").eq("user_id", session.user.id).maybeSingle();
      if (s) setSupplierId(s.id);
    }
    init();
  }, []);

  const loadOrders = useCallback(async () => {
    if (!supplierId) return;
    setLoading(true);
    const { data } = await supabase
      .from("supplier_orders")
      .select("*, tenants(name)")
      .eq("supplier_id", supplierId)
      .order("created_at", { ascending: false });

    setOrders((data ?? []).map((o: Record<string, unknown>) => ({
      ...o,
      tenant_name: (o.tenants as Record<string, string> | null)?.name ?? "—",
    })) as Order[]);
    setLoading(false);
  }, [supplierId]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const loadItems = async (orderId: string) => {
    if (expanded === orderId) { setExpanded(null); return; }
    const { data } = await supabase.from("supplier_order_items").select("*").eq("order_id", orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, items: data ?? [] } : o));
    setExpanded(orderId);
  };

  const advanceStatus = async (order: Order) => {
    const next = STATUS_FLOW[order.status];
    if (!next) return;
    setUpdating(order.id);
    await supabase.from("supplier_orders").update({ status: next }).eq("id", order.id);
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: next } : o));
    setUpdating(null);
  };

  const confirmPayment = async (orderId: string) => {
    setUpdating(orderId);
    await supabase.from("supplier_orders").update({ payment_status: "confirmed" }).eq("id", orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: "confirmed" } : o));
    setUpdating(null);
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm("¿Cancelar este pedido?")) return;
    setUpdating(orderId);
    await supabase.from("supplier_orders").update({ status: "cancelled" }).eq("id", orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "cancelled" } : o));
    setUpdating(null);
  };

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  const counts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "white", margin: 0 }}>Pedidos</h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "4px 0 0" }}>
          Gestiona los pedidos que hacen los negocios a tu empresa
        </p>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 20 }}>
        {(["all", "pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"] as Filter[]).map(f => {
          const meta = f === "all" ? { label: "Todos", color: "#fff", bg: "rgba(255,255,255,0.08)" } : { ...STATUS_META[f], bg: STATUS_META[f].bg };
          const count = f === "all" ? orders.length : (counts[f] ?? 0);
          const active = filter === f;
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "6px 13px", borderRadius: 8, border: "1px solid",
              fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all .15s",
              borderColor: active ? meta.color : "rgba(255,255,255,0.1)",
              background: active ? meta.bg : "transparent",
              color: active ? meta.color : "rgba(255,255,255,0.4)",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              {meta.label}
              {count > 0 && <span style={{ opacity: 0.8 }}>({count})</span>}
            </button>
          );
        })}
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.25)", fontSize: 14 }}>
          No hay pedidos {filter !== "all" ? `con estado "${STATUS_META[filter]?.label}"` : "aún"}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(order => {
            const sm = STATUS_META[order.status] ?? STATUS_META.pending;
            const pm = PAY_META[order.payment_status] ?? PAY_META.pending;
            const nextStatus = STATUS_FLOW[order.status];
            const isOpen = expanded === order.id;

            return (
              <div key={order.id} style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14, overflow: "hidden",
              }}>
                {/* Header */}
                <div style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "white" }}>{order.order_number}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: sm.bg, color: sm.color }}>
                          {sm.label}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: pm.color }}>· {pm.label}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                        {order.tenant_name} · {new Date(order.created_at).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#34d399" }}>{fmt(order.total)}</div>
                        {order.shipping_cost > 0 && (
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>+ {fmt(order.shipping_cost)} envío</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                    <button onClick={() => loadItems(order.id)} style={btnGhost}>
                      {isOpen ? "▲ Ocultar ítems" : "▼ Ver ítems"}
                    </button>

                    {order.payment_status === "proof_uploaded" && (
                      <button onClick={() => confirmPayment(order.id)} disabled={updating === order.id} style={{ ...btnGhost, color: "#34d399", borderColor: "rgba(52,211,153,0.3)" }}>
                        ✓ Confirmar pago
                      </button>
                    )}

                    {nextStatus && order.status !== "cancelled" && (
                      <button onClick={() => advanceStatus(order)} disabled={updating === order.id} style={{ ...btnGhost, color: "#60a5fa", borderColor: "rgba(96,165,250,0.3)" }}>
                        → Marcar como {STATUS_META[nextStatus]?.label}
                      </button>
                    )}

                    {["pending", "confirmed"].includes(order.status) && (
                      <button onClick={() => cancelOrder(order.id)} disabled={updating === order.id} style={{ ...btnGhost, color: "#f87171", borderColor: "rgba(248,113,113,0.2)" }}>
                        Cancelar
                      </button>
                    )}

                    {order.payment_proof_url && (
                      <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer" style={{ ...btnGhost, textDecoration: "none", color: "#fbbf24", borderColor: "rgba(251,186,36,0.3)" }}>
                        📎 Ver comprobante
                      </a>
                    )}
                  </div>
                </div>

                {/* Items expandibles */}
                {isOpen && order.items && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
                    {order.shipping_address && (
                      <div style={{ padding: "10px 20px 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                        📍 Enviar a: {order.shipping_address}
                      </div>
                    )}
                    {order.notes && (
                      <div style={{ padding: "6px 20px 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                        📝 Nota: {order.notes}
                      </div>
                    )}
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          {["Producto", "Precio unit.", "Cant.", "Subtotal"].map(h => (
                            <th key={h} style={{ padding: "10px 20px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map(item => (
                          <tr key={item.id}>
                            <td style={{ padding: "10px 20px", fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>{item.product_name}</td>
                            <td style={{ padding: "10px 20px", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{fmt(item.product_price)}</td>
                            <td style={{ padding: "10px 20px", fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>{item.quantity}</td>
                            <td style={{ padding: "10px 20px", fontSize: 13, color: "#34d399", fontWeight: 700 }}>{fmt(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
      <div style={{ width: 28, height: 28, border: "3px solid rgba(255,255,255,0.06)", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const btnGhost: React.CSSProperties = {
  padding: "7px 12px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 600,
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.6)", transition: "all .15s",
};
