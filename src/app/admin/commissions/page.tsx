-"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";
import { IconChartBar, IconUsers, IconBanknotes, IconX, IconPercent } from "../ZyncraIcons";

// -"-"-"- Types -"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-

interface Professional {
  id: string;
  name: string;
  role: string;
}

interface CommissionRule {
  professional_id: string;
  type: "percentage" | "fixed";
  value: number;
}

interface ProfSummary {
  prof: Professional;
  rule: CommissionRule | null;
  count: number;
  revenue: number;
  commission: number;
}

interface Payment {
  id: string;
  professional_id: string;
  period_start: string;
  period_end: string;
  appointments_count: number;
  revenue_total: number;
  commission_amount: number;
  paid_at: string;
  note: string | null;
  professionals: { name: string } | null;
}

// -"-"-"- Helpers -"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-


function calcCommission(revenue: number, count: number, rule: CommissionRule | null) {
  if (!rule) return 0;
  if (rule.type === "percentage") return (revenue * rule.value) / 100;
  return rule.value * count;
}

function periodLabel(start: string, end: string, loc: string) {
  const f = (d: string) => new Date(d + "T12:00:00").toLocaleDateString(loc, { day: "numeric", month: "short" });
  return `${f(start)} - ${f(end)}`;
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
}

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  return { start, end };
}

// -"-"-"- Styles -"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-

const card: React.CSSProperties = {
  background: "white",
  borderRadius: "18px",
  border: "1px solid #e8e6e2",
  overflow: "hidden",
};

const inp: React.CSSProperties = {
  width: "100%",
  padding: "10px 13px",
  border: "1.5px solid #e8e6e2",
  borderRadius: "10px",
  fontSize: "14px",
  background: "rgba(20,15,30,0.025)",
  color: "#14111C",
  fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
  outline: "none",
  boxSizing: "border-box",
};

const lbl: React.CSSProperties = {
  display: "block",
  fontWeight: 600,
  fontSize: "11px",
  color: "#564E66",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

// -"-"-"- Sub-components -"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-

function Avatar({ name }: { name: string }) {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg, #fb0f05, #0027fe)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontWeight: 800, fontSize: 13,
    }}>
      {name.substring(0, 2).toUpperCase()}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
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

function PeriodBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 16px", borderRadius: "9px", fontSize: "12px", fontWeight: 600,
      cursor: "pointer", border: active ? "1.5px solid rgba(251,15,5,0.4)" : "1.5px solid #e8e6e2",
      background: active ? "rgba(251,15,5,0.06)" : "white",
      color: active ? "#fb0f05" : "#564E66",
      fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif", transition: "all 0.15s",
    }}>
      {children}
    </button>
  );
}

function SectionHeader({ title, sub, icon }: { title: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: "1px solid #e8e6e2" }}>
      {icon && (
        <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05", flexShrink: 0 }}>
          {icon}
        </div>
      )}
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#14111C" }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: "#8E879B", marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

// -"-"-"- Main Component -"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-

