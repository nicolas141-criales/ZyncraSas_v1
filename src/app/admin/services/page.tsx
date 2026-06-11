"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";
import { IconServiceBell, IconPlus, IconClock, IconCreditCard, IconX, IconSliders } from "../ZyncraIcons";

type FieldType = "text" | "number" | "date" | "select" | "boolean";
interface CustomField { id: string; name: string; field_key: string; field_type: FieldType; required: boolean; options: string[]; position: number; }
const TYPE_LABELS: Record<FieldType, string> = { text: "Texto libre", number: "Número", date: "Fecha", select: "Lista desplegable", boolean: "Sí / No" };
const TYPE_ICONS: Record<FieldType, string> = { text: "T", number: "#", date: "D", select: "≡", boolean: "✓" };
function slugify(s: string) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""); }
const EMPTY_FIELD = { name: "", field_type: "text" as FieldType, required: false, options: "" };

interface Tag { name: string; color: string; }
const TAG_COLORS = ["#ef4444","#f97316","#f59e0b","#10b981","#06b6d4","#3b82f6","#8b5cf6","#ec4899","#64748b"];

interface Service {
  id: string; tenant_id: string; name: string;
  description: string | null; duration_minutes: number;
  price: number; image_url: string | null; tags: Tag[];
}

function TagEditor({ tags, onChange, inpStyle }: { tags: Tag[]; onChange: (t: Tag[]) => void; inpStyle: React.CSSProperties }) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TAG_COLORS[0]);
  const add = () => {
    const n = newName.trim(); if (!n) return;
    onChange([...tags, { name: n, color: newColor }]);
    setNewName("");
  };
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {tags.map((t, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: t.color + "18", color: t.color, border: `1px solid ${t.color}40` }}>
            {t.name}
            <button type="button" onClick={() => onChange(tags.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: t.color, padding: 0, lineHeight: 1, fontSize: 13 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())} placeholder="Nueva etiqueta..." style={{ ...inpStyle, flex: 1, padding: "8px 12px", fontSize: 13 }} />
        <div style={{ display: "flex", gap: 4 }}>
          {TAG_COLORS.map(c => (
            <button key={c} type="button" onClick={() => setNewColor(c)} style={{ width: 18, height: 18, borderRadius: "50%", background: c, border: newColor === c ? "2px solid #14111C" : "2px solid transparent", cursor: "pointer", flexShrink: 0 }} />
          ))}
        </div>
        <button type="button" onClick={add} style={{ padding: "8px 14px", borderRadius: 9, background: "#14111C", color: "#fff", border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>+</button>
      </div>
    </div>
  );
}

const EMPTY_FORM = { name: "", description: "", duration_minutes: "", price: "", image_url: "" };
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const fmt = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

const inp: React.CSSProperties = {
  width: "100%", padding: "11px 14px", border: "1.5px solid rgba(20,15,30,0.08)",
  borderRadius: "11px", fontSize: "14px", background: "rgba(20,15,30,0.025)",
  color: "#14111C", boxSizing: "border-box",
  fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif", outline: "none",
  transition: "border-color .2s",
};
const lbl: React.CSSProperties = {
  display: "block", fontWeight: 600, fontSize: "11px",
  color: "#564E66", marginBottom: "6px",
  textTransform: "uppercase", letterSpacing: "0.06em",
};

export default function ServicesPage() {
  const { tenantId } = useAdmin();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);

  // Campos adicionales del servicio (dentro del modal de edición)
  const [serviceFields, setServiceFields] = useState<CustomField[]>([]);
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [fieldForm, setFieldForm] = useState(EMPTY_FIELD);
  const [savingField, setSavingField] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const fetchServices = useCallback(async (tid: string) => {
    const { data } = await supabase.from("services").select("*").eq("tenant_id", tid).order("name");
    if (data) setServices(data);
  }, []);

  const loadServiceFields = useCallback(async (serviceId: string) => {
    const { data } = await supabase
      .from("custom_fields").select("*")
      .eq("service_id", serviceId)
      .order("position");
    setServiceFields((data ?? []).map((f: any) => ({ ...f, options: Array.isArray(f.options) ? f.options : [] })));
  }, []);

  useEffect(() => {
    if (tenantId) { setLoading(true); fetchServices(tenantId).then(() => setLoading(false)); }
  }, [tenantId, fetchServices]);

  const openCreate = () => {
    setEditingService(null); setForm(EMPTY_FORM); setImageFile(null);
    setImagePreview(""); setError(null); setServiceFields([]);
    setShowFieldForm(false); setTags([]); setShowModal(true);
  };

  const openEdit = (s: Service) => {
    setEditingService(s);
    setForm({ name: s.name, description: s.description ?? "", duration_minutes: String(s.duration_minutes), price: String(s.price), image_url: s.image_url ?? "" });
    setImageFile(null); setImagePreview(s.image_url ?? ""); setError(null);
    setShowFieldForm(false); setFieldForm(EMPTY_FIELD); setFieldError(null);
    setTags((s as any).tags || []);
    loadServiceFields(s.id);
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > MAX_FILE_SIZE) { setError("La imagen no puede superar 2MB."); e.target.value = ""; return; }
    setError(null); setImageFile(file); setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${tenantId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("services").upload(path, file, { upsert: true });
    if (upErr) { setError("Error subiendo imagen: " + upErr.message); return null; }
    return supabase.storage.from("services").getPublicUrl(path).data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!tenantId) return;
    const durationVal = parseInt(form.duration_minutes);
    const priceVal = parseFloat(form.price);
    if (!form.name.trim()) { setError("El nombre es obligatorio."); return; }
    if (isNaN(durationVal) || durationVal < 1) { setError("La duración debe ser al menos 1 minuto."); return; }
    if (isNaN(priceVal) || priceVal < 0) { setError("Ingresa un precio válido."); return; }
    setSaving(true); setError(null);
    let finalImageUrl = form.image_url || null;
    if (imageFile) { const u = await uploadImage(imageFile); if (!u) { setSaving(false); return; } finalImageUrl = u; }
    const payload = { tenant_id: tenantId, name: form.name.trim(), description: form.description.trim() || null, duration_minutes: durationVal, price: priceVal, image_url: finalImageUrl, tags };
    if (editingService) {
      const { error: err } = await supabase.from("services").update(payload).eq("id", editingService.id);
      if (err) { setError(err.message); setSaving(false); return; }
      setServices(prev => prev.map(s => s.id === editingService.id ? { ...s, ...payload } : s));
    } else {
      const { data, error: err } = await supabase.from("services").insert(payload).select("*").single();
      if (err) { setError(err.message); setSaving(false); return; }
      if (data) setServices(prev => [...prev, data]);
    }
    setSaving(false); setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este servicio?")) return;
    await supabase.from("services").delete().eq("id", id);
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const addServiceField = async () => {
    if (!editingService || !fieldForm.name.trim()) { setFieldError("El nombre es obligatorio."); return; }
    setSavingField(true); setFieldError(null);
    const payload = {
      tenant_id: tenantId,
      service_id: editingService.id,
      name: fieldForm.name.trim(),
      field_key: slugify(fieldForm.name),
      field_type: fieldForm.field_type,
      applies_to: "appointment",
      required: fieldForm.required,
      options: fieldForm.field_type === "select" ? fieldForm.options.split("\n").map(o => o.trim()).filter(Boolean) : [],
      active: true,
      position: serviceFields.length,
    };
    await supabase.from("custom_fields").insert(payload);
    setSavingField(false); setShowFieldForm(false); setFieldForm(EMPTY_FIELD);
    loadServiceFields(editingService.id);
  };

  const removeServiceField = async (fieldId: string) => {
    if (!confirm("¿Eliminar este campo?")) return;
    await supabase.from("custom_fields").delete().eq("id", fieldId);
    if (editingService) loadServiceFields(editingService.id);
  };

  return (
    <div style={{ fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "14px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05", flexShrink: 0 }}>
            <IconServiceBell size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#14111C", letterSpacing: "-0.5px", margin: 0 }}>Servicios</h1>
            <p style={{ color: "#8E879B", fontSize: "13px", marginTop: "2px" }}>{services.length} servicio{services.length !== 1 ? "s" : ""} disponibles</p>
          </div>
        </div>
        <button className="btn-primary" onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <IconPlus size={15} color="white" /> Añadir servicio
        </button>
      </div>

      {/* Grid de servicios */}
      {loading ? (
        <div style={{ padding: "60px", textAlign: "center", color: "#8E879B", fontSize: "14px" }}>Cargando servicios...</div>
      ) : services.length === 0 ? (
        <div style={{ background: "white", border: "1px solid rgba(20,15,30,0.08)", borderRadius: "22px", padding: "64px 32px", textAlign: "center" }}>
          <div style={{ width: "60px", height: "60px", borderRadius: "18px", background: "rgba(251,15,5,0.07)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05", margin: "0 auto 16px" }}>
            <IconServiceBell size={26} />
          </div>
          <div style={{ fontWeight: 700, fontSize: "16px", color: "#14111C", marginBottom: "6px" }}>Aún no hay servicios</div>
          <p style={{ color: "#8E879B", fontSize: "14px", marginBottom: "24px" }}>Agrega tu primer servicio para que los clientes puedan reservar.</p>
          <button className="btn-primary" onClick={openCreate}>Añadir primer servicio</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
          {services.map(s => (
            <div key={s.id} style={{ background: "white", border: "1px solid rgba(20,15,30,0.08)", borderRadius: "18px", overflow: "hidden", transition: "box-shadow 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
              {s.image_url ? (
                <img src={s.image_url} alt={s.name} style={{ width: "100%", height: "140px", objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{ width: "100%", height: "140px", background: "linear-gradient(135deg, rgba(251,15,5,0.06) 0%, rgba(0,39,254,0.06) 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: "52px", height: "52px", borderRadius: "16px", background: "rgba(251,15,5,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05" }}>
                    <IconServiceBell size={24} />
                  </div>
                </div>
              )}
              <div style={{ padding: "16px" }}>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "#14111C", marginBottom: "4px" }}>{s.name}</div>
                {s.description && (
                  <div style={{ fontSize: "12px", color: "#8E879B", marginBottom: "12px", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {s.description}
                  </div>
                )}
                <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, background: "rgba(20,15,30,0.025)", color: "#564E66", border: "1px solid rgba(20,15,30,0.08)" }}>
                    <IconClock size={11} /> {s.duration_minutes} min
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, background: "rgba(251,15,5,0.08)", color: "#fb0f05" }}>
                    <IconCreditCard size={11} /> {fmt(s.price)}
                  </span>
                </div>
                {((s as any).tags || []).length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                    {((s as any).tags as Tag[]).map((tag, ti) => (
                      <span key={ti} style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: tag.color + "18", color: tag.color, border: `1px solid ${tag.color}30` }}>{tag.name}</span>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", gap: "8px", borderTop: "1px solid #f0eeeb", paddingTop: "12px" }}>
                  <button onClick={() => openEdit(s)} style={{ flex: 1, padding: "8px", borderRadius: "9px", border: "1.5px solid rgba(20,15,30,0.08)", background: "white", color: "#3a3548", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#fb0f05"; e.currentTarget.style.color = "#fb0f05"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(20,15,30,0.08)"; e.currentTarget.style.color = "#3a3548"; }}>
                    Editar
                  </button>
                  <button onClick={() => handleDelete(s.id)} style={{ padding: "8px 14px", borderRadius: "9px", border: "1.5px solid transparent", background: "rgba(239,68,68,0.07)", color: "#ef4444", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.14)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(239,68,68,0.07)")}>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(12,12,20,0.45)", backdropFilter: "blur(16px) saturate(1.4)", WebkitBackdropFilter: "blur(16px) saturate(1.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(32px) saturate(1.6)", WebkitBackdropFilter: "blur(32px) saturate(1.6)", border: "1px solid rgba(255,255,255,0.7)", borderRadius: "22px", padding: "28px", width: "100%", maxWidth: "500px", boxShadow: "0 24px 64px rgba(0,0,0,0.18)", maxHeight: "92vh", overflowY: "auto" }}>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05" }}>
                  <IconServiceBell size={17} />
                </div>
                <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#14111C", margin: 0 }}>{editingService ? "Editar servicio" : "Nuevo servicio"}</h2>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8E879B", display: "flex", alignItems: "center" }}>
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "18px" }}>
                <label style={lbl}>Imagen del servicio</label>
                {imagePreview && <img src={imagePreview} alt="preview" style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "12px", marginBottom: "10px" }} />}
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ ...inp, padding: "9px" }} />
                <p style={{ fontSize: "11px", color: "#8E879B", marginTop: "5px" }}>Máx. 2MB · PNG, JPG o WebP</p>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={lbl}>Nombre del servicio *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej. Corte + Barba" style={inp} />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={lbl}>Descripción</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripción breve del servicio..." rows={2} style={{ ...inp, resize: "vertical" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "16px" }}>
                <div>
                  <label style={lbl}>Duración (minutos) *</label>
                  <input required type="number" min={1} placeholder="Ej. 30" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Precio COP *</label>
                  <input required type="number" min={0} placeholder="Ej. 50000" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={inp} />
                </div>
              </div>

              <div style={{ marginBottom: "22px" }}>
                <label style={lbl}>Etiquetas</label>
                <TagEditor tags={tags} onChange={setTags} inpStyle={inp} />
              </div>

              {error && (
                <div style={{ background: "#fff0f0", border: "1px solid rgba(251,15,5,0.2)", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#d90d04", marginBottom: "16px", fontWeight: 500 }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Guardando..." : editingService ? "Guardar cambios" : "Crear servicio"}</button>
              </div>
            </form>

            {/* ── Campos adicionales (solo en edición) ── */}
            {editingService ? (
              <div style={{ marginTop: "24px", borderTop: "1.5px solid #f0eeeb", paddingTop: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <IconSliders size={15} color="#564E66" />
                    <span style={{ fontWeight: 700, fontSize: "13px", color: "#14111C" }}>Campos adicionales</span>
                    {serviceFields.length > 0 && (
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 7px", borderRadius: "20px", background: "rgba(251,15,5,0.08)", color: "#fb0f05" }}>{serviceFields.length}</span>
                    )}
                  </div>
                  {!showFieldForm && (
                    <button onClick={() => { setShowFieldForm(true); setFieldForm(EMPTY_FIELD); setFieldError(null); }}
                      style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 14px", borderRadius: "8px", border: "none", background: "rgba(251,15,5,0.08)", color: "#fb0f05", fontWeight: 700, fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>
                      <IconPlus size={12} color="#fb0f05" /> Agregar campo
                    </button>
                  )}
                </div>

                {/* Formulario inline para nuevo campo */}
                {showFieldForm && (
                  <div style={{ background: "rgba(20,15,30,0.025)", border: "1.5px solid rgba(20,15,30,0.08)", borderRadius: "14px", padding: "16px", marginBottom: "14px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div>
                        <label style={lbl}>Nombre del campo</label>
                        <input value={fieldForm.name} onChange={e => setFieldForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="Ej: Color preferido, ¿Tienes alergias?..." style={inp} autoFocus />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div>
                          <label style={lbl}>Tipo</label>
                          <select value={fieldForm.field_type} onChange={e => setFieldForm(f => ({ ...f, field_type: e.target.value as FieldType }))} style={inp}>
                            {(Object.entries(TYPE_LABELS) as [FieldType, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </div>
                        <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "2px" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                            <input type="checkbox" checked={fieldForm.required} onChange={e => setFieldForm(f => ({ ...f, required: e.target.checked }))} style={{ accentColor: "#fb0f05", width: 15, height: 15 }} />
                            <span style={{ fontSize: "13px", color: "#564E66", fontWeight: 500 }}>Obligatorio</span>
                          </label>
                        </div>
                      </div>
                      {fieldForm.field_type === "select" && (
                        <div>
                          <label style={lbl}>Opciones (una por línea)</label>
                          <textarea value={fieldForm.options} onChange={e => setFieldForm(f => ({ ...f, options: e.target.value }))}
                            placeholder={"Opción 1\nOpción 2\nOpción 3"} rows={3} style={{ ...inp, resize: "vertical" }} />
                        </div>
                      )}
                      {fieldError && <div style={{ fontSize: "12px", color: "#d90d04", fontWeight: 500 }}>{fieldError}</div>}
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <button type="button" onClick={() => setShowFieldForm(false)} style={{ padding: "7px 16px", borderRadius: "8px", border: "1px solid rgba(20,15,30,0.08)", background: "white", color: "#564E66", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
                        <button type="button" onClick={addServiceField} disabled={savingField}
                          style={{ padding: "7px 16px", borderRadius: "8px", border: "none", background: "#fb0f05", color: "white", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: savingField ? 0.7 : 1 }}>
                          {savingField ? "Guardando..." : "Guardar campo"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de campos existentes */}
                {serviceFields.length === 0 && !showFieldForm ? (
                  <div style={{ textAlign: "center", padding: "16px 0", color: "#8E879B", fontSize: "12px" }}>
                    Sin campos adicionales — este servicio no requiere información extra
                  </div>
                ) : (
                  serviceFields.map((f, i) => (
                    <div key={f.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: i < serviceFields.length - 1 ? "1px solid #f0eeeb" : "none" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "rgba(20,15,30,0.025)", border: "1px solid rgba(20,15,30,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#fb0f05", flexShrink: 0 }}>
                        {TYPE_ICONS[f.field_type]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 600, fontSize: "13px", color: "#14111C" }}>{f.name}</span>
                        <span style={{ fontSize: "11px", color: "#8E879B", marginLeft: "7px" }}>{TYPE_LABELS[f.field_type]}</span>
                        {f.required && <span style={{ fontSize: "10px", fontWeight: 700, marginLeft: "6px", padding: "1px 6px", borderRadius: "20px", background: "rgba(251,15,5,0.08)", color: "#fb0f05" }}>Obligatorio</span>}
                      </div>
                      <button onClick={() => removeServiceField(f.id)} style={{ width: "28px", height: "28px", borderRadius: "7px", border: "1px solid rgba(20,15,30,0.08)", background: "rgba(20,15,30,0.025)", cursor: "pointer", fontSize: "12px", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <IconX size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div style={{ marginTop: "16px", background: "rgba(20,15,30,0.025)", borderRadius: "12px", padding: "12px 14px" }}>
                <p style={{ fontSize: "12px", color: "#8E879B", margin: 0 }}>
                  💡 Puedes agregar campos adicionales después de crear el servicio
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
