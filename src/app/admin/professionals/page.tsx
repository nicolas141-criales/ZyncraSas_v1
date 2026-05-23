"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "../admin.module.css";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";

interface Professional {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
  is_active: boolean;
  tenant_id: string;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const EMPTY_FORM = { name: "", role: "" };

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const { tenantId } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const fetchProfessionals = useCallback(async (tid: string) => {
    const { data, error } = await supabase
      .from("professionals")
      .select("*")
      .eq("tenant_id", tid)
      .order("created_at", { ascending: true });
    if (!error && data) setProfessionals(data);
  }, []);

  useEffect(() => {
    if (tenantId) {
      setLoading(true);
      fetchProfessionals(tenantId).then(() => setLoading(false));
    }
  }, [tenantId, fetchProfessionals]);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este profesional?")) return;
    const { error } = await supabase.from("professionals").delete().eq("id", id);
    if (!error) setProfessionals((prev) => prev.filter((p) => p.id !== id));
  };

  const handleToggleActive = async (prof: Professional) => {
    const { error } = await supabase
      .from("professionals")
      .update({ is_active: !prof.is_active })
      .eq("id", prof.id);
    if (!error) {
      setProfessionals((prev) =>
        prev.map((p) => (p.id === prof.id ? { ...p, is_active: !p.is_active } : p))
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setError("La imagen no puede superar 2MB.");
      e.target.value = "";
      return;
    }
    setError(null);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${tenantId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { setError("Error subiendo imagen: " + upErr.message); return null; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) { setError("No se encontró el tenant. Recarga la página."); return; }
    if (!form.name.trim() || !form.role.trim()) { setError("El nombre y el rol son obligatorios."); return; }

    setSaving(true);
    setError(null);

    let avatarUrl: string | null = null;
    if (avatarFile) {
      avatarUrl = await uploadAvatar(avatarFile);
      if (!avatarUrl) { setSaving(false); return; }
    }

    const { data, error: insertErr } = await supabase
      .from("professionals")
      .insert([{
        tenant_id: tenantId,
        name: form.name.trim(),
        role: form.role.trim(),
        avatar_url: avatarUrl,
        is_active: true,
      }])
      .select();

    if (insertErr) {
      setError("Error al guardar: " + insertErr.message);
      setSaving(false);
      return;
    }

    if (data && data.length > 0) {
      setProfessionals((prev) => [...prev, data[0] as Professional]);
    } else {
      await fetchProfessionals(tenantId);
    }

    setForm(EMPTY_FORM);
    setAvatarFile(null);
    setAvatarPreview("");
    setShowModal(false);
    setSaving(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px var(--spacing-md)",
    border: "1px solid var(--border-light)",
    borderRadius: "var(--radius-base)",
    fontSize: "15px",
    background: "var(--bg-base)",
    color: "var(--text-primary)",
    boxSizing: "border-box",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-xl)", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700 }}>Equipo (Profesionales)</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            {professionals.length} miembro{professionals.length !== 1 ? "s" : ""} en el equipo
          </p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(EMPTY_FORM); setAvatarFile(null); setAvatarPreview(""); setError(null); setShowModal(true); }}>
          + Añadir Profesional
        </button>
      </div>

      <div className={styles.listCard} style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div style={{ padding: "var(--spacing-2xl)", textAlign: "center", color: "var(--text-secondary)" }}>Cargando equipo...</div>
          ) : professionals.length === 0 ? (
            <div style={{ padding: "var(--spacing-2xl)", textAlign: "center", color: "var(--text-secondary)" }}>No hay profesionales. ¡Añade el primero!</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "560px" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-base)", borderBottom: "1px solid var(--border-light)" }}>
                  {["Perfil", "Nombre", "Rol / Especialidad", "Estado", "Acciones"].map((h) => (
                    <th key={h} style={{ padding: "var(--spacing-md)", fontWeight: 600, color: "var(--text-secondary)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {professionals.map((prof) => (
                  <tr
                    key={prof.id}
                    style={{ borderBottom: "1px solid var(--border-light)", transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-base)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "var(--spacing-md)" }}>
                      <div style={{
                        width: "44px", height: "44px", borderRadius: "50%",
                        backgroundImage: prof.avatar_url ? `url(${prof.avatar_url})` : undefined,
                        backgroundSize: "cover", backgroundPosition: "center",
                        backgroundColor: "var(--border-light)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, color: "#fb0f05", fontSize: "14px",
                        flexShrink: 0,
                      }}>
                        {!prof.avatar_url && prof.name.substring(0, 2).toUpperCase()}
                      </div>
                    </td>
                    <td style={{ padding: "var(--spacing-md)", fontWeight: 600 }}>{prof.name}</td>
                    <td style={{ padding: "var(--spacing-md)", color: "var(--text-secondary)" }}>{prof.role}</td>
                    <td style={{ padding: "var(--spacing-md)" }}>
                      <span style={{
                        padding: "4px 10px", borderRadius: "var(--radius-full)", fontSize: "12px", fontWeight: 600,
                        backgroundColor: prof.is_active ? "rgba(16,185,129,0.12)" : "rgba(100,116,139,0.12)",
                        color: prof.is_active ? "var(--success)" : "var(--text-secondary)",
                      }}>
                        {prof.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td style={{ padding: "var(--spacing-md)" }}>
                      <div style={{ display: "flex", gap: "16px" }}>
                        <button onClick={() => handleToggleActive(prof)} style={{ background: "none", border: "none", color: "#fb0f05", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
                          {prof.is_active ? "Desactivar" : "Activar"}
                        </button>
                        <button onClick={() => handleDelete(prof.id)} style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(15,23,42,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: "var(--spacing-2xl)", width: "100%", maxWidth: "480px", boxShadow: "var(--shadow-level-3)" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "var(--spacing-xl)" }}>Añadir Profesional</h2>
            <form onSubmit={handleAdd}>
              {/* Avatar Upload */}
              <div style={{ marginBottom: "var(--spacing-lg)" }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: "14px", marginBottom: "var(--spacing-sm)" }}>Foto de Perfil (Opcional)</label>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <div style={{
                    width: "64px", height: "64px", borderRadius: "50%", flexShrink: 0,
                    backgroundImage: avatarPreview ? `url(${avatarPreview})` : undefined,
                    backgroundSize: "cover", backgroundPosition: "center",
                    backgroundColor: "var(--border-light)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "24px", color: "var(--text-secondary)",
                  }}>
                    {!avatarPreview && "👤"}
                  </div>
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ ...inputStyle, padding: "8px" }} />
                </div>
                <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>Máx. 2MB. PNG, JPG o WebP.</p>
              </div>
              <div style={{ marginBottom: "var(--spacing-lg)" }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: "14px", marginBottom: "var(--spacing-sm)" }}>Nombre Completo *</label>
                <input type="text" required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej. Alex Rover" style={inputStyle} />
              </div>
              <div style={{ marginBottom: "var(--spacing-lg)" }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: "14px", marginBottom: "var(--spacing-sm)" }}>Rol / Especialidad *</label>
                <input type="text" required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Ej. Barbero Senior, Estilista..." style={inputStyle} />
              </div>
              {error && <p style={{ color: "var(--error)", fontSize: "13px", marginBottom: "16px" }}>❌ {error}</p>}
              <div style={{ display: "flex", gap: "var(--spacing-md)", justifyContent: "flex-end" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Guardando..." : "Añadir al Equipo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
