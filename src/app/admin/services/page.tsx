"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "../admin.module.css";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";

interface Service {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  image_url: string | null;
}

const EMPTY_FORM = { name: "", description: "", duration_minutes: "", price: "", image_url: "" };

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

function formatCOP(value: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const { tenantId } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async (tid: string) => {
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("tenant_id", tid)
      .order("name");
    if (data) setServices(data);
  }, []);

  useEffect(() => {
    if (tenantId) {
      setLoading(true);
      fetchServices(tenantId).then(() => setLoading(false));
    }
  }, [tenantId, fetchServices]);

  const openCreate = () => {
    setEditingService(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview("");
    setError(null);
    setShowModal(true);
  };

  const openEdit = (s: Service) => {
    setEditingService(s);
    setForm({
      name: s.name,
      description: s.description ?? "",
      duration_minutes: String(s.duration_minutes),
      price: String(s.price),
      image_url: s.image_url ?? "",
    });
    setImageFile(null);
    setImagePreview(s.image_url ?? "");
    setError(null);
    setShowModal(true);
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
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${tenantId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("services").upload(path, file, { upsert: true });
    if (upErr) { setError("Error subiendo imagen: " + upErr.message); return null; }
    const { data } = supabase.storage.from("services").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    const durationVal = parseInt(form.duration_minutes);
    const priceVal = parseFloat(form.price);

    if (!form.name.trim()) { setError("El nombre es obligatorio."); return; }
    if (isNaN(durationVal) || durationVal < 1) { setError("La duración debe ser al menos 1 minuto."); return; }
    if (isNaN(priceVal) || priceVal < 0) { setError("Ingresa un precio válido."); return; }

    setSaving(true);
    setError(null);

    let finalImageUrl = form.image_url || null;
    if (imageFile) {
      const uploaded = await uploadImage(imageFile);
      if (!uploaded) { setSaving(false); return; }
      finalImageUrl = uploaded;
    }

    const payload = {
      tenant_id: tenantId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      duration_minutes: durationVal,
      price: priceVal,
      image_url: finalImageUrl,
    };

    if (editingService) {
      const { error: err } = await supabase.from("services").update(payload).eq("id", editingService.id);
      if (err) { setError(err.message); setSaving(false); return; }
      setServices(prev => prev.map(s => s.id === editingService.id ? { ...s, ...payload } : s));
    } else {
      const { data, error: err } = await supabase.from("services").insert(payload).select("*").single();
      if (err) { setError(err.message); setSaving(false); return; }
      if (data) setServices(prev => [...prev, data]);
    }

    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este servicio?")) return;
    await supabase.from("services").delete().eq("id", id);
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px",
    border: "1px solid var(--border-light)", borderRadius: "var(--radius-base)",
    fontSize: "14px", background: "var(--bg-base)", color: "var(--text-primary)",
    boxSizing: "border-box",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-xl)", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700 }}>Gestión de Servicios</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            {services.length} servicio{services.length !== 1 ? "s" : ""} disponibles
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Añadir Servicio</button>
      </div>

      <div className={styles.listCard} style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div style={{ padding: "var(--spacing-2xl)", textAlign: "center", color: "var(--text-secondary)" }}>Cargando servicios...</div>
          ) : services.length === 0 ? (
            <div style={{ padding: "var(--spacing-2xl)", textAlign: "center", color: "var(--text-secondary)" }}>No hay servicios. ¡Añade el primero!</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "600px" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-base)", borderBottom: "1px solid var(--border-light)" }}>
                  {["Imagen", "Nombre del Servicio", "Duración", "Precio (COP)", "Acciones"].map(h => (
                    <th key={h} style={{ padding: "var(--spacing-md)", fontWeight: 600, color: "var(--text-secondary)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {services.map(s => (
                  <tr key={s.id}
                    style={{ borderBottom: "1px solid var(--border-light)", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--bg-base)")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "var(--spacing-md)" }}>
                      {s.image_url ? (
                        <img src={s.image_url} alt={s.name} style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "8px" }} />
                      ) : (
                        <div style={{ width: "48px", height: "48px", background: "var(--border-light)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>✂️</div>
                      )}
                    </td>
                    <td style={{ padding: "var(--spacing-md)", fontWeight: 600 }}>{s.name}</td>
                    <td style={{ padding: "var(--spacing-md)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{s.duration_min} min</td>
                    <td style={{ padding: "var(--spacing-md)", fontWeight: 700, color: "var(--accent-blue)", whiteSpace: "nowrap" }}>{formatCOP(s.price)}</td>
                    <td style={{ padding: "var(--spacing-md)" }}>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button onClick={() => openEdit(s)} style={{ background: "none", border: "none", color: "var(--accent-blue)", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>Editar</button>
                        <button onClick={() => handleDelete(s.id)} style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>Eliminar</button>
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
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: "32px", width: "100%", maxWidth: "500px", boxShadow: "var(--shadow-level-3)", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "24px" }}>
              {editingService ? "Editar Servicio" : "Nuevo Servicio"}
            </h2>
            <form onSubmit={handleSubmit}>
              {/* Image Upload */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>Imagen del Servicio</label>
                {imagePreview && (
                  <img src={imagePreview} alt="preview" style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "8px", marginBottom: "8px" }} />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ ...inputStyle, padding: "8px" }}
                />
                <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>Máx. 2MB. PNG, JPG o WebP.</p>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>Nombre del servicio *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej. Corte + Barba" style={inputStyle} />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>Descripción</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Descripción breve del servicio..." rows={2}
                  style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
                <div>
                  <label style={{ display: "block", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>Duración (minutos) *</label>
                  <input
                    required
                    type="number"
                    min={1}
                    placeholder="Ej. 30"
                    value={form.duration_minutes}
                    onChange={e => setForm({ ...form, duration_minutes: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>Precio (COP) *</label>
                  <input
                    required
                    type="number"
                    min={0}
                    placeholder="Ej. 50000"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
              {error && <p style={{ color: "var(--error)", fontSize: "13px", marginBottom: "16px" }}>❌ {error}</p>}
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Guardando..." : editingService ? "Guardar Cambios" : "Crear Servicio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
