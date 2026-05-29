"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";
import { IconBanknotes, IconPlus, IconX, IconClock } from "../ZyncraIcons";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface CashSession {
  id: string;
  tenant_id: string;
  opened_at: string;
  closed_at: string | null;
  opening_amount: number;
  closing_amount: number | null;
  opening_note: string | null;
  closing_note: string | null;
}

interface CashMovement {
  id: string;
  session_id: string;
  type: "ingreso" | "egreso";
  amount: number;
  description: string;
  category: string | null;
  created_at: string;
}

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const INGRESO_CATS = ["Servicio", "Producto", "Propina", "Otro"];
const EGRESO_CATS  = ["Arriendo", "NÃ³mina", "Insumos", "Servicios pÃºblicos", "Otro"];

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

// â”€â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const card: React.CSSProperties = {
  background: "white", borderRadius: 18, border: "1px solid #e8e6e2", overflow: "hidden",
};

const inp: React.CSSProperties = {
  width: "100%", padding: "10px 13px", border: "1.5px solid #e8e6e2",
  borderRadius: 10, fontSize: 14, background: "rgba(20,15,30,0.025)", color: "#14111C",
  fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif", outline: "none", boxSizing: "border-box",
};

const lbl: React.CSSProperties = {
  display: "block", fontWeight: 600, fontSize: 11, color: "#564E66",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em",
};

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
      cursor: "pointer", border: "none", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
      background: active ? "linear-gradient(135deg, #fb0f05, #0027fe)" : "transparent",
      color: active ? "#fff" : "#564E66",
      boxShadow: active ? "0 2px 8px rgba(251,15,5,0.25)" : "none",
      transition: "all 0.15s",
    }}>
      {children}
    </button>
  );
}

function MetricCard({ label, value, color = "#fb0f05", gradient = false }: {
  label: string; value: string; color?: string; gradient?: boolean;
}) {
  return (
    <div style={{ background: "white", borderRadius: 16, border: "1px solid #e8e6e2", padding: "18px 20px" }}>
      <div style={{
        fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 4,
        ...(gradient
          ? { background: "linear-gradient(135deg, #fb0f05, #0027fe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }
          : { color }),
      }}>
        {value}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#8E879B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
    </div>
  );
}

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: "1px solid #e8e6e2" }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05", flexShrink: 0 }}>
        <IconBanknotes size={16} />
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#14111C" }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: "#8E879B", marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

