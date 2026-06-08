"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";
import { IconBanknotes, IconPlus, IconX, IconClock } from "../ZyncraIcons";

interface CashSession {
  id: string; tenant_id: string; opened_at: string; closed_at: string | null;
  opening_amount: number; closing_amount: number | null;
  opening_note: string | null; closing_note: string | null;
}
interface CashMovement {
  id: string; session_id: string; type: "ingreso" | "egreso"; amount: number;
  description: string; category: string | null; pos_sale_id: string | null;
  payment_method: string | null; created_at: string;
}

const INGRESO_CATS = ["Servicio", "Producto", "Propina", "Otro"];
const EGRESO_CATS  = ["Arriendo", "Nómina", "Insumos", "Servicios públicos", "Otro"];

const PM_META: Record<string, { label: string; color: string; icon: string }> = {
  efectivo:  { label: "Efectivo",   color: "#10b981", icon: "💵" },
  tarjeta:   { label: "Tarjeta",    color: "#6366f1", icon: "💳" },
  nequi:     { label: "Nequi",      color: "#0027fe", icon: "📱" },
  daviplata: { label: "Daviplata",  color: "#f59e0b", icon: "🟡" },
};

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 13px", border: "1.5px solid #e8e6e2",
  borderRadius: 10, fontSize: 14, background: "rgba(20,15,30,0.025)", color: "#14111C",
  fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif", outline: "none", boxSizing: "border-box",
};
const lbl: React.CSSProperties = {
  display: "block", fontWeight: 600, fontSize: 11, color: "#564E66",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em",
};

