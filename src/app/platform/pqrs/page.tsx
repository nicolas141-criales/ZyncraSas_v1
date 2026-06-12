"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface PQR {
  id: string;
  type: string;
  subject: string;
  description: string;
  submitter_name: string | null;
  submitter_email: string | null;
  submitter_phone: string | null;
  target: string;
  tenant_name: string | null;
  status: string;
  priority: string;
  response: string | null;
  responded_at: string | null;
  created_at: string;
}

const TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  peticion:     { label: "Petición",     icon: "📋", color: "#60a5fa" },
  queja:        { label: "Queja",        icon: "😤", color: "#f87171" },
  reclamo:      { label: "Reclamo",      icon: "⚠️", color: "#fbbf24" },
  sugerencia:   { label: "Sugerencia",   icon: "💡", color: "#a78bfa" },
  felicitacion: { label: "Felicitación", icon: "⭐", color: "#34d399" },
};

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: "Pendiente",   bg: "rgba(251,191,36,.18)",  color: "#fbbf24" },
  in_review: { label: "En revisión", bg: "rgba(96,165,250,.18)",  color: "#60a5fa" },
  resolved:  { label: "Resuelto",    bg: "rgba(52,211,153,.18)",  color: "#34d399" },
  closed:    { label: "Cerrado",     bg: "rgba(148,163,184,.12)", color: "rgba(255,255,255,0.4)" },
};

