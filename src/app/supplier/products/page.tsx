"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  unit: string;
  min_order_qty: number;
  stock: number | null;
  is_active: boolean;
}

const UNITS = ["unidad", "caja", "kit", "bolsa", "frasco", "par", "docena", "litro", "ml", "g", "kg"];

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export default function SupplierProductsPage() {
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [search, setSearch] = useState("");

  const blankForm = (): Omit<Product, "id"> => ({
    name: "", description: "", category: "", price: 0, unit: "unidad",
    min_order_qty: 1, stock: null, is_active: true,
  });
  const [form, setForm] = useState(blankForm());

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: supplier } = await supabase.from("suppliers").select("id").eq("user_id", session.user.id).maybeSingle();
      if (supplier) { setSupplierId(supplier.id); }
    }
    init();
  }, []);

  const loadProducts = useCallback(async () => {
    if (!supplierId) return;
    setLoading(true);
    const { data } = await supabase
      .from("supplier_products")
      .select("*")
      .eq("supplier_id", supplierId)
      .order("created_at", { ascending: false });
    setProducts(data ?? []);
    setLoading(false);
  }, [supplierId]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const openCreate = () => { setEditing(null); setForm(blankForm()); setError(null); setShowModal(true); };
  const openEdit = (p: Product) => { setEditing(p); setForm({ ...p }); setError(null); setShowModal(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) return;
    setSaving(true);
    setError(null);
    try {
      const payload = { ...form, supplier_id: supplierId };
      if (editing) {
        const { error: err } = await supabase.from("supplier_products").update(payload).eq("id", editing.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from("supplier_products").insert(payload);
        if (err) throw err;
      }
      setShowModal(false);
      await loadProducts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p: Product) => {
    await supabase.from("supplier_products").update({ is_active: !p.is_active }).eq("id", p.id);
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !p.is_active } : x));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return;
    await supabase.from("supplier_products").delete().eq("id", id);
    setProducts(prev => prev.filter(x => x.id !== id));
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "white", margin: 0 }}>Catálogo de Productos</h1>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "4px 0 0" }}>
            {products.length} producto{products.length !== 1 ? "s" : ""} registrado{products.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button onClick={openCreate} style={btnPrimary}>+ Nuevo producto</button>
      </div>

      <input
        type="text" placeholder="Buscar por nombre o categoría..."
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ ...inputStyle, maxWidth: 320, marginBottom: 18 }}
      />

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.25)", fontSize: 14 }}>
          {search ? "Sin resultados" : "No tienes productos. ¡Agrega el primero!"}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {filtered.map(p => (
            <div key={p.id} style={{
              background: "rgba(255,255,255,0.03)", border: `1px solid ${p.is_active ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.04)"}`,
              borderRadius: 14, padding: 18, opacity: p.is_active ? 1 : 0.6,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 2, wordBreak: "break-word" }}>{p.name}</div>
                  {p.category && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>{p.category}</div>}
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 5, marginLeft: 8, flexShrink: 0,
                  background: p.is_active ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.07)",
                  color: p.is_active ? "#34d399" : "rgba(255,255,255,0.3)",
                }}>
                  {p.is_active ? "Activo" : "Inactivo"}
                </span>
              </div>

              {p.description && (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 10px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {p.description}
                </p>
              )}

              <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>Precio</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#34d399" }}>{fmt(p.price)}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>por {p.unit}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>Mín. pedido</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{p.min_order_qty}</div>
                </div>
                {p.stock !== null && (
                  <div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>Stock</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: p.stock <= 5 ? "#f87171" : "rgba(255,255,255,0.7)" }}>{p.stock}</div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 7 }}>
                <button onClick={() => openEdit(p)} style={btnGhost}>Editar</button>
                <button onClick={() => toggleActive(p)} style={btnGhost}>
                  {p.is_active ? "Desactivar" : "Activar"}
                </button>
                <button onClick={() => handleDelete(p.id)} style={{ ...btnGhost, color: "#f87171", borderColor: "rgba(248,113,113,0.2)" }}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{
            background: "#0d0d1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16,
            padding: "28px 28px", width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto",
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "white", marginBottom: 20 }}>
              {editing ? "Editar producto" : "Nuevo producto"}
            </h2>

            {error && (
              <div style={{ background: "rgba(251,15,5,0.1)", border: "1px solid rgba(251,15,5,0.3)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#ff7d72" }}>
                ⚠ {error}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <FLabel label="Nombre del producto *">
                <input required type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="Ej: Esmalte permanente gel 10ml" />
              </FLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <FLabel label="Categoría">
                  <input type="text" value={form.category ?? ""} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle} placeholder="Uñas, Barbería..." />
                </FLabel>
                <FLabel label="Unidad">
                  <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} style={inputStyle}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </FLabel>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <FLabel label="Precio (COP) *">
                  <input required type="number" min={0} value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} style={inputStyle} />
                </FLabel>
                <FLabel label="Mín. pedido">
                  <input type="number" min={1} value={form.min_order_qty} onChange={e => setForm(f => ({ ...f, min_order_qty: Number(e.target.value) }))} style={inputStyle} />
                </FLabel>
                <FLabel label="Stock (opcional)">
                  <input type="number" min={0} value={form.stock ?? ""} onChange={e => setForm(f => ({ ...f, stock: e.target.value === "" ? null : Number(e.target.value) }))} style={inputStyle} placeholder="Sin límite" />
                </FLabel>
              </div>
              <FLabel label="Descripción">
                <textarea value={form.description ?? ""} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, height: 72, resize: "none" } as React.CSSProperties} placeholder="Describe el producto, presentación, usos..." />
              </FLabel>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ ...btnGhost, flex: 1, padding: "11px" }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ ...btnPrimary, flex: 2 }}>
                  {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: "0.03em" }}>{label}</label>
      {children}
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

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
  color: "white", fontSize: 13, fontWeight: 500, outline: "none", boxSizing: "border-box",
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 18px", borderRadius: 10, border: "none", cursor: "pointer",
  background: "linear-gradient(135deg, #fb0f05, #cc0a03)",
  color: "white", fontSize: 13, fontWeight: 700,
  boxShadow: "0 4px 14px rgba(251,15,5,0.25)",
};

const btnGhost: React.CSSProperties = {
  padding: "7px 11px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 600,
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.6)",
};