function MetricCard({ label, value, color = "#14111C", gradient = false }: { label: string; value: string; color?: string; gradient?: boolean }) {
  return (
    <div style={{ background: "white", borderRadius: 16, border: "1px solid #e8e6e2", padding: "18px 20px" }}>
      <div style={{
        fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 4,
        ...(gradient ? { background: "linear-gradient(135deg,#fb0f05,#0027fe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } : { color }),
      }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#8E879B", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
    </div>
  );
}

export default function TabCaja() {
  const { tenantId, currency, locale } = useAdmin();
  const fmt     = (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  const [subTab, setSubTab] = useState<"caja" | "historial">("caja");
  const [session, setSession] = useState<CashSession | null>(null);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [loadingSession, setLoadingSession] = useState(true);
  const [sessions, setSessions] = useState<(CashSession & { ingresos: number; egresos: number })[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [openAmount, setOpenAmount] = useState("");
  const [openNote, setOpenNote] = useState("");
  const [openingSaving, setOpeningSaving] = useState(false);
  const [openingMsg, setOpeningMsg] = useState("");
  const [showMov, setShowMov] = useState(false);
  const [movForm, setMovForm] = useState({ type: "ingreso" as "ingreso" | "egreso", amount: "", description: "", category: "" });
  const [movSaving, setMovSaving] = useState(false);
  const [movMsg, setMovMsg] = useState("");
  const [showCierre, setShowCierre] = useState(false);
  const [cierreAmount, setCierreAmount] = useState("");
  const [cierreNote, setCierreNote] = useState("");
  const [cierreSaving, setCierreSaving] = useState(false);
  const [cierreMsg, setCierreMsg] = useState("");

  const loadSession = useCallback(async (tid: string) => {
    setLoadingSession(true);
    const { data: sess } = await supabase.from("cash_sessions").select("*").eq("tenant_id", tid).is("closed_at", null).order("opened_at", { ascending: false }).limit(1).maybeSingle();
    setSession(sess || null);
    if (sess) {
      const { data: movs } = await supabase.from("cash_movements").select("*").eq("session_id", sess.id).order("created_at", { ascending: false });
      setMovements(movs || []);
    } else { setMovements([]); }
    setLoadingSession(false);
  }, []);

  const loadHistory = useCallback(async (tid: string) => {
    setLoadingHistory(true);
    const { data: list } = await supabase.from("cash_sessions").select("*").eq("tenant_id", tid).not("closed_at", "is", null).order("opened_at", { ascending: false }).limit(30);
    if (!list?.length) { setSessions([]); setLoadingHistory(false); return; }
    const { data: allMovs } = await supabase.from("cash_movements").select("session_id, type, amount").in("session_id", list.map((s: CashSession) => s.id));
    setSessions(list.map((s: CashSession) => {
      const ms = (allMovs || []).filter((m: any) => m.session_id === s.id);
      return { ...s, ingresos: ms.filter((m: any) => m.type === "ingreso").reduce((a: number, m: any) => a + Number(m.amount), 0), egresos: ms.filter((m: any) => m.type === "egreso").reduce((a: number, m: any) => a + Number(m.amount), 0) };
    }));
    setLoadingHistory(false);
  }, []);

  useEffect(() => {
    if (!tenantId) return;
    if (subTab === "caja") loadSession(tenantId);
    else loadHistory(tenantId);
  }, [tenantId, subTab, loadSession, loadHistory]);

  const handleOpen = async () => {
    if (!tenantId) return;
    const amount = parseFloat(openAmount.replace(/[^0-9.]/g, ""));
    if (isNaN(amount) || amount < 0) { setOpeningMsg("Ingresa un fondo inicial válido."); return; }
    setOpeningSaving(true); setOpeningMsg("");
    const { data, error } = await supabase.from("cash_sessions").insert({ tenant_id: tenantId, opening_amount: amount, opening_note: openNote.trim() || null }).select().single();
    setOpeningSaving(false);
    if (error) { setOpeningMsg("Error: " + error.message); return; }
    setSession(data); setMovements([]); setOpenAmount(""); setOpenNote("");
  };

  const handleMovimiento = async () => {
    if (!tenantId || !session) return;
    const amount = parseFloat(movForm.amount.replace(/[^0-9.]/g, ""));
    if (isNaN(amount) || amount <= 0) { setMovMsg("Ingresa un monto válido."); return; }
    if (!movForm.description.trim()) { setMovMsg("La descripción es obligatoria."); return; }
    setMovSaving(true); setMovMsg("");
    const { data, error } = await supabase.from("cash_movements").insert({ session_id: session.id, tenant_id: tenantId, type: movForm.type, amount, description: movForm.description.trim(), category: movForm.category || null }).select().single();
    setMovSaving(false);
    if (error) { setMovMsg("Error: " + error.message); return; }
    setMovements(prev => [data, ...prev]); setMovMsg("Movimiento registrado.");
    setTimeout(() => { setShowMov(false); setMovForm({ type: "ingreso", amount: "", description: "", category: "" }); setMovMsg(""); }, 800);
  };

  const handleCierre = async () => {
    if (!tenantId || !session) return;
    const amount = parseFloat(cierreAmount.replace(/[^0-9.]/g, ""));
    if (isNaN(amount) || amount < 0) { setCierreMsg("Ingresa el efectivo contado."); return; }
    setCierreSaving(true); setCierreMsg("");
    const { error } = await supabase.from("cash_sessions").update({ closed_at: new Date().toISOString(), closing_amount: amount, closing_note: cierreNote.trim() || null }).eq("id", session.id);
    setCierreSaving(false);
    if (error) { setCierreMsg("Error: " + error.message); return; }
    setCierreMsg("Caja cerrada con éxito.");
    setTimeout(() => { setShowCierre(false); setSession(null); setMovements([]); setCierreAmount(""); setCierreNote(""); setCierreMsg(""); }, 900);
  };

  const totalIngresos = movements.filter(m => m.type === "ingreso").reduce((s, m) => s + Number(m.amount), 0);
  const totalEgresos  = movements.filter(m => m.type === "egreso").reduce((s, m) => s + Number(m.amount), 0);
  const balance = session ? Number(session.opening_amount) + totalIngresos - totalEgresos : 0;
  const cats = movForm.type === "ingreso" ? INGRESO_CATS : EGRESO_CATS;

  const pmBreakdown = Object.entries(PM_META).map(([key, meta]) => {
    let total = 0;
    if (key === "efectivo") {
      total = (session ? Number(session.opening_amount) : 0) + movements.filter(m => m.type === "ingreso" && (!m.payment_method || m.payment_method === "efectivo")).reduce((s, m) => s + Number(m.amount), 0) - totalEgresos;
    } else {
      total = movements.filter(m => m.type === "ingreso" && m.payment_method === key).reduce((s, m) => s + Number(m.amount), 0);
    }
    return { key, ...meta, total };
  });

  const FONT = "var(--font-space-grotesk),'Space Grotesk',sans-serif";
  const modalOverlay: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 300, background: "rgba(17,17,24,.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, fontFamily: FONT }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Sub-tab */}
      <div style={{ display: "flex", gap: 4, background: "rgba(20,15,30,0.04)", padding: 4, borderRadius: 12, width: "fit-content" }}>
        {(["caja", "historial"] as const).map(t => (
          <button key={t} onClick={() => setSubTab(t)} style={{
            padding: "7px 18px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", fontFamily: FONT, transition: "all 0.15s",
            background: subTab === t ? "linear-gradient(135deg,#fb0f05,#0027fe)" : "transparent",
            color: subTab === t ? "#fff" : "#564E66",
            boxShadow: subTab === t ? "0 2px 8px rgba(251,15,5,.25)" : "none",
          }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {/* ── Tab: Caja ── */}
      {subTab === "caja" && (
        loadingSession ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <div style={{ width: 36, height: 36, border: "3px solid #e8e6e2", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
          </div>
        ) : !session ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "white", borderRadius: 24, border: "1px solid #e8e6e2", padding: "40px 36px", maxWidth: 420, width: "100%", textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(251,15,5,.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", color: "#fb0f05" }}>
                <IconBanknotes size={32} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#14111C", marginBottom: 6 }}>Caja cerrada</div>
              <div style={{ fontSize: 13, color: "#8E879B", marginBottom: 28 }}>Abre la caja para registrar movimientos del día.</div>
              <div style={{ textAlign: "left", marginBottom: 14 }}>
                <label style={lbl}>Fondo inicial ({currency}) *</label>
                <input type="number" min={0} step={1000} value={openAmount} onChange={e => setOpenAmount(e.target.value)} placeholder="Ej. 200000" style={inp} />
              </div>
              <div style={{ textAlign: "left", marginBottom: 22 }}>
                <label style={lbl}>Nota de apertura (opcional)</label>
                <input type="text" value={openNote} onChange={e => setOpenNote(e.target.value)} placeholder="Ej. Turno mañana" style={inp} />
              </div>
              {openingMsg && <p style={{ fontSize: 13, marginBottom: 12, fontWeight: 600, color: openingMsg.startsWith("Error") ? "#ef4444" : "#10b981" }}>{openingMsg}</p>}
              <button onClick={handleOpen} disabled={openingSaving || !openAmount} style={{ width: "100%", padding: 13, borderRadius: 12, border: "none", background: (!openAmount || openingSaving) ? "rgba(20,15,30,.08)" : "linear-gradient(135deg,#fb0f05,#0027fe)", color: (!openAmount || openingSaving) ? "#8E879B" : "#fff", fontSize: 15, fontWeight: 700, cursor: (!openAmount || openingSaving) ? "not-allowed" : "pointer", fontFamily: FONT }}>
                {openingSaving ? "Abriendo..." : "Abrir Caja"}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.2)", borderRadius: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 0 3px rgba(16,185,129,.2)" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>Caja abierta</span>
              <span style={{ fontSize: 12, color: "#8E879B" }}>desde las {fmtTime(session.opened_at)}</span>
              {session.opening_note && <span style={{ fontSize: 12, color: "#564E66" }}>· {session.opening_note}</span>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
              <MetricCard label="Fondo inicial"  value={fmt(session.opening_amount)} color="#564E66" />
              <MetricCard label="Total ingresos" value={fmt(totalIngresos)}          color="#10b981" />
              <MetricCard label="Total egresos"  value={fmt(totalEgresos)}           color="#ef4444" />
              <MetricCard label="Balance actual" value={fmt(balance)}                gradient />
            </div>

            {/* Payment method breakdown */}
            <div style={{ background: "white", borderRadius: 18, border: "1px solid #e8e6e2", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #e8e6e2", fontWeight: 700, fontSize: 13, color: "#14111C" }}>Saldo por método de pago</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
                {pmBreakdown.map((pm, i) => (
                  <div key={pm.key} style={{ padding: "18px 20px", borderRight: i < pmBreakdown.length - 1 ? "1px solid #f0eeeb" : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <span style={{ fontSize: 16 }}>{pm.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#8E879B", textTransform: "uppercase", letterSpacing: "0.06em" }}>{pm.label}</span>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: pm.total < 0 ? "#ef4444" : pm.color }}>{fmt(pm.total)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => { setMovForm({ type: "ingreso", amount: "", description: "", category: "" }); setMovMsg(""); setShowMov(true); }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 10, border: "none", background: "rgba(16,185,129,.1)", color: "#10b981", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
                <IconPlus size={15} /> Registrar Movimiento
              </button>
              <button onClick={() => { setCierreAmount(""); setCierreNote(""); setCierreMsg(""); setShowCierre(true); }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 10, border: "1.5px solid rgba(251,15,5,.3)", background: "rgba(251,15,5,.06)", color: "#fb0f05", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
                Cerrar Caja
              </button>
            </div>

            {/* Movements */}
            <div style={{ background: "white", borderRadius: 18, border: "1px solid #e8e6e2", overflow: "hidden" }}>
              <div style={{ padding: "14px 20px", borderBottom: "1px solid #e8e6e2", fontWeight: 700, fontSize: 13, color: "#14111C" }}>
                Movimientos del día <span style={{ color: "#8E879B", fontWeight: 500, fontSize: 12 }}>· {movements.length} registros</span>
              </div>
              {movements.length === 0
                ? <div style={{ padding: "36px 20px", textAlign: "center", color: "#8E879B", fontSize: 14 }}>Sin movimientos aún.</div>
                : movements.map((m, i) => (
                  <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 20px", borderBottom: i < movements.length - 1 ? "1px solid #f7f7fa" : "none" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: m.type === "ingreso" ? "rgba(16,185,129,.1)" : "rgba(239,68,68,.1)", display: "flex", alignItems: "center", justifyContent: "center", color: m.type === "ingreso" ? "#10b981" : "#ef4444", fontSize: 16, fontWeight: 800 }}>
                        {m.type === "ingreso" ? "+" : "−"}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#14111C" }}>{m.description}</div>
                        <div style={{ fontSize: 11, color: "#8E879B", marginTop: 2, display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {m.payment_method && PM_META[m.payment_method] && <span style={{ padding: "2px 8px", borderRadius: 20, fontWeight: 700, fontSize: 10, background: `${PM_META[m.payment_method].color}15`, color: PM_META[m.payment_method].color }}>{PM_META[m.payment_method].label}</span>}
                          {m.category && m.category !== "POS" && <span style={{ padding: "2px 8px", borderRadius: 20, background: "rgba(20,15,30,.04)", color: "#564E66" }}>{m.category}</span>}
                          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><IconClock size={11} /> {fmtTime(m.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: m.type === "ingreso" ? "#10b981" : "#ef4444" }}>
                      {m.type === "ingreso" ? "+" : "−"}{fmt(Number(m.amount))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )
      )}

      {/* ── Tab: Historial ── */}
      {subTab === "historial" && (
        <div style={{ background: "white", borderRadius: 18, border: "1px solid #e8e6e2", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #e8e6e2", fontWeight: 700, fontSize: 13, color: "#14111C" }}>Sesiones anteriores <span style={{ color: "#8E879B", fontWeight: 500, fontSize: 12 }}>· últimas 30</span></div>
          {loadingHistory
            ? <div style={{ padding: "40px 20px", textAlign: "center" }}><div style={{ width: 32, height: 32, border: "3px solid #e8e6e2", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto" }} /></div>
            : sessions.length === 0
              ? <div style={{ padding: "36px 20px", textAlign: "center", color: "#8E879B", fontSize: 14 }}>Sin sesiones cerradas.</div>
              : <>
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 100px 110px 110px 110px", gap: 12, padding: "10px 20px", borderBottom: "1px solid #f0eeeb", fontSize: 11, fontWeight: 700, color: "#8E879B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  <span>Fecha</span><span style={{ textAlign: "right" }}>Fondo</span><span style={{ textAlign: "right" }}>Ingresos</span><span style={{ textAlign: "right" }}>Egresos</span><span style={{ textAlign: "right" }}>Balance</span>
                </div>
                {sessions.map((s, i) => {
                  const bal = Number(s.opening_amount) + s.ingresos - s.egresos;
                  return (
                    <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 100px 110px 110px 110px", gap: 12, padding: "14px 20px", alignItems: "center", borderBottom: i < sessions.length - 1 ? "1px solid #f7f7fa" : "none" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#14111C" }}>{fmtDate(s.opened_at)}</div>
                        <div style={{ fontSize: 11, color: "#8E879B", marginTop: 2 }}>{fmtTime(s.opened_at)} → {s.closed_at ? fmtTime(s.closed_at) : "—"}</div>
                      </div>
                      <div style={{ textAlign: "right", fontSize: 13, color: "#564E66", fontWeight: 600 }}>{fmt(s.opening_amount)}</div>
                      <div style={{ textAlign: "right", fontSize: 13, color: "#10b981", fontWeight: 700 }}>+{fmt(s.ingresos)}</div>
                      <div style={{ textAlign: "right", fontSize: 13, color: "#ef4444", fontWeight: 700 }}>−{fmt(s.egresos)}</div>
                      <div style={{ textAlign: "right", fontWeight: 800, fontSize: 14, background: "linear-gradient(135deg,#fb0f05,#0027fe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{fmt(bal)}</div>
                    </div>
                  );
                })}
              </>}
        </div>
      )}

      {/* ── Modal: Movimiento ── */}
      {showMov && (
        <div style={modalOverlay} onClick={e => { if (e.target === e.currentTarget) setShowMov(false); }}>
          <div style={{ background: "white", borderRadius: 22, padding: 28, width: "100%", maxWidth: 440, boxShadow: "0 24px 64px rgba(0,0,0,.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: "#14111C" }}>Registrar Movimiento</div>
              <button onClick={() => setShowMov(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8E879B" }}><IconX size={18} /></button>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 18, background: "rgba(20,15,30,.04)", padding: 4, borderRadius: 12 }}>
              {(["ingreso", "egreso"] as const).map(t => (
                <button key={t} onClick={() => setMovForm({ ...movForm, type: t, category: "" })} style={{ flex: 1, padding: 9, borderRadius: 9, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT, transition: "all .15s", background: movForm.type === t ? (t === "ingreso" ? "#10b981" : "#ef4444") : "transparent", color: movForm.type === t ? "#fff" : "#564E66" }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Monto ({currency}) *</label>
              <input type="number" min={0} step={1000} value={movForm.amount} onChange={e => setMovForm({ ...movForm, amount: e.target.value })} placeholder="Ej. 50000" style={inp} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Descripción *</label>
              <input type="text" value={movForm.description} onChange={e => setMovForm({ ...movForm, description: e.target.value })} placeholder="Ej. Corte de cabello" style={inp} />
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={lbl}>Categoría</label>
              <select value={movForm.category} onChange={e => setMovForm({ ...movForm, category: e.target.value })} style={{ ...inp, cursor: "pointer" }}>
                <option value="">Sin categoría</option>
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {movMsg && <p style={{ fontSize: 13, marginBottom: 12, fontWeight: 600, color: movMsg.startsWith("Error") ? "#ef4444" : "#10b981" }}>{movMsg}</p>}
            <button onClick={handleMovimiento} disabled={movSaving} style={{ width: "100%", padding: 13, borderRadius: 12, border: "none", background: movSaving ? "rgba(20,15,30,.08)" : "linear-gradient(135deg,#fb0f05,#0027fe)", color: movSaving ? "#8E879B" : "#fff", fontSize: 15, fontWeight: 700, cursor: movSaving ? "not-allowed" : "pointer", fontFamily: FONT }}>
              {movSaving ? "Guardando..." : "Guardar Movimiento"}
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: Cerrar Caja ── */}
      {showCierre && (
        <div style={modalOverlay} onClick={e => { if (e.target === e.currentTarget) setShowCierre(false); }}>
          <div style={{ background: "white", borderRadius: 22, padding: 28, width: "100%", maxWidth: 440, boxShadow: "0 24px 64px rgba(0,0,0,.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: "#14111C" }}>Cerrar Caja</div>
              <button onClick={() => setShowCierre(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8E879B" }}><IconX size={18} /></button>
            </div>
            <div style={{ background: "rgba(20,15,30,.03)", borderRadius: 12, padding: "14px 16px", marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {[["Fondo inicial", fmt(session?.opening_amount || 0)], ["Ingresos", fmt(totalIngresos)], ["Balance esperado", fmt(balance)]].map(([l, v]) => (
                <div key={l}><div style={{ fontSize: 10, fontWeight: 700, color: "#8E879B", textTransform: "uppercase", marginBottom: 3 }}>{l}</div><div style={{ fontWeight: 800, fontSize: 14, color: "#14111C" }}>{v}</div></div>
              ))}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Efectivo contado ({currency}) *</label>
              <input type="number" min={0} step={1000} value={cierreAmount} onChange={e => setCierreAmount(e.target.value)} placeholder="Ingresa el efectivo físico" style={inp} />
              {cierreAmount && !isNaN(parseFloat(cierreAmount)) && (
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: parseFloat(cierreAmount) >= balance ? "#10b981" : "#ef4444" }}>
                  Diferencia: {fmt(parseFloat(cierreAmount) - balance)}
                </div>
              )}
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={lbl}>Nota de cierre (opcional)</label>
              <input type="text" value={cierreNote} onChange={e => setCierreNote(e.target.value)} placeholder="Observaciones del turno" style={inp} />
            </div>
            {cierreMsg && <p style={{ fontSize: 13, marginBottom: 12, fontWeight: 600, color: cierreMsg.startsWith("Error") ? "#ef4444" : "#10b981" }}>{cierreMsg}</p>}
            <button onClick={handleCierre} disabled={cierreSaving || !cierreAmount} style={{ width: "100%", padding: 13, borderRadius: 12, border: "none", background: (!cierreAmount || cierreSaving) ? "rgba(20,15,30,.08)" : "#ef4444", color: (!cierreAmount || cierreSaving) ? "#8E879B" : "#fff", fontSize: 15, fontWeight: 700, cursor: (!cierreAmount || cierreSaving) ? "not-allowed" : "pointer", fontFamily: FONT }}>
              {cierreSaving ? "Cerrando..." : "Confirmar Cierre"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
