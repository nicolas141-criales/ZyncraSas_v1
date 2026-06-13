"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface SupplierRow {
  id: string;
  company_name: string;
  email: string;
  nit: string | null;
  phone: string | null;
  city: string | null;
  description: string | null;
  categories: string[];
  status: string;
  rejection_reason: string | null;
  created_at: string;
  logo_url: string | null;
  cover_url: string | null;
}

interface CatalogProduct {
  id: string;
  name: string;
  category: string | null;
  price: number;
  unit: string;
  stock: number | null;
  is_active: boolean;
  images: string[];
}

type Filter = "all" | "pending" | "approved" | "rejected" | "suspended";

const STATUS_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:   { label: "Pendiente",  color: "#fbbf24", bg: "rgba(251,186,36,0.15)", dot: "#fbbf24" },
  approved:  { label: "Aprobado",   color: "#34d399", bg: "rgba(52,211,153,0.15)", dot: "#34d399" },
  rejected:  { label: "Rechazado",  color: "#f87171", bg: "rgba(248,113,113,0.15)", dot: "#f87171" },
  suspended: { label: "Suspendido", color: "#a78bfa", bg: "rgba(167,139,250,0.15)", dot: "#a78bfa" },
};

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export default function PlatformSuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending");
  const [updating, setUpdating] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [profileModal, setProfileModal] = useState<{ supplier: SupplierRow; products: CatalogProduct[] } | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const q = supabase
      .from("suppliers")
      .select("id, company_name, email, nit, phone, city, description, categories, status, rejection_reason, created_at, logo_url, cover_url")
      .order("created_at", { ascending: false });
    const { data } = filter === "all" ? await q : await q.eq("status", filter);
    setSuppliers((data ?? []) as SupplierRow[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: string, reason?: string) => {
    setUpdating(id);
    const { data: updated } = await supabase
      .from("suppliers").update({ status, rejection_reason: reason ?? null })
      .eq("id", id).select("company_name, email").single();

    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, status, rejection_reason: reason ?? null } : s));
    if (profileModal?.supplier.id === id) {
      setProfileModal(prev => prev ? { ...prev, supplier: { ...prev.supplier, status } } : null);
    }

    if (status === "approved" && updated) {
      await fetch("/api/supplier-approved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: updated.company_name, email: updated.email, type: "approved" }),
      });
    }
    setUpdating(null);
  };

  const openProfile = async (supplier: SupplierRow) => {
    setProfileModal({ supplier, products: [] });
    setLoadingProducts(true);
    const { data } = await supabase
      .from("supplier_products")
      .select("id, name, category, price, unit, stock, is_active, images")
      .eq("supplier_id", supplier.id)
      .order("name");
    setProfileModal(prev => prev ? { ...prev, products: (data ?? []) as CatalogProduct[] } : null);
    setLoadingProducts(false);
  };

  const counts = suppliers.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filterTabs: { key: Filter; label: string }[] = [
    { key: "pending",   label: "Pendientes" },
    { key: "approved",  label: "Aprobados" },
    { key: "all",       label: "Todos" },
    { key: "rejected",  label: "Rechazados" },
    { key: "suspended", label: "Suspendidos" },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "white", margin: 0 }}>Proveedores</h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "4px 0 0" }}>
          Gestiona solicitudes y proveedores activos de la plataforma
        </p>
      </div>

      {/* Tabs de filtro */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 0 }}>
        {filterTabs.map(({ key, label }) => {
          const active = filter === key;
          const sm = key !== "all" ? STATUS_META[key] : null;
          const count = key === "all" ? suppliers.length : (counts[key] ?? 0);
          return (
            <button key={key} onClick={() => setFilter(key)} style={{
              padding: "9px 16px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
              background: "transparent",
              color: active ? (sm?.color ?? "white") : "rgba(255,255,255,0.35)",
              borderBottom: `2px solid ${active ? (sm?.color ?? "white") : "transparent"}`,
              marginBottom: -1, transition: "all .15s",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              {sm && <span style={{ width: 6, height: 6, borderRadius: "50%", background: sm.dot, display: "inline-block" }} />}
              {label}
              {count > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: "1px 6px", borderRadius: 10,
                  background: active ? (sm?.bg ?? "rgba(255,255,255,0.1)") : "rgba(255,255,255,0.07)",
                  color: active ? (sm?.color ?? "white") : "rgba(255,255,255,0.4)",
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Grid de tarjetas */}
      {loading ? <Spinner /> : suppliers.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px", color: "rgba(255,255,255,0.2)", fontSize: 14 }}>
          No hay proveedores {filter !== "all" ? `con estado "${STATUS_META[filter]?.label}"` : ""}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {suppliers.map(s => {
            const sm = STATUS_META[s.status] ?? STATUS_META.pending;
            return (
              <div key={s.id} style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16, overflow: "hidden",
                transition: "border-color .2s",
              }}>
                {/* Cover */}
                <div style={{ position: "relative", height: 120 }}>
                  {s.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{
                      height: "100%",
                      background: `linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(251,15,5,0.15) 100%)`,
                    }} />
                  )}
                  {/* Gradient overlay */}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(7,7,26,0.85) 0%, transparent 60%)" }} />
                  {/* Status badge */}
                  <span style={{
                    position: "absolute", top: 10, right: 10,
                    fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
                    background: sm.bg, color: sm.color,
                    border: `1px solid ${sm.color}30`,
                    backdropFilter: "blur(8px)",
                    display: "flex", alignItems: "center", gap: 4,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: sm.dot }} />
                    {sm.label}
                  </span>
                  {/* Logo */}
                  <div style={{
                    position: "absolute", bottom: -22, left: 18,
                    width: 48, height: 48, borderRadius: 12,
                    border: "2px solid rgba(255,255,255,0.12)",
                    background: "rgba(13,13,30,0.9)", overflow: "hidden",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    backdropFilter: "blur(8px)",
                  }}>
                    {s.logo_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={s.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: 22 }}>🏢</span>
                    }
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: "30px 18px 18px" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "white", marginBottom: 2 }}>{s.company_name}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {s.city && <span>📍 {s.city}</span>}
                    {s.email && <span>✉ {s.email}</span>}
                  </div>
                  {s.description && (
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 10px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {s.description}
                    </p>
                  )}
                  {s.categories.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
                      {s.categories.map(c => (
                        <span key={c} style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>{c}</span>
                      ))}
                    </div>
                  )}

                  {/* Acciones */}
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                    <button onClick={() => openProfile(s)} style={{
                      flex: 1, padding: "9px 12px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.85)",
                      fontSize: 12, fontWeight: 700, cursor: "pointer",
                    }}>
                      Ver perfil y catálogo →
                    </button>
                    {s.status === "pending" && (
                      <>
                        <button onClick={() => setStatus(s.id, "approved")} disabled={updating === s.id} style={actionBtn("#34d399", "rgba(52,211,153,0.15)")}>✓</button>
                        <button onClick={() => { setRejectModal({ id: s.id, name: s.company_name }); setRejectReason(""); }} disabled={updating === s.id} style={actionBtn("#f87171", "rgba(248,113,113,0.12)")}>✗</button>
                      </>
                    )}
                    {s.status === "approved" && (
                      <button onClick={() => setStatus(s.id, "suspended")} disabled={updating === s.id} style={actionBtn("#a78bfa", "rgba(167,139,250,0.1)")}>⏸</button>
                    )}
                    {(s.status === "rejected" || s.status === "suspended") && (
                      <button onClick={() => setStatus(s.id, "approved")} disabled={updating === s.id} style={actionBtn("#34d399", "rgba(52,211,153,0.1)")}>↑</button>
                    )}
                  </div>

                  {s.rejection_reason && (
                    <div style={{ marginTop: 10, fontSize: 11, color: "#f87171", background: "rgba(248,113,113,0.08)", padding: "7px 10px", borderRadius: 7 }}>
                      Motivo: {s.rejection_reason}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal perfil + catálogo ── */}
      {profileModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setProfileModal(null); }}
        >
          <div style={{
            background: "#0d0d1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20,
            width: "100%", maxWidth: 720, maxHeight: "92vh", display: "flex", flexDirection: "column",
            overflow: "hidden",
          }}>
            {/* Cover banner */}
            <div style={{ position: "relative", height: 160, flexShrink: 0 }}>
              {profileModal.supplier.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profileModal.supplier.cover_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ height: "100%", background: "linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(251,15,5,0.2) 100%)" }} />
              )}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(13,13,30,1) 0%, rgba(13,13,30,0.3) 60%, transparent 100%)" }} />
              <button
                onClick={() => setProfileModal(null)}
                style={{ position: "absolute", top: 14, right: 14, width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(7,7,26,0.7)", color: "white", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)" }}
              >×</button>

              {/* Logo sobre el cover */}
              <div style={{ position: "absolute", bottom: -28, left: 24, width: 60, height: 60, borderRadius: 16, border: "3px solid #0d0d1e", background: "rgba(13,13,30,0.95)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {profileModal.supplier.logo_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={profileModal.supplier.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <span style={{ fontSize: 28 }}>🏢</span>
                }
              </div>
              {/* Status */}
              {(() => { const sm = STATUS_META[profileModal.supplier.status] ?? STATUS_META.pending; return (
                <span style={{ position: "absolute", bottom: 14, right: 20, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: sm.bg, color: sm.color, border: `1px solid ${sm.color}30` }}>
                  {sm.label}
                </span>
              ); })()}
            </div>

            {/* Scrollable body */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {/* Info del proveedor */}
              <div style={{ padding: "36px 24px 20px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "white", letterSpacing: "-0.5px" }}>{profileModal.supplier.company_name}</div>
                    {profileModal.supplier.nit && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>NIT {profileModal.supplier.nit}</div>}
                  </div>
                  {/* Acciones rápidas */}
                  <div style={{ display: "flex", gap: 7 }}>
                    {profileModal.supplier.status === "pending" && (
                      <>
                        <button onClick={() => setStatus(profileModal.supplier.id, "approved")} disabled={updating === profileModal.supplier.id}
                          style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(52,211,153,0.4)", background: "rgba(52,211,153,0.12)", color: "#34d399", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          ✓ Aprobar
                        </button>
                        <button onClick={() => { setRejectModal({ id: profileModal.supplier.id, name: profileModal.supplier.company_name }); setRejectReason(""); }}
                          style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.1)", color: "#f87171", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          ✗ Rechazar
                        </button>
                      </>
                    )}
                    {profileModal.supplier.status === "approved" && (
                      <button onClick={() => setStatus(profileModal.supplier.id, "suspended")} disabled={updating === profileModal.supplier.id}
                        style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.1)", color: "#a78bfa", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        ⏸ Suspender
                      </button>
                    )}
                    {(profileModal.supplier.status === "rejected" || profileModal.supplier.status === "suspended") && (
                      <button onClick={() => setStatus(profileModal.supplier.id, "approved")} disabled={updating === profileModal.supplier.id}
                        style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(52,211,153,0.3)", background: "rgba(52,211,153,0.1)", color: "#34d399", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        ↑ Re-activar
                      </button>
                    )}
                  </div>
                </div>

                {profileModal.supplier.description && (
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, margin: "0 0 14px" }}>{profileModal.supplier.description}</p>
                )}

                <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 14 }}>
                  {profileModal.supplier.email && <ContactChip icon="✉" text={profileModal.supplier.email} />}
                  {profileModal.supplier.phone && <ContactChip icon="📞" text={profileModal.supplier.phone} />}
                  {profileModal.supplier.city && <ContactChip icon="📍" text={profileModal.supplier.city} />}
                  <ContactChip icon="📅" text={new Date(profileModal.supplier.created_at).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })} />
                </div>

                {profileModal.supplier.categories.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {profileModal.supplier.categories.map(c => (
                      <span key={c} style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 8, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.08)" }}>{c}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Separador */}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", margin: "0 24px" }} />

              {/* Catálogo */}
              <div style={{ padding: "20px 24px 28px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
                  Catálogo · {profileModal.products.length} producto{profileModal.products.length !== 1 ? "s" : ""}
                </div>
                {loadingProducts ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 100 }}>
                    <div style={{ width: 24, height: 24, border: "3px solid rgba(255,255,255,0.06)", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  </div>
                ) : profileModal.products.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(255,255,255,0.2)", fontSize: 13 }}>
                    Aún no tiene productos publicados
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                    {profileModal.products.map(p => (
                      <div key={p.id} style={{
                        background: "rgba(255,255,255,0.03)", border: `1px solid ${p.is_active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)"}`,
                        borderRadius: 12, overflow: "hidden", opacity: p.is_active ? 1 : 0.5,
                      }}>
                        {p.images?.[0]
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={p.images[0]} alt={p.name} style={{ width: "100%", height: 100, objectFit: "cover" }} />
                          : <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.02)", fontSize: 26 }}>📦</div>
                        }
                        <div style={{ padding: "10px 12px" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "white", marginBottom: 2, lineHeight: 1.3 }}>{p.name}</div>
                          {p.category && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 5 }}>{p.category}</div>}
                          <div style={{ fontSize: 14, fontWeight: 800, color: "#34d399" }}>{fmt(p.price)}</div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>
                            por {p.unit}{p.stock !== null ? ` · ${p.stock} en stock` : ""}
                          </div>
                          {!p.is_active && <div style={{ fontSize: 10, color: "#f87171", fontWeight: 700, marginTop: 4 }}>Inactivo</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de rechazo */}
      {rejectModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setRejectModal(null); }}>
          <div style={{ background: "#0d0d1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "28px", width: "100%", maxWidth: 440 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "white", marginBottom: 8 }}>Rechazar proveedor</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>
              Explica el motivo del rechazo para <strong style={{ color: "rgba(255,255,255,0.75)" }}>{rejectModal.name}</strong>.
            </p>
            <textarea
              value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Ej: No cumple los requisitos, información insuficiente..."
              style={{ width: "100%", height: 80, padding: "9px 12px", borderRadius: 8, boxSizing: "border-box", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 13, resize: "none", outline: "none", marginBottom: 16 }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setRejectModal(null)} style={{ flex: 1, padding: "10px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={async () => { await setStatus(rejectModal.id, "rejected", rejectReason || "No cumple los requisitos."); setRejectModal(null); setRejectReason(""); }}
                style={{ flex: 1, padding: "10px", borderRadius: 9, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.15)", color: "#f87171", fontSize: 13, fontWeight: 700, cursor: "pointer" } as React.CSSProperties}>
                Confirmar rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ContactChip({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      <div style={{ width: 30, height: 30, border: "3px solid rgba(255,255,255,0.06)", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const actionBtn = (color: string, bg: string): React.CSSProperties => ({
  padding: "9px 13px", borderRadius: 9, border: `1px solid ${color}40`,
  background: bg, color, fontSize: 13, fontWeight: 700, cursor: "pointer",
});
