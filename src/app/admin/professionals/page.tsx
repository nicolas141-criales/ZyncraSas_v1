"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";
import { IconUserGroup, IconPlus, IconX } from "../ZyncraIcons";

interface Professional {
  id: string; name: string; role: string;
  avatar_url: string | null; is_active: boolean; tenant_id: string;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const EMPTY_FORM = { name: "", role: "" };

const inp: React.CSSProperties = {
  width: "100%", padding: "11px 14px", border: "1.5px solid #e8e6e2",
  borderRadius: "11px", fontSize: "14px", background: "#f7f5f2",
  color: "#111118", boxSizing: "border-box",
  fontFamily: "'Plus Jakarta Sans', sans-serif", outline: "none",
};
const lbl: React.CSSProperties = {
  display: "block", fontWeight: 600, fontSize: "11px",
  color: "#6b6b80", marginBottom: "6px",
  textTransform: "uppercase", letterSpacing: "0.06em",
};

export default function ProfessionalsPage() {
  const { tenantId } = useAdmin();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const fetchProfessionals = useCallback(async (tid: string) => {
    const { data, error } = await supabase.from("professionals").select("*").eq("tenant_id", tid).order("created_at", { ascending: true });
    if (!error && data) setProfessionals(data);
  }, []);

  useEffect(() => {
    if (tenantId) { setLoading(true); fetchProfessionals(tenantId).then(() => setLoading(false)); }
  }, [tenantId, fetchProfessionals]);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este profesional?")) return;
    const { error } = await supabase.from("professionals").delete().eq("id", id);
    if (!error) setProfessionals(prev => prev.filter(p => p.id !== id));
  };

