"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";
import { IconPackage, IconPlus, IconX, IconSearch, IconRefresh } from "../ZyncraIcons";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tag { name: string; color: string; }
const TAG_COLORS = ["#ef4444","#f97316","#f59e0b","#10b981","#06b6d4","#3b82f6","#8b5cf6","#ec4899","#64748b"];

interface Product {
  id: string;
  tenant_id: string;
  sku: string | null;
  name: string;
  description: string | null;
  photo_url: string | null;
  cost_price: number;
  sale_price: number;
  discount_type: "percent" | "fixed" | null;
  discount_value: number;
  stock_quantity: number;
  low_stock_alert: number;
  is_active: boolean;
  created_at: string;
  tags: Tag[];
}

interface Movement {
  id: string;
  product_id: string;
  type: "purchase" | "sale" | "adjustment" | "return";
  quantity: number;
  reference: string | null;
  notes: string | null;
  created_at: string;
  products: { name: string; sku: string | null } | null;
}

const EMPTY_FORM = {
  sku: "", name: "", description: "", cost_price: "", sale_price: "",
  discount_type: "" as "" | "percent" | "fixed",
  discount_value: "", stock_initial: "", low_stock_alert: "5",
};

const MOVE_TYPES: Record<string, { label: string; color: string }> = {
  purchase:   { label: "Compra",    color: "#10b981" },
  sale:       { label: "Venta",     color: "#6366f1" },
  adjustment: { label: "Ajuste",    color: "#f59e0b" },
  return:     { label: "Devolución",color: "#8E879B" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function effectivePrice(p: Product): number {
  if (!p.discount_value || p.discount_value <= 0) return p.sale_price;
  if (p.discount_type === "percent") return p.sale_price * (1 - p.discount_value / 100);
  return Math.max(0, p.sale_price - p.discount_value);
}

function genSku(): string {
  return "SKU-" + Math.random().toString(36).toUpperCase().slice(2, 8);
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 13px", border: "1.5px solid rgba(20,15,30,0.08)",
  borderRadius: 10, fontSize: 14, background: "rgba(20,15,30,0.025)", color: "#14111C",
  fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
  outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontWeight: 600, fontSize: 11, color: "#564E66",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em",
};
const MONO = "var(--font-jetbrains-mono),'JetBrains Mono',monospace";
const GRAD = "linear-gradient(135deg,#fb0f05 0%,#0027fe 100%)";

function TagEditor({ tags, onChange, inpStyle }: { tags: Tag[]; onChange: (t: Tag[]) => void; inpStyle: React.CSSProperties }) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TAG_COLORS[0]);
  const add = () => {
    const n = newName.trim(); if (!n) return;
    onChange([...tags, { name: n, color: newColor }]);
    setNewName("");
  };
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {tags.map((t, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: t.color + "18", color: t.color, border: `1px solid ${t.color}40` }}>
            {t.name}
            <button type="button" onClick={() => onChange(tags.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: t.color, padding: 0, lineHeight: 1, fontSize: 13 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())} placeholder="Nueva etiqueta..." style={{ ...inpStyle, flex: 1, padding: "8px 12px", fontSize: 13 }} />
        <div style={{ display: "flex", gap: 4 }}>
          {TAG_COLORS.map(c => (
            <button key={c} type="button" onClick={() => setNewColor(c)} style={{ width: 18, height: 18, borderRadius: "50%", background: c, border: newColor === c ? "2px solid #14111C" : "2px solid transparent", cursor: "pointer", flexShrink: 0 }} />
          ))}
        </div>
        <button type="button" onClick={add} style={{ padding: "8px 14px", borderRadius: 9, background: "#14111C", color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>+</button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function InventarioPage() {
  const { tenantId, currency, locale } = useAdmin();
  const fmt = (n: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

  const [tab, setTab] = useState<"productos" | "movimientos">("productos");
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [movLoading, setMovLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [movFilter, setMovFilter] = useState("");

  // Modal producto
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Modal ajuste de stock
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustType, setAdjustType] = useState<"purchase" | "adjustment" | "return">("purchase");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  // ── Load products ──────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async (tid: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("tenant_id", tid)
      .order("name");
    setProducts((data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (tenantId) fetchProducts(tenantId);
  }, [tenantId, fetchProducts]);

  // ── Load movements ──────────────────────────────────────────────────────────
  const fetchMovements = useCallback(async (tid: string) => {
    setMovLoading(true);
    const { data } = await supabase
      .from("inventory_movements")
      .select("*, products(name, sku)")
      .eq("tenant_id", tid)
      .order("created_at", { ascending: false })
      .limit(200);
    setMovements((data as any) || []);
    setMovLoading(false);
  }, []);

  useEffect(() => {
    if (tenantId && tab === "movimientos") fetchMovements(tenantId);
  }, [tenantId, tab, fetchMovements]);

  // ── Photo selection ─────────────────────────────────────────────────────────
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // ── Open modal ─────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, sku: genSku() });
    setPhotoFile(null); setPhotoPreview(null);
    setTags([]); setFormError(null); setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      sku: p.sku ?? "",
      name: p.name,
      description: p.description ?? "",
      cost_price: String(p.cost_price),
      sale_price: String(p.sale_price),
      discount_type: p.discount_type ?? "",
      discount_value: String(p.discount_value || ""),
      stock_initial: "",
      low_stock_alert: String(p.low_stock_alert),
    });
    setPhotoFile(null);
    setPhotoPreview(p.photo_url ?? null);
    setTags(p.tags || []);
    setFormError(null); setShowModal(true);
  };

  // ── Save product ───────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setSaving(true); setFormError(null);

    let photoUrl = editing?.photo_url ?? null;

    // Upload photo if selected
    if (photoFile) {
      const ext = photoFile.name.split(".").pop();
      const path = `${tenantId}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("products")
        .upload(path, photoFile, { upsert: true, contentType: photoFile.type });
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("products").getPublicUrl(path);
        photoUrl = urlData.publicUrl;
      }
    }

    const payload: any = {
      tenant_id: tenantId,
      sku: form.sku.trim() || null,
      name: form.name.trim(),
      description: form.description.trim() || null,
      photo_url: photoUrl,
      cost_price: parseFloat(form.cost_price) || 0,
      sale_price: parseFloat(form.sale_price) || 0,
      discount_type: form.discount_type || null,
      discount_value: parseFloat(form.discount_value) || 0,
      low_stock_alert: parseInt(form.low_stock_alert) || 5,
      tags,
    };

    if (editing) {
      const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
      if (error) { setFormError(error.message); setSaving(false); return; }
      setProducts(prev => prev.map(p => p.id === editing.id ? { ...p, ...payload } : p));
    } else {
      // Insert product
      const { data: newProduct, error } = await supabase
        .from("products")
        .insert({ ...payload, stock_quantity: 0 })
        .select()
        .single();
      if (error || !newProduct) { setFormError(error?.message ?? "Error al crear"); setSaving(false); return; }

      // If initial stock provided, create a purchase movement
      const initStock = parseInt(form.stock_initial) || 0;
      if (initStock > 0) {
        await supabase.from("inventory_movements").insert({
          tenant_id: tenantId,
          product_id: newProduct.id,
          type: "purchase",
          quantity: initStock,
          notes: "Stock inicial",
        });
        // Refetch to get updated stock
        const { data: updated } = await supabase.from("products").select("*").eq("id", newProduct.id).single();
        setProducts(prev => [...prev, (updated as any) ?? newProduct]);
      } else {
        setProducts(prev => [...prev, newProduct as any]);
      }
    }

    setSaving(false); setShowModal(false);
  };

  // ── Delete product ─────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este producto? Los movimientos de inventario también se eliminarán.")) return;
    await supabase.from("products").delete().eq("id", id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // ── Adjust stock ───────────────────────────────────────────────────────────
  const handleAdjust = async () => {
    if (!tenantId || !adjustProduct) return;
    const qty = parseInt(adjustQty);
    if (!qty || qty <= 0) return;
    setAdjusting(true);
    const direction = adjustType === "adjustment" && adjustQty.startsWith("-") ? -qty : qty;
    await supabase.from("inventory_movements").insert({
      tenant_id: tenantId,
      product_id: adjustProduct.id,
      type: adjustType,
      quantity: direction,
      notes: adjustNotes.trim() || null,
    });
    // Refresh that product
    const { data: updated } = await supabase.from("products").select("*").eq("id", adjustProduct.id).single();
    if (updated) setProducts(prev => prev.map(p => p.id === adjustProduct.id ? (updated as any) : p));
    setAdjusting(false);
    setShowAdjust(false);
    setAdjustQty(""); setAdjustNotes("");
  };

  // ── Filtered ───────────────────────────────────────────────────────────────
  const filtered = products.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredMov = movFilter
    ? movements.filter(m => m.product_id === movFilter)
    : movements;

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalValue = products.reduce((s, p) => s + p.stock_quantity * p.cost_price, 0);
  const lowStock   = products.filter(p => p.stock_quantity <= p.low_stock_alert && p.stock_quantity > 0).length;
  const outStock   = products.filter(p => p.stock_quantity === 0).length;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05", flexShrink: 0 }}>
            <IconPackage size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: "-0.5px", color: "#14111C" }}>Inventario</h1>
            <p style={{ color: "#8E879B", fontSize: 13, marginTop: 2 }}>
              {products.length} producto{products.length !== 1 ? "s" : ""} registrado{products.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {tab === "productos" && (
            <>
              <div style={{ position: "relative" }}>
                <IconSearch size={14} color="#8E879B" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar producto o SKU..."
                  style={{ ...inp, paddingLeft: 34, width: 220, height: 36 }} />
              </div>
              <button onClick={() => tenantId && fetchProducts(tenantId)}
                style={{ height: 36, width: 36, borderRadius: 9, border: "1px solid rgba(20,15,30,0.08)", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#564E66" }}>
                <IconRefresh size={15} />
              </button>
            </>
          )}
          <button onClick={openCreate}
            style={{ display: "flex", alignItems: "center", gap: 7, height: 36, padding: "0 16px", borderRadius: 9, border: "none", background: GRAD, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif", boxShadow: "0 4px 14px rgba(251,15,5,0.25)" }}>
            <IconPlus size={14} color="white" /> Nuevo producto
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", background: "white", borderRadius: 16, border: "1px solid rgba(20,15,30,0.08)", overflow: "hidden" }}>
        {[
          { label: "Total productos", value: String(products.length), color: "#14111C" },
          { label: "Valor en inventario", value: fmt(totalValue), color: "#14111C" },
          { label: "Bajo stock", value: String(lowStock), color: lowStock > 0 ? "#f59e0b" : "#10b981" },
          { label: "Sin stock", value: String(outStock), color: outStock > 0 ? "#ef4444" : "#10b981" },
        ].map((s, i) => (
          <div key={i} style={{ padding: "14px 18px", borderLeft: i > 0 ? "1px solid rgba(20,15,30,0.06)" : "none" }}>
            <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, color: "#8E879B", textTransform: "uppercase", letterSpacing: ".1em" }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color, letterSpacing: "-0.5px", marginTop: 6, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "rgba(20,15,30,0.04)", padding: 4, borderRadius: 12, alignSelf: "flex-start" }}>
        {(["productos", "movimientos"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "7px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: "pointer", border: "none", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
            background: tab === t ? "#14111C" : "transparent",
            color: tab === t ? "#fff" : "#564E66",
            boxShadow: tab === t ? "0 2px 8px rgba(20,15,30,0.18)" : "none",
            transition: "all 0.15s",
          }}>
            {t === "productos" ? "Productos" : "Movimientos"}
          </button>
        ))}
      </div>

      {/* ── TAB: Productos ── */}
      {tab === "productos" && (
        loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <div style={{ width: 32, height: 32, border: "3px solid rgba(20,15,30,0.08)", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: "white", borderRadius: 18, border: "1px solid rgba(20,15,30,0.08)", padding: "60px 32px", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(251,15,5,0.07)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05", margin: "0 auto 16px" }}>
              <IconPackage size={24} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#14111C", marginBottom: 6 }}>
              {search ? "Sin resultados" : "Sin productos registrados"}
            </div>
            <p style={{ color: "#8E879B", fontSize: 14, marginBottom: 24 }}>
              {search ? `No hay productos que coincidan con "${search}"` : "Agrega tu primer producto para llevar el control del inventario."}
            </p>
            {!search && (
              <button onClick={openCreate} style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: GRAD, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>
                + Crear primer producto
              </button>
            )}
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: 18, border: "1px solid rgba(20,15,30,0.08)", overflow: "hidden" }}>
            {/* Table head */}
            <div style={{ display: "grid", gridTemplateColumns: "56px 1fr 120px 120px 120px 90px 150px", padding: "10px 20px", borderBottom: "1px solid #f0eeeb", background: "rgba(20,15,30,0.02)", gap: 12 }}>
              {["Foto", "Producto / SKU", "P. Costo", "P. Venta", "P. Efectivo", "Stock", "Acciones"].map(h => (
                <div key={h} style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 600, color: "#8E879B", textTransform: "uppercase", letterSpacing: ".09em" }}>{h}</div>
              ))}
            </div>

            {filtered.map((p, idx) => {
              const effP = effectivePrice(p);
              const isLow  = p.stock_quantity > 0 && p.stock_quantity <= p.low_stock_alert;
              const isOut  = p.stock_quantity === 0;
              return (
                <div key={p.id}
                  style={{ display: "grid", gridTemplateColumns: "56px 1fr 120px 120px 120px 90px 150px", padding: "13px 20px", gap: 12, alignItems: "center", borderBottom: idx < filtered.length - 1 ? "1px solid #f7f5f2" : "none", transition: "background .1s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#fafaf8")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Photo */}
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(20,15,30,0.04)", overflow: "hidden", flexShrink: 0 }}>
                    {p.photo_url ? (
                      <img src={p.photo_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#c4bfce" }}>
                        <IconPackage size={18} />
                      </div>
                    )}
                  </div>

                  {/* Name + SKU */}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#14111C" }}>{p.name}</div>
                    {p.sku && (
                      <div style={{ fontFamily: MONO, fontSize: 10, color: "#8E879B", marginTop: 2 }}>{p.sku}</div>
                    )}
                    {p.description && (
                      <div style={{ fontSize: 11, color: "#b0abc0", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{p.description}</div>
                    )}
                    {(p.tags || []).length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 4 }}>
                        {(p.tags || []).map((tag, ti) => (
                          <span key={ti} style={{ fontSize: 9.5, fontWeight: 700, padding: "1px 7px", borderRadius: 20, background: tag.color + "18", color: tag.color, border: `1px solid ${tag.color}30` }}>{tag.name}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Prices */}
                  <div style={{ fontFamily: MONO, fontSize: 12, color: "#564E66" }}>{fmt(p.cost_price)}</div>
                  <div style={{ fontFamily: MONO, fontSize: 12, color: "#14111C", fontWeight: 600 }}>{fmt(p.sale_price)}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: p.discount_value > 0 ? "#10b981" : "#14111C" }}>{fmt(effP)}</span>
                    {p.discount_value > 0 && (
                      <span style={{ fontSize: 10, color: "#10b981", fontWeight: 600 }}>
                        -{p.discount_type === "percent" ? `${p.discount_value}%` : fmt(p.discount_value)}
                      </span>
                    )}
                  </div>

                  {/* Stock */}
                  <div>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "3px 9px", borderRadius: 20, fontSize: 11.5, fontWeight: 700, fontFamily: MONO,
                      background: isOut ? "rgba(239,68,68,0.1)" : isLow ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.09)",
                      color: isOut ? "#ef4444" : isLow ? "#d97706" : "#059669",
                    }}>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", flexShrink: 0 }} />
                      {isOut ? "Sin stock" : `${p.stock_quantity} uds.`}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => { setAdjustProduct(p); setAdjustQty(""); setAdjustNotes(""); setAdjustType("purchase"); setShowAdjust(true); }}
                      style={{ padding: "5px 10px", borderRadius: 8, border: "1.5px solid rgba(20,15,30,0.08)", background: "white", color: "#3a3548", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>
                      Stock
                    </button>
                    <button onClick={() => openEdit(p)}
                      style={{ padding: "5px 10px", borderRadius: 8, border: "1.5px solid rgba(20,15,30,0.08)", background: "white", color: "#3a3548", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>
                      Editar
                    </button>
                    <button onClick={() => handleDelete(p.id)}
                      style={{ padding: "5px 8px", borderRadius: 8, border: "none", background: "rgba(239,68,68,0.07)", color: "#ef4444", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <IconX size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── TAB: Movimientos ── */}
      {tab === "movimientos" && (
        <div style={{ background: "white", borderRadius: 18, border: "1px solid rgba(20,15,30,0.08)", overflow: "hidden" }}>
          {/* Filter */}
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #f0eeeb", display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#564E66", whiteSpace: "nowrap" }}>Filtrar por:</span>
            <select value={movFilter} onChange={e => setMovFilter(e.target.value)}
              style={{ ...inp, width: 240, height: 36 }}>
              <option value="">Todos los productos</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ""}</option>)}
            </select>
          </div>

          {movLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
              <div style={{ width: 28, height: 28, border: "3px solid rgba(20,15,30,0.08)", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
            </div>
          ) : filteredMov.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#8E879B", fontSize: 14 }}>Sin movimientos registrados.</div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 110px 80px 1fr", padding: "10px 20px", borderBottom: "1px solid #f0eeeb", background: "rgba(20,15,30,0.02)", gap: 12 }}>
                {["Fecha", "Producto", "Tipo", "Cantidad", "Notas"].map(h => (
                  <div key={h} style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 600, color: "#8E879B", textTransform: "uppercase", letterSpacing: ".09em" }}>{h}</div>
                ))}
              </div>
              {filteredMov.map((m, i) => {
                const meta = MOVE_TYPES[m.type] ?? { label: m.type, color: "#8E879B" };
                return (
                  <div key={m.id} style={{ display: "grid", gridTemplateColumns: "160px 1fr 110px 80px 1fr", padding: "11px 20px", gap: 12, alignItems: "center", borderBottom: i < filteredMov.length - 1 ? "1px solid #f7f5f2" : "none" }}>
                    <div style={{ fontFamily: MONO, fontSize: 11, color: "#8E879B" }}>
                      {new Date(m.created_at).toLocaleString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12.5, color: "#14111C" }}>{m.products?.name ?? "—"}</div>
                      {m.products?.sku && <div style={{ fontFamily: MONO, fontSize: 10, color: "#8E879B" }}>{m.products.sku}</div>}
                    </div>
                    <span style={{ display: "inline-flex", padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${meta.color}15`, color: meta.color }}>
                      {meta.label}
                    </span>
                    <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: m.quantity > 0 ? "#10b981" : "#ef4444" }}>
                      {m.quantity > 0 ? "+" : ""}{m.quantity}
                    </div>
                    <div style={{ fontSize: 12, color: "#8E879B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {m.notes ?? m.reference ?? "—"}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ── Modal: Crear / Editar producto ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(12,12,20,0.45)", backdropFilter: "blur(16px) saturate(1.4)", WebkitBackdropFilter: "blur(16px) saturate(1.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)", border: "1px solid rgba(255,255,255,0.7)", borderRadius: 22, padding: 28, width: "100%", maxWidth: 540, boxShadow: "0 24px 64px rgba(0,0,0,0.18)", maxHeight: "90vh", overflowY: "auto" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: formError ? 14 : 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05" }}>
                  <IconPackage size={17} />
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: "#14111C", margin: 0 }}>
                  {editing ? "Editar producto" : "Nuevo producto"}
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8E879B" }}>
                <IconX size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ background: "#fff0f0", border: "1px solid rgba(251,15,5,0.2)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#d90d04", marginBottom: 16, fontWeight: 500 }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Photo */}
              <div style={{ marginBottom: 18, display: "flex", gap: 16, alignItems: "flex-end" }}>
                <div style={{ width: 80, height: 80, borderRadius: 14, background: "rgba(20,15,30,0.04)", border: "1.5px dashed rgba(20,15,30,0.15)", overflow: "hidden", flexShrink: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  onClick={() => fileRef.current?.click()}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ textAlign: "center", color: "#b0abc0" }}>
                      <IconPackage size={22} />
                      <div style={{ fontSize: 9, marginTop: 4 }}>Foto</div>
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Foto del producto</label>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
                  <button type="button" onClick={() => fileRef.current?.click()}
                    style={{ padding: "8px 14px", borderRadius: 9, border: "1.5px solid rgba(20,15,30,0.08)", background: "white", color: "#564E66", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>
                    {photoPreview ? "Cambiar foto" : "Subir foto"}
                  </button>
                  {photoPreview && (
                    <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                      style={{ marginLeft: 8, padding: "8px 10px", borderRadius: 9, border: "none", background: "rgba(239,68,68,0.07)", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>
                      Quitar
                    </button>
                  )}
                </div>
              </div>

              {/* Row: SKU + Name */}
              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={lbl}>SKU / Código</label>
                  <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="SKU-ABC123" style={{ ...inp, fontFamily: MONO }} />
                </div>
                <div>
                  <label style={lbl}>Nombre *</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej. Shampoo Keratina 300ml" style={inp} />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Descripción</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Descripción breve del producto..." rows={2}
                  style={{ ...inp, resize: "vertical", minHeight: 60 }} />
              </div>

              {/* Tags */}
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Etiquetas</label>
                <TagEditor tags={tags} onChange={setTags} inpStyle={inp} />
              </div>

              {/* Prices */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={lbl}>Precio de costo *</label>
                  <input required type="number" min={0} step={100} value={form.cost_price} onChange={e => setForm({ ...form, cost_price: e.target.value })}
                    placeholder="0" style={{ ...inp, fontFamily: MONO }} />
                </div>
                <div>
                  <label style={lbl}>Precio de venta *</label>
                  <input required type="number" min={0} step={100} value={form.sale_price} onChange={e => setForm({ ...form, sale_price: e.target.value })}
                    placeholder="0" style={{ ...inp, fontFamily: MONO }} />
                </div>
              </div>

              {/* Discount */}
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Descuento <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(opcional)</span></label>
                <div style={{ display: "flex", gap: 8 }}>
                  <select value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value as any })}
                    style={{ ...inp, width: 130 }}>
                    <option value="">Sin descuento</option>
                    <option value="percent">Porcentaje (%)</option>
                    <option value="fixed">Valor fijo ({currency})</option>
                  </select>
                  {form.discount_type && (
                    <input type="number" min={0} step={form.discount_type === "percent" ? 1 : 100}
                      max={form.discount_type === "percent" ? 100 : undefined}
                      value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })}
                      placeholder={form.discount_type === "percent" ? "0–100" : "0"}
                      style={{ ...inp, flex: 1, fontFamily: MONO }} />
                  )}
                </div>
                {form.discount_type && form.discount_value && form.sale_price && (
                  <div style={{ fontSize: 11.5, color: "#10b981", marginTop: 5, fontWeight: 600 }}>
                    Precio efectivo: {fmt(
                      form.discount_type === "percent"
                        ? (parseFloat(form.sale_price) || 0) * (1 - (parseFloat(form.discount_value) || 0) / 100)
                        : Math.max(0, (parseFloat(form.sale_price) || 0) - (parseFloat(form.discount_value) || 0))
                    )}
                  </div>
                )}
              </div>

              {/* Stock + Alert */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
                {!editing && (
                  <div>
                    <label style={lbl}>Stock inicial</label>
                    <input type="number" min={0} value={form.stock_initial} onChange={e => setForm({ ...form, stock_initial: e.target.value })}
                      placeholder="0" style={{ ...inp, fontFamily: MONO }} />
                  </div>
                )}
                <div>
                  <label style={lbl}>Alerta stock mínimo</label>
                  <input type="number" min={0} value={form.low_stock_alert} onChange={e => setForm({ ...form, low_stock_alert: e.target.value })}
                    placeholder="5" style={{ ...inp, fontFamily: MONO }} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setShowModal(false)} disabled={saving}
                  style={{ padding: "10px 18px", borderRadius: 10, border: "1.5px solid rgba(20,15,30,0.1)", background: "white", color: "#564E66", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: saving ? "rgba(20,15,30,0.08)" : GRAD, color: saving ? "#8E879B" : "white", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>
                  {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Ajustar stock ── */}
      {showAdjust && adjustProduct && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(12,12,20,0.45)", backdropFilter: "blur(16px) saturate(1.4)", WebkitBackdropFilter: "blur(16px) saturate(1.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowAdjust(false); }}>
          <div style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)", border: "1px solid rgba(255,255,255,0.7)", borderRadius: 22, padding: 28, width: "100%", maxWidth: 400, boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#14111C", margin: 0 }}>Ajustar stock</h2>
                <p style={{ fontSize: 12, color: "#8E879B", marginTop: 3 }}>{adjustProduct.name}</p>
              </div>
              <button onClick={() => setShowAdjust(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8E879B" }}><IconX size={18} /></button>
            </div>

            <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(20,15,30,0.03)", border: "1px solid rgba(20,15,30,0.06)", marginBottom: 20 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, color: "#8E879B", textTransform: "uppercase", letterSpacing: ".08em" }}>Stock actual</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#14111C", marginTop: 3, fontFamily: MONO }}>{adjustProduct.stock_quantity} uds.</div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Tipo de movimiento</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {(["purchase", "adjustment", "return"] as const).map(t => (
                  <button key={t} type="button" onClick={() => setAdjustType(t)} style={{
                    padding: "8px 6px", borderRadius: 9, fontSize: 11, fontWeight: 700, cursor: "pointer",
                    border: adjustType === t ? `1.5px solid ${MOVE_TYPES[t].color}` : "1.5px solid rgba(20,15,30,0.08)",
                    background: adjustType === t ? `${MOVE_TYPES[t].color}12` : "white",
                    color: adjustType === t ? MOVE_TYPES[t].color : "#564E66",
                    fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif", transition: "all .15s",
                  }}>
                    {MOVE_TYPES[t].label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Cantidad a {adjustType === "adjustment" ? "ajustar (+ entrada / – salida)" : "agregar"}</label>
              <input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)}
                placeholder={adjustType === "adjustment" ? "Ej. 10 o -5" : "Ej. 10"}
                style={{ ...inp, fontFamily: MONO }} />
            </div>

            <div style={{ marginBottom: 22 }}>
              <label style={lbl}>Notas</label>
              <input type="text" value={adjustNotes} onChange={e => setAdjustNotes(e.target.value)}
                placeholder="Motivo del ajuste..." style={inp} />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowAdjust(false)}
                style={{ padding: "10px 18px", borderRadius: 10, border: "1.5px solid rgba(20,15,30,0.1)", background: "white", color: "#564E66", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>
                Cancelar
              </button>
              <button onClick={handleAdjust} disabled={adjusting || !adjustQty}
                style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: (adjusting || !adjustQty) ? "rgba(20,15,30,0.08)" : GRAD, color: (adjusting || !adjustQty) ? "#8E879B" : "white", fontSize: 13, fontWeight: 700, cursor: (adjusting || !adjustQty) ? "not-allowed" : "pointer", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>
                {adjusting ? "Guardando..." : "Registrar movimiento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
