"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "../admin.module.css";
import { supabase } from "@/lib/supabase";

interface Professional {
  id: string;
  name: string;
  role: string;
  avatar_url: string | null;
  is_active: boolean;
  tenant_id: string;
}

const DEMO_TENANT_SLUG = "demo-salon";

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", avatar_url: "" });

  const fetchProfessionals = useCallback(async (tid: string) => {
    const { data, error } = await supabase
      .from("professionals")
      .select("*")
      .eq("tenant_id", tid)
      .order("created_at", { ascending: true });
    if (!error && data) setProfessionals(data);
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", DEMO_TENANT_SLUG)
        .single();

      if (tenant) {
        setTenantId(tenant.id);
        await fetchProfessionals(tenant.id);
      }
      setLoading(false);
    }
    init();
  }, [fetchProfessionals]);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este profesional?")) return;
    await supabase.from("professionals").delete().eq("id", id);
    setProfessionals((prev) => prev.filter((p) => p.id !== id));
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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("professionals")
      .insert({
        tenant_id: tenantId,
        name: form.name,
        role: form.role,
        avatar_url: form.avatar_url || null,
        is_active: true,
      })
      .select("*")
      .single();

    if (!error && data) {
      setProfessionals((prev) => [...prev, data]);
      setForm({ name: "", role: "", avatar_url: "" });
      setShowModal(false);
    } else {
      alert("Error al guardar: " + error?.message);
    }
    setSaving(false);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-xl)" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700 }}>Equipo (Profesionales)</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            {professionals.length} miembro{professionals.length !== 1 ? "s" : ""} en el equipo
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Añadir Profesional
        </button>
      </div>

      {/* Table */}
      <div className={styles.listCard} style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "var(--spacing-2xl)", textAlign: "center", color: "var(--text-secondary)" }}>
            Cargando equipo...
          </div>
        ) : professionals.length === 0 ? (
          <div style={{ padding: "var(--spacing-2xl)", textAlign: "center", color: "var(--text-secondary)" }}>
            No hay profesionales. ¡Añade el primero!
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--bg-base)", borderBottom: "1px solid var(--border-light)" }}>
                <th style={{ padding: "var(--spacing-md)", fontWeight: 600, color: "var(--text-secondary)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Perfil</th>
                <th style={{ padding: "var(--spacing-md)", fontWeight: 600, color: "var(--text-secondary)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Nombre</th>
                <th style={{ padding: "var(--spacing-md)", fontWeight: 600, color: "var(--text-secondary)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Rol / Especialidad</th>
                <th style={{ padding: "var(--spacing-md)", fontWeight: 600, color: "var(--text-secondary)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Estado</th>
                <th style={{ padding: "var(--spacing-md)", fontWeight: 600, color: "var(--text-secondary)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {professionals.map((prof) => (
                <tr key={prof.id} style={{ borderBottom: "1px solid var(--border-light)", transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--bg-base)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td style={{ padding: "var(--spacing-md)" }}>
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "50%",
                      backgroundImage: prof.avatar_url ? `url(${prof.avatar_url})` : undefined,
                      backgroundSize: "cover", backgroundPosition: "center",
                      backgroundColor: "var(--border-light)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, color: "var(--accent-blue)", fontSize: "14px"
                    }}>
                      {!prof.avatar_url && prof.name.substring(0, 2).toUpperCase()}
                    </div>
                  </td>
                  <td style={{ padding: "var(--spacing-md)", fontWeight: 600 }}>{prof.name}</td>
                  <td style={{ padding: "var(--spacing-md)", color: "var(--text-secondary)" }}>{prof.role}</td>
                  <td style={{ padding: "var(--spacing-md)" }}>
                    <span style={{
                      padding: "4px 10px", borderRadius: "var(--radius-full)", fontSize: "12px", fontWeight: 600,
                      backgroundColor: prof.is_active ? "rgba(16, 185, 129, 0.1)" : "rgba(100, 116, 139, 0.1)",
                      color: prof.is_active ? "var(--success)" : "var(--text-secondary)"
                    }}>
                      {prof.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td style={{ padding: "var(--spacing-md)" }}>
                    <div style={{ display: "flex", gap: "16px" }}>
                      <button
                        onClick={() => handleToggleActive(prof)}
                        style={{ background: "none", border: "none", color: "var(--accent-blue)", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}
                      >
                        {prof.is_active ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        onClick={() => handleDelete(prof.id)}
                        style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}
                      >
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

      {/* Add Professional Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          backgroundColor: "rgba(15, 23, 42, 0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "var(--spacing-md)"
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{
            background: "var(--surface)", borderRadius: "var(--radius-lg)",
            padding: "var(--spacing-2xl)", width: "100%", maxWidth: "480px",
            boxShadow: "var(--shadow-level-3)"
          }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "var(--spacing-xl)" }}>
              Añadir Profesional
            </h2>
            <form onSubmit={handleAdd}>
              <div style={{ marginBottom: "var(--spacing-lg)" }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: "14px", marginBottom: "var(--spacing-sm)" }}>
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej. Alex Rover"
                  style={{
                    width: "100%", padding: "12px var(--spacing-md)",
                    border: "1px solid var(--border-light)", borderRadius: "var(--radius-base)",
                    fontSize: "15px", background: "var(--bg-base)"
                  }}
                />
              </div>
              <div style={{ marginBottom: "var(--spacing-lg)" }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: "14px", marginBottom: "var(--spacing-sm)" }}>
                  Rol / Especialidad *
                </label>
                <input
                  type="text"
                  required
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="Ej. Barbero Senior, Estilista..."
                  style={{
                    width: "100%", padding: "12px var(--spacing-md)",
                    border: "1px solid var(--border-light)", borderRadius: "var(--radius-base)",
                    fontSize: "15px", background: "var(--bg-base)"
                  }}
                />
              </div>
              <div style={{ marginBottom: "var(--spacing-xl)" }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: "14px", marginBottom: "var(--spacing-sm)" }}>
                  URL de Avatar (Opcional)
                </label>
                <input
                  type="url"
                  value={form.avatar_url}
                  onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                  placeholder="https://..."
                  style={{
                    width: "100%", padding: "12px var(--spacing-md)",
                    border: "1px solid var(--border-light)", borderRadius: "var(--radius-base)",
                    fontSize: "15px", background: "var(--bg-base)"
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "var(--spacing-md)", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>
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