  const handleToggleActive = async (prof: Professional) => {
    const { error } = await supabase.from("professionals").update({ is_active: !prof.is_active }).eq("id", prof.id);
    if (!error) setProfessionals(prev => prev.map(p => p.id === prof.id ? { ...p, is_active: !p.is_active } : p));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > MAX_FILE_SIZE) { setError("La imagen no puede superar 2MB."); e.target.value = ""; return; }
    setError(null); setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${tenantId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { setError("Error subiendo imagen: " + upErr.message); return null; }
    return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) { setError("No se encontró el negocio. Recarga la página."); return; }
    if (!form.name.trim() || !form.role.trim()) { setError("El nombre y el rol son obligatorios."); return; }
    setSaving(true); setError(null);
    let avatarUrl: string | null = null;
    if (avatarFile) { avatarUrl = await uploadAvatar(avatarFile); if (!avatarUrl) { setSaving(false); return; } }
    const { data, error: insertErr } = await supabase.from("professionals").insert([{ tenant_id: tenantId, name: form.name.trim(), role: form.role.trim(), avatar_url: avatarUrl, is_active: true }]).select();
    if (insertErr) { setError("Error al guardar: " + insertErr.message); setSaving(false); return; }
    if (data && data.length > 0) setProfessionals(prev => [...prev, data[0] as Professional]);
    else await fetchProfessionals(tenantId);
    setForm(EMPTY_FORM); setAvatarFile(null); setAvatarPreview(""); setShowModal(false); setSaving(false);
  };

  const active = professionals.filter(p => p.is_active).length;
  const initials = (name: string) => name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "14px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05", flexShrink: 0 }}>
            <IconUserGroup size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#111118", letterSpacing: "-0.5px", margin: 0 }}>Equipo</h1>
            <p style={{ color: "#a0a0b0", fontSize: "13px", marginTop: "2px" }}>
              {professionals.length} miembro{professionals.length !== 1 ? "s" : ""} · {active} activo{active !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button className="btn-primary" onClick={() => { setForm(EMPTY_FORM); setAvatarFile(null); setAvatarPreview(""); setError(null); setShowModal(true); }}
          style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <IconPlus size={15} color="white" /> Añadir profesional
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: "60px", textAlign: "center", color: "#a0a0b0", fontSize: "14px" }}>Cargando equipo...</div>
      ) : professionals.length === 0 ? (
        <div style={{ background: "white", border: "1px solid #e8e6e2", borderRadius: "22px", padding: "64px 32px", textAlign: "center" }}>
          <div style={{ width: "60px", height: "60px", borderRadius: "18px", background: "rgba(251,15,5,0.07)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05", margin: "0 auto 16px" }}>
            <IconUserGroup size={26} />
          </div>
          <div style={{ fontWeight: 700, fontSize: "16px", color: "#111118", marginBottom: "6px" }}>Aún no hay profesionales</div>
          <p style={{ color: "#a0a0b0", fontSize: "14px", marginBottom: "24px" }}>Agrega a tu equipo para asignar citas y gestionar comisiones.</p>
          <button className="btn-primary" onClick={() => { setForm(EMPTY_FORM); setAvatarFile(null); setAvatarPreview(""); setError(null); setShowModal(true); }}>
            Añadir primer profesional
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px" }}>
          {professionals.map(prof => (
            <div key={prof.id} style={{ background: "white", border: "1px solid #e8e6e2", borderRadius: "18px", padding: "22px", display: "flex", flexDirection: "column", gap: "14px", transition: "box-shadow 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.07)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>

              {/* Avatar + status */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                {prof.avatar_url ? (
                  <img src={prof.avatar_url} alt={prof.name} style={{ width: "56px", height: "56px", borderRadius: "50%", objectFit: "cover", border: "2px solid #e8e6e2" }} />
                ) : (
                  <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "linear-gradient(135deg, #fb0f05, #9B3FC8)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: "18px", flexShrink: 0 }}>
                    {initials(prof.name)}
                  </div>
                )}
                <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: prof.is_active ? "rgba(16,185,129,0.1)" : "rgba(100,116,139,0.1)", color: prof.is_active ? "#10b981" : "#64748b" }}>
                  {prof.is_active ? "Activo" : "Inactivo"}
                </span>
              </div>

              {/* Info */}
              <div>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "#111118" }}>{prof.name}</div>
                <div style={{ fontSize: "13px", color: "#6b6b80", marginTop: "3px" }}>{prof.role}</div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "8px", borderTop: "1px solid #f0eeeb", paddingTop: "14px" }}>
                <button onClick={() => handleToggleActive(prof)}
                  style={{ flex: 1, padding: "8px", borderRadius: "9px", border: "1.5px solid #e8e6e2", background: "white", color: "#3a3a48", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#fb0f05"; e.currentTarget.style.color = "#fb0f05"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#e8e6e2"; e.currentTarget.style.color = "#3a3a48"; }}>
                  {prof.is_active ? "Desactivar" : "Activar"}
                </button>
                <button onClick={() => handleDelete(prof.id)}
                  style={{ padding: "8px 14px", borderRadius: "9px", border: "none", background: "rgba(239,68,68,0.07)", color: "#ef4444", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.14)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(239,68,68,0.07)")}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(17,17,24,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background: "white", borderRadius: "22px", padding: "28px", width: "100%", maxWidth: "460px", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05" }}>
                  <IconUserGroup size={17} />
                </div>
                <h2 style={{ fontSize: "17px", fontWeight: 800, color: "#111118" }}>Añadir profesional</h2>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#a0a0b0" }}>
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleAdd}>
              {/* Avatar */}
              <div style={{ marginBottom: "20px" }}>
                <label style={lbl}>Foto de perfil (opcional)</label>
                <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                  <div style={{ width: "60px", height: "60px", borderRadius: "50%", flexShrink: 0, backgroundImage: avatarPreview ? `url(${avatarPreview})` : undefined, backgroundSize: "cover", backgroundPosition: "center", background: avatarPreview ? undefined : "linear-gradient(135deg, rgba(251,15,5,0.1), rgba(0,39,254,0.1))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", color: "#a0a0b0", border: "2px solid #e8e6e2" }}>
                    {!avatarPreview && "·"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ ...inp, padding: "9px", fontSize: "13px" }} />
                    <p style={{ fontSize: "11px", color: "#a0a0b0", marginTop: "5px" }}>Máx. 2MB · PNG, JPG o WebP</p>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={lbl}>Nombre completo *</label>
                <input type="text" required autoFocus value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej. Ana García" style={inp} />
              </div>
              <div style={{ marginBottom: "22px" }}>
                <label style={lbl}>Rol / Especialidad *</label>
                <input type="text" required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Ej. Estilista Senior, Manicurista..." style={inp} />
              </div>

              {error && (
                <div style={{ background: "#fff0f0", border: "1px solid rgba(251,15,5,0.2)", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#d90d04", marginBottom: "16px", fontWeight: 500 }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Guardando..." : "Añadir al equipo"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
