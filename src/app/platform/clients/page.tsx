"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TenantRow {
  id: string;
  name: string;
  slug: string;
  owner_email: string | null;
  owner_phone: string | null;
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
  last_payment: {
    method: string | null;
    paid_at: string | null;
    amount: number;
  } | null;
  usage: {
    clients: number;
    appointments: number;
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

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function fmtMethod(method: string | null) {
  if (!method) return "—";
  const map: Record<string, string> = {
    transferencia: "Transferencia",
    nequi: "Nequi",
    efectivo: "Efectivo",
    daviplata: "Daviplata",
    tarjeta: "Tarjeta",
  };
  return map[method] ?? method.charAt(0).toUpperCase() + method.slice(1);
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    active:    { label: "Activo",     bg: "rgba(52,211,153,.15)",  color: "#34d399" },
    trial:     { label: "Trial",      bg: "rgba(251,191,36,.15)",  color: "#fbbf24" },
    overdue:   { label: "Vencido",    bg: "rgba(248,113,113,.15)", color: "#f87171" },
    suspended: { label: "Suspendido", bg: "rgba(148,163,184,.1)",  color: "rgba(255,255,255,0.55)" },
    cancelled: { label: "Cancelado",  bg: "rgba(148,163,184,.1)",  color: "rgba(255,255,255,0.55)" },
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
  const [editTrialEnds, setEditTrialEnds] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const loadTenants = useCallback(async () => {
    setLoading(true);

    const [
      { data: subs },
      { data: clientCounts },
      { data: apptCounts },
      { data: allTenants },
      { data: paidPayments },
    ] = await Promise.all([
      supabase.from("saas_subscriptions").select("*, saas_plans(name), tenants(id, name, slug, created_at)"),
      supabase.from("clients").select("tenant_id"),
      supabase.from("appointments").select("tenant_id"),
      supabase.from("tenants").select("id, name, slug, created_at, settings").order("created_at", { ascending: false }),
      supabase.from("saas_payments").select("tenant_id, method, paid_at, amount").eq("status", "paid").order("paid_at", { ascending: false }),
    ]);

    const subsMap = new Map((subs ?? []).map((s: any) => [s.tenant_id, s]));

    // Last paid payment per tenant (already ordered by paid_at desc)
    const paymentMap = new Map<string, { method: string | null; paid_at: string | null; amount: number }>();
    (paidPayments ?? []).forEach((p: any) => {
      if (!paymentMap.has(p.tenant_id)) {
        paymentMap.set(p.tenant_id, { method: p.method, paid_at: p.paid_at, amount: p.amount });
      }
    });

    const clientMap = new Map<string, number>();
    (clientCounts ?? []).forEach((c: any) => { clientMap.set(c.tenant_id, (clientMap.get(c.tenant_id) ?? 0) + 1); });
    const apptMap = new Map<string, number>();
    (apptCounts ?? []).forEach((a: any) => { apptMap.set(a.tenant_id, (apptMap.get(a.tenant_id) ?? 0) + 1); });

    const rows: TenantRow[] = (allTenants ?? []).map((t: any) => {
      const sub = subsMap.get(t.id);
      const pay = paymentMap.get(t.id) ?? null;
      const settings = t.settings ?? {};
      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        owner_email: settings.owner_email ?? null,
        owner_phone: settings.owner_phone ?? null,
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
        last_payment: pay,
        usage: {
          clients: clientMap.get(t.id) ?? 0,
          appointments: apptMap.get(t.id) ?? 0,
        },
      };
    });

    setTenants(rows);
    setLoading(false);
  }, []);

  useEffect(() => { loadTenants(); }, [loadTenants]);

  const filtered = tenants.filter(t => {
    const matchFilter = filter === "all" || (t.subscription?.status ?? "trial") === filter;
    const matchSearch = !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase()) ||
      (t.owner_email ?? "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  function openDelete(t: TenantRow) {
    setSelected(t);
    setDeleteConfirm("");
    setDeleteModal(true);
  }

  async function handleDelete() {
    if (!selected || deleteConfirm !== selected.name) return;
    setDeleting(true);
    // Delete platform-level records first, then the tenant (cascade handles the rest)
    await supabase.from("saas_payments").delete().eq("tenant_id", selected.id);
    await supabase.from("saas_subscriptions").delete().eq("tenant_id", selected.id);
    await supabase.from("tenants").delete().eq("id", selected.id);
    setDeleting(false);
    setDeleteModal(false);
    setEditModal(false);
    setSelected(null);
    loadTenants();
  }

  function openEdit(t: TenantRow) {
    setSelected(t);
    setEditStatus(t.subscription?.status ?? "trial");
    setEditAmount(String(t.subscription?.amount ?? ""));
    setEditNotes(t.subscription?.notes ?? "");
    setEditTrialEnds(t.subscription?.trial_ends_at ? t.subscription.trial_ends_at.slice(0, 10) : "");
    setEditModal(true);
  }

  async function saveEdit() {
    if (!selected) return;
    setSaving(true);
    const payload: Record<string, any> = {
      status: editStatus,
      amount: Number(editAmount) || 0,
      notes: editNotes,
      trial_ends_at: editTrialEnds || null,
      updated_at: new Date().toISOString(),
    };
    if (selected.subscription?.id) {
      await supabase.from("saas_subscriptions").update(payload).eq("id", selected.subscription.id);
    } else {
      await supabase.from("saas_subscriptions").insert({ tenant_id: selected.id, ...payload });
    }
    setSaving(false);
    setEditModal(false);
    loadTenants();
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "rgba(255,255,255,0.94)", margin: 0 }}>Clientes</h1>
        <p style={{ color: "rgba(255,255,255,0.32)", fontSize: 14, margin: "4px 0 0" }}>Todos los negocios registrados en Zyncra</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por negocio, slug o email..."
          style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.92)", fontSize: 13, width: 260, outline: "none" }} />
        <div style={{ display: "flex", gap: 4 }}>
          {(["all", "active", "trial", "overdue", "suspended"] as StatusFilter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
              background: filter === f ? "#fb0f05" : "rgba(255,255,255,0.08)",
              color: filter === f ? "white" : "rgba(255,255,255,0.42)",
            }}>
              {f === "all" ? "Todos" : f === "active" ? "Activos" : f === "trial" ? "Trial" : f === "overdue" ? "Vencidos" : "Suspendidos"}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.32)" }}>{filtered.length} de {tenants.length} clientes</span>
          <button
            onClick={() => {
              const headers = ["Negocio", "Slug", "Email", "Teléfono", "Estado", "Plan", "Monto/mes", "Trial vence", "Último pago", "Método pago", "Clientes", "Registrado"];
              const rows = filtered.map(t => [
                t.name,
                t.slug,
                t.owner_email ?? "",
                t.owner_phone ?? "",
                t.subscription?.status ?? "trial",
                t.subscription?.plan_name ?? "",
                String(t.subscription?.amount ?? ""),
                t.subscription?.trial_ends_at ?? "",
                t.last_payment?.paid_at ?? "",
                t.last_payment?.method ?? "",
                String(t.usage.clients),
                t.created_at,
              ]);
              const csv = [headers, ...rows].map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
              const a = document.createElement("a");
              a.href = "data:text/csv;charset=utf-8,﻿" + encodeURIComponent(csv);
              a.download = `clientes-zyncra-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
            }}
            style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            ↓ Exportar CSV
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.32)" }}>Cargando...</div>
      ) : (
        <div style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", boxShadow: "0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 960 }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.3)" }}>
                {["Negocio / Contacto", "Estado", "Plan / Monto", "Trial vence", "Último pago", "Clientes", "Registrado", ""].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.32)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.32)" }}>Sin resultados</td></tr>
              )}
              {filtered.map((t, i) => {
                const days = t.subscription?.status === "trial" ? daysUntil(t.subscription.trial_ends_at) : null;
                return (
                  <tr key={t.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>

                    {/* Negocio + contacto */}
                    <td style={{ padding: "12px 16px", minWidth: 220 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,0.94)" }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 1 }}>/{t.slug}</div>
                      {t.owner_email && (
                        <a href={`mailto:${t.owner_email}`} style={{ fontSize: 11, color: "#60a5fa", marginTop: 4, display: "block", textDecoration: "none" }}>
                          ✉ {t.owner_email}
                        </a>
                      )}
                      {t.owner_phone && (
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", marginTop: 2 }}>
                          📱 {t.owner_phone}
                        </div>
                      )}
                    </td>

                    {/* Estado */}
                    <td style={{ padding: "12px 16px" }}>
                      <StatusBadge status={t.subscription?.status ?? "trial"} />
                    </td>

                    {/* Plan / Monto */}
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{t.subscription?.plan_name ?? "Sin plan"}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#ff7d72" }}>{t.subscription?.amount ? fmt(t.subscription.amount) + "/mes" : "—"}</div>
                    </td>

                    {/* Trial vence */}
                    <td style={{ padding: "12px 16px" }}>
                      {t.subscription?.status === "trial" && t.subscription.trial_ends_at ? (
                        <div>
                          <div style={{ fontSize: 12, color: days !== null && days <= 3 ? "#f87171" : "rgba(255,255,255,0.55)" }}>
                            {fmtDate(t.subscription.trial_ends_at)}
                          </div>
                          {days !== null && (
                            <div style={{ fontSize: 11, fontWeight: 700, color: days <= 1 ? "#f87171" : days <= 3 ? "#fbbf24" : "rgba(255,255,255,0.32)", marginTop: 2 }}>
                              {days <= 0 ? "Vencido" : days === 1 ? "Mañana" : `${days} días`}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.22)" }}>—</span>
                      )}
                    </td>

                    {/* Último pago */}
                    <td style={{ padding: "12px 16px" }}>
                      {t.last_payment ? (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#34d399" }}>{fmtMethod(t.last_payment.method)}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", marginTop: 2 }}>{fmtDate(t.last_payment.paid_at)}</div>
                          <div style={{ fontSize: 11, color: "#ff7d72", marginTop: 1 }}>{fmt(t.last_payment.amount)}</div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.22)" }}>Sin pagos</span>
                      )}
                    </td>

                    {/* Clientes */}
                    <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.92)", textAlign: "center" }}>{t.usage.clients}</td>

                    {/* Registrado */}
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "rgba(255,255,255,0.42)" }}>{fmtDate(t.created_at)}</td>

                    {/* Acción */}
                    <td style={{ padding: "12px 16px" }}>
                      <button onClick={() => openEdit(t)}
                        style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "#ff7d72", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "rgba(6,6,20,0.9)", backdropFilter: "blur(40px) saturate(200%)", WebkitBackdropFilter: "blur(40px) saturate(200%)", borderRadius: 20, padding: 28, maxWidth: 500, width: "100%", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "rgba(255,255,255,0.94)" }}>{selected.name}</h2>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "rgba(255,255,255,0.42)" }}>/{selected.slug} · Registrado el {fmtDate(selected.created_at)}</p>

            {/* Datos de contacto (solo lectura) */}
            {(selected.owner_email || selected.owner_phone) && (
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.32)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Datos del dueño</div>
                {selected.owner_email && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", width: 60 }}>Email</span>
                    <a href={`mailto:${selected.owner_email}`} style={{ fontSize: 13, color: "#60a5fa", textDecoration: "none", fontWeight: 600 }}>{selected.owner_email}</a>
                  </div>
                )}
                {selected.owner_phone && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", width: 60 }}>Teléfono</span>
                    <a href={`https://wa.me/${selected.owner_phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#34d399", textDecoration: "none", fontWeight: 600 }}>{selected.owner_phone}</a>
                  </div>
                )}
                {selected.last_payment && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", width: 60 }}>Último pago</span>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                      {fmtMethod(selected.last_payment.method)} · {fmtDate(selected.last_payment.paid_at)} · {fmt(selected.last_payment.amount)}
                    </span>
                  </div>
                )}
              </div>
            )}

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
              {editStatus === "trial" && (
                <div>
                  <label style={lbl}>Fin del trial</label>
                  <input type="date" value={editTrialEnds} onChange={e => setEditTrialEnds(e.target.value)} style={inp} />
                </div>
              )}
              <div>
                <label style={lbl}>Notas internas</label>
                <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
                  placeholder="Plan acordado, descuentos, observaciones..."
                  style={{ ...inp, minHeight: 80, resize: "vertical" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "space-between", alignItems: "center" }}>
              <button
                onClick={() => { setEditModal(false); openDelete(selected); }}
                style={{ padding: "9px 16px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.08)", color: "#f87171", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
              >
                Eliminar cliente
              </button>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setEditModal(false)} style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "rgba(255,255,255,0.42)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                  Cancelar
                </button>
                <button onClick={saveEdit} disabled={saving} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "#fb0f05", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteModal && selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: 20 }}>
          <div style={{ background: "rgba(6,6,20,0.9)", backdropFilter: "blur(40px) saturate(200%)", WebkitBackdropFilter: "blur(40px) saturate(200%)", borderRadius: 20, padding: 28, maxWidth: 440, width: "100%", border: "1px solid rgba(239,68,68,0.3)", boxShadow: "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: 32, marginBottom: 12, textAlign: "center" }}>⚠️</div>
            <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "#f87171", textAlign: "center" }}>
              Eliminar cliente
            </h2>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "rgba(255,255,255,0.55)", textAlign: "center", lineHeight: 1.6 }}>
              Esta acción es <strong style={{ color: "#f87171" }}>permanente e irreversible</strong>. Se eliminarán el tenant, suscripción y pagos asociados.
            </p>

            <div style={{ background: "rgba(239,68,68,0.07)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, border: "1px solid rgba(239,68,68,0.15)" }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", marginBottom: 4 }}>Negocio a eliminar</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.94)" }}>{selected.name}</div>
              {selected.owner_email && <div style={{ fontSize: 12, color: "#60a5fa", marginTop: 2 }}>{selected.owner_email}</div>}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.42)", marginBottom: 8 }}>
                Escribe <strong style={{ color: "rgba(255,255,255,0.7)" }}>{selected.name}</strong> para confirmar:
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder={selected.name}
                autoFocus
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 8, boxSizing: "border-box",
                  border: deleteConfirm === selected.name
                    ? "1px solid rgba(239,68,68,0.6)"
                    : "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.92)",
                  fontSize: 14, fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif",
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => { setDeleteModal(false); setDeleteConfirm(""); }}
                style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "rgba(255,255,255,0.42)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || deleteConfirm !== selected.name}
                style={{
                  padding: "9px 20px", borderRadius: 10, border: "none",
                  background: deleteConfirm === selected.name ? "#ef4444" : "rgba(239,68,68,0.3)",
                  color: "white", fontWeight: 700, fontSize: 14,
                  cursor: deleteConfirm === selected.name ? "pointer" : "not-allowed",
                  transition: "background .15s",
                }}
              >
                {deleting ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const lbl: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.42)",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em",
};
const inp: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.92)", fontSize: 14, boxSizing: "border-box",
  fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif",
};
