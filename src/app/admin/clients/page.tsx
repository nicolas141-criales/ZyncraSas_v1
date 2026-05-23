"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "../admin.module.css";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";

interface Client {
  id: string;
  tenant_id: string;
  name: string;
  phone: string;
  email: string | null;
}

const EMPTY_FORM = { name: "", phone: "", email: "" };

function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("57")) return `+${digits}`;
  return `+57${digits}`;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const { tenantId } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async (tid: string) => {
    const { data, error } = await supabase
      .from("clients")
      .select("id, tenant_id, name, phone, email")
      .eq("tenant_id", tid)
      .order("name", { ascending: true });
    if (!error && data) setClients(data);
  }, []);

  useEffect(() => {
    if (tenantId) {
      setLoading(true);
      fetchClients(tenantId).then(() => setLoading(false));
    }
  }, [tenantId, fetchClients]);

  const openCreate = () => {
    setEditingClient(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowModal(true);
  };

  const openEdit = (c: Client) => {
    setEditingClient(c);
    setForm({ name: c.name, phone: c.phone, email: c.email ?? "" });
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setSaving(true);
    setError(null);

    const payload = {
      tenant_id: tenantId,
      name: form.name.trim(),
      phone: formatPhone(form.phone),
      email: form.email.trim() || null,
    };

    if (editingClient) {
      const { error: err } = await supabase.from("clients").update(payload).eq("id", editingClient.id);
      if (err) { setError(err.message); setSaving(false); return; }
      setClients(prev => prev.map(c => c.id === editingClient.id ? { ...c, ...payload } : c));
    } else {
      const { data, error: err } = await supabase
        .from("clients")
        .insert(payload)
        .select("id, tenant_id, name, phone, email")
        .single();
      if (err) { setError(err.message); setSaving(false); return; }
      if (data) setClients(prev => [...prev, data]);
    }

    setSaving(false);
    setShowModal(false);
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
          <h1 style={{ fontSize: "24px", fontWeight: 700 }}>Base de Clientes (CRM)</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            {clients.length} cliente{clients.length !== 1 ? "s" : ""} registrados
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, width: "260px" }}
          />
          <button className="btn-primary" onClick={openCreate}>+ Nuevo Cliente</button>
        </div>
      </div>

      <div className={styles.listCard} style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div style={{ padding: "var(--spacing-2xl)", textAlign: "center", color: "var(--text-secondary)" }}>
              Cargando clientes...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "var(--spacing-2xl)", textAlign: "center", color: "var(--text-secondary)" }}>
              {search ? "Sin resultados para tu búsqueda." : "No hay clientes. ¡Añade el primero!"}
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: "500px" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-base)", borderBottom: "1px solid var(--border-light)" }}>
                  {["Nombre", "Teléfono", "Email", "Acciones"].map(h => (
                    <th key={h} style={{ padding: "var(--spacing-md)", fontWeight: 600, color: "var(--text-secondary)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(client => (
                  <tr key={client.id}
                    style={{ borderBottom: "1px solid var(--border-light)", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--bg-base)")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "var(--spacing-md)", fontWeight: 600 }}>{client.name}</td>
                    <td style={{ padding: "var(--spacing-md)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{client.phone}</td>
                    <td style={{ padding: "var(--spacing-md)", color: "var(--text-secondary)" }}>{client.email || "—"}</td>
                    <td style={{ padding: "var(--spacing-md)" }}>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <button onClick={() => openEdit(client)} style={{ background: "none", border: "none", color: "#fb0f05", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
                          Editar
                        </button>
                        <button onClick={() => handleDelete(client.id)} style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
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
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{ background: "var(--surface)", borderRadius: "var(--radius-lg)", padding: "32px", width: "100%", maxWidth: "440px", boxShadow: "var(--shadow-level-3)" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "24px" }}>
              {editingClient ? "Editar Cliente" : "Nuevo Cliente"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>Nombre completo *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej. Juan Pérez" style={inputStyle} />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>Teléfono * (+57)</label>
                <input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="3001234567" style={inputStyle} />
              </div>
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: "13px", marginBottom: "6px" }}>Correo electrónico</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="juan@ejemplo.com" style={inputStyle} />
              </div>
              {error && <p style={{ color: "var(--error)", fontSize: "13px", marginBottom: "16px" }}>❌ {error}</p>}
              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Guardando..." : editingClient ? "Guardar Cambios" : "Crear Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
