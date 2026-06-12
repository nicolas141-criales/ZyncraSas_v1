"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

type PQRType = "peticion" | "queja" | "reclamo" | "sugerencia" | "felicitacion";

const TYPES: { key: PQRType; label: string; icon: string; desc: string; color: string }[] = [
  { key: "peticion",     label: "Petición",     icon: "📋", desc: "Solicitud de información o servicio",    color: "#60a5fa" },
  { key: "queja",        label: "Queja",        icon: "😤", desc: "Inconformidad con un producto o servicio", color: "#f87171" },
  { key: "reclamo",      label: "Reclamo",      icon: "⚠️", desc: "Exigencia de un derecho afectado",       color: "#fbbf24" },
  { key: "sugerencia",   label: "Sugerencia",   icon: "💡", desc: "Idea para mejorar la experiencia",        color: "#a78bfa" },
  { key: "felicitacion", label: "Felicitación", icon: "⭐", desc: "Reconocimiento por excelente servicio",  color: "#34d399" },
];

const GF: React.CSSProperties = {
  fontFamily: "'Space Grotesk', -apple-system, sans-serif",
};

export default function PqrPublicPage() {
  const [type, setType] = useState<PQRType>("queja");
  const [target, setTarget] = useState<"zyncra" | "tenant">("zyncra");
  const [tenantName, setTenantName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = TYPES.find(t => t.key === type)!;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim()) { setError("El asunto es obligatorio."); return; }
    if (!description.trim()) { setError("La descripción es obligatoria."); return; }
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.from("pqrs").insert({
      type,
      subject: subject.trim(),
      description: description.trim(),
      submitter_name: name.trim() || null,
      submitter_email: email.trim() || null,
      submitter_phone: phone.trim() || null,
      target,
      tenant_name: target === "tenant" ? (tenantName.trim() || null) : null,
      status: "pending",
      priority: "normal",
    });
    setLoading(false);
    if (err) {
      setError("No se pudo enviar el PQR. Por favor intenta de nuevo.");
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div style={{ ...GF, minHeight: "100vh", background: "#07071a", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "-10%", left: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(52,211,153,0.14) 0%, transparent 65%)" }} />
          <div style={{ position: "absolute", bottom: "-10%", right: "0%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 65%)" }} />
        </div>
        <div style={{ position: "relative", textAlign: "center", maxWidth: 440 }}>
          <div style={{ fontSize: 60, marginBottom: 20 }}>✅</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#34d399", margin: "0 0 12px" }}>PQR enviado exitosamente</h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, margin: "0 0 28px" }}>
            Hemos recibido tu {TYPES.find(t => t.key === type)?.label.toLowerCase()}. Nuestro equipo la revisará y tomará las acciones necesarias.
          </p>
          <button onClick={() => { setDone(false); setSubject(""); setDescription(""); setName(""); setEmail(""); setPhone(""); setTenantName(""); }}
            style={{ padding: "12px 28px", borderRadius: 12, border: "none", background: "#fb0f05", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", ...GF }}>
            Enviar otro PQR
          </button>
        </div>
      </div>
    );
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.92)",
    fontSize: 14, boxSizing: "border-box", outline: "none", ...GF,
  };
  const lbl: React.CSSProperties = {
    display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7,
  };

  return (
    <div style={{ ...GF, minHeight: "100vh", background: "#07071a", padding: "40px 16px 80px" }}>
      {/* Ambient orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-5%", left: "0%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,15,5,0.08) 0%, transparent 65%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 620, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", borderRadius: 12, padding: "8px 16px", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 20 }}>
            <Image src="/zyncra-logo.png" alt="Zyncra" width={80} height={22} style={{ height: 22, width: "auto" }} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "rgba(255,255,255,0.94)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            Centro de PQRs
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.38)", margin: 0, lineHeight: 1.6 }}>
            Peticiones, Quejas, Reclamos y Sugerencias — tu voz nos importa
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Tipo */}
          <div style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)", backdropFilter: "blur(20px)", borderRadius: 18, padding: 20, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 14 }}>
              ¿Qué tipo de PQR es?
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {TYPES.map(t => (
                <button type="button" key={t.key} onClick={() => setType(t.key)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    padding: "12px 16px", borderRadius: 12, cursor: "pointer", flex: 1, minWidth: 90,
                    border: type === t.key ? `2px solid ${t.color}` : "2px solid rgba(255,255,255,0.06)",
                    background: type === t.key ? `${t.color}18` : "rgba(255,255,255,0.04)",
                    transition: "all .15s", outline: "none",
                  }}>
                  <span style={{ fontSize: 20 }}>{t.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: type === t.key ? t.color : "rgba(255,255,255,0.45)" }}>{t.label}</span>
                </button>
              ))}
            </div>
            <p style={{ margin: "12px 0 0", fontSize: 12, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
              {selected.desc}
            </p>
          </div>

          {/* Dirigido a */}
          <div style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)", backdropFilter: "blur(20px)", borderRadius: 18, padding: 20, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 14 }}>
              ¿A quién va dirigido?
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { key: "zyncra" as const, label: "A Zyncra (la plataforma)", icon: "🏢" },
                { key: "tenant" as const, label: "A un negocio en Zyncra",   icon: "🏪" },
              ].map(opt => (
                <button type="button" key={opt.key} onClick={() => setTarget(opt.key)}
                  style={{
                    flex: 1, padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                    border: target === opt.key ? "2px solid #fb0f05" : "2px solid rgba(255,255,255,0.06)",
                    background: target === opt.key ? "rgba(251,15,5,0.1)" : "rgba(255,255,255,0.04)",
                    color: target === opt.key ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.42)",
                    fontSize: 13, fontWeight: 600, transition: "all .15s", outline: "none", display: "flex", gap: 8, alignItems: "center",
                    ...GF,
                  }}>
                  <span>{opt.icon}</span> {opt.label}
                </button>
              ))}
            </div>
            {target === "tenant" && (
              <div style={{ marginTop: 14 }}>
                <label style={lbl}>Nombre del negocio</label>
                <input value={tenantName} onChange={e => setTenantName(e.target.value)}
                  placeholder="Ej: Peluquería Glamour, Spa Bella..."
                  style={inp} />
              </div>
            )}
          </div>

          {/* Asunto + descripción */}
          <div style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)", backdropFilter: "blur(20px)", borderRadius: 18, padding: 20, border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 2 }}>Detalle del PQR</div>
            <div>
              <label style={lbl}>Asunto <span style={{ color: "#f87171" }}>*</span></label>
              <input value={subject} onChange={e => setSubject(e.target.value)}
                placeholder="Resume tu PQR en una línea..."
                style={inp} />
            </div>
            <div>
              <label style={lbl}>Descripción <span style={{ color: "#f87171" }}>*</span></label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Describe con detalle lo ocurrido, la fecha, personas involucradas, y lo que esperas como respuesta..."
                rows={5}
                style={{ ...inp, resize: "vertical", minHeight: 120 }} />
            </div>
          </div>

          {/* Información de contacto */}
          <div style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)", backdropFilter: "blur(20px)", borderRadius: 18, padding: 20, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 14 }}>
              Tu información <span style={{ fontSize: 11, fontWeight: 400, color: "rgba(255,255,255,0.28)" }}>(opcional, para darte una respuesta)</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={lbl}>Nombre completo</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre..." style={inp} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={lbl}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Teléfono / WhatsApp</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+57 300..." style={inp} />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 10, padding: "12px 16px", fontSize: 13, color: "#f87171", fontWeight: 600 }}>
              ✗ {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{
              padding: "14px 32px", borderRadius: 12, border: "none",
              background: loading ? "rgba(251,15,5,0.4)" : "#fb0f05",
              color: "white", fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 20px rgba(251,15,5,0.3)", transition: "all .2s",
              ...GF,
            }}>
            {loading ? "Enviando..." : `Enviar ${selected.label}`}
          </button>

          <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.2)", margin: 0 }}>
            Toda la información es tratada de forma confidencial · Zyncra SaaS © 2026
          </p>
        </form>
      </div>
    </div>
  );
}
