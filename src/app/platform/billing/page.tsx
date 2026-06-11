"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Payment {
  id: string;
  tenant_id: string;
  tenant_name: string;
  amount: number;
  status: "pending" | "paid" | "failed";
  due_date: string | null;
  paid_at: string | null;
  method: string | null;
  reference: string | null;
  notes: string | null;
  created_at: string;
}

type PayFilter = "all" | "pending" | "paid" | "failed";

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
    pending: { label: "Pendiente", bg: "rgba(251,191,36,.15)", color: "#fbbf24" },
    paid:    { label: "Pagado",    bg: "rgba(52,211,153,.15)", color: "#34d399" },
    failed:  { label: "Fallido",   bg: "rgba(248,113,113,.15)", color: "#f87171" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

const METHODS = ["transferencia", "nequi", "efectivo", "daviplata", "tarjeta"];

// ── Main ──────────────────────────────────────────────────────────────────────

export default function PlatformBillingPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<{ id: string; name: string; subAmount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PayFilter>("all");
  const [search, setSearch] = useState("");

  // Mark paid modal
  const [payModal, setPayModal] = useState<Payment | null>(null);
  const [payMethod, setPayMethod] = useState("transferencia");
  const [payRef, setPayRef] = useState("");
  const [payNote, setPayNote] = useState("");
  const [saving, setSaving] = useState(false);

  // New payment modal
  const [newModal, setNewModal] = useState(false);
  const [newTenant, setNewTenant] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDue, setNewDue] = useState("");
  const [newNote, setNewNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: pays }, { data: tens }, { data: subs }] = await Promise.all([
      supabase.from("saas_payments").select("*, tenants(name)").order("created_at", { ascending: false }),
      supabase.from("tenants").select("id, name").order("name"),
      supabase.from("saas_subscriptions").select("tenant_id, amount"),
    ]);

    const subAmountMap = new Map<string, number>((subs ?? []).map((s: any) => [s.tenant_id, s.amount ?? 0]));

    setPayments(
      (pays ?? []).map((p: any) => ({
        ...p,
        tenant_name: p.tenants?.name ?? "—",
      }))
    );
    setTenants(
      (tens ?? []).map((t: any) => ({
        id: t.id,
        name: t.name,
        subAmount: subAmountMap.get(t.id) ?? 0,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = payments.filter(p => {
    const matchFilter = filter === "all" || p.status === filter;
    const matchSearch = !search || p.tenant_name.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const pendingTotal     = payments.filter(p => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const paidTotal        = payments.filter(p => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const collectedMonth   = payments.filter(p => p.status === "paid" && p.paid_at && p.paid_at >= startOfMonth).reduce((s, p) => s + p.amount, 0);
  const overdueCount     = payments.filter(p => p.status === "pending" && p.due_date && new Date(p.due_date) < now).length;

  async function markPaid() {
    if (!payModal) return;
    setSaving(true);
    await supabase.from("saas_payments").update({
      status: "paid",
      paid_at: new Date().toISOString(),
      method: payMethod,
      reference: payRef || null,
      notes: payNote || null,
    }).eq("id", payModal.id);
    await supabase.from("saas_subscriptions").update({ status: "active" }).eq("tenant_id", payModal.tenant_id);
    setSaving(false);
    setPayModal(null);
    setPayRef(""); setPayNote("");
    load();
  }

  async function createPayment() {
    if (!newTenant || !newAmount) return;
    setSaving(true);
    await supabase.from("saas_payments").insert({
      tenant_id: newTenant,
      amount: Number(newAmount),
      status: "pending",
      due_date: newDue || null,
      notes: newNote || null,
    });
    setSaving(false);
    setNewModal(false);
    setNewTenant(""); setNewAmount(""); setNewDue(""); setNewNote("");
    load();
  }

  function handleTenantSelect(tenantId: string) {
    setNewTenant(tenantId);
    const t = tenants.find(x => x.id === tenantId);
    if (t?.subAmount) setNewAmount(String(t.subAmount));
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "rgba(255,255,255,0.94)", margin: 0 }}>Cobros</h1>
          <p style={{ color: "rgba(255,255,255,0.32)", fontSize: 14, margin: "4px 0 0" }}>Pagos de suscripción de clientes Zyncra</p>
        </div>
        <button onClick={() => setNewModal(true)}
          style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "#fb0f05", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          + Nuevo cobro
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <div style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", boxShadow: "0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 20px", border: "1px solid rgba(52,211,153,0.15)" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Cobrado este mes</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#34d399" }}>{fmt(collectedMonth)}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.32)", marginTop: 4 }}>{payments.filter(p => p.status === "paid" && p.paid_at && p.paid_at >= startOfMonth).length} pagos en {new Date().toLocaleDateString("es-CO", { month: "long" })}</div>
        </div>
        <div style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", boxShadow: "0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 20px", border: "1px solid rgba(251,191,36,0.15)" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Pendiente de cobro</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#fbbf24" }}>{fmt(pendingTotal)}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.32)", marginTop: 4 }}>{payments.filter(p => p.status === "pending").length} facturas</div>
        </div>
        <div style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", boxShadow: "0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 20px", border: "1px solid rgba(96,165,250,0.15)" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Recaudado (histórico)</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#60a5fa" }}>{fmt(paidTotal)}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.32)", marginTop: 4 }}>{payments.filter(p => p.status === "paid").length} pagos totales</div>
        </div>
        <div style={{ background: overdueCount > 0 ? "linear-gradient(145deg, rgba(248,113,113,0.1) 0%, rgba(248,113,113,0.03) 100%)" : "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", boxShadow: "0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 20px", border: `1px solid ${overdueCount > 0 ? "rgba(248,113,113,.25)" : "rgba(255,255,255,0.08)"}` }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>Vencidos</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: overdueCount > 0 ? "#f87171" : "rgba(255,255,255,0.42)" }}>{overdueCount}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.32)", marginTop: 4 }}>con fecha de vencimiento pasada</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar negocio..."
          style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.92)", fontSize: 13, width: 220, outline: "none" }} />
        <div style={{ display: "flex", gap: 4 }}>
          {(["all", "pending", "paid", "failed"] as PayFilter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
              background: filter === f ? "#fb0f05" : "rgba(255,255,255,0.08)",
              color: filter === f ? "white" : "rgba(255,255,255,0.42)",
            }}>
              {f === "all" ? "Todos" : f === "pending" ? "Pendientes" : f === "paid" ? "Pagados" : "Fallidos"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.32)" }}>Cargando...</div>
      ) : (
        <div style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)", boxShadow: "0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(0,0,0,0.3)" }}>
                {["Negocio", "Monto", "Estado", "Vencimiento", "Pagado", "Método", ""].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.32)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.32)" }}>Sin resultados</td></tr>
              )}
              {filtered.map((p, i) => {
                const isOverdue = p.status === "pending" && p.due_date && new Date(p.due_date) < now;
                return (
                  <tr key={p.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)", background: isOverdue ? "rgba(248,113,113,0.03)" : i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "rgba(255,255,255,0.94)" }}>{p.tenant_name}</div>
                      {p.notes && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", marginTop: 2 }}>{p.notes}</div>}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 800, fontSize: 15, color: "#ff7d72" }}>{fmt(p.amount)}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <StatusBadge status={p.status} />
                      {isOverdue && <div style={{ fontSize: 10, color: "#f87171", marginTop: 4, fontWeight: 700 }}>VENCIDO</div>}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: isOverdue ? "#f87171" : "rgba(255,255,255,0.42)" }}>{fmtDate(p.due_date)}</td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "rgba(255,255,255,0.42)" }}>{fmtDate(p.paid_at)}</td>
                    <td style={{ padding: "14px 16px", fontSize: 13, color: "rgba(255,255,255,0.55)" }}>{p.method ?? "—"}</td>
                    <td style={{ padding: "14px 16px" }}>
                      {p.status === "pending" && (
                        <button onClick={() => { setPayModal(p); setPayMethod("transferencia"); }}
                          style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#34d399", color: "#10101B", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                          Marcar pagado
                        </button>
                      )}
                      {p.status === "paid" && p.reference && (
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.32)" }}>Ref: {p.reference}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Mark Paid Modal */}
      {payModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "rgba(6,6,20,0.9)", backdropFilter: "blur(40px) saturate(200%)", WebkitBackdropFilter: "blur(40px) saturate(200%)", borderRadius: 20, padding: 28, maxWidth: 420, width: "100%", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800, color: "rgba(255,255,255,0.94)" }}>Registrar pago</h2>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "rgba(255,255,255,0.42)" }}>
              {payModal.tenant_name} · <strong style={{ color: "#ff7d72" }}>{fmt(payModal.amount)}</strong>
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={lbl}>Método de pago</label>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)} style={inp}>
                  {METHODS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Referencia / Comprobante</label>
                <input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="Número de transacción..." style={inp} />
              </div>
              <div>
                <label style={lbl}>Nota (opcional)</label>
                <input value={payNote} onChange={e => setPayNote(e.target.value)} placeholder="Observación..." style={inp} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button onClick={() => setPayModal(null)} style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "rgba(255,255,255,0.42)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancelar</button>
              <button onClick={markPaid} disabled={saving} style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "#34d399", color: "#10101B", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                {saving ? "Guardando..." : "Confirmar pago"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Payment Modal */}
      {newModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "rgba(6,6,20,0.9)", backdropFilter: "blur(40px) saturate(200%)", WebkitBackdropFilter: "blur(40px) saturate(200%)", borderRadius: 20, padding: 28, maxWidth: 420, width: "100%", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 800, color: "rgba(255,255,255,0.94)" }}>Nuevo cobro</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={lbl}>Negocio</label>
                <select value={newTenant} onChange={e => handleTenantSelect(e.target.value)} style={inp}>
                  <option value="">Seleccionar cliente...</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>
                  Monto (COP)
                  {newTenant && tenants.find(t => t.id === newTenant)?.subAmount ? (
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", marginLeft: 8, fontWeight: 400, textTransform: "none" }}>
                      (pre-llenado desde suscripción)
                    </span>
                  ) : null}
                </label>
                <input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="0" style={inp} />
              </div>
              <div>
                <label style={lbl}>Fecha de vencimiento</label>
                <input type="date" value={newDue} onChange={e => setNewDue(e.target.value)} style={inp} />
              </div>
              <div>
                <label style={lbl}>Nota (opcional)</label>
                <input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Concepto del cobro..." style={inp} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button onClick={() => { setNewModal(false); setNewTenant(""); setNewAmount(""); setNewDue(""); setNewNote(""); }}
                style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "rgba(255,255,255,0.42)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancelar</button>
              <button onClick={createPayment} disabled={saving || !newTenant || !newAmount}
                style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "#fb0f05", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: (!newTenant || !newAmount) ? 0.5 : 1 }}>
                {saving ? "Guardando..." : "Crear cobro"}
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
