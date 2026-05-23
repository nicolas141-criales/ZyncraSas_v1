"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAdminContext } from "../admin-context";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SiteReview {
  id: string;
  client_name: string;
  rating: number;
  comment: string | null;
  service: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

type StatusFilter = "all" | "pending" | "approved" | "rejected";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
}

function Stars({ n, size = 16 }: { n: number; size?: number }) {
  return (
    <span style={{ color: "#f59e0b", fontSize: size, letterSpacing: 1 }}>
      {"★".repeat(n)}
      <span style={{ color: "#d1d5db" }}>{"★".repeat(5 - n)}</span>
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    approved: { label: "Aprobada",  bg: "#e8f5e9", color: "#388e3c" },
    pending:  { label: "Pendiente", bg: "#fff8e1", color: "#f57c00" },
    rejected: { label: "Rechazada", bg: "#fce4ec", color: "#c62828" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 20, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ReviewsSitePage() {
  const { tenantId } = useAdminContext();
  const [tab, setTab] = useState<"resumen" | "resenas" | "config">("resumen");

  const [reviews, setReviews] = useState<SiteReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState("");
  const [urlCopied, setUrlCopied] = useState(false);
  const [showOnBooking, setShowOnBooking] = useState(true);
  const [savingPref, setSavingPref] = useState(false);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("site_reviews")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    setReviews((data as SiteReview[]) ?? []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  // Build public URL using current window origin + tenantId
  useEffect(() => {
    if (typeof window !== "undefined") {
      setPublicUrl(`${window.location.origin}/review/${tenantId}`);
    }
  }, [tenantId]);

  // Load show_on_booking preference from google_review_settings (reuse table)
  useEffect(() => {
    async function loadPref() {
      const { data } = await supabase
        .from("google_review_settings")
        .select("show_on_booking")
        .eq("tenant_id", tenantId)
        .maybeSingle();
      if (data?.show_on_booking !== undefined) setShowOnBooking(data.show_on_booking);
    }
    loadPref();
  }, [tenantId]);

  // Computed stats
  const approved = reviews.filter(r => r.status === "approved");
  const pending  = reviews.filter(r => r.status === "pending");
  const avgRating = approved.length
    ? approved.reduce((s, r) => s + r.rating, 0) / approved.length
    : 0;

  const starCounts = [5, 4, 3, 2, 1].map(n => ({
    n,
    count: approved.filter(r => r.rating === n).length,
    pct: approved.length ? (approved.filter(r => r.rating === n).length / approved.length) * 100 : 0,
  }));

  const filtered = filter === "all" ? reviews : reviews.filter(r => r.status === filter);

  // Update status
  async function updateStatus(id: string, status: "approved" | "rejected") {
    setUpdatingId(id);
    await supabase.from("site_reviews").update({ status }).eq("id", id);
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    setUpdatingId(null);
  }

  // Copy URL
  async function copyUrl() {
    await navigator.clipboard.writeText(publicUrl);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  }

  // Save show_on_booking preference
  async function savePref() {
    setSavingPref(true);
    await supabase.from("google_review_settings").upsert(
      { tenant_id: tenantId, show_on_booking: showOnBooking, updated_at: new Date().toISOString() },
      { onConflict: "tenant_id" }
    );
    setSavingPref(false);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "0 0 40px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a2e", margin: 0 }}>Reseñas del Negocio</h1>
        <p style={{ color: "#6b7280", fontSize: 14, margin: "4px 0 0" }}>
          Reseñas internas de clientes verificados en tu página de agendamiento
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#f0f0f5", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {(["resumen", "resenas", "config"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
            background: tab === t ? "white" : "transparent",
            color: tab === t ? "#1a1a2e" : "#6b7280",
            boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            transition: "all .2s",
          }}>
            {t === "resumen" ? "Resumen" : t === "resenas" ? `Reseñas${pending.length ? ` (${pending.length})` : ""}` : "Configuración"}
          </button>
        ))}
      </div>

      {/* ── Tab: Resumen ───────────────────────────────────────────────────── */}
      {tab === "resumen" && (
        <div style={{ maxWidth: 820 }}>

          {/* KPI cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
            <KpiCard label="Calificación promedio" value={avgRating ? avgRating.toFixed(1) : "—"} sub={`de ${approved.length} reseña${approved.length !== 1 ? "s" : ""} aprobada${approved.length !== 1 ? "s" : ""}`}>
              <Stars n={Math.round(avgRating)} size={18} />
            </KpiCard>
            <KpiCard label="Pendientes de revisión" value={String(pending.length)} sub="requieren tu aprobación" highlight={pending.length > 0} />
            <KpiCard label="Total recibidas" value={String(reviews.length)} sub={`${approved.length} aprobadas, ${reviews.filter(r => r.status === "rejected").length} rechazadas`} />
          </div>

          {/* Star distribution */}
          {approved.length > 0 && (
            <div style={{ background: "white", borderRadius: 14, padding: 24, border: "1px solid #e8e6e2", marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Distribución de calificaciones</h3>
              {starCounts.map(({ n, count, pct }) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "#6b7280", width: 30, textAlign: "right" }}>{n}★</span>
                  <div style={{ flex: 1, background: "#f0f0f5", borderRadius: 6, height: 10, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "#f59e0b", borderRadius: 6, transition: "width .4s" }} />
                  </div>
                  <span style={{ fontSize: 13, color: "#6b7280", width: 28 }}>{count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Recent approved reviews */}
          {approved.length > 0 && (
            <div style={{ background: "white", borderRadius: 14, padding: 24, border: "1px solid #e8e6e2" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Reseñas destacadas</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {approved.slice(0, 4).map(r => (
                  <ReviewCard key={r.id} review={r} />
                ))}
              </div>
            </div>
          )}

          {approved.length === 0 && reviews.length === 0 && (
            <div style={{ textAlign: "center", padding: 60, color: "#9b9bb0" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
              <div style={{ fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>Sin reseñas aún</div>
              <div style={{ fontSize: 13 }}>Comparte el link en la pestaña Configuración para empezar a recibir reseñas</div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Reseñas ──────────────────────────────────────────────────── */}
      {tab === "resenas" && (
        <div style={{ maxWidth: 740 }}>
          {/* Filter */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {(["all", "pending", "approved", "rejected"] as StatusFilter[]).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: "5px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 600,
                background: filter === f ? "#1a1a2e" : "#f0f0f5",
                color: filter === f ? "white" : "#6b7280",
              }}>
                {f === "all" ? "Todas" : f === "pending" ? "Pendientes" : f === "approved" ? "Aprobadas" : "Rechazadas"}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: "#9b9bb0" }}>Cargando...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#9b9bb0", fontSize: 14 }}>Sin reseñas en esta categoría</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filtered.map(r => (
                <div key={r.id} style={{ background: "white", borderRadius: 14, padding: 20, border: "1px solid #e8e6e2" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>{r.client_name}</span>
                      {r.service && <span style={{ fontSize: 12, color: "#9b9bb0", marginLeft: 8 }}>· {r.service}</span>}
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <div style={{ marginBottom: 8 }}><Stars n={r.rating} /></div>
                  {r.comment && (
                    <p style={{ margin: "0 0 10px", fontSize: 14, color: "#4a4a6a", lineHeight: 1.6 }}>{r.comment}</p>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#9b9bb0" }}>{fmtDate(r.created_at)}</span>
                    {r.status === "pending" && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => updateStatus(r.id, "rejected")}
                          disabled={updatingId === r.id}
                          style={{ padding: "5px 14px", borderRadius: 8, border: "1px solid #e8e6e2", background: "white", color: "#c62828", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                          Rechazar
                        </button>
                        <button onClick={() => updateStatus(r.id, "approved")}
                          disabled={updatingId === r.id}
                          style={{ padding: "5px 14px", borderRadius: 8, border: "none", background: "#388e3c", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                          Aprobar
                        </button>
                      </div>
                    )}
                    {r.status === "approved" && (
                      <button onClick={() => updateStatus(r.id, "rejected")}
                        disabled={updatingId === r.id}
                        style={{ padding: "5px 14px", borderRadius: 8, border: "1px solid #e8e6e2", background: "white", color: "#c62828", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                        Retirar
                      </button>
                    )}
                    {r.status === "rejected" && (
                      <button onClick={() => updateStatus(r.id, "approved")}
                        disabled={updatingId === r.id}
                        style={{ padding: "5px 14px", borderRadius: 8, border: "none", background: "#388e3c", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                        Aprobar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Configuración ─────────────────────────────────────────────── */}
      {tab === "config" && (
        <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 16 }}>

          <div style={{ background: "white", borderRadius: 14, padding: 24, border: "1px solid #e8e6e2" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700 }}>Link público de reseñas</h3>
            <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 14px" }}>
              Comparte este link con tus clientes para que dejen su reseña. Cada reseña queda pendiente hasta que la apruebes.
            </p>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <input value={publicUrl} readOnly style={{ ...inputStyle, flex: 1, background: "#f9f9f9", color: "#6b7280" }} />
              <button onClick={copyUrl} style={btnSecondary}>
                {urlCopied ? "✓ Copiado" : "Copiar"}
              </button>
            </div>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 13, color: "#fb0f05", textDecoration: "underline" }}>
              Abrir formulario de reseñas →
            </a>
          </div>

          <div style={{ background: "white", borderRadius: 14, padding: 24, border: "1px solid #e8e6e2" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 700 }}>Mostrar en página de agendamiento</h3>
            <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 14px" }}>
              Las reseñas aprobadas aparecerán visibles para los clientes en tu página de reservas.
            </p>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <div onClick={() => setShowOnBooking(v => !v)}
                style={{
                  width: 44, height: 24, borderRadius: 12, cursor: "pointer", transition: "background .2s",
                  background: showOnBooking ? "#fb0f05" : "#d1d5db", position: "relative",
                }}>
                <div style={{
                  position: "absolute", top: 3, left: showOnBooking ? "calc(100% - 21px)" : 3,
                  width: 18, height: 18, borderRadius: "50%", background: "white",
                  transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.2)",
                }} />
              </div>
              <span style={{ fontSize: 14, color: "#1a1a2e" }}>
                {showOnBooking ? "Activado" : "Desactivado"}
              </span>
            </label>
            <button onClick={savePref} disabled={savingPref} style={{ ...btnPrimary, marginTop: 16 }}>
              {savingPref ? "Guardando..." : "Guardar preferencias"}
            </button>
          </div>

          <div style={{ background: "#f0f9ff", borderRadius: 12, padding: "14px 18px", border: "1px solid #bae6fd" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#1e40af", marginBottom: 4 }}>💡 Consejo</div>
            <div style={{ fontSize: 13, color: "#1e40af" }}>
              Envía el link a tus clientes por WhatsApp después de cada servicio. Las reseñas verificadas generan más confianza que las anónimas.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, children, highlight }: {
  label: string; value: string; sub: string; children?: React.ReactNode; highlight?: boolean;
}) {
  return (
    <div style={{ background: "white", borderRadius: 14, padding: "20px 22px", border: `1px solid ${highlight ? "#fcd34d" : "#e8e6e2"}`, background: highlight ? "#fffbeb" : "white" as any }}>
      <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#1a1a2e", lineHeight: 1 }}>{value}</div>
      {children && <div style={{ marginTop: 4 }}>{children}</div>}
      <div style={{ fontSize: 12, color: "#9b9bb0", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function ReviewCard({ review }: { review: SiteReview }) {
  return (
    <div style={{ borderBottom: "1px solid #f0f0f0", paddingBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{review.client_name}</span>
        <span style={{ fontSize: 12, color: "#9b9bb0" }}>{fmtDate(review.created_at)}</span>
      </div>
      <div style={{ marginBottom: 6 }}><Stars n={review.rating} /></div>
      {review.comment && <p style={{ margin: 0, fontSize: 13, color: "#4a4a6a", lineHeight: 1.6 }}>{review.comment}</p>}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e8e6e2",
  fontSize: 14, color: "#1a1a2e", background: "white", boxSizing: "border-box",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};
const btnPrimary: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "9px 20px", borderRadius: 10, border: "none",
  background: "#fb0f05", color: "white", fontWeight: 700, fontSize: 14,
  cursor: "pointer",
};
const btnSecondary: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "9px 20px", borderRadius: 10, border: "1px solid #e8e6e2",
  background: "white", color: "#4a4a6a", fontWeight: 600, fontSize: 14,
  cursor: "pointer",
};
