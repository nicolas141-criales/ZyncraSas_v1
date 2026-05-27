"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";
import { IconCreditCard, IconPlus, IconX, IconSearch } from "../ZyncraIcons";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
}

interface Client {
  id: string;
  name: string;
  phone: string;
}

interface CartItem {
  key: string;
  serviceId: string | null;
  name: string;
  price: number;
  qty: number;
}

interface Sale {
  id: string;
  client_id: string | null;
  subtotal: number;
  discount_type: string | null;
  discount_value: number;
  total: number;
  payment_method: string;
  note: string | null;
  created_at: string;
  clients: { name: string; phone: string } | null;
  pos_sale_items: { name: string; price: number; quantity: number }[];
}

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

const PAYMENT_METHODS = [
  { key: "efectivo",  label: "Efectivo",  color: "#10b981" },
  { key: "tarjeta",   label: "Tarjeta",   color: "#6366f1" },
  { key: "nequi",     label: "Nequi",     color: "#0027fe" },
  { key: "daviplata", label: "Daviplata", color: "#f59e0b" },
];

// â”€â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 13px", border: "1.5px solid #e8e6e2",
  borderRadius: 10, fontSize: 14, background: "#f7f5f2", color: "#111118",
  fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none", boxSizing: "border-box",
};

const lbl: React.CSSProperties = {
  display: "block", fontWeight: 600, fontSize: 11, color: "#6b6b80",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em",
};

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function PosPage() {
  const { tenantId } = useAdmin();
  const [tab, setTab] = useState<"cobrar" | "historial">("cobrar");

  // Catalog
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [search, setSearch] = useState("");

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState("");
  const [clientResults, setClientResults] = useState<Client[]>([]);
  const [showClientDrop, setShowClientDrop] = useState(false);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [saleNote, setSaleNote] = useState("");
  const [charging, setCharging] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Free item modal
  const [showFreeItem, setShowFreeItem] = useState(false);
  const [freeItemName, setFreeItemName] = useState("");
  const [freeItemPrice, setFreeItemPrice] = useState("");

  // History
  const [sales, setSales] = useState<Sale[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [expandedSale, setExpandedSale] = useState<string | null>(null);

  const clientRef = useRef<HTMLDivElement>(null);

  // â”€â”€ Load services â”€â”€
  useEffect(() => {
    if (!tenantId) return;
    supabase.from("services").select("id,name,price,duration_minutes")
      .eq("tenant_id", tenantId).order("name")
      .then(({ data }) => { setServices(data || []); setLoadingServices(false); });
  }, [tenantId]);

  // â”€â”€ Load history â”€â”€
  const loadHistory = useCallback(async (tid: string) => {
    setLoadingHistory(true);
    const { data } = await supabase
      .from("pos_sales")
      .select("*, clients(name,phone), pos_sale_items(name,price,quantity)")
      .eq("tenant_id", tid)
      .order("created_at", { ascending: false })
      .limit(50);
    setSales((data as any) || []);
    setLoadingHistory(false);
  }, []);

  useEffect(() => {
    if (tenantId && tab === "historial") loadHistory(tenantId);
  }, [tenantId, tab, loadHistory]);

  // â”€â”€ Client search â”€â”€
  useEffect(() => {
    if (!tenantId || clientSearch.length < 2) { setClientResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase.from("clients").select("id,name,phone")
        .eq("tenant_id", tenantId)
        .or(`name.ilike.%${clientSearch}%,phone.ilike.%${clientSearch}%`)
        .limit(6);
      setClientResults(data || []);
      setShowClientDrop(true);
    }, 300);
    return () => clearTimeout(t);
  }, [clientSearch, tenantId]);

  // â”€â”€ Cart helpers â”€â”€
  const addToCart = (svc: Service) => {
    setCart(prev => {
      const existing = prev.find(i => i.serviceId === svc.id);
      if (existing) return prev.map(i => i.serviceId === svc.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { key: svc.id, serviceId: svc.id, name: svc.name, price: svc.price, qty: 1 }];
    });
  };

  const addFreeItem = () => {
    const price = parseFloat(freeItemPrice.replace(/[^0-9.]/g, ""));
    if (!freeItemName.trim() || isNaN(price) || price <= 0) return;
    const key = `free-${Date.now()}`;
    setCart(prev => [...prev, { key, serviceId: null, name: freeItemName.trim(), price, qty: 1 }]);
    setFreeItemName(""); setFreeItemPrice(""); setShowFreeItem(false);
  };

  const updateQty = (key: string, delta: number) => {
    setCart(prev => prev
      .map(i => i.key === key ? { ...i, qty: i.qty + delta } : i)
      .filter(i => i.qty > 0));
  };

  const removeItem = (key: string) => setCart(prev => prev.filter(i => i.key !== key));

  // â”€â”€ Totals â”€â”€
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discountVal = parseFloat(discountValue) || 0;
  const discountAmount = discountType === "percentage"
    ? (subtotal * Math.min(discountVal, 100)) / 100
    : Math.min(discountVal, subtotal);
  const total = Math.max(subtotal - discountAmount, 0);

  // â”€â”€ Charge â”€â”€
  const handleCharge = async () => {
    if (!tenantId || cart.length === 0) return;
    setCharging(true);
    const { data: sale, error } = await supabase.from("pos_sales").insert({
      tenant_id: tenantId,
      client_id: client?.id || null,
      subtotal,
      discount_type: discountValue ? discountType : null,
      discount_value: discountVal,
      total,
      payment_method: paymentMethod,
      note: saleNote.trim() || null,
    }).select().single();

    if (error || !sale) { setCharging(false); return; }

    await supabase.from("pos_sale_items").insert(
      cart.map(i => ({ sale_id: sale.id, service_id: i.serviceId, name: i.name, price: i.price, quantity: i.qty }))
    );

    setCharging(false);
    setSuccessMsg(`Venta de ${fmt(total)} registrada con Ã©xito.`);
    setCart([]); setClient(null); setClientSearch(""); setDiscountValue(""); setSaleNote("");
    setPaymentMethod("efectivo");
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  // â”€â”€ Filtered services â”€â”€
  const filtered = services.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  // â”€â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: "-0.5px", color: "#111118" }}>Sistema POS</h1>
          <p style={{ color: "#a0a0b0", fontSize: 13, marginTop: 3 }}>Cobra servicios y productos en el mostrador.</p>
        </div>
        <div style={{ display: "flex", gap: 4, background: "#f0eeeb", padding: 4, borderRadius: 14 }}>
          {(["cobrar", "historial"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
              cursor: "pointer", border: "none", fontFamily: "'Plus Jakarta Sans', sans-serif",
              background: tab === t ? "linear-gradient(135deg, #fb0f05, #0027fe)" : "transparent",
              color: tab === t ? "#fff" : "#6b6b80",
              boxShadow: tab === t ? "0 2px 8px rgba(251,15,5,0.25)" : "none",
              transition: "all 0.15s",
            }}>
              {t === "cobrar" ? "Cobrar" : "Historial"}
            </button>
          ))}
        </div>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div style={{ padding: "12px 18px", borderRadius: 12, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981", fontWeight: 700, fontSize: 14, animation: "fadeIn .2s ease" }}>
          {successMsg}
        </div>
      )}

      {/* â”€â”€ TAB: Cobrar â”€â”€ */}
      {tab === "cobrar" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, alignItems: "start" }}>

          {/* Left: Catalog */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Search + free item */}
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1, position: "relative" }}>
                <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#a0a0b0" }}>
                  <IconSearch size={15} />
                </div>
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar servicio..."
                  style={{ ...inp, paddingLeft: 36 }}
                />
              </div>
              <button onClick={() => { setFreeItemName(""); setFreeItemPrice(""); setShowFreeItem(true); }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, border: "1.5px solid rgba(251,15,5,0.3)", background: "rgba(251,15,5,0.06)", color: "#fb0f05", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: "nowrap" }}>
                <IconPlus size={14} /> Ãtem libre
              </button>
            </div>

            {/* Services grid */}
            {loadingServices ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                <div style={{ width: 32, height: 32, border: "3px solid #e8e6e2", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#a0a0b0", fontSize: 14 }}>
                {search ? "Sin resultados." : "No hay servicios configurados."}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                {filtered.map(svc => {
                  const inCart = cart.find(i => i.serviceId === svc.id);
                  return (
                    <button key={svc.id} onClick={() => addToCart(svc)} style={{
                      background: "white", borderRadius: 16, padding: "16px 18px",
                      border: inCart ? "2px solid rgba(251,15,5,0.4)" : "1.5px solid #e8e6e2",
                      cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                      boxShadow: inCart ? "0 0 0 3px rgba(251,15,5,0.08)" : "none",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#111118", marginBottom: 6 }}>{svc.name}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, background: "linear-gradient(135deg, #fb0f05, #0027fe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        {fmt(svc.price)}
                      </div>
                      <div style={{ fontSize: 11, color: "#a0a0b0", marginTop: 4 }}>{svc.duration_minutes} min</div>
                      {inCart && (
                        <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: "#fb0f05" }}>
                          Ã— {inCart.qty} en carrito
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Cart */}
          <div style={{ background: "white", borderRadius: 20, border: "1px solid #e8e6e2", overflow: "hidden", position: "sticky", top: 20 }}>
            {/* Cart header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e8e6e2", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05" }}>
                <IconCreditCard size={16} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#111118" }}>
                Carrito {cart.length > 0 && <span style={{ color: "#fb0f05" }}>({cart.length})</span>}
              </div>
            </div>

            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Client selector */}
              <div style={{ position: "relative" }} ref={clientRef}>
                <label style={lbl}>Cliente (opcional)</label>
                {client ? (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", borderRadius: 10, background: "#f7f5f2", border: "1.5px solid #e8e6e2" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#111118" }}>{client.name}</div>
                      <div style={{ fontSize: 11, color: "#a0a0b0" }}>{client.phone}</div>
                    </div>
                    <button onClick={() => { setClient(null); setClientSearch(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#a0a0b0", padding: 2 }}>
                      <IconX size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <input type="text" value={clientSearch} onChange={e => { setClientSearch(e.target.value); setShowClientDrop(true); }}
                      onFocus={() => clientSearch.length >= 2 && setShowClientDrop(true)}
                      onBlur={() => setTimeout(() => setShowClientDrop(false), 200)}
                      placeholder="Nombre o telÃ©fono..." style={inp} />
                    {showClientDrop && clientResults.length > 0 && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid #e8e6e2", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 50, overflow: "hidden", marginTop: 4 }}>
                        {clientResults.map(c => (
                          <button key={c.id} onMouseDown={() => { setClient(c); setClientSearch(""); setShowClientDrop(false); }}
                            style={{ display: "block", width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "'Plus Jakarta Sans', sans-serif", borderBottom: "1px solid #f0eeeb" }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: "#111118" }}>{c.name}</div>
                            <div style={{ fontSize: 11, color: "#a0a0b0" }}>{c.phone}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Cart items */}
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#a0a0b0", fontSize: 13 }}>
                  Selecciona servicios del catÃ¡logo.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {cart.map(item => (
                    <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 10, background: "#f7f5f2" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 12, color: "#111118", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: "#a0a0b0" }}>{fmt(item.price)} c/u</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        <button onClick={() => updateQty(item.key, -1)} style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid #e8e6e2", background: "white", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#6b6b80", display: "flex", alignItems: "center", justifyContent: "center" }}>âˆ’</button>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#111118", minWidth: 18, textAlign: "center" }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.key, 1)} style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid #e8e6e2", background: "white", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#6b6b80", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                        <button onClick={() => removeItem(item.key)} style={{ width: 26, height: 26, borderRadius: 7, border: "none", background: "rgba(239,68,68,0.08)", cursor: "pointer", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <IconX size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Discount */}
              {cart.length > 0 && (
                <div>
                  <label style={lbl}>Descuento</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ display: "flex", gap: 4, background: "#f0eeeb", padding: 3, borderRadius: 8 }}>
                      {(["percentage", "fixed"] as const).map(t => (
                        <button key={t} onClick={() => setDiscountType(t)} style={{
                          padding: "6px 10px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 700,
                          cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                          background: discountType === t ? "white" : "transparent",
                          color: discountType === t ? "#fb0f05" : "#6b6b80",
                          boxShadow: discountType === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                        }}>
                          {t === "percentage" ? "%" : "COP"}
                        </button>
                      ))}
                    </div>
                    <input type="number" min={0} max={discountType === "percentage" ? 100 : undefined}
                      value={discountValue} onChange={e => setDiscountValue(e.target.value)}
                      placeholder={discountType === "percentage" ? "0%" : "0"}
                      style={{ ...inp, flex: 1 }} />
                  </div>
                </div>
              )}

              {/* Totals */}
              {cart.length > 0 && (
                <div style={{ borderTop: "1px solid #f0eeeb", paddingTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: "#6b6b80" }}>Subtotal</span>
                    <span style={{ fontWeight: 600, color: "#111118" }}>{fmt(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: "#6b6b80" }}>Descuento</span>
                      <span style={{ fontWeight: 600, color: "#ef4444" }}>âˆ’{fmt(discountAmount)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 800, marginTop: 4 }}>
                    <span style={{ color: "#111118" }}>Total</span>
                    <span style={{ background: "linear-gradient(135deg, #fb0f05, #0027fe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      {fmt(total)}
                    </span>
                  </div>
                </div>
              )}

              {/* Payment method */}
              {cart.length > 0 && (
                <div>
                  <label style={lbl}>MÃ©todo de pago</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {PAYMENT_METHODS.map(pm => (
                      <button key={pm.key} onClick={() => setPaymentMethod(pm.key)} style={{
                        padding: "9px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                        cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                        border: paymentMethod === pm.key ? `1.5px solid ${pm.color}` : "1.5px solid #e8e6e2",
                        background: paymentMethod === pm.key ? `${pm.color}15` : "white",
                        color: paymentMethod === pm.key ? pm.color : "#6b6b80",
                        transition: "all 0.15s",
                      }}>
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Note */}
              {cart.length > 0 && (
                <div>
                  <label style={lbl}>Nota (opcional)</label>
                  <input type="text" value={saleNote} onChange={e => setSaleNote(e.target.value)}
                    placeholder="Ej. Pago parcial, abono..." style={inp} />
                </div>
              )}

              {/* Charge button */}
              <button onClick={handleCharge} disabled={cart.length === 0 || charging}
                style={{
                  width: "100%", padding: 14, borderRadius: 12, border: "none", fontSize: 15, fontWeight: 800,
                  cursor: (cart.length === 0 || charging) ? "not-allowed" : "pointer",
                  background: (cart.length === 0 || charging) ? "#e8e6e2" : "linear-gradient(135deg, #fb0f05, #0027fe)",
                  color: (cart.length === 0 || charging) ? "#a0a0b0" : "#fff",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  boxShadow: (cart.length === 0 || charging) ? "none" : "0 4px 16px rgba(251,15,5,0.3)",
                  transition: "all 0.15s",
                }}>
                {charging ? "Procesando..." : cart.length === 0 ? "Agrega Ã­tems al carrito" : `Cobrar ${fmt(total)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ TAB: Historial â”€â”€ */}
      {tab === "historial" && (
        <div style={{ background: "white", borderRadius: 18, border: "1px solid #e8e6e2", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: "1px solid #e8e6e2" }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05" }}>
              <IconCreditCard size={16} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#111118" }}>Historial de ventas</div>
          </div>
          {loadingHistory ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ width: 32, height: 32, border: "3px solid #e8e6e2", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto" }} />
            </div>
          ) : sales.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#a0a0b0", fontSize: 14 }}>
              Sin ventas registradas aÃºn.
            </div>
          ) : (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 90px 80px 110px", gap: 12, padding: "10px 20px", borderBottom: "1px solid #f0eeeb", fontSize: 11, fontWeight: 700, color: "#a0a0b0", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <span>Fecha</span><span>Cliente</span><span>MÃ©todo</span><span style={{ textAlign: "center" }}>Ãtems</span><span style={{ textAlign: "right" }}>Total</span>
              </div>
              {sales.map((s, i) => (
                <div key={s.id}>
                  <div onClick={() => setExpandedSale(expandedSale === s.id ? null : s.id)}
                    style={{
                      display: "grid", gridTemplateColumns: "1.2fr 1fr 90px 80px 110px",
                      gap: 12, padding: "13px 20px", alignItems: "center", cursor: "pointer",
                      borderBottom: expandedSale !== s.id && i < sales.length - 1 ? "1px solid #f0eeeb" : "none",
                      background: expandedSale === s.id ? "#fafafa" : "white",
                      transition: "background 0.1s",
                    }}>
                    <div style={{ fontSize: 12, color: "#3a3a48", fontWeight: 600 }}>{fmtDateTime(s.created_at)}</div>
                    <div style={{ fontSize: 12, color: s.clients ? "#111118" : "#a0a0b0", fontWeight: s.clients ? 600 : 400 }}>
                      {s.clients?.name || "Sin cliente"}
                    </div>
                    <div>
                      <span style={{
                        padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: `${PAYMENT_METHODS.find(p => p.key === s.payment_method)?.color || "#6b6b80"}15`,
                        color: PAYMENT_METHODS.find(p => p.key === s.payment_method)?.color || "#6b6b80",
                      }}>
                        {PAYMENT_METHODS.find(p => p.key === s.payment_method)?.label || s.payment_method}
                      </span>
                    </div>
                    <div style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: "#111118" }}>
                      {s.pos_sale_items?.length || 0}
                    </div>
                    <div style={{ textAlign: "right", fontWeight: 800, fontSize: 14, background: "linear-gradient(135deg, #fb0f05, #0027fe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      {fmt(s.total)}
                    </div>
                  </div>
                  {expandedSale === s.id && (
                    <div style={{ padding: "10px 20px 16px 52px", borderBottom: i < sales.length - 1 ? "1px solid #f0eeeb" : "none", background: "#fafafa" }}>
                      {s.pos_sale_items?.map((item, j) => (
                        <div key={j} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b6b80", marginBottom: 4 }}>
                          <span>{item.name} Ã— {item.quantity}</span>
                          <span style={{ fontWeight: 600, color: "#3a3a48" }}>{fmt(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      {s.discount_value > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#ef4444", marginTop: 6 }}>
                          <span>Descuento</span>
                          <span style={{ fontWeight: 600 }}>âˆ’{fmt(s.subtotal - s.total)}</span>
                        </div>
                      )}
                      {s.note && <div style={{ fontSize: 11, color: "#a0a0b0", marginTop: 6 }}>Nota: {s.note}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* â”€â”€ Modal: Ãtem libre â”€â”€ */}
      {showFreeItem && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(17,17,24,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowFreeItem(false); }}>
          <div style={{ background: "white", borderRadius: 22, padding: 28, width: "100%", maxWidth: 380, boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#111118" }}>Ãtem libre</div>
              <button onClick={() => setShowFreeItem(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#a0a0b0" }}><IconX size={18} /></button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Nombre *</label>
              <input type="text" value={freeItemName} onChange={e => setFreeItemName(e.target.value)} placeholder="Ej. Shampoo, cera, aceite..." style={inp} />
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={lbl}>Precio (COP) *</label>
              <input type="number" min={0} step={1000} value={freeItemPrice} onChange={e => setFreeItemPrice(e.target.value)} placeholder="Ej. 15000" style={inp} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowFreeItem(false)} className="btn-secondary">Cancelar</button>
              <button onClick={addFreeItem} disabled={!freeItemName.trim() || !freeItemPrice}
                style={{ padding: "10px 22px", borderRadius: 11, border: "none", fontSize: 14, fontWeight: 700, cursor: (!freeItemName.trim() || !freeItemPrice) ? "not-allowed" : "pointer", background: (!freeItemName.trim() || !freeItemPrice) ? "#e8e6e2" : "linear-gradient(135deg, #fb0f05, #0027fe)", color: (!freeItemName.trim() || !freeItemPrice) ? "#a0a0b0" : "#fff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
