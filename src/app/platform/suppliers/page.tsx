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
}

type Filter = "all" | "pending" | "approved" | "rejected" | "suspended";

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "Pendiente",   color: "#fbbf24", bg: "rgba(251,186,36,0.12)" },
  approved:  { label: "Aprobado",    color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  rejected:  { label: "Rechazado",   color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  suspended: { label: "Suspendido",  color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
};

export default function PlatformSuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending");
  const [updating, setUpdating] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const q = supabase.from("suppliers").select("*").order("created_at", { ascending: false });
    const { data } = filter === "all" ? await q : await q.eq("status", filter);
    setSuppliers(data ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: string, reason?: string) => {
    setUpdating(id);
    await supabase.from("suppliers").update({
      status,
      rejection_reason: reason ?? null,
    }).eq("id", id);
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, status, rejection_reason: reason ?? null } : s));
    setUpdating(null);
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    await setStatus(rejectModal.id, "rejected", rejectReason || "No cumple los requisitos de la plataforma.");
    setRejectModal(null);
    setRejectReason("");
  };

  const counts = suppliers.reduce((acc, s) => { acc[s.status] = (acc[s.status] ?? 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "white", margin: 0 }}>Proveedores</h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "4px 0 0" }}>
          Gestiona solicitudes y proveedores activos de la plataforma
        </p>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 20 }}>
        {(["all", "pending", "approved", "rejected", "suspended"] as Filter[]).map(f => {
          const meta = f === "all"
            ? { label: "Todos", color: "rgba(255,255,255,0.8)", bg: "rgba(255,255,255,0.08)" }
            : STATUS_META[f];
          const active = filter === f;
          return (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "6px 13px", borderRadius: 8, border: "1px solid",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              borderColor: active ? meta.color : "rgba(255,255,255,0.1)",
              background: active ? meta.bg : "transparent",
              color: active ? meta.color : "rgba(255,255,255,0.4)",
            }}>
              {meta.label}
              {f !== "all" && (counts[f] ?? 0) > 0 && ` (${counts[f] ?? 0})`}
            </button>
          );
        })}
      </div>

      {loading ? <Spinner /> : suppliers.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.25)", fontSize: 14 }}>
          No hay proveedores {filter !== "all" ? `con estado "${STATUS_META[filter]?.label}"` : ""}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {suppliers.map(s => {
            const sm = STATUS_META[s.status] ?? STATUS_META.pending;
            return (
              <div key={s.id} style={{
                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14, padding: "18px 20px",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "white" }}>{s.company_name}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: sm.bg, color: sm.color }}>
                        {sm.label}
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
                      <InfoItem label="Correo" value={s.email} />
                      {s.nit && <InfoItem label="NIT" value={s.nit} />}
                      {s.phone && <InfoItem label="Teléfono" value={s.phone} />}
                      {s.city && <InfoItem label="Ciudad" value={s.city} />}
                      <InfoItem label="Registrado" value={new Date(s.created_at).toLocaleDateString("es-CO")} />
                    </div>

                    {s.description && (
                      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 8px", lineHeight: 1.5 }}>
                        {s.description}
                      </p>
                    )}

                    {s.categories.length > 0 && (
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {s.categories.map(c => (
                          <span key={c} style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.06)", padding: "2px 7px", borderRadius: 4 }}>{c}</span>
                        ))}
                      </div>
                    )}

                    {s.rejection_reason && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "#f87171", background: "rgba(248,113,113,0.08)", padding: "8px 12px", borderRadius: 7 }}>
                        Motivo: {s.rejection_reason}
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 7, alignItems: "flex-end" }}>
                    {s.status === "pending" && (
                      <>
                        <button onClick={() => setStatus(s.id, "approved")} disabled={updating === s.id}
                          style={{ ...actionBtn, background: "rgba(52,211,153,0.15)", color: "#34d399", borderColor: "rgba(52,211,153,0.3)" }}>
                          ✓ Aprobar
                        </button>
                        <button onClick={() => { setRejectModal({ id: s.id, name: s.company_name }); setRejectReason(""); }} disabled={updating === s.id}
                          style={{ ...actionBtn, background: "rgba(248,113,113,0.1)", color: "#f87171", borderColor: "rgba(248,113,113,0.25)" }}>
                          ✗ Rechazar
                        </button>
                      </>
                    )}
                    {s.status === "approved" && (
                      <button onClick={() => setStatus(s.id, "suspended")} disabled={updating === s.id}
                        style={{ ...actionBtn, background: "rgba(167,139,250,0.1)", color: "#a78bfa", borderColor: "rgba(167,139,250,0.25)" }}>
                        ⏸ Suspender
                      </button>
                    )}
                    {(s.status === "rejected" || s.status === "suspended") && (
                      <button onClick={() => setStatus(s.id, "approved")} disabled={updating === s.id}
                        style={{ ...actionBtn, background: "rgba(52,211,153,0.1)", color: "#34d399", borderColor: "rgba(52,211,153,0.25)" }}>
                        ↑ Re-activar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de rechazo */}
      {rejectModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setRejectModal(null); }}>
          <div style={{ background: "#0d0d1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "28px", width: "100%", maxWidth: 440 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "white", marginBottom: 8 }}>Rechazar proveedor</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>
              Explica el motivo del rechazo para <strong style={{ color: "rgba(255,255,255,0.75)" }}>{rejectModal.name}</strong>. Esto se guardará en el registro.
            </p>
            <textarea
              value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Ej: No cumple los requisitos de categoría, información insuficiente..."
              style={{
                width: "100%", height: 80, padding: "9px 12px", borderRadius: 8, boxSizing: "border-box",
                border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
                color: "white", fontSize: 13, resize: "none", outline: "none", marginBottom: 16,
              }}
            />
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setRejectModal(null)}
                style={{ flex: 1, padding: "10px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={handleReject}
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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>{value}</div>
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

const actionBtn: React.CSSProperties = {
  padding: "7px 14px", borderRadius: 8, border: "1px solid",
  fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap",
};
