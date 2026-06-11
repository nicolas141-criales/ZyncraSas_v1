"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";
import { IconUserGroup, IconPlus, IconX } from "../ZyncraIcons";

interface Client {
  id: string; tenant_id: string; name: string; phone: string; email: string | null;
}

interface Segments { nuevos: number; recurrentes: number; perdidos: number; }

const EMPTY_FORM = { name: "", phone: "", email: "" };
const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, "");
  if (!d) return "";
  return d.startsWith("57") ? `+${d}` : `+57${d}`;
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ["#fb0f05","#0027fe","#0027fe","#10b981","#f59e0b","#ec4899"];
const avatarColor = (id: string) => AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];

const inp: React.CSSProperties = {
  width: "100%", padding: "11px 14px", border: "1.5px solid rgba(20,15,30,0.08)",
  borderRadius: "11px", fontSize: "14px", background: "rgba(20,15,30,0.025)",
  color: "#14111C", boxSizing: "border-box",
  fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif", outline: "none",
};
const lbl: React.CSSProperties = {
  display: "block", fontWeight: 600, fontSize: "11px", color: "#564E66",
  marginBottom: "7px", textTransform: "uppercase", letterSpacing: "0.06em",
};

export default function ClientsPage() {
  const { tenantId } = useAdmin();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [segments, setSegments] = useState<Segments>({ nuevos: 0, recurrentes: 0, perdidos: 0 });

  const fetchClients = useCallback(async (tid: string) => {
    const [{ data }, { data: aptsData }] = await Promise.all([
      supabase.from("clients").select("id,tenant_id,name,phone,email").eq("tenant_id", tid).order("name"),
      supabase.from("appointments").select("client_id,appointment_date").eq("tenant_id", tid).not("status", "eq", "cancelled"),
    ]);
    if (data) setClients(data);
    if (data && aptsData) {
      const thirtyDAgo = toISO(new Date(Date.now() - 30 * 86400000));
      const sixtyDAgo  = toISO(new Date(Date.now() - 60 * 86400000));
      const lastByClient: Record<string, string> = {};
      (aptsData as any[]).forEach((a: any) => {
        if (!lastByClient[a.client_id] || a.appointment_date > lastByClient[a.client_id])
          lastByClient[a.client_id] = a.appointment_date;
      });
      let nuevos = 0, recurrentes = 0, perdidos = 0;
      data.forEach(c => {
        const last = lastByClient[c.id];
        if (last && last >= thirtyDAgo) recurrentes++;
        else if (last && last < sixtyDAgo) perdidos++;
        else nuevos++;
      });
      setSegments({ nuevos, recurrentes, perdidos });
    }
  }, []);

  useEffect(() => {
    if (tenantId) { setLoading(true); fetchClients(tenantId).then(() => setLoading(false)); }
  }, [tenantId, fetchClients]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setError(null); setShowModal(true); };
  const openEdit = (c: Client) => { setEditing(c); setForm({ name: c.name, phone: c.phone, email: c.email ?? "" }); setError(null); setShowModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setSaving(true); setError(null);
    const payload = { tenant_id: tenantId, name: form.name.trim(), phone: formatPhone(form.phone), email: form.email.trim() || null };

    if (editing) {
      const { error: err } = await supabase.from("clients").update(payload).eq("id", editing.id);
      if (err) { setError(err.message); setSaving(false); return; }
      setClients(prev => prev.map(c => c.id === editing.id ? { ...c, ...payload } : c));
    } else {
      const { data, error: err } = await supabase.from("clients").insert(payload).select("id,tenant_id,name,phone,email").single();
      if (err) { setError(err.message); setSaving(false); return; }
      if (data) setClients(prev => [...prev, data]);
    }
    setSaving(false); setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este cliente?")) return;
    await supabase.from("clients").delete().eq("id", id);
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    (c.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "14px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05", flexShrink: 0 }}>
            <IconUserGroup size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#14111C", letterSpacing: "-0.5px", margin: 0 }}>Clientes</h1>
            <p style={{ color: "#8E879B", fontSize: "13px", marginTop: "2px" }}>
              {clients.length} cliente{clients.length !== 1 ? "s" : ""} registrados
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8E879B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...inp, paddingLeft: "36px", width: "220px" }}
            />
          </div>
          <button className="btn-primary" onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <IconPlus size={15} color="white" /> Nuevo cliente
          </button>
        </div>
      </div>

      {/* Segmentación */}
      {!loading && clients.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px", marginBottom: "20px" }}>
          {[
            { label: "Nuevos", sub: "Primera vez", value: segments.nuevos, color: "#0027fe", bg: "rgba(0,39,254,0.07)", dot: "#0027fe" },
            { label: "Recurrentes", sub: "Últimos 30 días", value: segments.recurrentes, color: "#10b981", bg: "rgba(16,185,129,0.07)", dot: "#10b981" },
            { label: "Perdidos", sub: "Más de 60 días", value: segments.perdidos, color: "#ef4444", bg: "rgba(239,68,68,0.07)", dot: "#ef4444" },
          ].map(s => (
            <div key={s.label} style={{ background: "white", border: "1px solid rgba(20,15,30,0.08)", borderRadius: "16px", padding: "16px 18px", display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: 40, height: 40, borderRadius: "12px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: s.dot, display: "block" }} />
              </div>
              <div>
                <div style={{ fontSize: "22px", fontWeight: 700, color: "#14111C", letterSpacing: "-0.6px", lineHeight: 1, fontFamily: "var(--font-jetbrains-mono),'JetBrains Mono',monospace" }}>{s.value}</div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: s.color, marginTop: "3px" }}>{s.label}</div>
                <div style={{ fontSize: "11px", color: "#8E879B", marginTop: "1px" }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      <div style={{ background: "white", border: "1px solid rgba(20,15,30,0.08)", borderRadius: "18px", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#8E879B", fontSize: "14px" }}>Cargando clientes...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "64px 32px", textAlign: "center" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "18px", background: "rgba(251,15,5,0.07)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05", margin: "0 auto 16px" }}>
              <IconUserGroup size={26} />
            </div>
            <div style={{ fontWeight: 700, fontSize: "16px", color: "#14111C", marginBottom: "6px" }}>
              {search ? "Sin resultados" : "Aún no hay clientes"}
            </div>
            <p style={{ color: "#8E879B", fontSize: "14px", marginBottom: "24px" }}>
              {search ? `No encontramos clientes para "${search}"` : "Los clientes aparecen aquí cuando agendan citas o los agregas manualmente."}
            </p>
            {!search && (
              <button className="btn-primary" onClick={openCreate}>Añadir primer cliente</button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", padding: "12px 20px", borderBottom: "1px solid #f0eeeb", background: "rgba(20,15,30,0.025)" }}>
              {["Cliente","Teléfono","Correo","Acciones"].map(h => (
                <div key={h} style={{ fontSize: "9.5px", fontWeight: 600, color: "#8E879B", textTransform: "uppercase", letterSpacing: "0.09em", fontFamily: "var(--font-jetbrains-mono),'JetBrains Mono',monospace" }}>{h}</div>
              ))}
            </div>

            {filtered.map((c, idx) => (
              <div key={c.id}
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", padding: "14px 20px", borderBottom: idx < filtered.length - 1 ? "1px solid #f7f5f2" : "none", alignItems: "center", transition: "background 0.1s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#fafaf8")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: `linear-gradient(135deg, ${avatarColor(c.id)}, ${avatarColor(c.id)}aa)`, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "12px", flexShrink: 0 }}>
                    {initials(c.name)}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: "14px", color: "#14111C" }}>{c.name}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "13px", color: "#564E66" }}>{c.phone}</span>
                  <a href={`https://wa.me/${c.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", padding: "3px 7px", borderRadius: "6px", background: "rgba(37,211,102,0.1)", color: "#25D366", fontSize: "11px", fontWeight: 700, textDecoration: "none" }}>
                    WA
                  </a>
                </div>

                <span style={{ fontSize: "13px", color: "#564E66" }}>{c.email || <span style={{ color: "#d0ceca" }}>—</span>}</span>

                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={() => openEdit(c)}
                    style={{ padding: "6px 12px", borderRadius: "8px", border: "1.5px solid rgba(20,15,30,0.08)", background: "white", color: "#3a3548", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif", transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#fb0f05"; e.currentTarget.style.color = "#fb0f05"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(20,15,30,0.08)"; e.currentTarget.style.color = "#3a3548"; }}>
                    Editar
                  </button>
                  <button onClick={() => handleDelete(c.id)}
                    style={{ padding: "6px 12px", borderRadius: "8px", border: "none", background: "rgba(239,68,68,0.07)", color: "#ef4444", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.14)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(239,68,68,0.07)")}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(12,12,20,0.45)", backdropFilter: "blur(16px) saturate(1.4)", WebkitBackdropFilter: "blur(16px) saturate(1.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(32px) saturate(1.6)", WebkitBackdropFilter: "blur(32px) saturate(1.6)", border: "1px solid rgba(255,255,255,0.7)", borderRadius: "22px", padding: "28px", width: "100%", maxWidth: "440px", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05" }}>
                  <IconUserGroup size={17} />
                </div>
                <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#14111C" }}>
                  {editing ? "Editar cliente" : "Nuevo cliente"}
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8E879B" }}>
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label style={lbl}>Nombre completo *</label>
                <input required autoFocus value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej. María García" style={inp} />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={lbl}>Teléfono * <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(sin +57)</span></label>
                <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="3001234567" style={inp} />
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={lbl}>Correo electrónico <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(opcional)</span></label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="maria@email.com" style={inp} />
              </div>

              {error && (
                <div style={{ background: "#fff0f0", border: "1px solid rgba(251,15,5,0.2)", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#d90d04", marginBottom: "16px", fontWeight: 500 }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
