"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";
import { IconPalette, IconCheck, IconStorefront, IconSliders, IconPlus, IconX } from "../ZyncraIcons";

type FieldType = "text" | "number" | "date" | "select" | "boolean";
interface CustomField { id: string; name: string; field_key: string; field_type: FieldType; required: boolean; options: string[]; position: number; active: boolean; }
const TYPE_LABELS: Record<FieldType, string> = { text: "Texto libre", number: "Número", date: "Fecha", select: "Lista desplegable", boolean: "Sí / No" };
const TYPE_ICONS: Record<FieldType, string> = { text: "T", number: "#", date: "📅", select: "≡", boolean: "✓" };
function slugify(s: string) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,""); }
const EMPTY_FIELD = { name: "", field_type: "text" as FieldType, required: false, options: "" };

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
  borderRadius: "11px", fontSize: "14px", background: "rgba(20,15,30,0.025)",
  color: "#14111C", boxSizing: "border-box",
  fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif", outline: "none",
};
const lbl: React.CSSProperties = {
  display: "block", fontWeight: 600, fontSize: "11px",
  color: "#564E66", marginBottom: "7px",
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

  // Custom fields (client type)
  const [fields, setFields] = useState<CustomField[]>([]);
  const [fieldModal, setFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [fieldForm, setFieldForm] = useState(EMPTY_FIELD);
  const [savingField, setSavingField] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const loadFields = useCallback(async (tid: string) => {
    const { data } = await supabase.from("custom_fields").select("*").eq("tenant_id", tid).eq("applies_to", "client").order("position");
    setFields((data ?? []).map((f: any) => ({ ...f, options: Array.isArray(f.options) ? f.options : [] })));
  }, []);

  const openCreateField = () => { setEditingField(null); setFieldForm(EMPTY_FIELD); setFieldError(null); setFieldModal(true); };
  const openEditField = (f: CustomField) => { setEditingField(f); setFieldForm({ name: f.name, field_type: f.field_type, required: f.required, options: f.options.join("\n") }); setFieldError(null); setFieldModal(true); };

  const saveField = async () => {
    if (!fieldForm.name.trim()) { setFieldError("El nombre es obligatorio."); return; }
    setSavingField(true); setFieldError(null);
    const payload = { tenant_id: tenantId, name: fieldForm.name.trim(), field_key: slugify(fieldForm.name), field_type: fieldForm.field_type, applies_to: "client", required: fieldForm.required, options: fieldForm.field_type === "select" ? fieldForm.options.split("\n").map(o => o.trim()).filter(Boolean) : [], active: true, position: editingField ? editingField.position : fields.length };
    if (editingField) await supabase.from("custom_fields").update(payload).eq("id", editingField.id);
    else await supabase.from("custom_fields").insert(payload);
    setSavingField(false); setFieldModal(false); if (tenantId) loadFields(tenantId);
  };

  const deleteField = async (f: CustomField) => {
    if (!confirm(`¿Eliminar el campo "${f.name}"?`)) return;
    await supabase.from("custom_fields").delete().eq("id", f.id);
    if (tenantId) loadFields(tenantId);
  };

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
    if (tenantId) { setLoading(true); fetchBranding(tenantId).then(() => setLoading(false)); loadFields(tenantId); }
  }, [tenantId, fetchBranding, loadFields]);

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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "40vh", color: "#8E879B", fontSize: "14px", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>
      Cargando configuración...
    </div>
  );

  return (
    <div style={{ fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "24px" }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05", flexShrink: 0 }}>
          <IconPalette size={20} />
        </div>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#14111C", letterSpacing: "-0.5px", margin: 0 }}>Mi Marca</h1>
          <p style={{ color: "#8E879B", fontSize: "13px", marginTop: "2px" }}>Personaliza la apariencia de tu página de reservas</p>
        </div>
      </div>

      {/* Booking link card */}
      <div style={{ background: "white", border: "1px solid #e8e6e2", borderRadius: "18px", padding: "18px 22px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05", flexShrink: 0 }}>
            <IconStorefront size={17} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "13px", color: "#14111C", marginBottom: "3px" }}>Link de reservas para clientes</div>
            <div style={{ fontFamily: "monospace", fontSize: "12px", color: "#fb0f05", wordBreak: "break-all" }}>{bookingLink}</div>
          </div>
        </div>
        <button onClick={handleCopyLink} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 18px", borderRadius: "10px", border: "1.5px solid #e8e6e2", background: copied ? "rgba(16,185,129,0.08)" : "white", color: copied ? "#10b981" : "#3a3548", fontWeight: 600, fontSize: "13px", cursor: "pointer", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif", transition: "all 0.2s", flexShrink: 0 }}>
          {copied ? <><IconCheck size={14} color="#10b981" /> Copiado</> : "Copiar link"}
        </button>
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>

        {/* Form */}
        <div style={{ background: "white", border: "1px solid #e8e6e2", borderRadius: "18px", overflow: "hidden" }}>
          <div style={{ padding: "18px 22px", borderBottom: "1px solid #e8e6e2" }}>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "#14111C" }}>Identidad visual</div>
            <div style={{ fontSize: "12px", color: "#8E879B", marginTop: "2px" }}>Estos datos aparecen en tu página pública de citas</div>
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
            <div style={{ marginBottom: "20px", background: "rgba(20,15,30,0.025)", padding: "16px", borderRadius: "14px", border: "1px solid #e8e6e2" }}>
              <label style={lbl}>Logo del negocio</label>
              <input type="file" accept="image/*" onChange={handleLogoFileChange} style={{ ...inp, padding: "9px", marginBottom: "8px" }} />
              <p style={{ fontSize: "11px", color: "#8E879B", margin: "0 0 12px" }}>Máx. 2MB · PNG con fondo transparente recomendado</p>
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
          <div style={{ fontWeight: 700, fontSize: "13px", color: "#564E66", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Vista previa en vivo</div>
          <div style={{ border: "1px solid #e8e6e2", borderRadius: "18px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>

            {/* Browser bar mockup */}
            <div style={{ background: "#f0eee9", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid #e8e6e2" }}>
              <div style={{ display: "flex", gap: "5px" }}>
                {["#ff5f57","#ffbd2e","#28c840"].map(c => <div key={c} style={{ width: "9px", height: "9px", borderRadius: "50%", background: c }} />)}
              </div>
              <div style={{ flex: 1, background: "white", border: "1px solid #e8e6e2", borderRadius: "5px", padding: "3px 9px", fontSize: "10px", color: "#8E879B", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                zyncra.app/book/{tenantSlug}
              </div>
            </div>

            {/* Page background */}
            <div style={{ background: "rgba(20,15,30,0.025)", padding: "20px 16px", minHeight: "380px" }}>

              {/* Header */}
              <div style={{ textAlign: "center", marginBottom: "16px" }}>
                {logoPreview ? (
                  <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "white", border: "2px solid #e8e6e2", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", margin: "0 auto 8px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                    <img src={logoPreview} alt="logo" style={{ width: `${config.logo_size}%`, height: `${config.logo_size}%`, objectFit: "contain", objectPosition: config.logo_object_position }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  </div>
                ) : (
                  <div style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "-0.3px", marginBottom: "4px", background: `linear-gradient(135deg,${config.primary_color},${config.secondary_color})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    {config.business_name}
                  </div>
                )}
                {logoPreview && (
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#14111C", marginBottom: "2px" }}>{config.business_name}</div>
                )}
                <div style={{ fontSize: "11px", color: "#564E66" }}>{config.welcome_message}</div>
              </div>

              {/* Progress bar preview */}
              <div style={{ display: "flex", alignItems: "center", marginBottom: "14px", gap: "0" }}>
                {[
                  { label: "Servicio", active: true },
                  { label: "Fecha", active: false },
                  { label: "Datos", active: false },
                ].map((s, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                    {idx > 0 && <div style={{ flex: 1, height: "2px", background: "rgba(20,15,30,0.08)", margin: "0 4px", marginBottom: "14px" }} />}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                      <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: s.active ? `linear-gradient(135deg,${config.primary_color},${config.secondary_color})` : "white", border: `1.5px solid ${s.active ? config.primary_color : "rgba(20,15,30,0.08)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: s.active ? "white" : "#8E879B" }}>
                        {idx + 1}
                      </div>
                      <span style={{ fontSize: "9px", fontWeight: 600, color: s.active ? "#14111C" : "#8E879B", whiteSpace: "nowrap" }}>{s.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Card preview */}
              <div style={{ background: "white", borderRadius: "16px", border: "1px solid #e8e6e2", padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#14111C", marginBottom: "12px" }}>¿Qué servicio necesitas?</div>

                {/* Service row examples */}
                {[
                  { name: "Servicio de ejemplo", dur: "45 min", price: "$50", selected: false },
                  { name: "Servicio destacado", dur: "60 min", price: "$80", selected: true },
                ].map((svc, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "11px", border: `1.5px solid ${svc.selected ? config.primary_color : "rgba(20,15,30,0.08)"}`, background: svc.selected ? config.primary_color + "12" : "white", marginBottom: i === 0 ? "8px" : 0 }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: config.primary_color + "14", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={config.primary_color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#14111C" }}>{svc.name}</div>
                      <div style={{ fontSize: "10px", color: "#564E66", marginTop: "2px" }}>{svc.dur}</div>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: config.primary_color, flexShrink: 0 }}>{svc.price}</div>
                    {svc.selected && (
                      <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: config.primary_color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                      </div>
                    )}
                  </div>
                ))}

                {/* Continue button */}
                <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #f0eeeb", display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ background: `linear-gradient(135deg,${config.primary_color},${config.secondary_color})`, color: "white", padding: "8px 18px", borderRadius: "8px", fontSize: "11px", fontWeight: 700 }}>
                    Continuar →
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p style={{ fontSize: "11px", color: "#8E879B", marginTop: "8px", textAlign: "center" }}>Los cambios se aplican al guardar</p>
        </div>
      </div>

      {/* Campos del formulario de clientes */}
      <div style={{ background: "white", border: "1px solid #e8e6e2", borderRadius: "18px", overflow: "hidden", marginTop: "20px" }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid #e8e6e2", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05", flexShrink: 0 }}>
              <IconSliders size={17} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px", color: "#14111C" }}>Campos del formulario de clientes</div>
              <div style={{ fontSize: "12px", color: "#8E879B", marginTop: "2px" }}>Información extra que recolectas de tus clientes al reservar</div>
            </div>
          </div>
          <button onClick={openCreateField} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "9px", border: "none", background: "rgba(251,15,5,0.08)", color: "#fb0f05", fontWeight: 700, fontSize: "12px", cursor: "pointer", fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif" }}>
            <IconPlus size={13} color="#fb0f05" /> Agregar campo
          </button>
        </div>
        <div style={{ padding: "4px 22px 8px" }}>
          {fields.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#8E879B", fontSize: "13px" }}>Sin campos aún — los campos que agregues aparecerán en el formulario de reserva</div>
          ) : fields.map((f, i) => (
            <div key={f.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", borderBottom: i < fields.length - 1 ? "1px solid #f0eeeb" : "none" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#f8fafc", border: "1px solid #e8e6e2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "#fb0f05", flexShrink: 0 }}>{TYPE_ICONS[f.field_type]}</div>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 600, fontSize: "13px", color: "#14111C" }}>{f.name}</span>
                <span style={{ fontSize: "11px", color: "#8E879B", marginLeft: "8px" }}>{TYPE_LABELS[f.field_type]}</span>
                {f.required && <span style={{ fontSize: "10px", fontWeight: 700, marginLeft: "6px", padding: "2px 6px", borderRadius: "20px", background: "rgba(251,15,5,0.08)", color: "#fb0f05" }}>Obligatorio</span>}
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                <button onClick={() => openEditField(f)} style={{ width: "30px", height: "30px", borderRadius: "7px", border: "1px solid #e8e6e2", background: "#f8fafc", cursor: "pointer", fontSize: "12px" }}>✏️</button>
                <button onClick={() => deleteField(f)} style={{ width: "30px", height: "30px", borderRadius: "7px", border: "1px solid #e8e6e2", background: "#f8fafc", cursor: "pointer", fontSize: "12px" }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal campos */}
      {fieldModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(17,17,24,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={e => { if (e.target === e.currentTarget) setFieldModal(false); }}>
          <div style={{ background: "white", borderRadius: "22px", padding: "28px", width: "100%", maxWidth: "440px", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#14111C", margin: 0 }}>{editingField ? "Editar campo" : "Nuevo campo de cliente"}</h2>
              <button onClick={() => setFieldModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8E879B" }}><IconX size={18} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={lbl}>Nombre del campo</label>
                <input value={fieldForm.name} onChange={e => setFieldForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Tipo de cabello, Alergia conocida..." style={inp} />
              </div>
              <div>
                <label style={lbl}>Tipo de campo</label>
                <select value={fieldForm.field_type} onChange={e => setFieldForm(f => ({ ...f, field_type: e.target.value as FieldType }))} style={inp}>
                  {(Object.entries(TYPE_LABELS) as [FieldType, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              {fieldForm.field_type === "select" && (
                <div>
                  <label style={lbl}>Opciones (una por línea)</label>
                  <textarea value={fieldForm.options} onChange={e => setFieldForm(f => ({ ...f, options: e.target.value }))} placeholder={"Liso\nRizado\nOndulado"} rows={3} style={{ ...inp, resize: "vertical" }} />
                </div>
              )}
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                <input type="checkbox" checked={fieldForm.required} onChange={e => setFieldForm(f => ({ ...f, required: e.target.checked }))} style={{ accentColor: "#fb0f05", width: 16, height: 16 }} />
                <span style={{ fontSize: "13px", color: "#475569" }}>Campo obligatorio</span>
              </label>
            </div>
            {fieldError && <div style={{ background: "#fff0f0", border: "1px solid rgba(251,15,5,0.2)", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#d90d04", marginTop: "14px" }}>{fieldError}</div>}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "22px" }}>
              <button type="button" className="btn-secondary" onClick={() => setFieldModal(false)}>Cancelar</button>
              <button type="button" className="btn-primary" onClick={saveField} disabled={savingField}>{savingField ? "Guardando..." : editingField ? "Guardar cambios" : "Crear campo"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
