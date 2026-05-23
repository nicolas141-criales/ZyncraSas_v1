"use client";

import { useState, use, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Branding {
  primary_color: string;
  business_name: string;
  logo_url: string | null;
}

type Step = "form" | "success";

// ── Helpers ───────────────────────────────────────────────────────────────────

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          style={{
            fontSize: 36, background: "none", border: "none", cursor: "pointer",
            color: n <= (hovered || value) ? "#f59e0b" : "#d1d5db",
            transition: "color .15s", padding: 0,
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

const RATING_LABELS: Record<number, string> = {
  1: "Muy mala", 2: "Regular", 3: "Buena", 4: "Muy buena", 5: "Excelente",
};

// ── Main ──────────────────────────────────────────────────────────────────────

export default function ReviewPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = use(params);

  const [branding, setBranding] = useState<Branding>({ primary_color: "#fb0f05", business_name: "El Negocio", logo_url: null });
  const [loadingBranding, setLoadingBranding] = useState(true);
  const [step, setStep] = useState<Step>("form");

  // Form fields
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [service, setService] = useState("");
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load branding + services
  useEffect(() => {
    async function load() {
      const [{ data: brandingData }, { data: servicesData }] = await Promise.all([
        supabase.from("branding").select("primary_color, business_name, logo_url").eq("tenant_id", tenantId).maybeSingle(),
        supabase.from("services").select("id, name").eq("tenant_id", tenantId).order("name"),
      ]);
      if (brandingData) {
        setBranding({
          primary_color: brandingData.primary_color ?? "#fb0f05",
          business_name: brandingData.business_name ?? "El Negocio",
          logo_url: brandingData.logo_url ?? null,
        });
      }
      setServices((servicesData as { id: string; name: string }[]) ?? []);
      setLoadingBranding(false);
    }
    load();
  }, [tenantId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError("Por favor ingresa tu nombre."); return; }
    if (rating === 0) { setError("Selecciona una calificación."); return; }

    setSubmitting(true);
    const { error: dbError } = await supabase.from("site_reviews").insert({
      tenant_id: tenantId,
      client_name: name.trim(),
      rating,
      comment: comment.trim() || null,
      service: service || null,
      status: "pending",
    });
    setSubmitting(false);

    if (dbError) {
      setError("Ocurrió un error al enviar tu reseña. Inténtalo de nuevo.");
    } else {
      setStep("success");
    }
  }

  const accent = branding.primary_color;

  if (loadingBranding) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f5f2" }}>
        <div style={{ width: 36, height: 36, border: `3px solid #e8e6e2`, borderTopColor: accent, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f5f2", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 16px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');`}</style>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        {branding.logo_url ? (
          <img src={branding.logo_url} alt={branding.business_name}
            style={{ height: 56, objectFit: "contain", marginBottom: 12 }} />
        ) : (
          <div style={{ fontSize: 28, fontWeight: 800, color: accent, marginBottom: 8 }}>{branding.business_name}</div>
        )}
      </div>

      {/* Card */}
      <div style={{ background: "white", borderRadius: 20, padding: "32px 28px", maxWidth: 480, width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>

        {step === "success" ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🙏</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1a1a2e", margin: "0 0 8px" }}>¡Gracias por tu reseña!</h2>
            <p style={{ color: "#6b7280", fontSize: 15, margin: "0 0 6px" }}>
              Tu opinión fue enviada a <strong>{branding.business_name}</strong>.
            </p>
            <p style={{ color: "#9b9bb0", fontSize: 13, margin: 0 }}>
              Será publicada una vez revisada por el equipo.
            </p>
            <div style={{ marginTop: 28, fontSize: 32 }}>{"★".repeat(rating)}<span style={{ color: "#d1d5db" }}>{"★".repeat(5 - rating)}</span></div>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1a1a2e", margin: "0 0 4px" }}>
              Deja tu reseña
            </h2>
            <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 24px" }}>
              Tu opinión nos ayuda a mejorar y a que más personas nos encuentren.
            </p>

            <form onSubmit={handleSubmit}>

              {/* Rating */}
              <div style={{ marginBottom: 22, textAlign: "center" }}>
                <StarPicker value={rating} onChange={setRating} />
                {rating > 0 && (
                  <div style={{ marginTop: 6, fontSize: 14, fontWeight: 600, color: accent }}>
                    {RATING_LABELS[rating]}
                  </div>
                )}
              </div>

              {/* Name */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Tu nombre *</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ej: María García"
                  style={inputStyle} />
              </div>

              {/* Service */}
              {services.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <label style={labelStyle}>Servicio recibido (opcional)</label>
                  <select value={service} onChange={e => setService(e.target.value)} style={inputStyle}>
                    <option value="">Seleccionar servicio...</option>
                    {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              )}

              {/* Comment */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>¿Qué te pareció? (opcional)</label>
                <textarea value={comment} onChange={e => setComment(e.target.value)}
                  placeholder="Comparte tu experiencia..."
                  style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} />
              </div>

              {error && (
                <div style={{ background: "#fce4ec", color: "#c62828", borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 500, marginBottom: 14 }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={submitting}
                style={{
                  width: "100%", padding: "13px 0", borderRadius: 12, border: "none",
                  background: accent, color: "white", fontSize: 16, fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1,
                }}>
                {submitting ? "Enviando..." : "Enviar reseña"}
              </button>
            </form>
          </>
        )}
      </div>

      <div style={{ marginTop: 24, fontSize: 12, color: "#9b9bb0" }}>
        Powered by <span style={{ fontWeight: 700 }}>Zyncra</span>
      </div>
    </div>
  );
}
