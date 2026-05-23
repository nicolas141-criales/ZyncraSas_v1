"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  owner_email: string;
  created_at: string;
  subscription: {
    id: string;
    status: string;
    amount: number;
    plan_name: string;
    current_period_end: string | null;
    trial_ends_at: string | null;
    notes: string | null;
  } | null;
  usage: {
    clients: number;
    appointments: number;
    invoices: number;
  };
}

type StatusFilter = "all" | "active" | "trial" | "overdue" | "suspended";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    active:    { label: "Activo",     bg: "rgba(52,211,153,.15)",  color: "#34d399" },
    trial:     { label: "Trial",      bg: "rgba(251,191,36,.15)",  color: "#fbbf24" },
    overdue:   { label: "Vencido",    bg: "rgba(248,113,113,.15)", color: "#f87171" },
    suspended: { label: "Suspendido", bg: "rgba(148,163,184,.1)",  color: "#94a3b8" },
    cancelled: { label: "Cancelado",  bg: "rgba(148,163,184,.1)",  color: "#94a3b8" },
  };
  const s = map[status] ?? map.trial;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color, whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
}

const STATUS_OPTIONS = ["active", "trial", "overdue", "suspended", "cancelled"] as const;

// ── Main ──────────────────────────────────────────────────────────────────────

export default function PlatformClientsPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<TenantRow | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const loadTenants = useCallback(async () => {
    setLoading(true);

    const { data: subs } = await supabase
      .from("saas_subscriptions")
      .select("*, saas_plans(name), tenants(id, name, slug, created_at)");

    const { data: users } = await supabase
      .from("tenants")
      .select("id, owner_id");

    // For usage stats
    const { data: clientCounts } = await supabase
      .from("clients")
      .select("tenant_id");

    const { data: apptCounts } = await supabase
      .from("appointments")
      .select("tenant_id");

    const subsMap = new Map((subs ?? []).map((s: any) => [s.tenant_id, s]));
    const clientMap = new Map<string, number>();
    (clientCounts ?? []).forEach((c: any) => { clientMap.set(c.tenant_id, (clientMap.get(c.tenant_id) ?? 0) + 1); });
    const apptMap = new Map<string, number>();
    (apptCounts ?? []).forEach((a: any) => { apptMap.set(a.tenant_id, (apptMap.get(a.tenant_id) ?? 0) + 1); });

    // Get all tenants
    const { data: allTenants } = await supabase
      .from("tenants")
      .select("id, name, slug, created_at, owner_id")
      .order("created_at", { ascending: false });

    // Get owner emails from auth — use what we have
    const rows: TenantRow[] = (allTenants ?? []).map((t: any) => {
      const sub = subsMap.get(t.id);
      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        owner_email: t.owner_id ?? "",
        created_at: t.created_at,
        subscription: sub ? {
          id: sub.id,
          status: sub.status,
          amount: sub.amount ?? 0,
          plan_name: sub.saas_plans?.name ?? "Sin plan",
          current_period_end: sub.current_period_end,
          trial_ends_at: sub.trial_ends_at,
          notes: sub.notes,
        } : null,
        usage: {
          clients: clientMap.get(t.id) ?? 0,
          appointments: apptMap.get(t.id) ?? 0,
          invoices: 0,
        },
      };
    });

    setTenants(rows);
    setLoading(false);
  }, []);

  useEffect(() => { loadTenants(); }, [loadTenants]);

  const filtered = tenants.filter(t => {
    const matchFilter = filter === "all" || (t.subscription?.status ?? "trial") === filter;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  function openEdit(t: TenantRow) {
    setSelected(t);
    setEditStatus(t.subscription?.status ?? "trial");
    setEditAmount(String(t.subscription?.amount ?? ""));
    setEditNotes(t.subscription?.notes ?? "");
    setEditModal(true);
  }

  async function saveEdit() {
    if (!selected) return;
    setSaving(true);
    if (selected.subscription?.id) {
      await supabase.from("saas_subscriptions").update({
        status: editStatus,
        amount: Number(editAmount) || 0,
        notes: editNotes,
        updated_at: new Date().toISOString(),
      }).eq("id", selected.subscription.id);
    } else {
      await supabase.from("saas_subscriptions").insert({
        tenant_id: selected.id,
        status: editStatus,
        amount: Number(editAmount) || 0,
        notes: editNotes,
      });
    }
    setSaving(false);
    setEditModal(false);
    loadTenants();
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", margin: 0 }}>Clientes</h1>
        <p style={{ color: "#475569", fontSize: 14, margin: "4px 0 0" }}>Todos los negocios registrados en Zyncra</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar negocio..."
          style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #1e293b", background: "#1e293b", color: "#e2e8f0", fontSize: 13, width: 220, outline: "none" }} />
        <div style={{ display: "flex", gap: 4 }}>
          {(["all", "active", "trial", "overdue", "suspended"] as StatusFilter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
              background: filter === f ? "#7c3aed" : "#1e293b",
              color: filter === f ? "white" : "#64748b",
            }}>
              {f === "all" ? "Todos" : f === "active" ? "Activos" : f === "trial" ? "Trial" : f === "overdue" ? "Vencidos" : "Suspendidos"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>Cargando...</div>
      ) : (
        <div style={{ background: "#1e293b", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#0f172a" }}>
                {["Negocio", "Estado", "Plan / Monto", "Clientes", "Citas", "Registrado", ""].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#475569" }}>Sin resultados</td></tr>
              )}
              {filtered.map((t, i) => (
                <tr key={t.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9" }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>/{t.slug}</div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <StatusBadge status={t.subscription?.status ?? "trial"} />
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: 13, color: "#94a3b8" }}>{t.subscription?.plan_name ?? "Sin plan"}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>{t.subscription?.amount ? fmt(t.subscription.amount) + "/mes" : "—"}</div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 600, color: "#e2e8f0", textAlign: "center" }}>{t.usage.clients}</td>
                  <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 600, color: "#e2e8f0", textAlign: "center" }}>{t.usage.appointments}</td>
                  <td style={{ padding: "14px 16px", fontSize: 12, color: "#64748b" }}>{fmtDate(t.created_at)}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <button onClick={() => openEdit(t)}
                      style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #334155", background: "transparent", color: "#a78bfa", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "#1e293b", borderRadius: 20, padding: 28, maxWidth: 460, width: "100%", border: "1px solid #334155" }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#f1f5f9" }}>{selected.name}</h2>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748b" }}>Registrado el {fmtDate(selected.created_at)}</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={lbl}>Estado de suscripción</label>
                <select value={editStatus} onChange={e => setEditStatus(e.target.value)} style={inp}>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s === "active" ? "Activo" : s === "trial" ? "Trial" : s === "overdue" ? "Vencido" : s === "suspended" ? "Suspendido" : "Cancelado"}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Monto mensual (COP)</label>
                <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)}
                  placeholder="0" style={inp} />
              </div>
              <div>
                <label style={lbl}>Notas internas</label>
                <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
                  placeholder="Plan acordado, descuentos, observaciones..."
                  style={{ ...inp, minHeight: 80, resize: "vertical" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button onClick={() => setEditModal(false)} style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid #334155", background: "transparent", color: "#64748b", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={saveEdit} disabled={saving} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "#7c3aed", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                {saving ? "Guardando..." : "Guardar cambios"}
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