export default function CommissionsPage() {
  const { tenantId, currency, locale } = useAdmin();
  const fmt = (n: number) => new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

  const [tab, setTab] = useState<"resumen" | "reglas" | "historial">("resumen");

  // Resumen state
  const [period, setPeriod] = useState<"semana" | "mes" | "custom">("semana");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [summaries, setSummaries] = useState<ProfSummary[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [currentRange, setCurrentRange] = useState({ start: "", end: "" });

  // Reglas state
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [editingProf, setEditingProf] = useState<Professional | null>(null);
  const [editForm, setEditForm] = useState({ type: "percentage" as "percentage" | "fixed", value: "" });
  const [savingRule, setSavingRule] = useState(false);
  const [ruleMsg, setRuleMsg] = useState("");

  // Historial state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);

  // Liquidar modal
  const [liquidarTarget, setLiquidarTarget] = useState<ProfSummary | null>(null);
  const [liquidarNote, setLiquidarNote] = useState("");
  const [liquidarSaving, setLiquidarSaving] = useState(false);
  const [liquidarMsg, setLiquidarMsg] = useState("");

  // -"-"- Fetch summary -"-"-
  const fetchSummary = useCallback(async (tid: string, p: "semana" | "mes" | "custom", cStart?: string, cEnd?: string) => {
    setLoadingSummary(true);
    const range = p === "semana" ? getWeekRange() : p === "mes" ? getMonthRange() : { start: cStart || "", end: cEnd || "" };
    if (!range.start || !range.end) { setLoadingSummary(false); return; }
    setCurrentRange(range);

    const [{ data: profs }, { data: apts }, { data: rulesData }] = await Promise.all([
      supabase.from("professionals").select("id,name,role").eq("tenant_id", tid).eq("is_active", true).order("name"),
      supabase.from("appointments")
        .select("professional_id, status, services(price)")
        .eq("tenant_id", tid)
        .gte("appointment_date", range.start)
        .lte("appointment_date", range.end)
        .neq("status", "cancelled"),
      supabase.from("commission_rules").select("professional_id,type,value").eq("tenant_id", tid),
    ]);

    const ruleMap: Record<string, CommissionRule> = {};
    (rulesData || []).forEach((r: any) => { ruleMap[r.professional_id] = r; });

    const result: ProfSummary[] = (profs || []).map((prof: Professional) => {
      const profApts = (apts || []).filter((a: any) => a.professional_id === prof.id);
      const revenue = profApts.reduce((s: number, a: any) => s + Number(a.services?.price || 0), 0);
      const rule = ruleMap[prof.id] || null;
      return { prof, rule, count: profApts.length, revenue, commission: calcCommission(revenue, profApts.length, rule) };
    });

    setSummaries(result);
    setLoadingSummary(false);
  }, []);

  // -"-"- Fetch rules -"-"-
  const fetchRules = useCallback(async (tid: string) => {
    setLoadingRules(true);
    const [{ data: profs }, { data: rulesData }] = await Promise.all([
      supabase.from("professionals").select("id,name,role").eq("tenant_id", tid).eq("is_active", true).order("name"),
      supabase.from("commission_rules").select("professional_id,type,value").eq("tenant_id", tid),
    ]);
    setProfessionals(profs || []);
    setRules(rulesData || []);
    setLoadingRules(false);
  }, []);

  // -"-"- Fetch payments -"-"-
  const fetchPayments = useCallback(async (tid: string) => {
    setLoadingPayments(true);
    const { data } = await supabase
      .from("commission_payments")
      .select("*, professionals(name)")
      .eq("tenant_id", tid)
      .order("paid_at", { ascending: false })
      .limit(50);
    setPayments(data || []);
    setLoadingPayments(false);
  }, []);

  useEffect(() => {
    if (!tenantId) return;
    if (tab === "resumen") fetchSummary(tenantId, period);
    if (tab === "reglas") fetchRules(tenantId);
    if (tab === "historial") fetchPayments(tenantId);
  }, [tenantId, tab, period, fetchSummary, fetchRules, fetchPayments]);

  // -"-"- Save rule -"-"-
  const handleSaveRule = async () => {
    if (!tenantId || !editingProf) return;
    const v = parseFloat(editForm.value);
    if (isNaN(v) || v < 0) { setRuleMsg("Ingresa un valor v-lido."); return; }
    if (editForm.type === "percentage" && v > 100) { setRuleMsg("El porcentaje no puede superar 100%."); return; }
    setSavingRule(true); setRuleMsg("");
    const { error } = await supabase.from("commission_rules").upsert({
      tenant_id: tenantId,
      professional_id: editingProf.id,
      type: editForm.type,
      value: v,
      updated_at: new Date().toISOString(),
    }, { onConflict: "tenant_id,professional_id" });
    setSavingRule(false);
    if (error) { setRuleMsg("Error: " + error.message); return; }
    setRuleMsg("Regla guardada.");
    fetchRules(tenantId);
    setTimeout(() => { setEditingProf(null); setRuleMsg(""); }, 1000);
  };

  // -"-"- Liquidar -"-"-
  const handleLiquidar = async () => {
    if (!tenantId || !liquidarTarget) return;
    setLiquidarSaving(true); setLiquidarMsg("");
    const { error } = await supabase.from("commission_payments").insert({
      tenant_id: tenantId,
      professional_id: liquidarTarget.prof.id,
      period_start: currentRange.start,
      period_end: currentRange.end,
      appointments_count: liquidarTarget.count,
      revenue_total: liquidarTarget.revenue,
      commission_amount: liquidarTarget.commission,
      note: liquidarNote.trim() || null,
    });
    setLiquidarSaving(false);
    if (error) { setLiquidarMsg("Error: " + error.message); return; }
    setLiquidarMsg("Comisi-n liquidada con -xito.");
    setTimeout(() => { setLiquidarTarget(null); setLiquidarNote(""); setLiquidarMsg(""); }, 1200);
  };

  const openEdit = (prof: Professional) => {
    const rule = rules.find(r => r.professional_id === prof.id);
    setEditForm({ type: rule?.type || "percentage", value: rule ? String(rule.value) : "" });
    setRuleMsg("");
    setEditingProf(prof);
  };

  // -"-"-"- Totals -"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-
  const totalRevenue = summaries.reduce((s, p) => s + p.revenue, 0);
  const totalCommission = summaries.reduce((s, p) => s + p.commission, 0);
  const totalApts = summaries.reduce((s, p) => s + p.count, 0);

  // -"-"-"- Render -"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-"-

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: "-0.5px", color: "#14111C" }}>
            Comisiones
          </h1>
          <p style={{ color: "#8E879B", fontSize: 13, marginTop: 3 }}>
            Liquida las comisiones de tu equipo autom-ticamente.
          </p>
        </div>
        <div style={{ display: "flex", gap: 4, background: "rgba(20,15,30,0.04)", padding: 4, borderRadius: 14 }}>
          <TabBtn active={tab === "resumen"} onClick={() => setTab("resumen")}>Resumen</TabBtn>
          <TabBtn active={tab === "reglas"} onClick={() => setTab("reglas")}>Reglas</TabBtn>
          <TabBtn active={tab === "historial"} onClick={() => setTab("historial")}>Historial</TabBtn>
        </div>
      </div>

      {/* -"-"- TAB: Resumen -"-"- */}
      {tab === "resumen" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Period filter */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <PeriodBtn active={period === "semana"} onClick={() => setPeriod("semana")}>Esta semana</PeriodBtn>
            <PeriodBtn active={period === "mes"} onClick={() => setPeriod("mes")}>Este mes</PeriodBtn>
            <PeriodBtn active={period === "custom"} onClick={() => setPeriod("custom")}>Rango</PeriodBtn>
            {period === "custom" && (
              <>
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} style={{ ...inp, width: "auto", padding: "6px 10px", fontSize: 12 }} />
                <span style={{ color: "#8E879B", fontSize: 12 }}>-"</span>
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} style={{ ...inp, width: "auto", padding: "6px 10px", fontSize: 12 }} />
                <button onClick={() => { if (tenantId) fetchSummary(tenantId, "custom", customStart, customEnd); }}
                  disabled={!customStart || !customEnd}
                  style={{ padding: "7px 14px", borderRadius: 9, border: "none", background: (!customStart || !customEnd) ? "rgba(20,15,30,0.08)" : "#fb0f05", color: "#fff", cursor: (!customStart || !customEnd) ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif" }}>
                  Buscar
                </button>
              </>
            )}
          </div>

          {/* Totals */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {[
              { label: "Total citas", value: String(totalApts), icon: <IconUsers size={18} /> },
              { label: "Revenue total", value: fmt(totalRevenue), icon: <IconBanknotes size={18} /> },
              { label: "Comisiones totales", value: fmt(totalCommission), icon: <IconChartBar size={18} /> },
            ].map((m, i) => (
              <div key={i} style={{ background: "white", borderRadius: 16, border: "1px solid #e8e6e2", padding: "18px 20px" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05", marginBottom: 10 }}>
                  {m.icon}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", background: "linear-gradient(135deg, #fb0f05, #0027fe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {m.value}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#8E879B", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* Per-professional table */}
          <div style={card}>
            <SectionHeader
              title="Por profesional"
              sub={currentRange.start ? periodLabel(currentRange.start, currentRange.end, locale) : ""}
              icon={<IconUsers size={16} />}
            />
            {loadingSummary ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <div style={{ width: 32, height: 32, border: "3px solid #e8e6e2", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto" }} />
              </div>
            ) : summaries.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "#8E879B", fontSize: 14 }}>Sin profesionales activos.</div>
            ) : (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 70px 120px 120px 110px", gap: 12, padding: "10px 20px", borderBottom: "1px solid #f0eeeb", fontSize: 11, fontWeight: 700, color: "#8E879B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  <span>Profesional</span>
                  <span style={{ textAlign: "center" }}>Citas</span>
                  <span style={{ textAlign: "right" }}>Revenue</span>
                  <span style={{ textAlign: "right" }}>Comisi-n</span>
                  <span />
                </div>
                {summaries.map((s, i) => (
                  <div key={s.prof.id} style={{
                    display: "grid", gridTemplateColumns: "1fr 70px 120px 120px 110px",
                    gap: 12, padding: "14px 20px", alignItems: "center",
                    borderBottom: i < summaries.length - 1 ? "1px solid #f0eeeb" : "none",
                  }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <Avatar name={s.prof.name} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#14111C" }}>{s.prof.name}</div>
                        <div style={{ fontSize: 11, color: "#8E879B", marginTop: 2 }}>
                          {s.rule
                            ? s.rule.type === "percentage" ? `${s.rule.value}% del servicio` : `${fmt(s.rule.value)} por cita`
                            : "Sin regla"}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "center", fontWeight: 700, fontSize: 15, color: "#14111C" }}>{s.count}</div>
                    <div style={{ textAlign: "right", fontWeight: 600, fontSize: 13, color: "#3a3548" }}>{fmt(s.revenue)}</div>
                    <div style={{ textAlign: "right" }}>
                      {s.rule ? (
                        <span style={{ fontWeight: 800, fontSize: 14, background: "linear-gradient(135deg, #fb0f05, #0027fe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                          {fmt(s.commission)}
                        </span>
                      ) : (
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>Sin regla</span>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <button
                        disabled={!s.rule || s.count === 0}
                        onClick={() => { setLiquidarTarget(s); setLiquidarNote(""); setLiquidarMsg(""); }}
                        style={{
                          padding: "7px 14px", borderRadius: 9, border: "none", fontSize: 12, fontWeight: 700,
                          cursor: (!s.rule || s.count === 0) ? "not-allowed" : "pointer",
                          background: (!s.rule || s.count === 0) ? "rgba(20,15,30,0.04)" : "rgba(251,15,5,0.08)",
                          color: (!s.rule || s.count === 0) ? "#c0c0d0" : "#fb0f05",
                          fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                        }}>
                        Liquidar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* -"-"- TAB: Reglas -"-"- */}
      {tab === "reglas" && (
        <div style={card}>
          <SectionHeader title="Reglas de comisi-n" sub="Una regla por profesional activo" icon={<IconPercent size={16} />} />
          {loadingRules ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ width: 32, height: 32, border: "3px solid #e8e6e2", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto" }} />
            </div>
          ) : professionals.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#8E879B", fontSize: 14 }}>
              Sin profesionales activos. Agr-dalos en la secci-n Equipo.
            </div>
          ) : (
            professionals.map((prof, i) => {
              const rule = rules.find(r => r.professional_id === prof.id);
              return (
                <div key={prof.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 20px",
                  borderBottom: i < professionals.length - 1 ? "1px solid #f0eeeb" : "none",
                }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <Avatar name={prof.name} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#14111C" }}>{prof.name}</div>
                      <div style={{ fontSize: 11, color: "#8E879B", marginTop: 2 }}>{prof.role}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {rule ? (
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#3a3548" }}>
                        {rule.type === "percentage" ? `${rule.value}%` : `${fmt(rule.value)} / cita`}
                      </span>
                    ) : (
                      <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "rgba(100,116,139,0.1)", color: "#94a3b8" }}>Sin configurar</span>
                    )}
                    <button onClick={() => openEdit(prof)} style={{
                      padding: "7px 16px", borderRadius: 9, border: "1.5px solid rgba(251,15,5,0.3)",
                      background: "rgba(251,15,5,0.06)", color: "#fb0f05", fontSize: 12, fontWeight: 700,
                      cursor: "pointer", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
                    }}>
                      {rule ? "Editar" : "Configurar"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* -"-"- TAB: Historial -"-"- */}
      {tab === "historial" && (
        <div style={card}>
          <SectionHeader title="Historial de liquidaciones" sub="-ltimas 50 liquidaciones" icon={<IconBanknotes size={16} />} />
          {loadingPayments ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ width: 32, height: 32, border: "3px solid #e8e6e2", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto" }} />
            </div>
          ) : payments.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#8E879B", fontSize: 14 }}>
              Sin liquidaciones registradas a-n.
            </div>
          ) : (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 60px 120px 130px", gap: 12, padding: "10px 20px", borderBottom: "1px solid #f0eeeb", fontSize: 11, fontWeight: 700, color: "#8E879B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <span>Profesional</span>
                <span>Per-odo</span>
                <span style={{ textAlign: "center" }}>Citas</span>
                <span style={{ textAlign: "right" }}>Comisi-n</span>
                <span style={{ textAlign: "right" }}>Fecha pago</span>
              </div>
              {payments.map((p, i) => (
                <div key={p.id} style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr 60px 120px 130px",
                  gap: 12, padding: "13px 20px", alignItems: "center",
                  borderBottom: i < payments.length - 1 ? "1px solid #f0eeeb" : "none",
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#14111C" }}>{p.professionals?.name || "-"}</div>
                    {p.note && <div style={{ fontSize: 11, color: "#8E879B", marginTop: 2 }}>{p.note}</div>}
                  </div>
                  <div style={{ fontSize: 12, color: "#564E66" }}>{periodLabel(p.period_start, p.period_end, locale)}</div>
                  <div style={{ textAlign: "center", fontWeight: 700, fontSize: 13, color: "#14111C" }}>{p.appointments_count}</div>
                  <div style={{ textAlign: "right", fontWeight: 800, fontSize: 14, background: "linear-gradient(135deg, #fb0f05, #0027fe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    {fmt(p.commission_amount)}
                  </div>
                  <div style={{ textAlign: "right", fontSize: 12, color: "#8E879B" }}>
                    {new Date(p.paid_at).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* -"-"- Modal: Editar Regla -"-"- */}
      {editingProf && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(17,17,24,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setEditingProf(null); }}>
          <div style={{ background: "white", borderRadius: 22, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={editingProf.name} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: "#14111C" }}>Regla de comisi-n</div>
                  <div style={{ fontSize: 12, color: "#8E879B", marginTop: 2 }}>{editingProf.name}</div>
                </div>
              </div>
              <button onClick={() => setEditingProf(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8E879B", padding: 4 }}>
                <IconX size={18} />
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Tipo de comisi-n</label>
              <select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value as "percentage" | "fixed" })} style={inp}>
                <option value="percentage">Porcentaje del servicio (%)</option>
                <option value="fixed">Monto fijo por cita ({currency})</option>
              </select>
            </div>

            <div style={{ marginBottom: 22 }}>
              <label style={lbl}>{editForm.type === "percentage" ? "Porcentaje (0 - 100)" : `Monto por cita (${currency})`}</label>
              <input
                type="number"
                min={0}
                max={editForm.type === "percentage" ? 100 : undefined}
                step={editForm.type === "percentage" ? 0.5 : 1000}
                value={editForm.value}
                onChange={e => setEditForm({ ...editForm, value: e.target.value })}
                placeholder={editForm.type === "percentage" ? "Ej. 30" : "Ej. 15000"}
                style={inp}
              />
            </div>

            {ruleMsg && (
              <p style={{ fontSize: 13, marginBottom: 12, fontWeight: 600, color: ruleMsg.startsWith("Error") ? "#ef4444" : "#10b981" }}>
                {ruleMsg}
              </p>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setEditingProf(null)} className="btn-secondary" disabled={savingRule}>Cancelar</button>
              <button onClick={handleSaveRule} className="btn-primary" disabled={savingRule || !editForm.value}>
                {savingRule ? "Guardando..." : "Guardar regla"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -"-"- Modal: Liquidar -"-"- */}
      {liquidarTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(17,17,24,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) setLiquidarTarget(null); }}>
          <div style={{ background: "white", borderRadius: 22, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: "#14111C" }}>Confirmar liquidaci-n</div>
              <button onClick={() => setLiquidarTarget(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8E879B" }}>
                <IconX size={18} />
              </button>
            </div>

            <div style={{ background: "rgba(20,15,30,0.025)", border: "1px solid #e8e6e2", borderRadius: 14, padding: "16px 18px", marginBottom: 18 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
                <Avatar name={liquidarTarget.prof.name} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#14111C" }}>{liquidarTarget.prof.name}</div>
                  <div style={{ fontSize: 11, color: "#8E879B" }}>{currentRange.start && periodLabel(currentRange.start, currentRange.end, locale)}</div>
                </div>
              </div>
              {[
                ["Citas completadas", String(liquidarTarget.count)],
                ["Revenue generado", fmt(liquidarTarget.revenue)],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: "#564E66" }}>{k}</span>
                  <span style={{ fontWeight: 600, color: "#14111C" }}>{v}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, borderTop: "1px solid #e8e6e2", paddingTop: 10, marginTop: 4 }}>
                <span style={{ fontWeight: 700, color: "#14111C" }}>A pagar</span>
                <span style={{ fontWeight: 800, background: "linear-gradient(135deg, #fb0f05, #0027fe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {fmt(liquidarTarget.commission)}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Nota (opcional)</label>
              <input type="text" value={liquidarNote} onChange={e => setLiquidarNote(e.target.value)}
                placeholder="Ej. Pago quincenal mayo" style={inp} />
            </div>

            {liquidarMsg && (
              <p style={{ fontSize: 13, marginBottom: 12, fontWeight: 600, color: liquidarMsg.startsWith("Error") ? "#ef4444" : "#10b981" }}>
                {liquidarMsg}
              </p>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setLiquidarTarget(null)} className="btn-secondary" disabled={liquidarSaving}>Cancelar</button>
              <button onClick={handleLiquidar} className="btn-primary" disabled={liquidarSaving}>
                {liquidarSaving ? "Registrando..." : `Liquidar ${fmt(liquidarTarget.commission)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
