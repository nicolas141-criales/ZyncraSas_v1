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

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  peticion:     { label: "Petición",     icon: "📋", color: "#60a5fa" },
  queja:        { label: "Queja",        icon: "😤", color: "#f87171" },
  reclamo:      { label: "Reclamo",      icon: "⚠️", color: "#fbbf24" },
  sugerencia:   { label: "Sugerencia",   icon: "💡", color: "#a78bfa" },
  felicitacion: { label: "Felicitación", icon: "⭐", color: "#34d399" },
};

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: "Pendiente",   bg: "rgba(251,191,36,.15)",  color: "#fbbf24" },
  in_review: { label: "En revisión", bg: "rgba(96,165,250,.15)",  color: "#60a5fa" },
  resolved:  { label: "Resuelto",    bg: "rgba(52,211,153,.15)",  color: "#34d399" },
  closed:    { label: "Cerrado",     bg: "rgba(148,163,184,.1)",  color: "rgba(255,255,255,0.4)" },
};

const PRIORITY_META: Record<string, { label: string; color: string }> = {
  low:    { label: "Baja",     color: "rgba(255,255,255,0.3)" },
  normal: { label: "Normal",   color: "rgba(255,255,255,0.55)" },
  high:   { label: "Alta",     color: "#fb923c" },
  urgent: { label: "Urgente",  color: "#f87171" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const GLASS: React.CSSProperties = {
  background: "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const MODAL_GLASS: React.CSSProperties = {
  background: "rgba(6,6,20,0.92)",
  backdropFilter: "blur(40px) saturate(200%)",
  WebkitBackdropFilter: "blur(40px) saturate(200%)",
  boxShadow: "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.12)",
};

const lbl: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: "rgba(255,255,255,0.32)", textTransform: "uppercase",
  letterSpacing: "0.06em", marginBottom: 6,
};
const inp: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.92)",
  fontSize: 14, boxSizing: "border-box",
  fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif",
};

const MIGRATION_SQL = `-- Ejecuta esto en Supabase Dashboard → SQL Editor
CREATE TABLE IF NOT EXISTS pqrs (
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

CREATE POLICY "pqrs_insert_public" ON pqrs FOR INSERT WITH CHECK (true);
CREATE POLICY "pqrs_select_admin"  ON pqrs FOR SELECT USING (true);
CREATE POLICY "pqrs_update_admin"  ON pqrs FOR UPDATE USING (true);`;

// ── Main ──────────────────────────────────────────────────────────────────────

