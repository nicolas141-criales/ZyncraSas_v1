"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";
import { IconSearch } from "../ZyncraIcons";

interface Sale {
  id: string; total: number; subtotal: number; discount_type: string | null;
  discount_value: number; payment_method: string; created_at: string; note: string | null;
  clients: { name: string; phone: string | null } | null;
  pos_sale_items: { name: string; quantity: number; price: number }[];
}

const PM_COLOR: Record<string, string> = {
  efectivo: "#10b981", tarjeta: "#6366f1", nequi: "#0027fe", daviplata: "#f59e0b",
};
const FONT = "var(--font-space-grotesk),'Space Grotesk',sans-serif";

export default function TabVentas() {
  const { tenantId, currency, locale } = useAdmin();
  const fmt = (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pmFilter, setPmFilter] = useState("todos");
  const [days, setDays] = useState("30");

  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      setLoading(true);
      const ago = new Date(); ago.setDate(ago.getDate() - parseInt(days));
      let q = supabase.from("pos_sales")
        .select("id, total, subtotal, discount_type, discount_value, payment_method, created_at, note, clients(name, phone), pos_sale_items(name, quantity, price)")
        .eq("tenant_id", tenantId)
        .gte("created_at", ago.toISOString())
        .order("created_at", { ascending: false });
      if (pmFilter !== "todos") q = q.eq("payment_method", pmFilter);
      const { data } = await q;
      setSales((data as unknown as Sale[]) || []);
      setLoading(false);
    })();
  }, [tenantId, days, pmFilter]);

  const totalRevenue = sales.reduce((s, x) => s + Number(x.total), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, fontFamily: FONT }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 4, background: "rgba(20,15,30,.04)", padding: 4, borderRadius: 12 }}>
          {["7", "30", "90"].map(d => (
            <button key={d} onClick={() => setDays(d)} style={{ padding: "7px 16px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", fontFamily: FONT, transition: "all .15s", background: days === d ? "#14111C" : "transparent", color: days === d ? "#fff" : "#564E66" }}>
              {d === "7" ? "7 días" : d === "30" ? "30 días" : "90 días"}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4, background: "rgba(20,15,30,.04)", padding: 4, borderRadius: 12 }}>
          {["todos", "efectivo", "nequi", "daviplata", "tarjeta"].map(pm => (
            <button key={pm} onClick={() => setPmFilter(pm)} style={{ padding: "7px 14px", borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", fontFamily: FONT, transition: "all .15s", background: pmFilter === pm ? (PM_COLOR[pm] || "#14111C") : "transparent", color: pmFilter === pm ? "#fff" : "#564E66" }}>
              {pm.charAt(0).toUpperCase() + pm.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", fontSize: 13, color: "#8E879B" }}>
          <strong style={{ color: "#14111C" }}>{sales.length}</strong> ventas · <strong style={{ color: "#14111C" }}>{fmt(totalRevenue)}</strong>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: 18, border: "1px solid rgba(20,15,30,0.08)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <div style={{ width: 36, height: 36, border: "3px solid rgba(20,15,30,0.08)", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
          </div>
        ) : sales.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🧾</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#14111C", marginBottom: 4 }}>Sin ventas en este período</div>
            <div style={{ fontSize: 13, color: "#8E879B" }}>Ajusta el filtro de fecha o registra ventas desde el POS.</div>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 100px 100px 40px", gap: 12, padding: "10px 20px", borderBottom: "1px solid #f0eeeb", fontSize: 11, fontWeight: 700, color: "#8E879B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <span>Cliente · Items</span><span>Fecha y hora</span><span>Método</span><span style={{ textAlign: "right" }}>Total</span><span />
            </div>
            {sales.map((s, i) => {
              const isOpen = expanded === s.id;
              const pm = s.payment_method || "efectivo";
              const dt = new Date(s.created_at);
              const dateStr = dt.toLocaleDateString(locale, { day: "numeric", month: "short" });
              const timeStr = dt.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
              const clientName = (s.clients as any)?.name || "Sin cliente";
              const itemCount = s.pos_sale_items?.length || 0;

              return (
                <div key={s.id}>
                  <div
                    onClick={() => setExpanded(isOpen ? null : s.id)}
                    style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 100px 100px 40px", gap: 12, padding: "14px 20px", alignItems: "center", borderBottom: "1px solid #f7f7fa", cursor: "pointer", background: isOpen ? "rgba(0,39,254,.02)" : "transparent", transition: "background .15s" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#14111C" }}>{clientName}</div>
                      <div style={{ fontSize: 11, color: "#8E879B", marginTop: 2 }}>{itemCount} ítem{itemCount !== 1 ? "s" : ""}</div>
                    </div>
                    <div style={{ fontSize: 13, color: "#564E66" }}>{dateStr} · <span style={{ color: "#8E879B" }}>{timeStr}</span></div>
                    <div>
                      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${PM_COLOR[pm] || "#8E879B"}15`, color: PM_COLOR[pm] || "#8E879B" }}>
                        {pm.charAt(0).toUpperCase() + pm.slice(1)}
                      </span>
                    </div>
                    <div style={{ textAlign: "right", fontWeight: 700, fontSize: 14, color: "#14111C" }}>{fmt(Number(s.total))}</div>
                    <div style={{ textAlign: "center", fontSize: 14, color: "#8E879B", transition: "transform .15s", transform: isOpen ? "rotate(180deg)" : "none" }}>▾</div>
                  </div>

                  {isOpen && (
                    <div style={{ padding: "0 20px 16px 20px", background: "rgba(0,39,254,.015)", borderBottom: "1px solid rgba(20,15,30,0.08)" }}>
                      <div style={{ paddingTop: 12 }}>
                        {s.pos_sale_items?.map((item: any, j: number) => (
                          <div key={j} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: j < s.pos_sale_items.length - 1 ? "1px solid #f0eeeb" : "none", fontSize: 13, color: "#14111C" }}>
                            <span>{item.quantity > 1 ? `${item.quantity}× ` : ""}{item.name}</span>
                            <span style={{ fontWeight: 700 }}>{fmt(Number(item.price) * Number(item.quantity))}</span>
                          </div>
                        ))}
                        {(s.discount_value > 0) && (
                          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, color: "#ef4444" }}>
                            <span>Descuento {s.discount_type === "percentage" ? `${s.discount_value}%` : ""}</span>
                            <span>−{fmt(Number(s.subtotal) - Number(s.total))}</span>
                          </div>
                        )}
                        {s.note && <div style={{ marginTop: 8, fontSize: 12, color: "#8E879B", fontStyle: "italic" }}>Nota: {s.note}</div>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
