"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";

// ── Types ─────────────────────────────────────────────────────────────────────

type FieldType = "text" | "number" | "date" | "select" | "boolean";
type AppliesTo = "client" | "appointment";

interface CustomField {
  id: string;
  name: string;
  field_key: string;
  field_type: FieldType;
  applies_to: AppliesTo;
  required: boolean;
  options: string[];
  position: number;
  active: boolean;
}

interface ClientFieldValue {
  client_id: string;
  client_name: string;
  field_id: string;
  value: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<FieldType, string> = {
  text: "Texto libre",
  number: "Número",
  date: "Fecha",
  select: "Lista desplegable",
  boolean: "Sí / No",
};

const TYPE_ICONS: Record<FieldType, string> = {
  text: "T",
  number: "#",
  date: "D",
  select: "≡",
  boolean: "✓",
};

function slugify(name: string) {
  return name.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

const EMPTY_FORM = {
  name: "",
  field_type: "text" as FieldType,
  applies_to: "client" as AppliesTo,
  required: false,
  options: "",
  active: true,
};

// ── Main ──────────────────────────────────────────────────────────────────────

export default function CustomFieldsPage() {
  const { tenantId } = useAdmin();
  const [tab, setTab] = useState<"fields" | "values">("fields");
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<CustomField | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Values tab
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [clientValues, setClientValues] = useState<Record<string, string>>({});
  const [loadingValues, setLoadingValues] = useState(false);
  const [savingValues, setSavingValues] = useState(false);
  const [valuesSaved, setValuesSaved] = useState(false);

  const loadFields = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data } = await supabase
      .from("custom_fields")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("position");
    setFields((data ?? []).map((f: any) => ({
      ...f,
      options: Array.isArray(f.options) ? f.options : [],
    })));
    setLoading(false);
  }, [tenantId]);

  const loadClients = useCallback(async () => {
    if (!tenantId) return;
    const { data } = await supabase
      .from("clients")
      .select("id, name")
      .eq("tenant_id", tenantId)
      .order("name");
    setClients(data ?? []);
  }, [tenantId]);

  useEffect(() => { loadFields(); loadClients(); }, [loadFields, loadClients]);

  async function loadClientValues(clientId: string) {
    setLoadingValues(true);
    setValuesSaved(false);
    const { data } = await supabase
      .from("client_field_values")
      .select("field_id, value")
      .eq("client_id", clientId);
    const map: Record<string, string> = {};
    (data ?? []).forEach((r: any) => { map[r.field_id] = r.value ?? ""; });
    setClientValues(map);
    setLoadingValues(false);
  }

  async function saveClientValues() {
    if (!selectedClient) return;
    setSavingValues(true);
    const clientFields = fields.filter(f => f.applies_to === "client" && f.active);
    const upserts = clientFields.map(f => ({
      tenant_id: tenantId,
      client_id: selectedClient,
      field_id: f.id,
      field_key: f.field_key,
      value: clientValues[f.id] ?? null,
    }));
    await supabase.from("client_field_values").upsert(upserts, { onConflict: "client_id,field_id" });
    setSavingValues(false);
    setValuesSaved(true);
    setTimeout(() => setValuesSaved(false), 2500);
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModal(true);
  }

  function openEdit(f: CustomField) {
    setEditing(f);
    setForm({
      name: f.name,
      field_type: f.field_type,
      applies_to: f.applies_to,
      required: f.required,
      options: f.options.join("\n"),
      active: f.active,
    });
    setError(null);
    setModal(true);
  }

  async function save() {
    setError(null);
    if (!form.name.trim()) { setError("El nombre es obligatorio."); return; }
    setSaving(true);
    const payload = {
      tenant_id: tenantId,
      name: form.name.trim(),
      field_key: slugify(form.name),
      field_type: form.field_type,
      applies_to: form.applies_to,
      required: form.required,
      options: form.field_type === "select"
        ? form.options.split("\n").map(o => o.trim()).filter(Boolean)
        : [],
      active: form.active,
      position: editing ? editing.position : fields.length,
    };
    if (editing) {
      await supabase.from("custom_fields").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("custom_fields").insert(payload);
    }
    setSaving(false);
    setModal(false);
    loadFields();
  }

  async function toggleActive(f: CustomField) {
    await supabase.from("custom_fields").update({ active: !f.active }).eq("id", f.id);
    loadFields();
  }

  async function deleteField(f: CustomField) {
    if (!confirm(`¿Eliminar el campo "${f.name}"? Se borrarán todos sus valores.`)) return;
    await supabase.from("custom_fields").delete().eq("id", f.id);
    loadFields();
  }

  async function moveField(f: CustomField, dir: -1 | 1) {
    const idx = fields.findIndex(x => x.id === f.id);
    const other = fields[idx + dir];
    if (!other) return;
    await Promise.all([
      supabase.from("custom_fields").update({ position: other.position }).eq("id", f.id),
      supabase.from("custom_fields").update({ position: f.position }).eq("id", other.id),
    ]);
    loadFields();
  }

  const clientFields = fields.filter(f => f.applies_to === "client" && f.active);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#14111C", margin: 0 }}>Campos Personalizados</h1>
          <p style={{ color: "#564E66", fontSize: 14, margin: "4px 0 0" }}>Define campos adicionales para clientes y citas</p>
        </div>
        {tab === "fields" && (
          <button onClick={openCreate} style={btnPrimary}>+ Nuevo campo</button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid rgba(20,15,30,0.08)" }}>
        {(["fields", "values"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "9px 18px", borderRadius: "8px 8px 0 0", border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 600,
            background: tab === t ? "#14111C" : "transparent",
            color: tab === t ? "#fb0f05" : "#564E66",
            borderBottom: tab === t ? "2px solid #fb0f05" : "2px solid transparent",
            marginBottom: -1,
          }}>
            {t === "fields" ? "Campos" : "Valores por cliente"}
          </button>
        ))}
      </div>

      {/* Tab: Fields */}
      {tab === "fields" && (
        <>
          {loading ? (
            <div style={{ textAlign: "center", padding: 60, color: "#8E879B" }}>Cargando...</div>
          ) : fields.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🗂️</div>
              <div style={{ fontWeight: 700, color: "#3a3548", marginBottom: 4 }}>Sin campos aún</div>
              <div style={{ fontSize: 13, color: "#8E879B" }}>Crea tu primer campo personalizado</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {fields.map((f, i) => (
                <div key={f.id} style={{
                  background: "white", borderRadius: 14, padding: "16px 20px",
                  border: `1px solid ${f.active ? "rgba(20,15,30,0.08)" : "rgba(20,15,30,0.04)"}`,
                  opacity: f.active ? 1 : 0.6,
                  display: "flex", alignItems: "center", gap: 14,
                }}>
                  {/* Type icon */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, background: "rgba(20,15,30,0.025)",
                    border: "1px solid rgba(20,15,30,0.08)", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#fb0f05",
                    flexShrink: 0,
                  }}>
                    {TYPE_ICONS[f.field_type]}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: "#14111C" }}>{f.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: f.applies_to === "client" ? "rgba(99,102,241,.1)" : "rgba(251,191,36,.15)", color: f.applies_to === "client" ? "#6366f1" : "#d97706" }}>
                        {f.applies_to === "client" ? "Cliente" : "Cita"}
                      </span>
                      {f.required && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(248,113,113,.1)", color: "#f87171" }}>Obligatorio</span>}
                      {!f.active && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "rgba(20,15,30,0.04)", color: "#8E879B" }}>Inactivo</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "#8E879B", marginTop: 2 }}>
                      {TYPE_LABELS[f.field_type]}
                      {f.field_type === "select" && f.options.length > 0 && ` · ${f.options.join(", ")}`}
                      <span style={{ color: "rgba(20,15,30,0.15)", marginLeft: 8 }}>clave: {f.field_key}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => moveField(f, -1)} disabled={i === 0}
                      style={{ ...btnIcon, opacity: i === 0 ? 0.3 : 1 }} title="Subir">↑</button>
                    <button onClick={() => moveField(f, 1)} disabled={i === fields.length - 1}
                      style={{ ...btnIcon, opacity: i === fields.length - 1 ? 0.3 : 1 }} title="Bajar">↓</button>
                    <button onClick={() => openEdit(f)} style={btnIcon}>✏️</button>
                    <button onClick={() => toggleActive(f)}
                      style={{ ...btnIcon, color: f.active ? "#fb0f05" : "#8E879B" }}
                      title={f.active ? "Desactivar" : "Activar"}>
                      {f.active ? "●" : "○"}
                    </button>
                    <button onClick={() => deleteField(f)}
                      style={{ ...btnIcon, color: "#f87171" }} title="Eliminar">🗑</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab: Values */}
      {tab === "values" && (
        <div>
          <div style={{ background: "white", borderRadius: 14, padding: 20, border: "1px solid rgba(20,15,30,0.08)", marginBottom: 20 }}>
            <label style={lbl}>Seleccionar cliente</label>
            <select value={selectedClient} onChange={e => {
              setSelectedClient(e.target.value);
              if (e.target.value) loadClientValues(e.target.value);
              else setClientValues({});
            }} style={inp}>
              <option value="">— Elige un cliente —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {selectedClient && (
            <div style={{ background: "white", borderRadius: 14, padding: 24, border: "1px solid rgba(20,15,30,0.08)" }}>
              {loadingValues ? (
                <div style={{ textAlign: "center", padding: 40, color: "#8E879B" }}>Cargando...</div>
              ) : clientFields.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "#8E879B" }}>
                  No hay campos de tipo "Cliente" activos. Crea campos en la pestaña Campos.
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
                    {clientFields.map(f => (
                      <div key={f.id}>
                        <label style={lbl}>
                          {f.name}
                          {f.required && <span style={{ color: "#f87171", marginLeft: 4 }}>*</span>}
                          <span style={{ fontWeight: 400, color: "rgba(20,15,30,0.15)", marginLeft: 6, textTransform: "none" }}>({TYPE_LABELS[f.field_type]})</span>
                        </label>
                        {f.field_type === "boolean" ? (
                          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                            <input type="checkbox"
                              checked={clientValues[f.id] === "true"}
                              onChange={e => setClientValues(v => ({ ...v, [f.id]: e.target.checked ? "true" : "false" }))}
                              style={{ accentColor: "#fb0f05", width: 16, height: 16 }} />
                            <span style={{ fontSize: 13, color: "#564E66" }}>Sí</span>
                          </label>
                        ) : f.field_type === "select" ? (
                          <select value={clientValues[f.id] ?? ""} onChange={e => setClientValues(v => ({ ...v, [f.id]: e.target.value }))} style={inp}>
                            <option value="">— Seleccionar —</option>
                            {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input
                            type={f.field_type === "number" ? "number" : f.field_type === "date" ? "date" : "text"}
                            value={clientValues[f.id] ?? ""}
                            onChange={e => setClientValues(v => ({ ...v, [f.id]: e.target.value }))}
                            style={inp}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button onClick={saveClientValues} disabled={savingValues} style={btnPrimary}>
                      {savingValues ? "Guardando..." : "Guardar valores"}
                    </button>
                    {valuesSaved && <span style={{ fontSize: 13, color: "#22c55e", fontWeight: 600 }}>¡Guardado!</span>}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal create/edit */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(12,12,20,0.45)", backdropFilter: "blur(16px) saturate(1.4)", WebkitBackdropFilter: "blur(16px) saturate(1.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(32px) saturate(1.6)", WebkitBackdropFilter: "blur(32px) saturate(1.6)", border: "1px solid rgba(255,255,255,0.7)", borderRadius: 20, padding: 28, maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 700, color: "#14111C" }}>
              {editing ? "Editar campo" : "Nuevo campo personalizado"}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={lbl}>Nombre del campo</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ej: Tipo de cabello, Alergia, Preferencia..." style={inp} />
                {form.name && <div style={{ fontSize: 11, color: "#8E879B", marginTop: 4 }}>Clave: {slugify(form.name)}</div>}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>Tipo de campo</label>
                  <select value={form.field_type} onChange={e => setForm(f => ({ ...f, field_type: e.target.value as FieldType }))} style={inp}>
                    {(Object.entries(TYPE_LABELS) as [FieldType, string][]).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Aplica a</label>
                  <select value={form.applies_to} onChange={e => setForm(f => ({ ...f, applies_to: e.target.value as AppliesTo }))} style={inp}>
                    <option value="client">Cliente</option>
                    <option value="appointment">Cita</option>
                  </select>
                </div>
              </div>

              {form.field_type === "select" && (
                <div>
                  <label style={lbl}>Opciones (una por línea)</label>
                  <textarea value={form.options} onChange={e => setForm(f => ({ ...f, options: e.target.value }))}
                    placeholder={"Liso\nRizado\nOndulado\nAfro"}
                    style={{ ...inp, minHeight: 90, resize: "vertical" }} />
                </div>
              )}

              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={form.required} onChange={e => setForm(f => ({ ...f, required: e.target.checked }))}
                  style={{ accentColor: "#fb0f05", width: 16, height: 16 }} />
                <span style={{ fontSize: 13, color: "#564E66" }}>Campo obligatorio</span>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                  style={{ accentColor: "#fb0f05", width: 16, height: 16 }} />
                <span style={{ fontSize: 13, color: "#564E66" }}>Campo activo</span>
              </label>
            </div>

            {error && (
              <div style={{ background: "rgba(248,113,113,.1)", color: "#f87171", borderRadius: 8, padding: "8px 12px", fontSize: 13, marginTop: 12 }}>{error}</div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button onClick={() => setModal(false)} style={btnSecondary}>Cancelar</button>
              <button onClick={save} disabled={saving} style={btnPrimary}>
                {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear campo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const lbl: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700, color: "#564E66",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em",
};
const inp: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(20,15,30,0.08)",
  background: "rgba(20,15,30,0.025)", color: "#14111C", fontSize: 14, boxSizing: "border-box",
  fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif", outline: "none",
};
const btnPrimary: React.CSSProperties = {
  padding: "9px 20px", borderRadius: 10, border: "none",
  background: "linear-gradient(135deg, #fb0f05, #ff6b35)",
  color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer",
};
const btnSecondary: React.CSSProperties = {
  padding: "9px 20px", borderRadius: 10, border: "1px solid rgba(20,15,30,0.08)",
  background: "transparent", color: "#564E66", fontWeight: 600, fontSize: 14, cursor: "pointer",
};
const btnIcon: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(20,15,30,0.08)",
  background: "rgba(20,15,30,0.025)", color: "#564E66", fontSize: 13, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
};
