"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  description: string | null;
  features: string[];
  active: boolean;
  subscribers: number;
  created_at: string;
}

function fmt(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

const EMPTY_PLAN = { name: "", price: "", billing_cycle: "monthly", description: "", features: "", active: true };

export default function PlatformPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState(EMPTY_PLAN);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: plansData }, { data: subsData }] = await Promise.all([
      supabase.from("saas_plans").select("*").order("price"),
      supabase.from("saas_subscriptions").select("plan_id, status").eq("status", "active"),
    ]);

    const subCountMap = new Map<string, number>();
    (subsData ?? []).forEach((s: any) => {
      if (s.plan_id) subCountMap.set(s.plan_id, (subCountMap.get(s.plan_id) ?? 0) + 1);
    });

    setPlans(
      (plansData ?? []).map((p: any) => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : [],
        subscribers: subCountMap.get(p.id) ?? 0,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_PLAN);
    setError(null);
    setModal(true);
  }

  function openEdit(p: Plan) {
    setEditing(p);
    setForm({
      name: p.name,
      price: String(p.price),
      billing_cycle: p.billing_cycle,
      description: p.description ?? "",
      features: Array.isArray(p.features) ? p.features.join("\n") : "",
      active: p.active,
    });
    setError(null);
    setModal(true);
  }

  async function save() {
    setError(null);
    if (!form.name.trim()) { setError("El nombre es obligatorio."); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      price: Number(form.price) || 0,
      billing_cycle: form.billing_cycle,
      description: form.description || null,
      features: form.features.split("\n").map(f => f.trim()).filter(Boolean),
      active: form.active,
    };
    if (editing) {
      await supabase.from("saas_plans").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("saas_plans").insert(payload);
    }
    setSaving(false);
    setModal(false);
    load();
  }

  const totalMRR = plans.reduce((s, p) => s + p.price * p.subscribers, 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>Planes</h1>
          <p style={{ color: "#475569", fontSize: 14, margin: "4px 0 0" }}>Configura los planes de suscripción de Zyncra</p>
        </div>
        <button onClick={openCreate}
          style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "#7c3aed", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          + Nuevo plan
        </button>
      </div>

      {/* MRR banner */}
      <div style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(99,102,241,0.1))", borderRadius: 16, padding: "20px 24px", marginBottom: 24, border: "1px solid rgba(124,58,237,0.2)", display: "flex", gap: 40 }}>
        <div>
          <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>MRR Estimado</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9" }}>{fmt(totalMRR)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Planes activos</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9" }}>{plans.filter(p => p.active).length}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Suscriptores activos</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#f1f5f9" }}>{plans.reduce((s, p) => s + p.subscribers, 0)}</div>
        </div>
      </div>

      {/* Plans grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>Cargando...</div>
      ) : plans.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <div style={{ fontWeight: 700, color: "#64748b", marginBottom: 4 }}>Sin planes aún</div>
          <div style={{ fontSize: 13 }}>Crea tu primer plan de suscripción</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {plans.map(p => (
            <div key={p.id} style={{ background: "#1e293b", borderRadius: 16, padding: 24, border: `1px solid ${p.active ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.05)"}`, opacity: p.active ? 1 : 0.6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#f1f5f9" }}>{p.name}</div>
                  {!p.active && <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Inactivo</span>}
                </div>
                <button onClick={() => openEdit(p)}
                  style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid #334155", background: "transparent", color: "#a78bfa", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Editar
                </button>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#a78bfa", marginBottom: 4 }}>{fmt(p.price)}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>/{p.billing_cycle === "monthly" ? "mes" : "año"}</div>
              {p.description && <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 14px" }}>{p.description}</p>}
              {p.features.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  {p.features.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0", fontSize: 13, color: "#94a3b8" }}>
                      <span style={{ color: "#34d399", fontSize: 12 }}>✓</span> {f}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>Suscriptores activos</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#34d399" }}>{p.subscribers}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "#1e293b", borderRadius: 20, padding: 28, maxWidth: 460, width: "100%", border: "1px solid #334155", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 800, color: "#f1f5f9" }}>
              {editing ? "Editar plan" : "Nuevo plan"}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={lbl}>Nombre del plan</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Starter, Pro, Enterprise..." style={inp} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={lbl}>Precio (COP)</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Ciclo</label>
                  <select value={form.billing_cycle} onChange={e => setForm(f => ({ ...f, billing_cycle: e.target.value }))} style={inp}>
                    <option value="monthly">Mensual</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={lbl}>Descripción</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ideal para negocios pequeños..." style={inp} />
              </div>
              <div>
                <label style={lbl}>Características (una por línea)</label>
                <textarea value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))}
                  placeholder={"Agenda ilimitada\nMarketing WhatsApp\nFactura Electrónica"}
                  style={{ ...inp, minHeight: 100, resize: "vertical" }} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                  style={{ accentColor: "#7c3aed", width: 16, height: 16 }} />
                <span style={{ fontSize: 13, color: "#94a3b8" }}>Plan activo (visible para nuevos clientes)</span>
              </label>
            </div>
            {error && <div style={{ background: "rgba(248,113,113,.15)", color: "#f87171", borderRadius: 8, padding: "8px 12px", fontSize: 13, marginTop: 12 }}>{error}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button onClick={() => setModal(false)} style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid #334155", background: "transparent", color: "#64748b", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancelar</button>
              <button onClick={save} disabled={saving} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "#7c3aed", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const lbl: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700, color: "#64748b",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em",
};
const inp: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #334155",
  background: "#0f172a", color: "#e2e8f0", fontSize: 14, boxSizing: "border-box",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};
