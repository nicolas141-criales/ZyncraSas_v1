"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "../admin.module.css";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";

interface BrandingConfig {
  business_name: string;
  logo_url: string;
  logo_object_position: string;
  logo_size: number;
  primary_color: string;
  secondary_color: string;
  background_image_url: string;
  welcome_message: string;
}

const DEFAULT_CONFIG: BrandingConfig = {
  business_name: "Mi Salón",
  logo_url: "",
  logo_object_position: "center",
  logo_size: 85,
  primary_color: "#fb0f05",
  secondary_color: "#0027fe",
  background_image_url: "",
  welcome_message: "Reserva tu cita fácil y rápido",
};

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

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

  const bookingLink = typeof window !== "undefined"
    ? `${window.location.origin}/book/${tenantSlug}`
    : `/book/${tenantSlug}`;

  const fetchBranding = useCallback(async (tid: string) => {
    const { data: brandings } = await supabase.from("branding").select("*").eq("tenant_id", tid).limit(1);
    if (brandings && brandings.length > 0) {
      const data = brandings[0];
      const loaded = {
        business_name: data.business_name ?? DEFAULT_CONFIG.business_name,
        logo_url: data.logo_url ?? "",
        logo_object_position: data.logo_object_position ?? "center",
        logo_size: data.logo_size ?? 85,
        primary_color: data.primary_color ?? DEFAULT_CONFIG.primary_color,
        secondary_color: data.secondary_color ?? DEFAULT_CONFIG.secondary_color,
        background_image_url: data.background_image_url ?? "",
        welcome_message: data.welcome_message ?? DEFAULT_CONFIG.welcome_message,
      };
      setConfig(loaded);
      setLogoPreview(loaded.logo_url);
    }
  }, []);

  useEffect(() => {
    if (tenantId) {
      setLoading(true);
      fetchBranding(tenantId).then(() => setLoading(false));
    }
  }, [tenantId, fetchBranding]);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError("El logo no puede superar 2MB.");
      e.target.value = "";
      return;
    }
    setError(null);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${tenantId}/logo.${ext}`;
    const { error: upErr } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
    if (upErr) { setError("Error subiendo logo: " + upErr.message); return null; }
    const { data } = supabase.storage.from("logos").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setSaving(true); setError(null); setSaved(false);

    let finalLogoUrl = config.logo_url;
    if (logoFile) {
      const uploaded = await uploadLogo(logoFile);
      if (!uploaded) { setSaving(false); return; }
      finalLogoUrl = uploaded;
      setConfig(prev => ({ ...prev, logo_url: uploaded }));
      setLogoFile(null);
    }

    const { error: err } = await supabase.from("branding").upsert(
      { tenant_id: tenantId, ...config, logo_url: finalLogoUrl },
      { onConflict: "tenant_id" }
    );
    if (err) setError("Error: " + err.message);
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(bookingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inp: React.CSSProperties = {
    width: "100%", padding: "10px 12px", border: "1px solid var(--border-light)",
    borderRadius: "var(--radius-base)", fontSize: "14px", background: "var(--bg-base)",
    color: "var(--text-primary)", boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = { display: "block", fontWeight: 600, fontSize: "13px", marginBottom: "6px" };

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>Cargando configuración...</div>;

  return (
    <div>
      <div style={{ marginBottom: "var(--spacing-xl)" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700 }}>Mi Marca</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
          Configura el logo, colores y fondo de tu landing de citas.
        </p>
      </div>

      {/* Booking Link Box */}
      <div className={styles.listCard} style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ fontWeight: 700, marginBottom: "4px" }}>🔗 Tu link de reservas para clientes</div>
          <div style={{ fontFamily: "monospace", fontSize: "13px", color: "#fb0f05", wordBreak: "break-all" }}>{bookingLink}</div>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Comparte este link con tus clientes para que reserven directamente.</div>
        </div>
        <button
          onClick={handleCopyLink}
          className="btn-secondary"
          style={{ flexShrink: 0, padding: "10px 20px" }}
        >
          {copied ? "✅ ¡Copiado!" : "📋 Copiar Link"}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
        {/* Form */}
        <div className={styles.listCard} style={{ padding: "28px" }}>
          <form onSubmit={handleSave}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "20px", borderBottom: "1px solid var(--border-light)", paddingBottom: "12px" }}>
              🎨 Identidad Visual
            </h2>
            <div style={{ marginBottom: "16px" }}>
              <label style={lbl}>Nombre del negocio</label>
              <input value={config.business_name} onChange={e => setConfig({ ...config, business_name: e.target.value })} placeholder="Ej. Barbería Elite" style={inp} />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={lbl}>Mensaje de bienvenida</label>
              <input value={config.welcome_message} onChange={e => setConfig({ ...config, welcome_message: e.target.value })} placeholder="Ej. Reserva tu cita en 60 segundos" style={inp} />
            </div>

            {/* Logo Upload & Controls */}
            <div style={{ marginBottom: "24px", background: "var(--bg-base)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-light)" }}>
              <label style={lbl}>Logo del Negocio</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoFileChange}
                style={{ ...inp, padding: "8px", marginBottom: "12px" }}
              />
              <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px", marginBottom: "16px" }}>Máx. 2MB. PNG, JPG o WebP. Usa fondo transparente (PNG) para mejor resultado.</p>
              
              {logoPreview && (
                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", borderTop: "1px solid var(--border-light)", paddingTop: "16px" }}>
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <label style={{...lbl, fontSize: "12px", color: "var(--text-secondary)"}}>Tamaño del Logo (%)</label>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <input 
                        type="range" min="30" max="150" value={config.logo_size} 
                        onChange={e => setConfig({...config, logo_size: parseInt(e.target.value)})}
                        style={{ flex: 1, accentColor: "#fb0f05" }}
                      />
                      <span style={{ fontSize: "12px", fontWeight: 600, width: "32px" }}>{config.logo_size}%</span>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: "150px" }}>
                    <label style={{...lbl, fontSize: "12px", color: "var(--text-secondary)"}}>Posición (Alineación)</label>
                    <select 
                      value={config.logo_object_position} 
                      onChange={e => setConfig({...config, logo_object_position: e.target.value})}
                      style={{ ...inp, padding: "8px" }}
                    >
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div>
                <label style={lbl}>Color Primario</label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input type="color" value={config.primary_color} onChange={e => setConfig({ ...config, primary_color: e.target.value })}
                    style={{ width: "44px", height: "44px", border: "none", borderRadius: "8px", cursor: "pointer", padding: "2px", background: "transparent" }} />
                  <input value={config.primary_color} onChange={e => setConfig({ ...config, primary_color: e.target.value })} style={{ ...inp, flex: 1 }} />
                </div>
              </div>
              <div>
                <label style={lbl}>Color Secundario</label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input type="color" value={config.secondary_color} onChange={e => setConfig({ ...config, secondary_color: e.target.value })}
                    style={{ width: "44px", height: "44px", border: "none", borderRadius: "8px", cursor: "pointer", padding: "2px", background: "transparent" }} />
                  <input value={config.secondary_color} onChange={e => setConfig({ ...config, secondary_color: e.target.value })} style={{ ...inp, flex: 1 }} />
                </div>
              </div>
            </div>
            {error && <p style={{ color: "var(--error)", fontSize: "13px", marginBottom: "12px" }}>❌ {error}</p>}
            {saved && <p style={{ color: "var(--success)", fontSize: "13px", marginBottom: "12px" }}>✅ Configuración guardada</p>}
            <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={saving}>
              {saving ? "Guardando..." : "💾 Guardar Configuración"}
            </button>
          </form>
        </div>

        {/* Live Preview */}
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>👁️ Vista previa</h2>
          <div style={{
            borderRadius: "16px", overflow: "hidden", border: "1px solid var(--border-light)",
            background: "#050814",
            padding: "24px", minHeight: "280px", display: "flex", flexDirection: "column", gap: "16px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: "12px" }}>
              {logoPreview ? (
                <div style={{ 
                  width: "110px", height: "110px", borderRadius: "50%",
                  background: "#12182b", border: "2px solid rgba(255,255,255,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)", overflow: "hidden"
                }}>
                  <img src={logoPreview} alt="logo" style={{ 
                    width: `${config.logo_size}%`, 
                    height: `${config.logo_size}%`, 
                    objectFit: "contain",
                    objectPosition: config.logo_object_position,
                    transition: "all 0.2s ease"
                  }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                </div>
              ) : (
                <div style={{ background: `linear-gradient(135deg,${config.primary_color},${config.secondary_color})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 800, fontSize: "18px" }}>
                  ◆ {config.business_name}
                </div>
              )}
            </div>
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: "22px", fontWeight: 900, color: "#F0F4FF", lineHeight: 1.2, marginBottom: "8px" }}>{config.business_name}</div>
              <p style={{ fontSize: "13px", color: "rgba(200,210,255,0.65)", marginBottom: "16px" }}>{config.welcome_message}</p>
              <button style={{ background: `linear-gradient(135deg,${config.primary_color},${config.secondary_color})`, color: "#fff", border: "none", padding: "10px 24px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}>
                Reservar Cita →
              </button>
            </div>
          </div>
          <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "8px", textAlign: "center" }}>
            Vista previa en tiempo real. Guarda los cambios para aplicarlos.
          </p>
        </div>
      </div>
    </div>
  );
}