// â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function CajaPage() {
  const { tenantId } = useAdmin();
  const [tab, setTab] = useState<"caja" | "historial">("caja");

  // Session state
  const [session, setSession] = useState<CashSession | null>(null);
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [loadingSession, setLoadingSession] = useState(true);

  // Historial
  const [sessions, setSessions] = useState<(CashSession & { ingresos: number; egresos: number })[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Apertura
  const [openAmount, setOpenAmount] = useState("");
  const [openNote, setOpenNote] = useState("");
  const [openingSaving, setOpeningSaving] = useState(false);
  const [openingMsg, setOpeningMsg] = useState("");

  // Movimiento modal
  const [showMov, setShowMov] = useState(false);
  const [movForm, setMovForm] = useState({ type: "ingreso" as "ingreso" | "egreso", amount: "", description: "", category: "" });
  const [movSaving, setMovSaving] = useState(false);
  const [movMsg, setMovMsg] = useState("");

  // Cierre modal
  const [showCierre, setShowCierre] = useState(false);
  const [cierreAmount, setCierreAmount] = useState("");
  const [cierreNote, setCierreNote] = useState("");
  const [cierreSaving, setCierreSaving] = useState(false);
  const [cierreMsg, setCierreMsg] = useState("");

  // â”€â”€ Load open session â”€â”€
  const loadSession = useCallback(async (tid: string) => {
    setLoadingSession(true);
    const { data: sess } = await supabase
      .from("cash_sessions")
      .select("*")
      .eq("tenant_id", tid)
      .is("closed_at", null)
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setSession(sess || null);

    if (sess) {
      const { data: movs } = await supabase
        .from("cash_movements")
        .select("*")
        .eq("session_id", sess.id)
        .order("created_at", { ascending: false });
      setMovements(movs || []);
    } else {
      setMovements([]);
    }
    setLoadingSession(false);
  }, []);

  // â”€â”€ Load history â”€â”€
  const loadHistory = useCallback(async (tid: string) => {
    setLoadingHistory(true);
    const { data: sessList } = await supabase
      .from("cash_sessions")
      .select("*")
      .eq("tenant_id", tid)
      .not("closed_at", "is", null)
      .order("opened_at", { ascending: false })
      .limit(30);

    if (!sessList || sessList.length === 0) { setSessions([]); setLoadingHistory(false); return; }

    const { data: allMovs } = await supabase
      .from("cash_movements")
      .select("session_id, type, amount")
      .in("session_id", sessList.map((s: CashSession) => s.id));

    const enriched = sessList.map((s: CashSession) => {
      const movs = (allMovs || []).filter((m: any) => m.session_id === s.id);
      const ingresos = movs.filter((m: any) => m.type === "ingreso").reduce((acc: number, m: any) => acc + Number(m.amount), 0);
      const egresos  = movs.filter((m: any) => m.type === "egreso").reduce((acc: number, m: any) => acc + Number(m.amount), 0);
      return { ...s, ingresos, egresos };
    });
    setSessions(enriched);
    setLoadingHistory(false);
  }, []);

  useEffect(() => {
    if (!tenantId) return;
    if (tab === "caja") loadSession(tenantId);
    if (tab === "historial") loadHistory(tenantId);
  }, [tenantId, tab, loadSession, loadHistory]);

  // â”€â”€ Abrir caja â”€â”€
  const handleOpen = async () => {
    if (!tenantId) return;
    const amount = parseFloat(openAmount.replace(/[^0-9.]/g, ""));
    if (isNaN(amount) || amount < 0) { setOpeningMsg("Ingresa un fondo inicial vÃ¡lido."); return; }
    setOpeningSaving(true); setOpeningMsg("");
    const { data, error } = await supabase.from("cash_sessions").insert({
      tenant_id: tenantId,
      opening_amount: amount,
      opening_note: openNote.trim() || null,
    }).select().single();
    setOpeningSaving(false);
    if (error) { setOpeningMsg("Error: " + error.message); return; }
    setSession(data); setMovements([]);
    setOpenAmount(""); setOpenNote("");
  };

  // â”€â”€ Registrar movimiento â”€â”€
  const handleMovimiento = async () => {
    if (!tenantId || !session) return;
    const amount = parseFloat(movForm.amount.replace(/[^0-9.]/g, ""));
    if (isNaN(amount) || amount <= 0) { setMovMsg("Ingresa un monto vÃ¡lido."); return; }
    if (!movForm.description.trim()) { setMovMsg("La descripciÃ³n es obligatoria."); return; }
    setMovSaving(true); setMovMsg("");
    const { data, error } = await supabase.from("cash_movements").insert({
      session_id: session.id,
      tenant_id: tenantId,
      type: movForm.type,
      amount,
      description: movForm.description.trim(),
      category: movForm.category || null,
    }).select().single();
    setMovSaving(false);
    if (error) { setMovMsg("Error: " + error.message); return; }
    setMovements(prev => [data, ...prev]);
    setMovMsg("Movimiento registrado.");
    setTimeout(() => { setShowMov(false); setMovForm({ type: "ingreso", amount: "", description: "", category: "" }); setMovMsg(""); }, 800);
  };

  // â”€â”€ Cerrar caja â”€â”€
  const handleCierre = async () => {
    if (!tenantId || !session) return;
    const amount = parseFloat(cierreAmount.replace(/[^0-9.]/g, ""));
    if (isNaN(amount) || amount < 0) { setCierreMsg("Ingresa el efectivo contado."); return; }
    setCierreSaving(true); setCierreMsg("");
    const { error } = await supabase.from("cash_sessions").update({
      closed_at: new Date().toISOString(),
      closing_amount: amount,
      closing_note: cierreNote.trim() || null,
    }).eq("id", session.id);
    setCierreSaving(false);
    if (error) { setCierreMsg("Error: " + error.message); return; }
    setCierreMsg("Caja cerrada con Ã©xito.");
    setTimeout(() => {
      setShowCierre(false); setSession(null); setMovements([]);
      setCierreAmount(""); setCierreNote(""); setCierreMsg("");
    }, 900);
  };

  // â”€â”€ Derived totals â”€â”€
  const totalIngresos = movements.filter(m => m.type === "ingreso").reduce((s, m) => s + Number(m.amount), 0);
  const totalEgresos  = movements.filter(m => m.type === "egreso").reduce((s, m) => s + Number(m.amount), 0);
  const balance = session ? Number(session.opening_amount) + totalIngresos - totalEgresos : 0;

  const cats = movForm.type === "ingreso" ? INGRESO_CATS : EGRESO_CATS;

  // â”€â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: "-0.5px", color: "#14111C" }}>Sistema de Caja</h1>
          <p style={{ color: "#8E879B", fontSize: 13, marginTop: 3 }}>Control de ingresos y egresos del dÃ­a.</p>
        </div>
        <div style={{ display: "flex", gap: 4, background: "rgba(20,15,30,0.04)", padding: 4, borderRadius: 14 }}>
          <TabBtn active={tab === "caja"} onClick={() => setTab("caja")}>Caja</TabBtn>
          <TabBtn active={tab === "historial"} onClick={() => setTab("historial")}>Historial</TabBtn>
        </div>
      </div>

      {/* â”€â”€ TAB: Caja â”€â”€ */}
      {tab === "caja" && (
        loadingSession ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "40vh" }}>
            <div style={{ width: 36, height: 36, border: "3px solid #e8e6e2", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
          </div>
        ) : !session ? (
          /* â”€â”€ CAJA CERRADA â”€â”€ */
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "white", borderRadius: 24, border: "1px solid #e8e6e2", padding: "40px 36px", maxWidth: 420, width: "100%", textAlign: "center" }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", color: "#fb0f05" }}>
                <IconBanknotes size={32} />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#14111C", marginBottom: 6 }}>Caja cerrada</div>
              <div style={{ fontSize: 13, color: "#8E879B", marginBottom: 28 }}>Abre la caja para empezar a registrar movimientos.</div>

              <div style={{ textAlign: "left", marginBottom: 14 }}>
                <label style={lbl}>Fondo inicial (COP) *</label>
                <input
                  type="number" min={0} step={1000}
                  value={openAmount} onChange={e => setOpenAmount(e.target.value)}
                  placeholder="Ej. 200000" style={inp}
                />
              </div>
              <div style={{ textAlign: "left", marginBottom: 22 }}>
                <label style={lbl}>Nota de apertura (opcional)</label>
                <input
                  type="text" value={openNote} onChange={e => setOpenNote(e.target.value)}
                  placeholder="Ej. Turno maÃ±ana" style={inp}
                />
              </div>

              {openingMsg && <p style={{ fontSize: 13, marginBottom: 12, fontWeight: 600, color: openingMsg.startsWith("Error") ? "#ef4444" : "#10b981" }}>{openingMsg}</p>}

              <button onClick={handleOpen} disabled={openingSaving || !openAmount}
                style={{
                  width: "100%", padding: "13px", borderRadius: 12, border: "none",
                  background: (!openAmount || openingSaving) ? "rgba(20,15,30,0.08)" : "linear-gradient(135deg, #fb0f05, #0027fe)",
                  color: (!openAmount || openingSaving) ? "#8E879B" : "#fff",
                  fontSize: 15, fontWeight: 700, cursor: (!openAmount || openingSaving) ? "not-allowed" : "pointer",
                  fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                }}>
                {openingSaving ? "Abriendo..." : "Abrir Caja"}
              </button>
            </div>
          </div>
        ) : (
          /* â”€â”€ CAJA ABIERTA â”€â”€ */
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Status banner */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981", flexShrink: 0, boxShadow: "0 0 0 3px rgba(16,185,129,0.2)" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#10b981" }}>Caja abierta</span>
              <span style={{ fontSize: 12, color: "#8E879B", marginLeft: 4 }}>desde las {fmtTime(session.opened_at)}</span>
              {session.opening_note && <span style={{ fontSize: 12, color: "#564E66", marginLeft: 4 }}>Â· {session.opening_note}</span>}
            </div>

            {/* Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              <MetricCard label="Fondo inicial"    value={fmt(session.opening_amount)} color="#564E66" />
              <MetricCard label="Total ingresos"   value={fmt(totalIngresos)}          color="#10b981" />
              <MetricCard label="Total egresos"    value={fmt(totalEgresos)}           color="#ef4444" />
              <MetricCard label="Balance actual"   value={fmt(balance)}                gradient />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => { setMovForm({ type: "ingreso", amount: "", description: "", category: "" }); setMovMsg(""); setShowMov(true); }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 10, border: "none", background: "rgba(16,185,129,0.1)", color: "#10b981", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>
                <IconPlus size={15} /> Registrar Movimiento
              </button>
              <button onClick={() => { setCierreAmount(""); setCierreNote(""); setCierreMsg(""); setShowCierre(true); }}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 10, border: "1.5px solid rgba(251,15,5,0.3)", background: "rgba(251,15,5,0.06)", color: "#fb0f05", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>
                Cerrar Caja
              </button>
            </div>

            {/* Movements list */}
            <div style={card}>
              <SectionHeader title="Movimientos del dÃ­a" sub={`${movements.length} registros`} />
              {movements.length === 0 ? (
                <div style={{ padding: "36px 20px", textAlign: "center", color: "#8E879B", fontSize: 14 }}>
                  Sin movimientos aÃºn. Registra el primero.
                </div>
              ) : (
                movements.map((m, i) => (
                  <div key={m.id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "13px 20px", borderBottom: i < movements.length - 1 ? "1px solid #f0eeeb" : "none",
                  }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: m.type === "ingreso" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: m.type === "ingreso" ? "#10b981" : "#ef4444",
                        fontSize: 16, fontWeight: 800,
                      }}>
                        {m.type === "ingreso" ? "+" : "âˆ’"}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#14111C" }}>{m.description}</div>
                        <div style={{ fontSize: 11, color: "#8E879B", marginTop: 2, display: "flex", gap: 8, alignItems: "center" }}>
                          {m.category && <span style={{ padding: "2px 8px", borderRadius: 20, background: "rgba(20,15,30,0.04)", color: "#564E66" }}>{m.category}</span>}
                          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                            <IconClock size={11} /> {fmtTime(m.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: m.type === "ingreso" ? "#10b981" : "#ef4444" }}>
                      {m.type === "ingreso" ? "+" : "âˆ’"}{fmt(Number(m.amount))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      )}

      {/* â”€â”€ TAB: Historial â”€â”€ */}
      {tab === "historial" && (
        <div style={card}>
          <SectionHeader title="Sesiones anteriores" sub="Ãšltimas 30 sesiones cerradas" />
          {loadingHistory ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ width: 32, height: 32, border: "3px solid #e8e6e2", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto" }} />
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#8E879B", fontSize: 14 }}>
              Sin sesiones cerradas aÃºn.
            </div>
          ) : (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 100px 110px 110px 110px", gap: 12, padding: "10px 20px", borderBottom: "1px solid #f0eeeb", fontSize: 11, fontWeight: 700, color: "#8E879B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <span>Fecha</span>
                <span style={{ textAlign: "right" }}>Fondo</span>
                <span style={{ textAlign: "right" }}>Ingresos</span>
                <span style={{ textAlign: "right" }}>Egresos</span>
                <span style={{ textAlign: "right" }}>Balance</span>
              </div>
              {sessions.map((s, i) => {
                const bal = Number(s.opening_amount) + s.ingresos - s.egresos;
                return (
                  <div key={s.id} style={{
                    display: "grid", gridTemplateColumns: "1.5fr 100px 110px 110px 110px",
                    gap: 12, padding: "14px 20px", alignItems: "center",
                    borderBottom: i < sessions.length - 1 ? "1px solid #f0eeeb" : "none",
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#14111C" }}>{fmtDate(s.opened_at)}</div>
                      <div style={{ fontSize: 11, color: "#8E879B", marginTop: 2 }}>
                        {fmtTime(s.opened_at)} â†’ {s.closed_at ? fmtTime(s.closed_at) : "â€”"}
                        {s.opening_note && ` Â· ${s.opening_note}`}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 13, color: "#564E66", fontWeight: 600 }}>{fmt(s.opening_amount)}</div>
                    <div style={{ textAlign: "right", fontSize: 13, color: "#10b981", fontWeight: 700 }}>+{fmt(s.ingresos)}</div>
                    <div style={{ textAlign: "right", fontSize: 13, color: "#ef4444", fontWeight: 700 }}>âˆ’{fmt(s.egresos)}</div>
                    <div style={{ textAlign: "right", fontWeight: 800, fontSize: 14, background: "linear-gradient(135deg, #fb0f05, #0027fe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      {fmt(bal)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* â”€â”€ Modal: Registrar Movimiento â”€â”€ */}
      {showMov && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(17,17,24,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowMov(false); }}>
          <div style={{ background: "white", borderRadius: 22, padding: 28, width: "100%", maxWidth: 440, boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: "#14111C" }}>Registrar Movimiento</div>
              <button onClick={() => setShowMov(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8E879B" }}><IconX size={18} /></button>
            </div>

            {/* Type toggle */}
            <div style={{ display: "flex", gap: 8, marginBottom: 18, background: "rgba(20,15,30,0.04)", padding: 4, borderRadius: 12 }}>
              {(["ingreso", "egreso"] as const).map(t => (
                <button key={t} onClick={() => setMovForm({ ...movForm, type: t, category: "" })}
                  style={{
                    flex: 1, padding: "9px", borderRadius: 9, border: "none", fontSize: 13, fontWeight: 700,
                    cursor: "pointer", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif", transition: "all 0.15s",
                    background: movForm.type === t ? (t === "ingreso" ? "#10b981" : "#ef4444") : "transparent",
                    color: movForm.type === t ? "#fff" : "#564E66",
                  }}>
                  {t === "ingreso" ? "Ingreso" : "Egreso"}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Monto (COP) *</label>
              <input type="number" min={0} step={1000} value={movForm.amount} onChange={e => setMovForm({ ...movForm, amount: e.target.value })} placeholder="Ej. 50000" style={inp} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>DescripciÃ³n *</label>
              <input type="text" value={movForm.description} onChange={e => setMovForm({ ...movForm, description: e.target.value })} placeholder={movForm.type === "ingreso" ? "Ej. Corte de cabello" : "Ej. Pago de arriendo"} style={inp} />
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={lbl}>CategorÃ­a</label>
              <select value={movForm.category} onChange={e => setMovForm({ ...movForm, category: e.target.value })} style={inp}>
                <option value="">â€” Sin categorÃ­a â€”</option>
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {movMsg && <p style={{ fontSize: 13, marginBottom: 12, fontWeight: 600, color: movMsg.startsWith("Error") ? "#ef4444" : "#10b981" }}>{movMsg}</p>}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowMov(false)} className="btn-secondary" disabled={movSaving}>Cancelar</button>
              <button onClick={handleMovimiento} disabled={movSaving || !movForm.amount || !movForm.description}
                style={{
                  padding: "10px 22px", borderRadius: 11, border: "none", fontSize: 14, fontWeight: 700,
                  cursor: (movSaving || !movForm.amount || !movForm.description) ? "not-allowed" : "pointer",
                  background: (movSaving || !movForm.amount || !movForm.description) ? "rgba(20,15,30,0.08)"
                    : movForm.type === "ingreso" ? "#10b981" : "#ef4444",
                  color: "#fff", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                }}>
                {movSaving ? "Guardando..." : `Registrar ${movForm.type === "ingreso" ? "Ingreso" : "Egreso"}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Modal: Cerrar Caja â”€â”€ */}
      {showCierre && session && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(17,17,24,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowCierre(false); }}>
          <div style={{ background: "white", borderRadius: 22, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: "#14111C" }}>Cerrar Caja</div>
              <button onClick={() => setShowCierre(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8E879B" }}><IconX size={18} /></button>
            </div>

            {/* Summary */}
            <div style={{ background: "rgba(20,15,30,0.025)", border: "1px solid #e8e6e2", borderRadius: 14, padding: "16px 18px", marginBottom: 18 }}>
              {[
                ["Fondo inicial",   fmt(session.opening_amount), "#564E66"],
                ["Total ingresos",  fmt(totalIngresos),          "#10b981"],
                ["Total egresos",   fmt(totalEgresos),           "#ef4444"],
              ].map(([k, v, c]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: "#564E66" }}>{k}</span>
                  <span style={{ fontWeight: 700, color: c }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, borderTop: "1px solid #e8e6e2", paddingTop: 10, marginTop: 4 }}>
                <span style={{ fontWeight: 700, color: "#14111C" }}>Balance esperado</span>
                <span style={{ fontWeight: 800, background: "linear-gradient(135deg, #fb0f05, #0027fe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {fmt(balance)}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Efectivo contado (COP) *</label>
              <input type="number" min={0} step={1000} value={cierreAmount} onChange={e => setCierreAmount(e.target.value)} placeholder="Lo que hay fÃ­sicamente en caja" style={inp} />
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={lbl}>Nota de cierre (opcional)</label>
              <input type="text" value={cierreNote} onChange={e => setCierreNote(e.target.value)} placeholder="Ej. Turno tarde" style={inp} />
            </div>

            {/* Diferencia */}
            {cierreAmount && (
              <div style={{ marginBottom: 18, padding: "10px 14px", borderRadius: 10, background: "rgba(251,15,5,0.05)", border: "1px solid rgba(251,15,5,0.15)" }}>
                <div style={{ fontSize: 12, color: "#564E66", marginBottom: 2 }}>Diferencia</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: parseFloat(cierreAmount) - balance >= 0 ? "#10b981" : "#ef4444" }}>
                  {fmt(parseFloat(cierreAmount) - balance)}
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#8E879B", marginLeft: 6 }}>
                    {parseFloat(cierreAmount) - balance >= 0 ? "sobrante" : "faltante"}
                  </span>
                </div>
              </div>
            )}

            {cierreMsg && <p style={{ fontSize: 13, marginBottom: 12, fontWeight: 600, color: cierreMsg.startsWith("Error") ? "#ef4444" : "#10b981" }}>{cierreMsg}</p>}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowCierre(false)} className="btn-secondary" disabled={cierreSaving}>Cancelar</button>
              <button onClick={handleCierre} disabled={cierreSaving || !cierreAmount}
                style={{
                  padding: "10px 22px", borderRadius: 11, border: "none", fontSize: 14, fontWeight: 700,
                  cursor: (cierreSaving || !cierreAmount) ? "not-allowed" : "pointer",
                  background: (cierreSaving || !cierreAmount) ? "rgba(20,15,30,0.08)" : "linear-gradient(135deg, #fb0f05, #0027fe)",
                  color: (cierreSaving || !cierreAmount) ? "#8E879B" : "#fff",
                  fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                }}>
                {cierreSaving ? "Cerrando..." : "Confirmar Cierre"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