const PRIORITY_META: Record<string, { label: string; color: string }> = {
  low:    { label: "Baja",    color: "rgba(255,255,255,0.38)" },
  normal: { label: "Normal",  color: "rgba(255,255,255,0.6)" },
  high:   { label: "Alta",    color: "#fb923c" },
  urgent: { label: "Urgente", color: "#f87171" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const FF = "var(--font-space-grotesk),'Space Grotesk',sans-serif";

const GLASS: React.CSSProperties = {
  background: "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const MIGRATION_SQL = `CREATE TABLE IF NOT EXISTS pqrs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'queja',
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  submitter_name TEXT,
  submitter_email TEXT,
  submitter_phone TEXT,
  target TEXT NOT NULL DEFAULT 'zyncra',
  tenant_id UUID,
  tenant_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'normal',
  response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE pqrs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pqrs_insert" ON pqrs FOR INSERT WITH CHECK (true);
CREATE POLICY "pqrs_select" ON pqrs FOR SELECT USING (true);
CREATE POLICY "pqrs_update" ON pqrs FOR UPDATE USING (true) WITH CHECK (true);`;

export default function PlatformPqrsPage() {
  const [pqrs, setPqrs] = useState<PQR[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState(false);
  const [selected, setSelected] = useState<PQR | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [search, setSearch] = useState("");
  const [response, setResponse] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("pqrs").select("*").order("created_at", { ascending: false });
    if (error) { setTableError(true); setLoading(false); return; }
    setPqrs((data ?? []) as PQR[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const ch = supabase
      .channel("pqrs-admin")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "pqrs" }, (payload) => {
        setPqrs(prev => [payload.new as PQR, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Quick single-field update directly from table
  async function quickUpdate(id: string, fields: Partial<PQR>) {
    const { error } = await supabase.from("pqrs")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { showToast("Error al actualizar", false); return; }
    setPqrs(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p));
    showToast("✓ Estado actualizado");
    if (selected?.id === id) setSelected(s => s ? { ...s, ...fields } : s);
  }

  function openDetail(p: PQR) {
    setSelected(p);
    setResponse(p.response ?? "");
    setEditStatus(p.status);
    setEditPriority(p.priority);
  }

  async function saveAll() {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase.from("pqrs").update({
      status: editStatus,
      priority: editPriority,
      response: response.trim() || null,
      responded_at: response.trim() ? new Date().toISOString() : selected.responded_at,
      updated_at: new Date().toISOString(),
    }).eq("id", selected.id);
    setSaving(false);
    if (error) { showToast("Error al guardar", false); return; }
    showToast("✓ PQR actualizado correctamente");
    setPqrs(prev => prev.map(p => p.id === selected.id
      ? { ...p, status: editStatus, priority: editPriority, response: response.trim() || null }
      : p
    ));
    setSelected(null);
  }

  const filtered = pqrs.filter(p => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    if (filterType !== "all" && p.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.subject.toLowerCase().includes(q) ||
        (p.submitter_name ?? "").toLowerCase().includes(q) ||
        (p.submitter_email ?? "").toLowerCase().includes(q) ||
        (p.tenant_name ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  const pending   = pqrs.filter(p => p.status === "pending").length;
  const inReview  = pqrs.filter(p => p.status === "in_review").length;
  const resolved  = pqrs.filter(p => p.status === "resolved").length;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
      <div style={{ width: 36, height: 36, border: "3px solid rgba(255,255,255,0.06)", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ fontFamily: FF }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 76, right: 24, zIndex: 9999,
          padding: "12px 20px", borderRadius: 12, fontWeight: 700, fontSize: 14,
          background: toast.ok ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)",
          border: `1px solid ${toast.ok ? "rgba(52,211,153,0.4)" : "rgba(248,113,113,0.4)"}`,
          color: toast.ok ? "#34d399" : "#f87171",
          backdropFilter: "blur(20px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          transition: "all .3s",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "rgba(255,255,255,0.94)", margin: 0 }}>PQRs</h1>
          <p style={{ color: "rgba(255,255,255,0.32)", fontSize: 14, margin: "4px 0 0" }}>Peticiones, Quejas, Reclamos y Sugerencias</p>
        </div>
        <a href="/pqr" target="_blank" rel="noreferrer"
          style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          🔗 Formulario público
        </a>
      </div>

      {/* Migration banner */}
      {tableError && (
        <div style={{ background: "rgba(248,113,113,0.08)", borderRadius: 14, padding: "16px 20px", border: "1px solid rgba(248,113,113,0.25)", marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f87171", marginBottom: 8 }}>⚠️ Tabla pqrs no encontrada — ejecuta este SQL en Supabase</div>
          <pre style={{ background: "rgba(0,0,0,0.4)", borderRadius: 9, padding: "12px 16px", fontSize: 11, color: "#a78bfa", margin: "0 0 10px", overflowX: "auto", fontFamily: "var(--font-jetbrains-mono),'JetBrains Mono',monospace", lineHeight: 1.6 }}>{MIGRATION_SQL}</pre>
          <button onClick={() => { navigator.clipboard.writeText(MIGRATION_SQL); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.08)", color: "#a78bfa", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {copied ? "✓ Copiado" : "Copiar SQL"}
          </button>
        </div>
      )}

      {!tableError && (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Total",       value: pqrs.length, color: "#60a5fa", icon: "💬" },
              { label: "Pendientes",  value: pending,     color: "#fbbf24", icon: "🔔" },
              { label: "En revisión", value: inReview,    color: "#a78bfa", icon: "🔍" },
              { label: "Resueltos",   value: resolved,    color: "#34d399", icon: "✅" },
            ].map(s => (
              <div key={s.label} style={{ ...GLASS, borderRadius: 16, padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.label}</span>
                  <span style={{ fontSize: 18 }}>{s.icon}</span>
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..." style={{
                padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.92)",
                fontSize: 13, width: 220, outline: "none", fontFamily: FF,
              }} />
            {(["all", "pending", "in_review", "resolved", "closed"] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{
                padding: "7px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: FF,
                background: filterStatus === s ? "#fb0f05" : "rgba(255,255,255,0.07)",
                color: filterStatus === s ? "white" : "rgba(255,255,255,0.42)",
              }}>
                {s === "all" ? "Todos" : STATUS_META[s]?.label ?? s}
              </button>
            ))}
            <div style={{ display: "flex", gap: 4 }}>
              {[{ k: "all", label: "📄 Todos" }, ...Object.entries(TYPE_META).map(([k, v]) => ({ k, label: `${v.icon} ${v.label}` }))].map(({ k, label }) => (
                <button key={k} onClick={() => setFilterType(k)} style={{
                  padding: "7px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: FF,
                  background: filterType === k ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)",
                  color: filterType === k ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.38)",
                }}>{label}</button>
              ))}
            </div>
            <span style={{ marginLeft: "auto", fontSize: 12, color: "rgba(255,255,255,0.28)" }}>{filtered.length} de {pqrs.length}</span>
          </div>

          {/* Table */}
          <div style={{ ...GLASS, borderRadius: 16, overflow: "hidden" }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.28)" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{pqrs.length === 0 ? "Aún no hay PQRs" : "Sin resultados"}</div>
                {pqrs.length === 0 && <div style={{ fontSize: 12, marginTop: 4 }}>Comparte <strong style={{ color: "rgba(255,255,255,0.4)" }}>/pqr</strong> con tus clientes</div>}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780 }}>
                  <thead>
                    <tr style={{ background: "rgba(0,0,0,0.3)" }}>
                      {["Tipo", "Asunto / Descripción", "Remitente", "Dirigido a", "Estado", "Acciones"].map(h => (
                        <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p, i) => {
                      const tm = TYPE_META[p.type] ?? { icon: "📄", color: "#fff", label: p.type };
                      const sm = STATUS_META[p.status] ?? { bg: "rgba(255,255,255,0.1)", color: "#fff", label: p.status };
                      return (
                        <tr key={p.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>

                          {/* Tipo */}
                          <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                            <div style={{ fontSize: 18 }}>{tm.icon}</div>
                            <div style={{ fontSize: 9, fontWeight: 700, color: tm.color, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{tm.label}</div>
                          </td>

                          {/* Asunto */}
                          <td style={{ padding: "12px 14px", maxWidth: 240 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,0.88)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.subject}</div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.description.slice(0, 70)}{p.description.length > 70 ? "…" : ""}</div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 3 }}>{fmtDate(p.created_at)}</div>
                          </td>

                          {/* Remitente */}
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>{p.submitter_name ?? <em style={{ color: "rgba(255,255,255,0.25)", fontStyle: "normal" }}>Anónimo</em>}</div>
                            {p.submitter_email && <a href={`mailto:${p.submitter_email}`} style={{ fontSize: 11, color: "#60a5fa", textDecoration: "none" }}>{p.submitter_email}</a>}
                            {p.submitter_phone && <div style={{ fontSize: 11, color: "#34d399" }}>{p.submitter_phone}</div>}
                          </td>

                          {/* Dirigido a */}
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{
                              fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
                              background: p.target === "zyncra" ? "rgba(251,15,5,0.12)" : "rgba(96,165,250,0.12)",
                              color: p.target === "zyncra" ? "#ff7d72" : "#60a5fa",
                            }}>
                              {p.target === "zyncra" ? "Zyncra" : (p.tenant_name ?? "Negocio")}
                            </span>
                          </td>

                          {/* Estado badge */}
                          <td style={{ padding: "12px 14px" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: sm.bg, color: sm.color }}>
                              {sm.label}
                            </span>
                            {p.priority === "urgent" && <div style={{ fontSize: 9, fontWeight: 700, color: "#f87171", marginTop: 3, textTransform: "uppercase" }}>🔴 Urgente</div>}
                            {p.priority === "high" && <div style={{ fontSize: 9, fontWeight: 700, color: "#fb923c", marginTop: 3, textTransform: "uppercase" }}>🟠 Alta prioridad</div>}
                          </td>

                          {/* Acciones rápidas */}
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                              {/* Quick status change */}
                              {p.status === "pending" && (
                                <div style={{ display: "flex", gap: 4 }}>
                                  <button onClick={() => quickUpdate(p.id, { status: "in_review" })}
                                    style={{ padding: "5px 9px", borderRadius: 7, border: "1px solid rgba(96,165,250,0.4)", background: "rgba(96,165,250,0.12)", color: "#60a5fa", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FF }}>
                                    🔍 Revisar
                                  </button>
                                  <button onClick={() => quickUpdate(p.id, { status: "resolved" })}
                                    style={{ padding: "5px 9px", borderRadius: 7, border: "1px solid rgba(52,211,153,0.4)", background: "rgba(52,211,153,0.12)", color: "#34d399", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FF }}>
                                    ✓ Resolver
                                  </button>
                                </div>
                              )}
                              {p.status === "in_review" && (
                                <button onClick={() => quickUpdate(p.id, { status: "resolved" })}
                                  style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(52,211,153,0.4)", background: "rgba(52,211,153,0.12)", color: "#34d399", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FF, alignSelf: "flex-start" }}>
                                  ✓ Marcar resuelto
                                </button>
                              )}
                              {(p.status === "resolved" || p.status === "closed") && (
                                <button onClick={() => quickUpdate(p.id, { status: "pending" })}
                                  style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(251,191,36,0.3)", background: "rgba(251,191,36,0.08)", color: "#fbbf24", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: FF, alignSelf: "flex-start" }}>
                                  ↺ Reabrir
                                </button>
                              )}
                              {/* Detail button */}
                              <button onClick={() => openDetail(p)}
                                style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid rgba(255,255,255,0.16)", background: "#fb0f05", color: "white", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FF, alignSelf: "flex-start" }}>
                                Gestionar →
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── MANAGEMENT PANEL (slide-in from right) ── */}
      {selected && (
        <>
          {/* Backdrop */}
          <div onClick={() => setSelected(null)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 2000 }} />

          {/* Panel */}
          <div style={{
            position: "fixed", top: 0, right: 0, bottom: 0, width: 480,
            zIndex: 2001, overflowY: "auto",
            background: "rgba(8,8,22,0.97)",
            borderLeft: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "-16px 0 60px rgba(0,0,0,0.6)",
            display: "flex", flexDirection: "column",
          }}>
            {/* Panel header */}
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0, background: "rgba(251,15,5,0.06)" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 20 }}>{TYPE_META[selected.type]?.icon ?? "📄"}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: TYPE_META[selected.type]?.color ?? "#fff", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    {TYPE_META[selected.type]?.label ?? selected.type}
                  </span>
                </div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "rgba(255,255,255,0.94)", lineHeight: 1.4, maxWidth: 360 }}>{selected.subject}</h2>
              </div>
              <button onClick={() => setSelected(null)}
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", fontSize: 16, cursor: "pointer", borderRadius: 8, padding: "6px 11px", flexShrink: 0 }}>
                ✕
              </button>
            </div>

            <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

              {/* ── SECCIÓN DE GESTIÓN (siempre visible) ── */}
              <div style={{ background: "rgba(251,15,5,0.05)", borderRadius: 14, padding: "18px 20px", border: "1px solid rgba(251,15,5,0.15)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#ff7d72", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>
                  🛠 Gestión del PQR
                </div>

                {/* Estado */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Estado</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {Object.entries(STATUS_META).map(([k, v]) => (
                      <button key={k} onClick={() => setEditStatus(k)}
                        style={{
                          padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                          fontSize: 13, fontWeight: 700, fontFamily: FF,
                          border: editStatus === k ? `2px solid ${v.color}` : "2px solid rgba(255,255,255,0.08)",
                          background: editStatus === k ? v.bg : "rgba(255,255,255,0.04)",
                          color: editStatus === k ? v.color : "rgba(255,255,255,0.4)",
                          boxShadow: editStatus === k ? `0 0 12px ${v.color}30` : "none",
                          transition: "all .15s",
                        }}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prioridad */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Prioridad</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {Object.entries(PRIORITY_META).map(([k, v]) => (
                      <button key={k} onClick={() => setEditPriority(k)}
                        style={{
                          flex: 1, padding: "9px 8px", borderRadius: 10, cursor: "pointer",
                          fontSize: 12, fontWeight: 700, fontFamily: FF,
                          border: editPriority === k ? `2px solid ${v.color}` : "2px solid rgba(255,255,255,0.08)",
                          background: editPriority === k ? `${v.color}18` : "rgba(255,255,255,0.04)",
                          color: editPriority === k ? v.color : "rgba(255,255,255,0.35)",
                          transition: "all .15s",
                        }}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Respuesta */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Respuesta / Notas internas</div>
                  <textarea
                    value={response}
                    onChange={e => setResponse(e.target.value)}
                    placeholder="Escribe la respuesta al PQR o notas internas de seguimiento..."
                    rows={4}
                    style={{
                      width: "100%", padding: "10px 13px", borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.14)",
                      background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.9)",
                      fontSize: 13, boxSizing: "border-box", fontFamily: FF,
                      resize: "vertical", minHeight: 90, outline: "none",
                    }}
                  />
                  {selected.responded_at && (
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 4 }}>
                      Respondido el {fmtDate(selected.responded_at)}
                    </div>
                  )}
                </div>

                {/* Guardar */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={saveAll} disabled={saving}
                    style={{
                      flex: 1, padding: "12px", borderRadius: 10, border: "none",
                      background: saving ? "rgba(251,15,5,0.4)" : "#fb0f05",
                      color: "white", fontWeight: 800, fontSize: 14, cursor: saving ? "not-allowed" : "pointer",
                      fontFamily: FF, boxShadow: "0 4px 16px rgba(251,15,5,0.3)",
                    }}>
                    {saving ? "Guardando..." : "💾 Guardar cambios"}
                  </button>
                  {selected.submitter_email && (
                    <a href={`mailto:${selected.submitter_email}?subject=Re: ${encodeURIComponent(selected.subject)}&body=${encodeURIComponent(response)}`}
                      style={{
                        padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(96,165,250,0.35)",
                        background: "rgba(96,165,250,0.1)", color: "#60a5fa",
                        fontWeight: 700, fontSize: 13, textDecoration: "none",
                        display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                      }}>
                      ✉ Email
                    </a>
                  )}
                </div>
              </div>

              {/* ── Info del PQR ── */}
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: "16px 18px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Contenido del PQR</div>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.7 }}>{selected.description}</p>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { label: "Nombre",     value: selected.submitter_name ?? "Anónimo" },
                    { label: "Email",      value: selected.submitter_email },
                    { label: "Teléfono",   value: selected.submitter_phone },
                    { label: "Dirigido a", value: selected.target === "zyncra" ? "Zyncra (plataforma)" : selected.tenant_name ?? "Negocio" },
                    { label: "Recibido",   value: fmtDate(selected.created_at) },
                  ].filter(r => r.value).map(r => (
                    <div key={r.label} style={{ display: "flex", gap: 12 }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", width: 72, flexShrink: 0 }}>{r.label}</span>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}
