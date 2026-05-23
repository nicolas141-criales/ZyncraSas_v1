"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";
import { IconPalette, IconCheck, IconStorefront } from "../ZyncraIcons";

interface BrandingConfig {
  business_name: string; logo_url: string; logo_object_position: string;
  logo_size: number; primary_color: string; secondary_color: string;
  background_image_url: string; welcome_message: string;
}

const DEFAULT_CONFIG: BrandingConfig = {
  business_name: "Mi Negocio", logo_url: "", logo_object_position: "center",
  logo_size: 85, primary_color: "#fb0f05", secondary_color: "#0027fe",
  background_image_url: "", welcome_message: "Reserva tu cita fácil y rápido",
};

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const inp: React.CSSProperties = {
  width: "100%", padding: "11px 14px", border: "1.5px solid #e8e6e2",
  borderRadius: "11px", fontSize: "14px", background: "#f7f5f2",
  color: "#111118", boxSizing: "border-box",
  fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none",
};
const lbl: React.CSSProperties = {
  display: "block", fontWeight: 600, fontSize: "11px",
  color: "#6b6b80", marginBottom: "7px",
  textTransform: "uppercase", letterSpacing: "0.06em",
};

export default function BrandingPage() {
  const { tenantId, tenantSlug } = useAdmin();
  const [config, setConfig] = useState<BrandingConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const bookingLink = typeof window !== "undefined" ? `${window.location.origin}/book/${tenantSlug}` : `/book/${tenantSlug}`;

  const fetchBranding = useCallback(async (tid: string) => {
    const { data: brandings } = await supabase.from("branding").select("*").eq("tenant_id", tid).limit(1);
    if (brandings && brandings.length > 0) {
      const d = brandings[0];
      const loaded = { business_name: d.business_name ?? DEFAULT_CONFIG.business_name, logo_url: d.logo_url ?? "", logo_object_position: d.logo_object_position ?? "center", logo_size: d.logo_size ?? 85, primary_color: d.primary_color ?? DEFAULT_CONFIG.primary_color, secondary_color: d.secondary_color ?? DEFAULT_CONFIG.secondary_color, background_image_url: d.background_image_url ?? "", welcome_message: d.welcome_message ?? DEFAULT_CONFIG.welcome_message };
      setConfig(loaded); setLogoPreview(loaded.logo_url);
    }
  }, []);

  useEffect(() => {
    if (tenantId) { setLoading(true); fetchBranding(tenantId).then(() => setLoading(false)); }
  }, [tenantId, fetchBranding]);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > MAX_FILE_SIZE) { setError("El logo no puede superar 2MB."); e.target.value = ""; return; }
    setError(null); setLogoFile(file); setLogoPreview(URL.createObjectURL(file));
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${tenantId}/logo.${ext}`;
    const { error: upErr } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
    if (upErr) { setError("Error subiendo logo: " + upErr.message); return null; }
    return supabase.storage.from("logos").getPublicUrl(path).data.publicUrl;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); if (!tenantId) return;
    setSaving(true); setError(null); setSaved(false);
    let finalLogoUrl = config.logo_url;
    if (logoFile) { const u = await uploadLogo(logoFile); if (!u) { setSaving(false); return; } finalLogoUrl = u; setConfig(prev => ({ ...prev, logo_url: u })); setLogoFile(null); }
    const { error: err } = await supabase.from("branding").upsert({ tenant_id: tenantId, ...config, logo_url: finalLogoUrl }, { onConflict: "tenant_id" });
    if (err) setError("Error: " + err.message);
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  };

  const handleCopyLink = () => { navigator.clipboard.writeText(bookingLink); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "40vh", color: "#a0a0b0", fontSize: "14px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      Cargando configuración...
    </div>
  );

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "24px" }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05", flexShrink: 0 }}>
          <IconPalette size={20} />
        </div>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#111118", letterSpacing: "-0.5px", margin: 0 }}>Mi Marca</h1>
          <p style={{ color: "#a0a0b0", fontSize: "13px", marginTop: "2px" }}>Personaliza la apariencia de tu página de reservas</p>
        </div>
      </div>

      {/* Booking link card */}
      <div style={{ background: "white", border: "1px solid #e8e6e2", borderRadius: "18px", padding: "18px 22px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05", flexShrink: 0 }}>
            <IconStorefront size={17} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "13px", color: "#111118", marginBottom: "3px" }}>Link de reservas para clientes</div>
            <div style={{ fontFamily: "monospace", fontSize: "12px", color: "#fb0f05", wordBreak: "break-all" }}>{bookingLink}</div>
          </div>
        </div>
        <button onClick={handleCopyLink} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 18px", borderRadius: "10px", border: "1.5px solid #e8e6e2", background: copied ? "rgba(16,185,129,0.08)" : "white", color: copied ? "#10b981" : "#3a3a48", fontWeight: 600, fontSize: "13px", cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.2s", flexShrink: 0 }}>
          {copied ? <><IconCheck size={14} color="#10b981" /> Copiado</> : "Copiar link"}
        </button>
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>

        {/* Form */}
        <div style={{ background: "white", border: "1px solid #e8e6e2", borderRadius: "18px", overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid #e8e6e2" }}>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "#111118" }}>Identidad visual</div>
            <div style={{ fontSize: "12px", color: "#a0a0b0", marginTop: "2px" }}>Estos datos aparecen en tu página pública de citas</div>
          </div>
          <form onSubmit={handleSave} style={{ padding: "22px" }}>
            <div style={{ marginBottom: "18px" }}>
              <label style={lbl}>Nombre del negocio</label>
              <input value={config.business_name} onChange={e => setConfig({ ...config, business_name: e.target.value })} placeholder="Ej. Spa & Bienestar Nova" style={inp} />
            </div>
            <div style={{ marginBottom: "18px" }}>
              <label style={lbl}>Mensaje de bienvenida</label>
              <input value={config.welcome_message} onChange={e => setConfig({ ...config, welcome_message: e.target.value })} placeholder="Ej. Reserva tu cita en 60 segundos" style={inp} />
            </div>

            {/* Logo */}
            <div style={{ marginBottom: "20px", background: "#f7f5f2", padding: "16px", borderRadius: "14px", border: "1px solid #e8e6e2" }}>
              <label style={lbl}>Logo del negocio</label>
              <input type="file" accept="image/*" onChange={handleLogoFileChange} style={{ ...inp, padding: "9px", marginBottom: "8px" }} />
              <p style={{ fontSize: "11px", color: "#a0a0b0", margin: "0 0 12px" }}>Máx. 2MB · PNG con fondo transparente recomendado</p>
              {logoPreview && (
                <div style={{ borderTop: "1px solid #e8e6e2", paddingTop: "14px", display: "flex", gap: "14px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "180px" }}>
                    <label style={{ ...lbl, marginBottom: "8px" }}>Tamaño — {config.logo_size}%</label>
                    <input type="range" min="30" max="150" value={config.logo_size} onChange={e => setConfig({ ...config, logo_size: parseInt(e.target.value) })} style={{ width: "100%", accentColor: "#fb0f05" }} />
                  </div>
                  <div style={{ minWidth: "130px" }}>
                    <label style={lbl}>Alineación</label>
                    <select value={config.logo_object_position} onChange={e => setConfig({ ...config, logo_object_position: e.target.value })} style={{ ...inp, padding: "9px" }}>
                      <option value="top">Arriba</option>
                      <option value="center">Centro</option>
                      <option value="bottom">Abajo</option>
                      <option value="left">Izquierda</option>
                      <option value="right">Derecha</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Colors */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "22px" }}>
              <div>
                <label style={lbl}>Color primario</label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input type="color" value={config.primary_color} onChange={e => setConfig({ ...config, primary_color: e.target.value })} style={{ width: "42px", height: "42px", border: "1.5px solid #e8e6e2", borderRadius: "10px", cursor: "pointer", padding: "3px", background: "white" }} />
                  <input value={config.primary_color} onChange={e => setConfig({ ...config, primary_color: e.target.value })} style={{ ...inp, flex: 1 }} />
                </div>
              </div>
              <div>
                <label style={lbl}>Color secundario</label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input type="color" value={config.secondary_color} onChange={e => setConfig({ ...config, secondary_color: e.target.value })} style={{ width: "42px", height: "42px", border: "1.5px solid #e8e6e2", borderRadius: "10px", cursor: "pointer", padding: "3px", background: "white" }} />
                  <input value={config.secondary_color} onChange={e => setConfig({ ...config, secondary_color: e.target.value })} style={{ ...inp, flex: 1 }} />
                </div>
              </div>
            </div>

            {error && (
              <div style={{ background: "#fff0f0", border: "1px solid rgba(251,15,5,0.2)", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#d90d04", marginBottom: "16px", fontWeight: 500 }}>
                {error}
              </div>
            )}
            {saved && (
              <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#10b981", marginBottom: "16px", fontWeight: 600, display: "flex", alignItems: "center", gap: "7px" }}>
                <IconCheck size={14} color="#10b981" /> Cambios guardados correctamente
              </div>
            )}
            <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={saving}>
              {saving ? "Guardando..." : "Guardar configuración"}
            </button>
          </form>
        </div>

        {/* Live Preview */}
        <div>
          <div style={{ fontWeight: 700, fontSize: "13px", color: "#6b6b80", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Vista previa en vivo</div>
          <div style={{ border: "1px solid #e8e6e2", borderRadius: "18px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            {/* Browser bar mockup */}
            <div style={{ background: "#f7f5f2", padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid #e8e6e2" }}>
              <div style={{ display: "flex", gap: "5px" }}>
                {["#ff5f57","#ffbd2e","#28c840"].map(c => <div key={c} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c }} />)}
              </div>
              <div style={{ flex: 1, background: "white", border: "1px solid #e8e6e2", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", color: "#a0a0b0", fontFamily: "monospace" }}>
                zyncra.app/book/{tenantSlug}
              </div>
            </div>

            {/* Preview content */}
            <div style={{ background: "#050814", padding: "28px 24px", minHeight: "260px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px" }}>
              {logoPreview ? (
                <div style={{ width: "88px", height: "88px", borderRadius: "50%", background: "#12182b", border: "2px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  <img src={logoPreview} alt="logo" style={{ width: `${config.logo_size}%`, height: `${config.logo_size}%`, objectFit: "contain", objectPosition: config.logo_object_position }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                </div>
              ) : (
                <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: `linear-gradient(135deg,${config.primary_color},${config.secondary_color})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "28px", fontWeight: 900, color: "white" }}>{config.business_name.charAt(0)}</span>
                </div>
              )}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: 900, color: "#F0F4FF", letterSpacing: "-0.5px", lineHeight: 1.2, marginBottom: "6px" }}>{config.business_name}</div>
                <p style={{ fontSize: "13px", color: "rgba(200,210,255,0.6)", marginBottom: "18px" }}>{config.welcome_message}</p>
                <button style={{ background: `linear-gradient(135deg,${config.primary_color},${config.secondary_color})`, color: "#fff", border: "none", padding: "10px 24px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontSize: "13px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Reservar cita →
                </button>
              </div>

              {/* Slot preview */}
              <div style={{ width: "100%", maxWidth: "260px", marginTop: "8px" }}>
                {[
                  { time: "9:00", label: "Disponible", style: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(200,210,255,0.5)" } },
                  { time: "10:30", label: "Disponible", style: { background: `${config.primary_color}18`, border: `1px solid ${config.primary_color}40`, color: config.primary_color } },
                  { time: "12:00", label: "Disponible", style: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(200,210,255,0.5)" } },
                ].map((slot, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "5px" }}>
                    <span style={{ fontSize: "10px", color: "rgba(200,210,255,0.35)", fontWeight: 600, minWidth: "34px" }}>{slot.time}</span>
                    <div style={{ flex: 1, padding: "7px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: 600, ...slot.style }}>{slot.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p style={{ fontSize: "11px", color: "#a0a0b0", marginTop: "8px", textAlign: "center" }}>Los cambios se aplican al guardar</p>
        </div>
      </div>
    </div>
  );
}
