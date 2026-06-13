"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Supplier {
  id: string;
  company_name: string;
  description: string | null;
  city: string | null;
  phone: string | null;
  categories: string[];
  logo_url: string | null;
  cover_url: string | null;
}

interface Product {
  id: string;
  supplier_id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  unit: string;
  min_order_qty: number;
  stock: number | null;
  supplier_name?: string;
}

interface CartItem extends Product {
  qty: number;
}

interface MyOrder {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  created_at: string;
  supplier_name: string;
  payment_proof_url: string | null;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "Pendiente",   color: "#fbbf24", bg: "rgba(251,186,36,0.12)" },
  confirmed: { label: "Confirmado",  color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  preparing: { label: "Preparando",  color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  shipped:   { label: "Enviado",     color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  delivered: { label: "Entregado",   color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  cancelled: { label: "Cancelado",   color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

const PAY_META: Record<string, { label: string; color: string }> = {
  pending:        { label: "Sin pago",        color: "#fbbf24" },
  proof_uploaded: { label: "Comprobante env.", color: "#60a5fa" },
  confirmed:      { label: "Pago confirmado", color: "#34d399" },
};

type Tab = "catalogo" | "mis-pedidos";

// ── Página ────────────────────────────────────────────────────────────────────

export default function ProveedoresPage() {
  const [tab, setTab] = useState<Tab>("catalogo");
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantAddress, setTenantAddress] = useState("");

  // Catálogo
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingCat, setLoadingCat] = useState(true);
  const [searchProd, setSearchProd] = useState("");
  const [catFilter, setCatFilter] = useState("Todos");
  const [supplierFilter, setSupplierFilter] = useState<string | null>(null);
  // Modal de perfil de proveedor
  const [profileModal, setProfileModal] = useState<Supplier | null>(null);

  // Carrito
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "payment">("cart");
  const [shippingAddress, setShippingAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("transfer");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [placing, setPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  // Mis pedidos
  const [myOrders, setMyOrders] = useState<MyOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Init
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: tenant } = await supabase.from("tenants").select("id, address").eq("owner_id", session.user.id).maybeSingle();
      if (tenant) {
        setTenantId(tenant.id);
        setShippingAddress(tenant.address ?? "");
        setTenantAddress(tenant.address ?? "");
      }
    }
    init();
  }, []);

  const loadCatalog = useCallback(async () => {
    setLoadingCat(true);
    const [{ data: supData }, { data: prodData }] = await Promise.all([
      supabase.from("suppliers").select("id, company_name, description, city, phone, categories, logo_url, cover_url").eq("status", "approved"),
      supabase.from("supplier_products")
        .select("*, suppliers(company_name)")
        .eq("is_active", true)
        .order("name"),
    ]);
    setSuppliers(supData ?? []);
    setProducts((prodData ?? []).map((p: Record<string, unknown>) => ({
      ...p,
      supplier_name: (p.suppliers as Record<string, string> | null)?.company_name ?? "—",
    })) as Product[]);
    setLoadingCat(false);
  }, []);

  useEffect(() => { loadCatalog(); }, [loadCatalog]);

  const loadMyOrders = useCallback(async () => {
    if (!tenantId) return;
    setLoadingOrders(true);
    const { data } = await supabase
      .from("supplier_orders")
      .select("*, suppliers(company_name)")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    setMyOrders((data ?? []).map((o: Record<string, unknown>) => ({
      ...o,
      supplier_name: (o.suppliers as Record<string, string> | null)?.company_name ?? "—",
    })) as MyOrder[]);
    setLoadingOrders(false);
  }, [tenantId]);

  useEffect(() => { if (tab === "mis-pedidos") loadMyOrders(); }, [tab, loadMyOrders]);

  // ── Carrito ────────────────────────────────────────────────────────────────

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + (product.min_order_qty || 1) } : i);
      return [...prev, { ...product, qty: product.min_order_qty || 1 }];
    });
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) { setCart(prev => prev.filter(i => i.id !== id)); return; }
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };

  // Agrupar carrito por proveedor (un pedido por proveedor)
  const cartBySupplier = cart.reduce((acc, item) => {
    if (!acc[item.supplier_id]) acc[item.supplier_id] = { supplier_name: item.supplier_name ?? "—", items: [] };
    acc[item.supplier_id].items.push(item);
    return acc;
  }, {} as Record<string, { supplier_name: string; items: CartItem[] }>);

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const handlePlaceOrder = async () => {
    if (!tenantId || cart.length === 0) return;
    setPlacing(true);
    try {
      let proofUrl: string | null = null;

      if (proofFile) {
        const ext = proofFile.name.split(".").pop();
        const path = `payment-proofs/${tenantId}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("supplier-proofs").upload(path, proofFile);
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from("supplier-proofs").getPublicUrl(path);
        proofUrl = urlData.publicUrl;
      }

      // Crear un pedido por cada proveedor en el carrito
      for (const [supplierId, group] of Object.entries(cartBySupplier)) {
        const subtotal = group.items.reduce((s, i) => s + i.price * i.qty, 0);

        // Generar número de pedido
        const { data: numData } = await supabase.rpc("generate_order_number");
        const orderNumber = numData as string;

        const { data: newOrder, error: orderErr } = await supabase
          .from("supplier_orders")
          .insert({
            order_number: orderNumber,
            tenant_id: tenantId,
            supplier_id: supplierId,
            subtotal,
            shipping_cost: 0,
            total: subtotal,
            shipping_address: shippingAddress || null,
            notes: orderNotes || null,
            payment_method: paymentMethod,
            payment_proof_url: proofUrl,
            payment_status: proofUrl ? "proof_uploaded" : "pending",
            status: "pending",
          })
          .select("id")
          .single();

        if (orderErr) throw orderErr;

        const items = group.items.map(i => ({
          order_id: newOrder.id,
          product_id: i.id,
          product_name: i.name,
          product_price: i.price,
          quantity: i.qty,
          subtotal: i.price * i.qty,
        }));
        const { error: itemsErr } = await supabase.from("supplier_order_items").insert(items);
        if (itemsErr) throw itemsErr;
      }

      setCart([]);
      setShowCart(false);
      setCheckoutStep("cart");
      setProofFile(null);
      setOrderNotes("");
      setShippingAddress(tenantAddress);
      setOrderSuccess("¡Pedido(s) enviado(s) con éxito! El proveedor lo confirmará pronto.");
      setTab("mis-pedidos");
      setTimeout(() => setOrderSuccess(null), 6000);
    } catch (err) {
      alert("Error al crear el pedido: " + (err instanceof Error ? err.message : ""));
    } finally {
      setPlacing(false);
    }
  };

  // ── Filtros catálogo ───────────────────────────────────────────────────────

  const allCategories = ["Todos", ...Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[]))];

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchProd.toLowerCase()) ||
      (p.supplier_name ?? "").toLowerCase().includes(searchProd.toLowerCase());
    const matchCat = catFilter === "Todos" || p.category === catFilter;
    const matchSupplier = !supplierFilter || p.supplier_id === supplierFilter;
    return matchSearch && matchCat && matchSupplier;
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: "var(--font-space-grotesk,'Space Grotesk',sans-serif)" }}>

      {/* Notificación de éxito */}
      {orderSuccess && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 200,
          background: "#0d2b1c", border: "1px solid rgba(52,211,153,0.4)",
          borderRadius: 12, padding: "14px 18px", maxWidth: 340,
          fontSize: 13, color: "#34d399", fontWeight: 600,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>
          ✓ {orderSuccess}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#14111C", margin: 0 }}>Proveedores</h1>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>
            Compra insumos para tu negocio directamente desde Zyncra
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {cart.length > 0 && (
            <button onClick={() => { setShowCart(true); setCheckoutStep("cart"); }} style={{
              position: "relative", padding: "9px 16px", borderRadius: 10, border: "1px solid #e5e7eb",
              background: "white", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#374151",
              display: "flex", alignItems: "center", gap: 7,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}>
              🛒 Carrito
              <span style={{
                background: "#fb0f05", color: "white", borderRadius: 10,
                fontSize: 10, fontWeight: 800, padding: "1px 6px",
              }}>
                {cartCount}
              </span>
              <span style={{ fontWeight: 600, color: "#6b7280", fontSize: 12 }}>{fmt(cartTotal)}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, borderBottom: "1px solid #e5e7eb", paddingBottom: 0 }}>
        {(["catalogo", "mis-pedidos"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "9px 16px", borderRadius: "8px 8px 0 0", border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 700, transition: "all .15s",
            background: tab === t ? "white" : "transparent",
            color: tab === t ? "#14111C" : "#9ca3af",
            borderBottom: tab === t ? "2px solid #fb0f05" : "2px solid transparent",
            marginBottom: -1,
          }}>
            {t === "catalogo" ? "📦 Catálogo" : "🛍 Mis Pedidos"}
          </button>
        ))}
      </div>

      {/* ── TAB: Catálogo ── */}
      {tab === "catalogo" && (
        <>
          {/* Tarjetas de proveedores con cover/logo */}
          {suppliers.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                  Proveedores disponibles
                </p>
                {supplierFilter && (
                  <button onClick={() => { setSupplierFilter(null); setCatFilter("Todos"); }}
                    style={{ fontSize: 12, fontWeight: 600, color: "#fb0f05", background: "rgba(251,15,5,0.06)", border: "1px solid rgba(251,15,5,0.2)", borderRadius: 7, padding: "4px 10px", cursor: "pointer" }}>
                    ✕ Ver todos
                  </button>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                {suppliers.map(s => {
                  const active = supplierFilter === s.id;
                  const prodCount = products.filter(p => p.supplier_id === s.id).length;
                  return (
                    <div key={s.id} style={{
                      background: "white",
                      border: `1px solid ${active ? "#fb0f05" : "#e5e7eb"}`,
                      borderRadius: 14, overflow: "hidden", cursor: "pointer",
                      boxShadow: active ? "0 0 0 2px rgba(251,15,5,0.15)" : "0 2px 8px rgba(0,0,0,0.05)",
                      transition: "all .18s",
                    }}>
                      {/* Cover */}
                      <div style={{ position: "relative", height: 80 }}>
                        {s.cover_url
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={s.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : <div style={{ height: "100%", background: "linear-gradient(135deg, #f0f0ff 0%, #ffe5e5 100%)" }} />
                        }
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(255,255,255,0.9) 0%, transparent 60%)" }} />
                        {/* Logo */}
                        <div style={{ position: "absolute", bottom: -18, left: 14, width: 40, height: 40, borderRadius: 10, border: "2px solid white", background: "white", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
                          {s.logo_url
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={s.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            : <span style={{ fontSize: 18 }}>🏢</span>
                          }
                        </div>
                      </div>
                      {/* Body */}
                      <div style={{ padding: "24px 14px 14px" }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#111827", marginBottom: 2 }}>{s.company_name}</div>
                        {s.city && <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>📍 {s.city}</div>}
                        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 10, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {s.description ?? (s.categories ?? []).join(", ")}
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => setProfileModal(s)}
                            style={{ flex: 1, padding: "7px", borderRadius: 8, border: "1px solid #e5e7eb", background: "white", color: "#374151", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                            Ver perfil
                          </button>
                          <button
                            onClick={() => { setSupplierFilter(active ? null : s.id); setCatFilter("Todos"); }}
                            style={{ flex: 1, padding: "7px", borderRadius: 8, border: `1px solid ${active ? "#fb0f05" : "#e5e7eb"}`, background: active ? "rgba(251,15,5,0.06)" : "white", color: active ? "#fb0f05" : "#374151", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                            {active ? `✓ ${prodCount} prod.` : `${prodCount} prod.`}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filtros de productos */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
            <input
              type="text" placeholder="Buscar productos o proveedor..."
              value={searchProd} onChange={e => setSearchProd(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, outline: "none", minWidth: 240, color: "#374151" }}
            />
            {allCategories.map(c => (
              <button key={c} onClick={() => setCatFilter(c)} style={{
                padding: "6px 12px", borderRadius: 7, border: "1px solid",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                borderColor: catFilter === c ? "#fb0f05" : "#e5e7eb",
                background: catFilter === c ? "rgba(251,15,5,0.06)" : "white",
                color: catFilter === c ? "#fb0f05" : "#6b7280",
              }}>
                {c}
              </button>
            ))}
          </div>

          {loadingCat ? <Spinner light /> : filteredProducts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af", fontSize: 14 }}>
              {suppliers.length === 0 ? "Aún no hay proveedores disponibles." : "Sin productos para estos filtros."}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
              {filteredProducts.map(p => {
                const inCart = cart.find(i => i.id === p.id);
                return (
                  <div key={p.id} style={{
                    background: "white", border: "1px solid #e5e7eb", borderRadius: 14,
                    padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column",
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                        {p.supplier_name}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{p.name}</div>
                      {p.category && (
                        <span style={{ fontSize: 11, color: "#4b5563", background: "#f3f4f6", padding: "2px 7px", borderRadius: 4, fontWeight: 600 }}>{p.category}</span>
                      )}
                      {p.description && (
                        <p style={{ fontSize: 12, color: "#6b7280", margin: "8px 0", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {p.description}
                        </p>
                      )}
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#059669", marginBottom: 2 }}>{fmt(p.price)}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10 }}>por {p.unit} · mín. {p.min_order_qty}</div>
                      {p.stock !== null && p.stock <= 10 && (
                        <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600, marginBottom: 8 }}>⚠ Solo {p.stock} disponibles</div>
                      )}
                      {inCart ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <button onClick={() => updateQty(p.id, inCart.qty - 1)} style={qtyBtn}>−</button>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#374151", minWidth: 24, textAlign: "center" }}>{inCart.qty}</span>
                          <button onClick={() => updateQty(p.id, inCart.qty + 1)} style={qtyBtn}>+</button>
                          <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: 4 }}>{fmt(inCart.qty * p.price)}</span>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(p)} style={{
                          width: "100%", padding: "9px", borderRadius: 9, border: "none", cursor: "pointer",
                          background: "linear-gradient(135deg, #fb0f05, #cc0a03)",
                          color: "white", fontSize: 13, fontWeight: 700,
                          boxShadow: "0 4px 12px rgba(251,15,5,0.2)",
                        }}>
                          + Agregar al carrito
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── TAB: Mis Pedidos ── */}
      {tab === "mis-pedidos" && (
        <>
          {loadingOrders ? <Spinner light /> : myOrders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af", fontSize: 14 }}>
              Aún no has realizado pedidos.{" "}
              <button onClick={() => setTab("catalogo")} style={{ background: "none", border: "none", color: "#fb0f05", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
                Ver catálogo →
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {myOrders.map(order => {
                const sm = STATUS_META[order.status] ?? STATUS_META.pending;
                const pm = PAY_META[order.payment_status] ?? PAY_META.pending;
                return (
                  <div key={order.id} style={{
                    background: "white", border: "1px solid #e5e7eb", borderRadius: 14,
                    padding: "16px 20px", boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                    display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
                  }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>{order.order_number}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: sm.bg, color: sm.color }}>{sm.label}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>
                        {order.supplier_name} · {new Date(order.created_at).toLocaleDateString("es-CO")}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: pm.color, marginTop: 3 }}>{pm.label}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#059669" }}>{fmt(order.total)}</div>
                      {order.payment_proof_url && (
                        <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 11, color: "#fb0f05", fontWeight: 600, textDecoration: "none" }}>
                          📎 Ver comprobante
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Modal perfil de proveedor ── */}
      {profileModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setProfileModal(null); }}
        >
          <div style={{ background: "white", borderRadius: 20, width: "100%", maxWidth: 600, maxHeight: "88vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,0.25)" }}>
            {/* Cover */}
            <div style={{ position: "relative", height: 160, flexShrink: 0 }}>
              {profileModal.cover_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={profileModal.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ height: "100%", background: "linear-gradient(135deg, #ede9fe 0%, #fce7f3 100%)" }} />
              }
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(255,255,255,1) 0%, transparent 60%)" }} />
              <button onClick={() => setProfileModal(null)} style={{ position: "absolute", top: 14, right: 14, width: 30, height: 30, borderRadius: "50%", border: "1px solid rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.85)", color: "#374151", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
              {/* Logo */}
              <div style={{ position: "absolute", bottom: -24, left: 24, width: 56, height: 56, borderRadius: 14, border: "3px solid white", background: "white", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(0,0,0,0.15)" }}>
                {profileModal.logo_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={profileModal.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 26 }}>🏢</span>
                }
              </div>
            </div>

            <div style={{ overflowY: "auto", flex: 1, padding: "34px 24px 24px" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 4 }}>{profileModal.company_name}</div>
              {profileModal.city && <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 10 }}>📍 {profileModal.city}</div>}
              {profileModal.description && <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.65, marginBottom: 14 }}>{profileModal.description}</p>}
              {profileModal.phone && <div style={{ fontSize: 13, color: "#4b5563", marginBottom: 10 }}>📞 {profileModal.phone}</div>}
              {profileModal.categories.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                  {profileModal.categories.map(c => (
                    <span key={c} style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 8, background: "#f3f4f6", color: "#4b5563" }}>{c}</span>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setProfileModal(null); setSupplierFilter(profileModal.id); setCatFilter("Todos"); }}
                  style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #fb0f05, #cc0a03)", color: "white", fontSize: 13, fontWeight: 700, boxShadow: "0 4px 14px rgba(251,15,5,0.25)" }}>
                  Ver catálogo y ordenar →
                </button>
                <button onClick={() => setProfileModal(null)}
                  style={{ padding: "11px 16px", borderRadius: 10, border: "1px solid #e5e7eb", background: "white", color: "#6b7280", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Carrito / Checkout ── */}
      {showCart && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "flex-end", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowCart(false); }}>
          <div style={{
            background: "white", borderRadius: 16, width: "100%", maxWidth: 480,
            maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
          }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#111827", margin: 0 }}>
                {checkoutStep === "cart" ? `🛒 Carrito (${cartCount} ítems)` : "💳 Finalizar pedido"}
              </h2>
              <button onClick={() => setShowCart(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>×</button>
            </div>

            {checkoutStep === "cart" && (
              <div>
                {/* Items por proveedor */}
                {Object.entries(cartBySupplier).map(([suppId, group]) => (
                  <div key={suppId} style={{ padding: "16px 24px", borderBottom: "1px solid #f3f4f6" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                      📦 {group.supplier_name}
                    </div>
                    {group.items.map(item => (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", wordBreak: "break-word" }}>{item.name}</div>
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>{fmt(item.price)} / {item.unit}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          <button onClick={() => updateQty(item.id, item.qty - 1)} style={qtyBtn}>−</button>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", minWidth: 20, textAlign: "center" }}>{item.qty}</span>
                          <button onClick={() => updateQty(item.id, item.qty + 1)} style={qtyBtn}>+</button>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#059669", minWidth: 80, textAlign: "right" }}>{fmt(item.price * item.qty)}</div>
                      </div>
                    ))}
                  </div>
                ))}

                <div style={{ padding: "16px 24px", background: "#f9fafb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#374151" }}>Total</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#059669" }}>{fmt(cartTotal)}</span>
                </div>
                <div style={{ padding: "12px 24px 20px" }}>
                  <button onClick={() => setCheckoutStep("payment")} style={{
                    width: "100%", padding: "12px", borderRadius: 10, border: "none", cursor: "pointer",
                    background: "linear-gradient(135deg, #fb0f05, #cc0a03)",
                    color: "white", fontSize: 14, fontWeight: 700,
                    boxShadow: "0 4px 14px rgba(251,15,5,0.25)",
                  }}>
                    Continuar al pago →
                  </button>
                </div>
              </div>
            )}

            {checkoutStep === "payment" && (
              <div style={{ padding: "20px 24px" }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Dirección de envío *</label>
                  <input type="text" value={shippingAddress} onChange={e => setShippingAddress(e.target.value)}
                    style={inputStyleLight} placeholder="Dirección completa donde recibir el pedido" required />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Notas para el proveedor (opcional)</label>
                  <textarea value={orderNotes} onChange={e => setOrderNotes(e.target.value)}
                    style={{ ...inputStyleLight, height: 64, resize: "none" } as React.CSSProperties}
                    placeholder="Instrucciones especiales, horario de entrega..." />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Método de pago</label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[
                      { value: "transfer", label: "Transferencia" },
                      { value: "nequi", label: "Nequi" },
                      { value: "daviplata", label: "Daviplata" },
                    ].map(m => (
                      <button key={m.value} type="button" onClick={() => setPaymentMethod(m.value)} style={{
                        padding: "8px 14px", borderRadius: 8, border: "1px solid",
                        fontSize: 13, fontWeight: 600, cursor: "pointer",
                        borderColor: paymentMethod === m.value ? "#fb0f05" : "#e5e7eb",
                        background: paymentMethod === m.value ? "rgba(251,15,5,0.05)" : "white",
                        color: paymentMethod === m.value ? "#fb0f05" : "#6b7280",
                      }}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 20, background: "#f9fafb", borderRadius: 10, padding: "12px 14px", border: "1px solid #e5e7eb" }}>
                  <label style={{ ...labelStyle, marginBottom: 8, display: "block" }}>Adjuntar comprobante de pago (opcional)</label>
                  <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10 }}>
                    Sube el comprobante de transferencia para que el proveedor confirme el pago más rápido. También puedes enviarlo después.
                  </p>
                  <input type="file" accept="image/*,.pdf" onChange={e => setProofFile(e.target.files?.[0] ?? null)}
                    style={{ fontSize: 12, color: "#6b7280" }} />
                  {proofFile && <div style={{ fontSize: 11, color: "#059669", marginTop: 6, fontWeight: 600 }}>✓ {proofFile.name}</div>}
                </div>

                <div style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 14px", marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Total del pedido</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#059669" }}>{fmt(cartTotal)}</span>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setCheckoutStep("cart")} style={{ ...qtyBtn, flex: 0, padding: "11px 16px", fontSize: 13, borderRadius: 9 }}>← Atrás</button>
                  <button onClick={handlePlaceOrder} disabled={placing || !shippingAddress} style={{
                    flex: 1, padding: "12px", borderRadius: 10, border: "none", cursor: "pointer",
                    background: placing ? "#d1d5db" : "linear-gradient(135deg, #fb0f05, #cc0a03)",
                    color: "white", fontSize: 14, fontWeight: 700,
                    boxShadow: placing ? "none" : "0 4px 14px rgba(251,15,5,0.25)",
                  }}>
                    {placing ? "Enviando pedido..." : "Confirmar pedido"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Spinner({ light }: { light?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
      <div style={{ width: 28, height: 28, border: `3px solid ${light ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)"}`, borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const qtyBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 6, border: "1px solid #e5e7eb",
  background: "white", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#374151",
  display: "flex", alignItems: "center", justifyContent: "center",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "0.04em",
  textTransform: "uppercase", display: "block", marginBottom: 6,
};

const inputStyleLight: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: "1px solid #e5e7eb", background: "white",
  color: "#374151", fontSize: 13, fontWeight: 500,
  outline: "none", boxSizing: "border-box",
};