export default function PlatformPqrsPage() {
  const [pqrs, setPqrs] = useState<PQR[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState(false);
  const [selected, setSelected] = useState<PQR | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [response, setResponse] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("pqrs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setTableError(true);
      setLoading(false);
      return;
    }
    setPqrs((data ?? []) as PQR[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Realtime: auto-refresh on new inserts
  useEffect(() => {
    const channel = supabase
      .channel("pqrs-admin")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "pqrs" }, (payload) => {
        setPqrs(prev => [payload.new as PQR, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  function openDetail(p: PQR) {
    setSelected(p);
    setResponse(p.response ?? "");
    setEditStatus(p.status);
    setEditPriority(p.priority);
  }

  async function saveResponse() {
    if (!selected) return;
    setSaving(true);
    await supabase.from("pqrs").update({
      status: editStatus,
      priority: editPriority,
      response: response.trim() || null,
      responded_at: response.trim() ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq("id", selected.id);
    setSaving(false);
    setSelected(null);
    load();
  }

  const filtered = pqrs.filter(p => {
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    const matchType = filterType === "all" || p.type === filterType;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      p.subject.toLowerCase().includes(q) ||
      (p.submitter_name ?? "").toLowerCase().includes(q) ||
      (p.submitter_email ?? "").toLowerCase().includes(q) ||
      (p.tenant_name ?? "").toLowerCase().includes(q);
    return matchStatus && matchType && matchSearch;
  });

  // Stats
  const total = pqrs.length;
  const pending = pqrs.filter(p => p.status === "pending").length;
  const inReview = pqrs.filter(p => p.status === "in_review").length;
  const resolved = pqrs.filter(p => p.status === "resolved").length;

  const stats = [
    { label: "Total PQRs",       value: total,    color: "#60a5fa", icon: "📊" },
    { label: "Pendientes",        value: pending,  color: "#fbbf24", icon: "🔔" },
    { label: "En revisión",       value: inReview, color: "#a78bfa", icon: "🔍" },
    { label: "Resueltos",         value: resolved, color: "#34d399", icon: "✅" },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <div style={{ width: 36, height: 36, border: "3px solid rgba(255,255,255,0.06)", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "rgba(255,255,255,0.94)", margin: 0 }}>PQRs</h1>
          <p style={{ color: "rgba(255,255,255,0.32)", fontSize: 14, margin: "4px 0 0" }}>Peticiones, Quejas, Reclamos y Sugerencias</p>
        </div>
        <a href="/pqr" target="_blank" rel="noreferrer"
          style={{ padding: "9px 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", fontWeight: 600, fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center", gap: 8, backdropFilter: "blur(8px)" }}>
          🔗 Ver formulario público
        </a>
      </div>

      {/* Migration banner */}
      {tableError && (
        <div style={{ background: "rgba(248,113,113,0.08)", borderRadius: 14, padding: "16px 20px", border: "1px solid rgba(248,113,113,0.25)", marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f87171", marginBottom: 8 }}>⚠️ Tabla pqrs no encontrada</div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", margin: "0 0 12px", lineHeight: 1.6 }}>
            Ejecuta el siguiente SQL en tu Supabase Dashboard → SQL Editor para activar los PQRs:
          </p>
          <pre style={{ background: "rgba(0,0,0,0.4)", borderRadius: 9, padding: "12px 16px", fontSize: 11, color: "#a78bfa", margin: "0 0 10px", overflowX: "auto", fontFamily: "var(--font-jetbrains-mono),'JetBrains Mono',monospace", lineHeight: 1.6 }}>
            {MIGRATION_SQL}
          </pre>
          <button onClick={() => { navigator.clipboard.writeText(MIGRATION_SQL); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.08)", color: "#a78bfa", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {copied ? "✓ Copiado" : "Copiar SQL"}
          </button>
        </div>
      )}

      {!tableError && (
        <>
          {/* Stats KPI */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
            {stats.map(s => (
              <div key={s.label} style={{ ...GLASS, borderRadius: 16, padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.label}</span>
                  <span style={{ fontSize: 18, opacity: 0.7 }}>{s.icon}</span>
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por asunto, remitente, negocio..."
              style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.92)", fontSize: 13, width: 280, outline: "none", fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif" }} />

            <div style={{ display: "flex", gap: 4 }}>
              {(["all", "pending", "in_review", "resolved", "closed"] as const).map(s => (
                <button key={s} onClick={() => setFilterStatus(s)} style={{
                  padding: "7px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
                  background: filterStatus === s ? "#fb0f05" : "rgba(255,255,255,0.07)",
                  color: filterStatus === s ? "white" : "rgba(255,255,255,0.42)",
                }}>
                  {s === "all" ? "Todos" : STATUS_META[s]?.label ?? s}
                </button>
              ))}
            </div>

            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)", fontSize: 12, cursor: "pointer", outline: "none" }}>
              <option value="all">Todos los tipos</option>
              {Object.entries(TYPE_META).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>

            <span style={{ marginLeft: "auto", fontSize: 12, color: "rgba(255,255,255,0.28)" }}>
              {filtered.length} de {pqrs.length} PQRs
            </span>
          </div>

          {/* Table */}
          <div style={{ ...GLASS, borderRadius: 16, overflow: "hidden" }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.28)" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>💬</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {pqrs.length === 0 ? "Aún no hay PQRs" : "Sin resultados para ese filtro"}
                </div>
                {pqrs.length === 0 && (
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.2)", marginTop: 4 }}>
                    Comparte el enlace <strong style={{ color: "rgba(255,255,255,0.4)" }}>/pqr</strong> con tus clientes para empezar a recibir PQRs
                  </div>
                )}
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
                  <thead>
                    <tr style={{ background: "rgba(0,0,0,0.3)" }}>
                      {["Tipo", "Asunto", "Remitente", "Dirigido a", "Prioridad", "Estado", "Fecha", ""].map(h => (
                        <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p, i) => {
                      const tm = TYPE_META[p.type] ?? { label: p.type, icon: "📄", color: "#fff" };
                      const sm = STATUS_META[p.status] ?? { label: p.status, bg: "rgba(255,255,255,0.1)", color: "#fff" };
                      const pm = PRIORITY_META[p.priority] ?? PRIORITY_META.normal;
                      return (
                        <tr key={p.id} style={{ borderTop: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                          <td style={{ padding: "13px 16px" }}>
                            <span style={{ fontSize: 16 }}>{tm.icon}</span>
                            <div style={{ fontSize: 10, fontWeight: 700, color: tm.color, marginTop: 2 }}>{tm.label}</div>
                          </td>
                          <td style={{ padding: "13px 16px", maxWidth: 220 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,0.88)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.subject}</div>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.description.slice(0, 60)}{p.description.length > 60 ? "…" : ""}</div>
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            {p.submitter_name ? (
                              <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{p.submitter_name}</div>
                            ) : (
                              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>Anónimo</div>
                            )}
                            {p.submitter_email && (
                              <a href={`mailto:${p.submitter_email}`} style={{ fontSize: 11, color: "#60a5fa", textDecoration: "none", display: "block", marginTop: 2 }}>{p.submitter_email}</a>
                            )}
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            {p.target === "zyncra" ? (
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#ff7d72", background: "rgba(251,15,5,0.12)", borderRadius: 20, padding: "2px 8px" }}>Zyncra</span>
                            ) : (
                              <span style={{ fontSize: 11, fontWeight: 700, color: "#60a5fa", background: "rgba(96,165,250,0.12)", borderRadius: 20, padding: "2px 8px" }}>
                                {p.tenant_name ?? "Negocio"}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: pm.color }}>{pm.label}</span>
                          </td>
                          <td style={{ padding: "13px 16px" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: sm.bg, color: sm.color }}>
                              {sm.label}
                            </span>
                          </td>
                          <td style={{ padding: "13px 16px", fontSize: 11, color: "rgba(255,255,255,0.32)", whiteSpace: "nowrap" }}>{fmtDate(p.created_at)}</td>
                          <td style={{ padding: "13px 16px" }}>
                            <button onClick={() => openDetail(p)}
                              style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "#ff7d72", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                              Ver
                            </button>
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

      {/* Detail / Response modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ ...MODAL_GLASS, borderRadius: 22, padding: 28, maxWidth: 580, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            {/* Modal header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 24 }}>{TYPE_META[selected.type]?.icon ?? "📄"}</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: TYPE_META[selected.type]?.color ?? "#fff", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                    {TYPE_META[selected.type]?.label ?? selected.type}
                  </div>
                  <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "rgba(255,255,255,0.94)", lineHeight: 1.3 }}>{selected.subject}</h2>
                </div>
              </div>
              <button onClick={() => setSelected(null)}
                style={{ background: "rgba(255,255,255,0.07)", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 16, cursor: "pointer", borderRadius: 8, padding: "4px 9px" }}>
                ✕
              </button>
            </div>

            {/* Descripción */}
            <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 16px", marginBottom: 18, border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Descripción</div>
              <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.72)", lineHeight: 1.7 }}>{selected.description}</p>
            </div>

            {/* Info del remitente */}
            <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "14px 16px", marginBottom: 18, border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Remitente</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", width: 70 }}>Nombre</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{selected.submitter_name ?? <em style={{ color: "rgba(255,255,255,0.25)" }}>Anónimo</em>}</span>
                </div>
                {selected.submitter_email && (
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", width: 70 }}>Email</span>
                    <a href={`mailto:${selected.submitter_email}`} style={{ fontSize: 13, color: "#60a5fa", textDecoration: "none", fontWeight: 600 }}>{selected.submitter_email}</a>
                  </div>
                )}
                {selected.submitter_phone && (
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", width: 70 }}>Teléfono</span>
                    <a href={`https://wa.me/${selected.submitter_phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#34d399", textDecoration: "none", fontWeight: 600 }}>
                      {selected.submitter_phone} (WhatsApp ↗)
                    </a>
                  </div>
                )}
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", width: 70 }}>Dirigido a</span>
                  <span style={{ fontSize: 13, color: selected.target === "zyncra" ? "#ff7d72" : "#60a5fa", fontWeight: 600 }}>
                    {selected.target === "zyncra" ? "Zyncra (plataforma)" : selected.tenant_name ?? "Negocio"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", width: 70 }}>Fecha</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{fmtDate(selected.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Estado + prioridad */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
              <div>
                <label style={lbl}>Estado</label>
                <select value={editStatus} onChange={e => setEditStatus(e.target.value)} style={{ ...inp }}>
                  {Object.entries(STATUS_META).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Prioridad</label>
                <select value={editPriority} onChange={e => setEditPriority(e.target.value)} style={{ ...inp }}>
                  {Object.entries(PRIORITY_META).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Respuesta */}
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Respuesta interna / Para el cliente</label>
              <textarea
                value={response}
                onChange={e => setResponse(e.target.value)}
                placeholder="Escribe aquí la respuesta al PQR. Si el cliente dejó email, puedes copiar esta respuesta y enviársela..."
                rows={5}
                style={{ ...inp, resize: "vertical", minHeight: 100 }}
              />
              {selected.responded_at && (
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginTop: 4 }}>
                  Respondido el {fmtDate(selected.responded_at)}
                </div>
              )}
            </div>

            {/* Acciones */}
            <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center" }}>
              {selected.submitter_email && (
                <a href={`mailto:${selected.submitter_email}?subject=Re: ${encodeURIComponent(selected.subject)}&body=${encodeURIComponent(response || "")}`}
                  style={{ padding: "9px 16px", borderRadius: 10, border: "1px solid rgba(96,165,250,0.3)", background: "rgba(96,165,250,0.08)", color: "#60a5fa", fontWeight: 600, fontSize: 12, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                  ✉ Responder por email
                </a>
              )}
              <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
                <button onClick={() => setSelected(null)}
                  style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.14)", background: "transparent", color: "rgba(255,255,255,0.42)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                  Cancelar
                </button>
                <button onClick={saveResponse} disabled={saving}
                  style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: "#fb0f05", color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
