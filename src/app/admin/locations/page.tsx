"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";
import { IconMapPin, IconPlus, IconPencil, IconTrash, IconCheck, IconX } from "../ZyncraIcons";

interface LocationAdmin {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  invited_at: string;
  accepted_at: string | null;
}

interface Location {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

const EMPTY_FORM = { name: "", address: "", phone: "" };

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} style={{
      width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", padding: 2,
      background: checked ? "#fb0f05" : "rgba(20,15,30,0.1)",
      display: "flex", alignItems: "center",
      justifyContent: checked ? "flex-end" : "flex-start",
      transition: "background .2s", flexShrink: 0,
    }}>
      <span style={{ width: 20, height: 20, borderRadius: "50%", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.18)", display: "block" }} />
    </button>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#564E66", display: "block", marginBottom: 5 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "9px 12px", borderRadius: 10, fontSize: 14,
          border: "1.5px solid rgba(20,15,30,0.1)", background: "white", color: "#14111C",
          fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif", outline: "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

export default function LocationsPage() {
  const { tenantId, setLocationId, locationId } = useAdmin();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  // Admins de sede
  const [adminsMap, setAdminsMap] = useState<Record<string, LocationAdmin[]>>({});
  const [invitingLocId, setInvitingLocId] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState({ email: "", name: "" });
  const [inviteSaving, setInviteSaving] = useState(false);

  const showToast = (text: string, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    if (!tenantId) return;
    const { data } = await supabase
      .from("locations")
      .select("id, name, address, phone, is_active, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at");
    const locs: Location[] = data ?? [];
    setLocations(locs);

    // Cargar admins de cada sede
    if (locs.length > 0) {
      const { data: admins } = await supabase
        .from("location_admins")
        .select("id, location_id, email, name, is_active, invited_at, accepted_at")
        .eq("tenant_id", tenantId)
        .order("invited_at");
      const map: Record<string, LocationAdmin[]> = {};
      for (const a of (admins ?? []) as any[]) {
        if (!map[a.location_id]) map[a.location_id] = [];
        map[a.location_id].push(a);
      }
      setAdminsMap(map);
    }

    setLoading(false);
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setForm(EMPTY_FORM);
    setEditingId("new");
  }

  function openEdit(loc: Location) {
    setForm({ name: loc.name, address: loc.address ?? "", phone: loc.phone ?? "" });
    setEditingId(loc.id);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave() {
    if (!form.name.trim()) { showToast("El nombre es obligatorio.", false); return; }
    setSaving(true);
    if (editingId === "new") {
      const { error } = await supabase.from("locations").insert({
        tenant_id: tenantId,
        name: form.name.trim(),
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
      });
      if (error) { showToast(error.message, false); }
      else { showToast("Sede creada."); }
    } else {
      const { error } = await supabase.from("locations").update({
        name: form.name.trim(),
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
      }).eq("id", editingId!);
      if (error) { showToast(error.message, false); }
      else { showToast("Sede actualizada."); }
    }
    setSaving(false);
    cancelEdit();
    load();
  }

  async function toggleActive(loc: Location) {
    const activeCount = locations.filter(l => l.is_active).length;
    if (loc.is_active && activeCount <= 1) {
      showToast("Debe quedar al menos una sede activa.", false);
      return;
    }
    await supabase.from("locations").update({ is_active: !loc.is_active }).eq("id", loc.id);
    // Si se desactiva la sede seleccionada, cambiar a otra activa
    if (loc.is_active && loc.id === locationId) {
      const next = locations.find(l => l.id !== loc.id && l.is_active);
      if (next) setLocationId(next.id);
    }
    load();
  }

  async function handleDelete(loc: Location) {
    const activeCount = locations.filter(l => l.is_active).length;
    if (loc.is_active && activeCount <= 1) {
      showToast("No puedes eliminar la única sede activa.", false);
      return;
    }
    setDeletingId(loc.id);
    const { error } = await supabase.from("locations").delete().eq("id", loc.id);
    if (error) showToast(error.message, false);
    else {
      if (loc.id === locationId) {
        const next = locations.find(l => l.id !== loc.id && l.is_active);
        if (next) setLocationId(next.id);
      }
      showToast("Sede eliminada.");
    }
    setDeletingId(null);
    load();
  }

  async function handleInvite(locId: string) {
    if (!inviteForm.email.trim()) { showToast("El email es obligatorio.", false); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setInviteSaving(true);
    const res = await fetch("/api/invite-location-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteForm.email,
        name: inviteForm.name,
        locationId: locId,
        tenantId,
        requestingUserId: session.user.id,
      }),
    });
    const json = await res.json();
    if (!res.ok) { showToast(json.error ?? "Error al invitar.", false); }
    else {
      showToast("Invitación enviada.");
      setInvitingLocId(null);
      setInviteForm({ email: "", name: "" });
      load();
    }
    setInviteSaving(false);
  }

  async function revokeAdmin(adminId: string) {
    await supabase.from("location_admins").update({ is_active: false }).eq("id", adminId);
    load();
  }

  const activeCount = locations.filter(l => l.is_active).length;

  return (
    <div style={{ fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif", display: "flex", flexDirection: "column", gap: 20, maxWidth: 680 }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 24, zIndex: 9999,
          padding: "11px 18px", borderRadius: 10,
          background: toast.ok ? "#f0fdf4" : "#fff1f0",
          border: `1px solid ${toast.ok ? "#bbf7d0" : "#fecaca"}`,
          color: toast.ok ? "#166534" : "#991b1b",
          fontSize: 13, fontWeight: 600,
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {toast.ok ? <IconCheck size={14} /> : <IconX size={14} />}
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05", flexShrink: 0 }}>
            <IconMapPin size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#14111C", letterSpacing: "-0.5px", margin: 0 }}>Sedes</h1>
            <p style={{ color: "#8E879B", fontSize: 13, marginTop: 2, marginBottom: 0 }}>
              {locations.length === 0 ? "Sin sedes registradas" : `${locations.length} sede${locations.length > 1 ? "s" : ""} — ${activeCount} activa${activeCount > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        {editingId !== "new" && (
          <button
            onClick={openNew}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer",
              background: "#fb0f05", color: "white", fontSize: 13, fontWeight: 700,
              fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif",
            }}
          >
            <IconPlus size={15} /> Nueva sede
          </button>
        )}
      </div>

      {/* Formulario nueva sede */}
      {editingId === "new" && (
        <div style={{ background: "white", border: "1.5px solid rgba(251,15,5,0.2)", borderRadius: 16, padding: "22px 24px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#14111C", marginBottom: 18 }}>Nueva sede</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Nombre *" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="Ej: Sede Norte, Local Centro…" />
            <Field label="Dirección" value={form.address} onChange={v => setForm(p => ({ ...p, address: v }))} placeholder="Calle 45 # 12-34, Bogotá" />
            <Field label="Teléfono" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} placeholder="3001234567" type="tel" />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
            <button onClick={cancelEdit} style={{ padding: "9px 18px", borderRadius: 10, border: "1.5px solid rgba(20,15,30,0.1)", background: "white", color: "#564E66", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving} style={{ padding: "9px 22px", borderRadius: 10, border: "none", background: "#fb0f05", color: "white", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, fontFamily: "inherit" }}>
              {saving ? "Guardando…" : "Crear sede"}
            </button>
          </div>
        </div>
      )}

      {/* Lista de sedes */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid rgba(20,15,30,0.08)", borderTopColor: "#fb0f05", animation: "znSpin .8s linear infinite" }} />
        </div>
      ) : locations.length === 0 ? (
        <div style={{ background: "white", border: "1px solid rgba(20,15,30,0.08)", borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📍</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#14111C", marginBottom: 6 }}>Sin sedes todavía</div>
          <div style={{ fontSize: 13, color: "#8E879B" }}>Crea tu primera sede con el botón de arriba.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {locations.map(loc => (
            <div key={loc.id}>
              {/* Tarjeta normal + Admins de sede */}
              {editingId !== loc.id && (() => {
                const admins = (adminsMap[loc.id] ?? []).filter(a => a.is_active);
                const isInviting = invitingLocId === loc.id;
                return (
                  <div style={{
                    background: "white",
                    border: loc.id === locationId
                      ? "1.5px solid rgba(251,15,5,0.3)"
                      : "1px solid rgba(20,15,30,0.08)",
                    borderRadius: 14,
                    overflow: "hidden",
                    opacity: loc.is_active ? 1 : 0.55,
                    transition: "opacity .2s",
                  }}>
                    {/* Fila principal: icono + info + acciones */}
                    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px" }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                        background: loc.id === locationId ? "rgba(251,15,5,0.08)" : "rgba(20,15,30,0.04)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: loc.id === locationId ? "#fb0f05" : "#8E879B",
                      }}>
                        <IconMapPin size={17} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: "#14111C" }}>{loc.name}</span>
                          {loc.id === locationId && (
                            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 20, background: "rgba(251,15,5,0.08)", color: "#fb0f05", border: "1px solid rgba(251,15,5,0.18)" }}>
                              Activa
                            </span>
                          )}
                          {!loc.is_active && (
                            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 20, background: "rgba(20,15,30,0.05)", color: "#8E879B", border: "1px solid rgba(20,15,30,0.1)" }}>
                              Inactiva
                            </span>
                          )}
                        </div>
                        {loc.address && <div style={{ fontSize: 12, color: "#8E879B", marginTop: 2 }}>{loc.address}</div>}
                        {loc.phone && <div style={{ fontSize: 12, color: "#8E879B" }}>{loc.phone}</div>}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                          <span style={{ fontSize: 10, color: "#8E879B", fontWeight: 500 }}>
                            {loc.is_active ? "Activa" : "Inactiva"}
                          </span>
                          <Toggle checked={loc.is_active} onChange={() => toggleActive(loc)} />
                        </div>
                        <button onClick={() => openEdit(loc)} title="Editar" style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid rgba(20,15,30,0.1)", background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#564E66" }}>
                          <IconPencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(loc)}
                          disabled={!!deletingId || (loc.is_active && activeCount <= 1)}
                          title={loc.is_active && activeCount <= 1 ? "No puedes eliminar la única sede activa" : "Eliminar"}
                          style={{
                            width: 34, height: 34, borderRadius: 8,
                            border: "1px solid rgba(248,113,113,0.25)",
                            background: "rgba(254,242,242,0.8)",
                            cursor: (loc.is_active && activeCount <= 1) ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#ef4444",
                            opacity: (loc.is_active && activeCount <= 1) ? 0.35 : 1,
                          }}
                        >
                          {deletingId === loc.id
                            ? <div style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #ef444455", borderTopColor: "#ef4444", animation: "znSpin .7s linear infinite" }} />
                            : <IconTrash size={14} />
                          }
                        </button>
                      </div>
                    </div>

                    {/* Admins de sede */}
                    <div style={{ borderTop: "1px solid rgba(20,15,30,0.06)", padding: "12px 20px 14px", background: "rgba(20,15,30,0.015)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: admins.length > 0 || isInviting ? 10 : 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#8E879B", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
                          Admins de sede
                        </span>
                        {!isInviting && (
                          <button
                            onClick={() => { setInvitingLocId(loc.id); setInviteForm({ email: "", name: "" }); }}
                            style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 7, border: "1px solid rgba(20,15,30,0.12)", background: "white", color: "#564E66", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                          >
                            <IconPlus size={11} /> Invitar
                          </button>
                        )}
                      </div>

                      {admins.map(a => (
                        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid rgba(20,15,30,0.04)" }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(251,15,5,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 700, color: "#fb0f05" }}>
                            {a.name.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#14111C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</div>
                            <div style={{ fontSize: 11, color: "#8E879B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.email}</div>
                          </div>
                          <span style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" as const,
                            padding: "2px 7px", borderRadius: 20, flexShrink: 0,
                            background: a.accepted_at ? "rgba(16,185,129,0.08)" : "rgba(20,15,30,0.05)",
                            color: a.accepted_at ? "#059669" : "#8E879B",
                            border: `1px solid ${a.accepted_at ? "rgba(16,185,129,0.2)" : "rgba(20,15,30,0.1)"}`,
                          }}>
                            {a.accepted_at ? "Activo" : "Pendiente"}
                          </span>
                          <button
                            onClick={() => revokeAdmin(a.id)}
                            title="Revocar acceso"
                            style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid rgba(248,113,113,0.25)", background: "rgba(254,242,242,0.8)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444", flexShrink: 0 }}
                          >
                            <IconX size={11} />
                          </button>
                        </div>
                      ))}

                      {admins.length === 0 && !isInviting && (
                        <p style={{ fontSize: 11, color: "rgba(20,15,30,0.3)", margin: 0, marginTop: 4 }}>Sin admins asignados.</p>
                      )}

                      {isInviting && (
                        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                          <Field label="Email *" value={inviteForm.email} onChange={v => setInviteForm(p => ({ ...p, email: v }))} placeholder="nombre@correo.com" type="email" />
                          <Field label="Nombre" value={inviteForm.name} onChange={v => setInviteForm(p => ({ ...p, name: v }))} placeholder="Nombre del admin" />
                          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                            <button onClick={() => setInvitingLocId(null)} style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid rgba(20,15,30,0.1)", background: "white", color: "#564E66", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                              Cancelar
                            </button>
                            <button onClick={() => handleInvite(loc.id)} disabled={inviteSaving} style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "#fb0f05", color: "white", fontSize: 12, fontWeight: 700, cursor: inviteSaving ? "not-allowed" : "pointer", opacity: inviteSaving ? 0.7 : 1, fontFamily: "inherit" }}>
                              {inviteSaving ? "Enviando…" : "Enviar invitación"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Formulario edición inline */}
              {editingId === loc.id && (
                <div style={{ background: "white", border: "1.5px solid rgba(251,15,5,0.2)", borderRadius: 14, padding: "20px 22px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#14111C", marginBottom: 16 }}>Editar sede</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                    <Field label="Nombre *" value={form.name} onChange={v => setForm(p => ({ ...p, name: v }))} placeholder="Nombre de la sede" />
                    <Field label="Dirección" value={form.address} onChange={v => setForm(p => ({ ...p, address: v }))} placeholder="Calle 45 # 12-34" />
                    <Field label="Teléfono" value={form.phone} onChange={v => setForm(p => ({ ...p, phone: v }))} placeholder="3001234567" type="tel" />
                  </div>
                  <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
                    <button onClick={cancelEdit} style={{ padding: "8px 16px", borderRadius: 9, border: "1.5px solid rgba(20,15,30,0.1)", background: "white", color: "#564E66", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      Cancelar
                    </button>
                    <button onClick={handleSave} disabled={saving} style={{ padding: "8px 20px", borderRadius: 9, border: "none", background: "#fb0f05", color: "white", fontSize: 13, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, fontFamily: "inherit" }}>
                      {saving ? "Guardando…" : "Guardar cambios"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tip informativo */}
      {locations.length > 0 && (
        <div style={{ background: "rgba(20,15,30,0.025)", border: "1px solid rgba(20,15,30,0.07)", borderRadius: 12, padding: "13px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>💡</span>
          <p style={{ fontSize: 12, color: "#8E879B", margin: 0, lineHeight: 1.6 }}>
            La sede <strong style={{ color: "#564E66" }}>activa</strong> en el selector del panel determina qué datos ves en calendario, caja, POS e inventario. Puedes cambiarla en cualquier momento desde la barra superior.
          </p>
        </div>
      )}
    </div>
  );
}
