"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";
import { IconCreditCard, IconPlus, IconX, IconSearch } from "../ZyncraIcons";
import { useCountUp, MONO } from "../charts";

interface LinkedApt {
  id: string;
  clientName: string;
  serviceName: string;
  date: string;
  time: string;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Service {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
  sale_price: number;
  cost_price: number;
  discount_type: "percent" | "fixed" | null;
  discount_value: number;
  stock_quantity: number;
  photo_url: string | null;
}

interface Client {
  id: string;
  name: string;
  phone: string;
}

interface CartItem {
  key: string;
  serviceId: string | null;
  productId: string | null;
  itemType: "service" | "product" | "free";
  name: string;
  price: number;
  qty: number;
}

function productEffectivePrice(p: Product): number {
  if (!p.discount_value || p.discount_value <= 0) return p.sale_price;
  if (p.discount_type === "percent") return p.sale_price * (1 - p.discount_value / 100);
  return Math.max(0, p.sale_price - p.discount_value);
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

// ─── Helpers ─────────────────────────────────────────────────────────────────


const PAYMENT_METHODS = [
  { key: "efectivo",  label: "Efectivo",  color: "#10b981" },
  { key: "tarjeta",   label: "Tarjeta",   color: "#6366f1" },
  { key: "nequi",     label: "Nequi",     color: "#0027fe" },
  { key: "daviplata", label: "Daviplata", color: "#f59e0b" },
];

// ─── Styles ──────────────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 13px", border: "1.5px solid rgba(20,15,30,0.08)",
  borderRadius: 10, fontSize: 14, background: "rgba(20,15,30,0.025)", color: "#14111C",
  fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif", outline: "none", boxSizing: "border-box",
};

const lbl: React.CSSProperties = {
  display: "block", fontWeight: 600, fontSize: 11, color: "#564E66",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PosPage() {
  const { tenantId, currency, locale } = useAdmin();
  const fmt         = (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  const fmtDateTime = (iso: string) => new Date(iso).toLocaleString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const router = useRouter();
  const [tab, setTab] = useState<"cobrar" | "historial">("cobrar");
  const [openSession, setOpenSession] = useState<{ id: string } | null | "loading">("loading");

  // Catalog
  const [catalogTab, setCatalogTab] = useState<"servicios" | "productos">("servicios");
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
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

  const [linkedApt, setLinkedApt] = useState<LinkedApt | null>(null);
  const clientRef = useRef<HTMLDivElement>(null);

  // ── Load services ──
  useEffect(() => {
    if (!tenantId) return;
    supabase.from("services").select("id,name,price,duration_minutes")
      .eq("tenant_id", tenantId).order("name")
      .then(({ data }) => { setServices(data || []); setLoadingServices(false); });
  }, [tenantId]);

  // ── Load products ──
  useEffect(() => {
    if (!tenantId) return;
    supabase.from("products")
      .select("id,name,sku,sale_price,cost_price,discount_type,discount_value,stock_quantity,photo_url")
      .eq("tenant_id", tenantId).eq("is_active", true).order("name")
      .then(({ data }) => { setProducts((data as any) || []); setLoadingProducts(false); });
  }, [tenantId]);

  // ── Verify open cash session ──────────────────────────────────────────────
  useEffect(() => {
    if (!tenantId) return;
    supabase.from("cash_sessions")
      .select("id").eq("tenant_id", tenantId).is("closed_at", null)
      .order("opened_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setOpenSession(data ? { id: data.id } : null));
  }, [tenantId]);

  // ── Load from appointment param ──────────────────────────────────────────
  useEffect(() => {
    if (!tenantId) return;
    const aptId = new URLSearchParams(window.location.search).get("appointment");
    if (!aptId) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("appointments")
        .select("id, appointment_date, appointment_time, clients(id,name,phone), services(id,name,price)")
        .eq("id", aptId)
        .single();
      if (!data) return;
      if (data.clients) setClient({ id: data.clients.id, name: data.clients.name, phone: data.clients.phone });
      if (data.services) {
        setCart([{ key: data.services.id, serviceId: data.services.id, productId: null, itemType: "service", name: data.services.name, price: data.services.price, qty: 1 }]);
      }
      setLinkedApt({
        id: aptId,
        clientName: data.clients?.name ?? "-",
        serviceName: data.services?.name ?? "-",
        date: data.appointment_date,
        time: (data.appointment_time as string).slice(0, 5),
      });
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  // ─────────────────────────────────────────────────────────────────────────
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

  // ── Client search ──
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

  // ── Cart helpers ──
  const addToCart = (svc: Service) => {
    setCart(prev => {
      const existing = prev.find(i => i.serviceId === svc.id);
      if (existing) return prev.map(i => i.serviceId === svc.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { key: svc.id, serviceId: svc.id, productId: null, itemType: "service", name: svc.name, price: svc.price, qty: 1 }];
    });
  };

  const addProductToCart = (prod: Product) => {
    if (prod.stock_quantity <= 0) return;
    const effPrice = productEffectivePrice(prod);
    setCart(prev => {
      const existing = prev.find(i => i.productId === prod.id);
      if (existing) {
        const inCart = existing.qty;
        if (inCart >= prod.stock_quantity) return prev; // no more stock
        return prev.map(i => i.productId === prod.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { key: `prod-${prod.id}`, serviceId: null, productId: prod.id, itemType: "product", name: prod.name, price: effPrice, qty: 1 }];
    });
  };

  const addFreeItem = () => {
    const price = parseFloat(freeItemPrice.replace(/[^0-9.]/g, ""));
    if (!freeItemName.trim() || isNaN(price) || price <= 0) return;
    const key = `free-${Date.now()}`;
    setCart(prev => [...prev, { key, serviceId: null, productId: null, itemType: "free", name: freeItemName.trim(), price, qty: 1 }]);
    setFreeItemName(""); setFreeItemPrice(""); setShowFreeItem(false);
  };

  const updateQty = (key: string, delta: number) => {
    setCart(prev => prev
      .map(i => i.key === key ? { ...i, qty: i.qty + delta } : i)
      .filter(i => i.qty > 0));
  };

  const removeItem = (key: string) => setCart(prev => prev.filter(i => i.key !== key));

  // ── Totals ──
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discountVal = parseFloat(discountValue) || 0;
  const discountAmount = discountType === "percentage"
    ? (subtotal * Math.min(discountVal, 100)) / 100
    : Math.min(discountVal, subtotal);
  const total = Math.max(subtotal - discountAmount, 0);
  const totalAnim = useCountUp(total, 420);

  // ── Charge ──
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
      appointment_id: linkedApt?.id || null,
    }).select().single();

    if (error || !sale) { setCharging(false); return; }

    await supabase.from("pos_sale_items").insert(
      cart.map(i => ({
        sale_id:    sale.id,
        service_id: i.itemType === "service" ? i.serviceId : null,
        product_id: i.itemType === "product"  ? i.productId  : null,
        item_type:  i.itemType === "free" ? "service" : i.itemType,
        name:       i.name,
        price:      i.price,
        quantity:   i.qty,
      }))
    );

    // Descontar inventario por cada producto vendido
    const productItems = cart.filter(i => i.itemType === "product" && i.productId);
    if (productItems.length > 0) {
      await supabase.from("inventory_movements").insert(
        productItems.map(i => ({
          tenant_id:  tenantId,
          product_id: i.productId!,
          type:       "sale",
          quantity:   -i.qty,
          reference:  sale.id,
          notes:      `Venta POS${client ? ` · ${client.name}` : ""}`,
        }))
      );
      // Actualizar estado local del stock
      setProducts(prev => prev.map(p => {
        const sold = productItems.find(i => i.productId === p.id);
        if (!sold) return p;
        return { ...p, stock_quantity: Math.max(0, p.stock_quantity - sold.qty) };
      }));
    }

    // Registrar ingreso automático en caja activa
    if (openSession && openSession !== "loading") {
      const desc = `Venta POS${client ? ` · ${client.name}` : ""}${linkedApt ? ` · ${linkedApt.serviceName}` : ""}`;
      await supabase.from("cash_movements").insert({
        session_id: openSession.id,
        tenant_id: tenantId,
        type: "ingreso",
        amount: total,
        description: desc,
        category: "POS",
        pos_sale_id: sale.id,
        payment_method: paymentMethod,
      });
    }

    // Marcar cita como completada
    if (linkedApt?.id) {
      await supabase.from("appointments").update({ status: "completed" }).eq("id", linkedApt.id);
    }

    setCharging(false);
    setSuccessMsg(`Venta de ${fmt(total)} registrada con éxito.`);
    setCart([]); setClient(null); setClientSearch(""); setDiscountValue(""); setSaleNote("");
    setPaymentMethod("efectivo"); setLinkedApt(null);
    setTimeout(() => setSuccessMsg(""), 3500);
  };

  // ── Filtered services ──
  const filtered = services.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: "-0.5px", color: "#14111C" }}>Sistema POS</h1>
          <p style={{ color: "#8E879B", fontSize: 13, marginTop: 3 }}>Cobra servicios y productos en el mostrador.</p>
        </div>
        <div style={{ display: "flex", gap: 4, background: "rgba(20,15,30,0.04)", padding: 4, borderRadius: 14 }}>
          {(["cobrar", "historial"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
              cursor: "pointer", border: "none", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
              background: tab === t ? "#14111C" : "transparent",
              color: tab === t ? "#fff" : "#564E66",
              boxShadow: tab === t ? "0 2px 8px rgba(20,15,30,0.18)" : "none",
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

      {/* ── TAB: Cobrar ── */}
      {tab === "cobrar" && openSession === "loading" && (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <div style={{ width: 36, height: 36, border: "3px solid rgba(20,15,30,0.08)", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
        </div>
      )}
      {tab === "cobrar" && openSession === null && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "white", borderRadius: 24, border: "1px solid rgba(20,15,30,0.08)", padding: "48px 36px", maxWidth: 420, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#14111C", marginBottom: 8 }}>Caja no abierta</div>
            <p style={{ color: "#8E879B", fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
              Para poder cobrar debes abrir primero el turno en el Sistema de Caja.
            </p>
            <button onClick={() => router.push("/admin/caja")}
              style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #fb0f05, #0027fe)", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>
              Ir a Sistema de Caja →
            </button>
          </div>
        </div>
      )}
      {tab === "cobrar" && openSession !== "loading" && openSession !== null && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, alignItems: "start" }}>

          {/* Left: Catalog */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Catalog tab + search + free item */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              {/* Servicios / Productos switcher */}
              <div style={{ display: "flex", gap: 3, background: "rgba(20,15,30,0.04)", padding: 3, borderRadius: 10, flexShrink: 0 }}>
                {(["servicios", "productos"] as const).map(t => (
                  <button key={t} onClick={() => { setCatalogTab(t); setSearch(""); }} style={{
                    padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700,
                    cursor: "pointer", border: "none", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                    background: catalogTab === t ? "#14111C" : "transparent",
                    color: catalogTab === t ? "#fff" : "#564E66",
                    boxShadow: catalogTab === t ? "0 1px 6px rgba(20,15,30,0.18)" : "none",
                    transition: "all 0.15s",
                  }}>
                    {t === "servicios" ? "Servicios" : "Productos"}
                  </button>
                ))}
              </div>
              <div style={{ flex: 1, position: "relative", minWidth: 140 }}>
                <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8E879B", pointerEvents: "none" }}>
                  <IconSearch size={15} />
                </div>
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder={catalogTab === "servicios" ? "Buscar servicio..." : "Buscar producto..."}
                  style={{ ...inp, paddingLeft: 36 }}
                />
              </div>
              <button onClick={() => { setFreeItemName(""); setFreeItemPrice(""); setShowFreeItem(true); }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10, border: "1.5px solid rgba(251,15,5,0.3)", background: "rgba(251,15,5,0.06)", color: "#fb0f05", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif", whiteSpace: "nowrap" }}>
                <IconPlus size={14} /> Ítem libre
              </button>
            </div>

            {/* Services grid */}
            {catalogTab === "servicios" && (
              loadingServices ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                  <div style={{ width: 32, height: 32, border: "3px solid rgba(20,15,30,0.08)", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#8E879B", fontSize: 14 }}>
                  {search ? "Sin resultados." : "No hay servicios configurados."}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12 }}>
                  {filtered.map(svc => {
                    const inCart = cart.find(i => i.serviceId === svc.id);
                    return (
                      <button key={svc.id} onClick={() => addToCart(svc)}
                        onMouseDown={e => { e.currentTarget.style.transform = "scale(0.965)"; }}
                        onMouseUp={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = inCart ? "0 0 0 3px rgba(251,15,5,0.08), 0 8px 20px rgba(20,15,30,0.08)" : "0 8px 20px rgba(20,15,30,0.08)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = inCart ? "0 0 0 3px rgba(251,15,5,0.08)" : "none"; }}
                        style={{
                          background: "white", borderRadius: 16, padding: "16px 18px",
                          border: inCart ? "2px solid rgba(251,15,5,0.4)" : "1.5px solid rgba(20,15,30,0.08)",
                          cursor: "pointer", textAlign: "left",
                          transition: "transform .14s ease, box-shadow .18s ease, border-color .15s",
                          boxShadow: inCart ? "0 0 0 3px rgba(251,15,5,0.08)" : "none",
                          fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                        }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#14111C", marginBottom: 6 }}>{svc.name}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#14111C", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.4px" }}>{fmt(svc.price)}</div>
                        <div style={{ fontSize: 10.5, color: "#8E879B", marginTop: 4, fontFamily: MONO }}>{svc.duration_minutes} min</div>
                        {inCart && (
                          <div key={inCart.qty} style={{
                            marginTop: 8, fontSize: 10, fontWeight: 700, color: "white",
                            background: "linear-gradient(135deg, #fb0f05, #0027fe)",
                            display: "inline-flex", alignItems: "center", gap: 4,
                            padding: "3px 9px", borderRadius: 20, fontFamily: MONO,
                            animation: "znPop .3s cubic-bezier(.22,1,.36,1) both",
                          }}>
                            × {inCart.qty} en carrito
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )
            )}

            {/* Products grid */}
            {catalogTab === "productos" && (
              loadingProducts ? (
                <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                  <div style={{ width: 32, height: 32, border: "3px solid rgba(20,15,30,0.08)", borderTopColor: "#0027fe", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
                </div>
              ) : products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku ?? "").toLowerCase().includes(search.toLowerCase())).length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#8E879B", fontSize: 14 }}>
                  {search ? "Sin resultados." : "No hay productos en inventario."}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12 }}>
                  {products
                    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku ?? "").toLowerCase().includes(search.toLowerCase()))
                    .map(prod => {
                      const effPrice = productEffectivePrice(prod);
                      const inCart = cart.find(i => i.productId === prod.id);
                      const outOfStock = prod.stock_quantity <= 0;
                      return (
                        <button key={prod.id} onClick={() => addProductToCart(prod)}
                          disabled={outOfStock}
                          style={{
                            background: outOfStock ? "rgba(20,15,30,0.03)" : "white",
                            borderRadius: 16, padding: "14px 16px",
                            border: inCart ? "2px solid rgba(0,39,254,0.4)" : outOfStock ? "1.5px solid rgba(20,15,30,0.05)" : "1.5px solid rgba(20,15,30,0.08)",
                            cursor: outOfStock ? "not-allowed" : "pointer", textAlign: "left", transition: "all 0.15s",
                            boxShadow: inCart ? "0 0 0 3px rgba(0,39,254,0.08)" : "none",
                            fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                            position: "relative", overflow: "hidden",
                          }}>
                          {/* Photo */}
                          {prod.photo_url && (
                            <div style={{ width: "100%", height: 80, borderRadius: 10, overflow: "hidden", marginBottom: 10, background: "rgba(20,15,30,0.04)" }}>
                              <img src={prod.photo_url} alt={prod.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                          )}
                          {prod.sku && <div style={{ fontSize: 9.5, fontFamily: "'JetBrains Mono',monospace", color: "#b0abc0", marginBottom: 3 }}>{prod.sku}</div>}
                          <div style={{ fontWeight: 700, fontSize: 12.5, color: outOfStock ? "#b0abc0" : "#14111C", marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{prod.name}</div>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                            <span style={{ fontSize: 16, fontWeight: 700, color: outOfStock ? "#b0abc0" : "#14111C" }}>{fmt(effPrice)}</span>
                            {prod.discount_value > 0 && <span style={{ fontSize: 10, color: "#b0abc0", textDecoration: "line-through" }}>{fmt(prod.sale_price)}</span>}
                          </div>
                          <div style={{ marginTop: 6, fontSize: 10.5, fontWeight: 600, color: outOfStock ? "#ef4444" : prod.stock_quantity <= 5 ? "#f59e0b" : "#8E879B" }}>
                            {outOfStock ? "Sin stock" : `${prod.stock_quantity} disponibles`}
                          </div>
                          {inCart && <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: "#0027fe" }}>× {inCart.qty} en carrito</div>}
                        </button>
                      );
                    })}
                </div>
              )
            )}
          </div>

          {/* Right: Cart */}
          <div style={{ background: "white", borderRadius: 20, border: "1px solid rgba(20,15,30,0.08)", overflow: "hidden", position: "sticky", top: 20 }}>
            {/* Cart header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(20,15,30,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05" }}>
                <IconCreditCard size={16} />
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#14111C", display: "flex", alignItems: "center", gap: 7 }}>
                Carrito
                {cart.length > 0 && (
                  <span key={cart.length} style={{
                    background: "#14111C", color: "white", fontFamily: MONO, fontSize: 10.5,
                    fontWeight: 700, borderRadius: 20, padding: "2px 8px", lineHeight: 1.4,
                    display: "inline-block", animation: "znPop .3s cubic-bezier(.22,1,.36,1) both",
                  }}>{cart.length}</span>
                )}
              </div>
            </div>

            <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Cita vinculada */}
              {linkedApt && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>
                        Cita vinculada
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#14111C" }}>{linkedApt.clientName}</div>
                      <div style={{ fontSize: 11, color: "#8E879B", marginTop: 1 }}>
                        {linkedApt.serviceName} · {linkedApt.date} {linkedApt.time}
                      </div>
                    </div>
                    <button onClick={() => setLinkedApt(null)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#8E879B", padding: 2, flexShrink: 0 }}>
                      <IconX size={13} />
                    </button>
                  </div>
                  <div style={{ fontSize: 10, color: "#10b981", marginTop: 6, fontWeight: 600 }}>
                    La cita se marcará como Completada al cobrar.
                  </div>
                </div>
              )}
              {/* Client selector */}
              <div style={{ position: "relative" }} ref={clientRef}>
                <label style={lbl}>Cliente (opcional)</label>
                {client ? (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", borderRadius: 10, background: "rgba(20,15,30,0.025)", border: "1.5px solid rgba(20,15,30,0.08)" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#14111C" }}>{client.name}</div>
                      <div style={{ fontSize: 11, color: "#8E879B" }}>{client.phone}</div>
                    </div>
                    <button onClick={() => { setClient(null); setClientSearch(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#8E879B", padding: 2 }}>
                      <IconX size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <input type="text" value={clientSearch} onChange={e => { setClientSearch(e.target.value); setShowClientDrop(true); }}
                      onFocus={() => clientSearch.length >= 2 && setShowClientDrop(true)}
                      onBlur={() => setTimeout(() => setShowClientDrop(false), 200)}
                      placeholder="Nombre o teléfono..." style={inp} />
                    {showClientDrop && clientResults.length > 0 && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1px solid rgba(20,15,30,0.08)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 50, overflow: "hidden", marginTop: 4 }}>
                        {clientResults.map(c => (
                          <button key={c.id} onMouseDown={() => { setClient(c); setClientSearch(""); setShowClientDrop(false); }}
                            style={{ display: "block", width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif", borderBottom: "1px solid #f0eeeb" }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: "#14111C" }}>{c.name}</div>
                            <div style={{ fontSize: 11, color: "#8E879B" }}>{c.phone}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Cart items */}
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#8E879B", fontSize: 13 }}>
                  Selecciona servicios del catálogo.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {cart.map(item => (
                    <div key={item.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 10, background: "rgba(20,15,30,0.025)", animation: "znFadeUp .28s cubic-bezier(.22,1,.36,1) both" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 12, color: "#14111C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                        <div style={{ fontSize: 10.5, color: "#8E879B", fontFamily: MONO }}>{fmt(item.price)} c/u</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        <button onClick={() => updateQty(item.key, -1)} style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid rgba(20,15,30,0.08)", background: "white", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#564E66", display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color .12s" }}>-</button>
                        <span key={item.qty} style={{ fontSize: 12.5, fontWeight: 700, color: "#14111C", minWidth: 18, textAlign: "center", fontFamily: MONO, display: "inline-block", animation: "znPop .25s cubic-bezier(.22,1,.36,1) both" }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.key, 1)} style={{ width: 26, height: 26, borderRadius: 7, border: "1px solid rgba(20,15,30,0.08)", background: "white", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#564E66", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
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
                    <div style={{ display: "flex", gap: 4, background: "rgba(20,15,30,0.04)", padding: 3, borderRadius: 8 }}>
                      {(["percentage", "fixed"] as const).map(t => (
                        <button key={t} onClick={() => setDiscountType(t)} style={{
                          padding: "6px 10px", borderRadius: 6, border: "none", fontSize: 11, fontWeight: 700,
                          cursor: "pointer", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                          background: discountType === t ? "white" : "transparent",
                          color: discountType === t ? "#fb0f05" : "#564E66",
                          boxShadow: discountType === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                        }}>
                          {t === "percentage" ? "%" : currency}
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
                    <span style={{ color: "#564E66" }}>Subtotal</span>
                    <span style={{ fontWeight: 600, color: "#14111C", fontFamily: MONO, fontSize: 12.5 }}>{fmt(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: "#564E66" }}>Descuento</span>
                      <span style={{ fontWeight: 600, color: "#ef4444", fontFamily: MONO, fontSize: 12.5 }}>-{fmt(discountAmount)}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                    <span style={{ color: "#14111C" }}>Total</span>
                    <span style={{ color: "#14111C", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.5px" }}>
                      {fmt(totalAnim)}
                    </span>
                  </div>
                </div>
              )}

              {/* Payment method */}
              {cart.length > 0 && (
                <div>
                  <label style={lbl}>Método de pago</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {PAYMENT_METHODS.map(pm => (
                      <button key={pm.key} onClick={() => setPaymentMethod(pm.key)} style={{
                        padding: "9px", borderRadius: 10, fontSize: 12, fontWeight: 700,
                        cursor: "pointer", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                        border: paymentMethod === pm.key ? `1.5px solid ${pm.color}` : "1.5px solid rgba(20,15,30,0.08)",
                        background: paymentMethod === pm.key ? `${pm.color}15` : "white",
                        color: paymentMethod === pm.key ? pm.color : "#564E66",
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
                  width: "100%", padding: 14, borderRadius: 12, border: "none", fontSize: 15, fontWeight: 700,
                  cursor: (cart.length === 0 || charging) ? "not-allowed" : "pointer",
                  background: (cart.length === 0 || charging) ? "rgba(20,15,30,0.08)" : "linear-gradient(135deg, #fb0f05, #0027fe)",
                  color: (cart.length === 0 || charging) ? "#8E879B" : "#fff",
                  fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                  boxShadow: (cart.length === 0 || charging) ? "none" : "0 4px 16px rgba(251,15,5,0.3)",
                  transition: "all 0.15s",
                }}>
                {charging ? "Procesando..." : cart.length === 0 ? "Agrega ítems al carrito" : `Cobrar ${fmt(total)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Historial ── */}
      {tab === "historial" && (
        <div style={{ background: "white", borderRadius: 18, border: "1px solid rgba(20,15,30,0.08)", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: "1px solid rgba(20,15,30,0.08)" }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05" }}>
              <IconCreditCard size={16} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#14111C" }}>Historial de ventas</div>
          </div>
          {loadingHistory ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ width: 32, height: 32, border: "3px solid rgba(20,15,30,0.08)", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto" }} />
            </div>
          ) : sales.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#8E879B", fontSize: 14 }}>
              Sin ventas registradas aún.
            </div>
          ) : (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 90px 80px 110px", gap: 12, padding: "10px 20px", borderBottom: "1px solid #f0eeeb", fontSize: 11, fontWeight: 700, color: "#8E879B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <span>Fecha</span><span>Cliente</span><span>Método</span><span style={{ textAlign: "center" }}>Ítems</span><span style={{ textAlign: "right" }}>Total</span>
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
                    <div style={{ fontSize: 12, color: "#3a3548", fontWeight: 600 }}>{fmtDateTime(s.created_at)}</div>
                    <div style={{ fontSize: 12, color: s.clients ? "#14111C" : "#8E879B", fontWeight: s.clients ? 600 : 400 }}>
                      {s.clients?.name || "Sin cliente"}
                    </div>
                    <div>
                      <span style={{
                        padding: "3px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: `${PAYMENT_METHODS.find(p => p.key === s.payment_method)?.color || "#564E66"}15`,
                        color: PAYMENT_METHODS.find(p => p.key === s.payment_method)?.color || "#564E66",
                      }}>
                        {PAYMENT_METHODS.find(p => p.key === s.payment_method)?.label || s.payment_method}
                      </span>
                    </div>
                    <div style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: "#14111C" }}>
                      {s.pos_sale_items?.length || 0}
                    </div>
                    <div style={{ textAlign: "right", fontWeight: 700, fontSize: 14, color: "#14111C" }}>
                      {fmt(s.total)}
                    </div>
                  </div>
                  {expandedSale === s.id && (
                    <div style={{ padding: "10px 20px 16px 52px", borderBottom: i < sales.length - 1 ? "1px solid #f0eeeb" : "none", background: "#fafafa" }}>
                      {s.pos_sale_items?.map((item, j) => (
                        <div key={j} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#564E66", marginBottom: 4 }}>
                          <span>{item.name} × {item.quantity}</span>
                          <span style={{ fontWeight: 600, color: "#3a3548" }}>{fmt(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      {s.discount_value > 0 && (
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#ef4444", marginTop: 6 }}>
                          <span>Descuento</span>
                          <span style={{ fontWeight: 600 }}>-{fmt(s.subtotal - s.total)}</span>
                        </div>
                      )}
                      {s.note && <div style={{ fontSize: 11, color: "#8E879B", marginTop: 6 }}>Nota: {s.note}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modal: Ítem libre ── */}
      {showFreeItem && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(12,12,20,0.45)", backdropFilter: "blur(16px) saturate(1.4)", WebkitBackdropFilter: "blur(16px) saturate(1.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowFreeItem(false); }}>
          <div style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(32px) saturate(1.6)", WebkitBackdropFilter: "blur(32px) saturate(1.6)", border: "1px solid rgba(255,255,255,0.7)", borderRadius: 22, padding: 28, width: "100%", maxWidth: 380, boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#14111C" }}>Ítem libre</div>
              <button onClick={() => setShowFreeItem(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8E879B" }}><IconX size={18} /></button>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Nombre *</label>
              <input type="text" value={freeItemName} onChange={e => setFreeItemName(e.target.value)} placeholder="Ej. Shampoo, cera, aceite..." style={inp} />
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={lbl}>Precio ({currency}) *</label>
              <input type="number" min={0} step={1000} value={freeItemPrice} onChange={e => setFreeItemPrice(e.target.value)} placeholder="Ej. 15000" style={inp} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowFreeItem(false)} className="btn-secondary">Cancelar</button>
              <button onClick={addFreeItem} disabled={!freeItemName.trim() || !freeItemPrice}
                style={{ padding: "10px 22px", borderRadius: 11, border: "none", fontSize: 14, fontWeight: 700, cursor: (!freeItemName.trim() || !freeItemPrice) ? "not-allowed" : "pointer", background: (!freeItemName.trim() || !freeItemPrice) ? "rgba(20,15,30,0.08)" : "linear-gradient(135deg, #fb0f05, #0027fe)", color: (!freeItemName.trim() || !freeItemPrice) ? "#8E879B" : "#fff", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
