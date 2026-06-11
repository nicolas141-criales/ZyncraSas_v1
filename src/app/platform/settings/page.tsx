"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// Fallback defaults if platform_settings table doesn't exist yet
const DEFAULT_TRIAL_CODE = "Freetrialzyncra";
const DEFAULT_TRIAL_DAYS = 30;

function fmt(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

interface SysStats {
  tenantCount: number;
  activeSubs: number;
  trialSubs: number;
  planCount: number;
  totalPaid: number;
  pendingCount: number;
  pendingTotal: number;
}

const lbl: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.32)",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em",
};
const inp: React.CSSProperties = {
  padding: "9px 14px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.18)",
  background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.92)", fontSize: 14,
  fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif", outline: "none",
};

// ── Editable field component ───────────────────────────────────────────────────

function EditableField({
  label, value, type = "text", min, max, suffix,
  onSave,
}: {
  label: string;
  value: string;
  type?: "text" | "number";
  min?: number;
  max?: number;
  suffix?: string;
  onSave: (v: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);

  async function save() {
    if (!draft.trim()) return;
    setSaving(true);
    await onSave(draft.trim());
    setSaving(false);
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  return (
    <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 12, padding: "16px 20px", border: `1px solid ${editing ? "rgba(251,15,5,0.35)" : "rgba(255,255,255,0.07)"}`, transition: "border-color .2s" }}>
      <label style={lbl}>{label}</label>
      {editing ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            autoFocus
            type={type}
            min={min}
            max={max}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
            style={{ ...inp, flex: 1, minWidth: 140 }}
          />
          {suffix && <span style={{ fontSize: 13, color: "rgba(255,255,255,0.42)" }}>{suffix}</span>}
          <button onClick={cancel} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.42)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Cancelar
          </button>
          <button onClick={save} disabled={saving || !draft.trim()} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#fb0f05", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: (!draft.trim() || saving) ? 0.6 : 1 }}>
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: type === "number" ? 28 : 18, fontWeight: 800, color: "#fbbf24", fontFamily: type === "text" ? "var(--font-jetbrains-mono),'JetBrains Mono',monospace" : "inherit", letterSpacing: type === "text" ? "0.03em" : 0 }}>
              {value || "—"}
            </span>
            {suffix && <span style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.42)" }}>{suffix}</span>}
          </div>
          <button onClick={() => setEditing(true)} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Editar
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function PlatformSettingsPage() {
  const [stats, setStats] = useState<SysStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");

  // Settings from DB
  const [trialCode, setTrialCode] = useState(DEFAULT_TRIAL_CODE);
  const [trialDays, setTrialDays] = useState(DEFAULT_TRIAL_DAYS);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [tableError, setTableError] = useState(false); // true if platform_settings table doesn't exist

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    const [
      { data: tenants },
      { data: subs },
      { data: plans },
      { data: paidPayments },
      { data: pendingPayments },
    ] = await Promise.all([
      supabase.from("tenants").select("id"),
      supabase.from("saas_subscriptions").select("status"),
      supabase.from("saas_plans").select("id").eq("active", true),
      supabase.from("saas_payments").select("amount").eq("status", "paid"),
      supabase.from("saas_payments").select("amount").eq("status", "pending"),
    ]);
    const allTenants = (tenants ?? []) as any[];
    const allSubs = (subs ?? []) as any[];
    const activeSubs = allSubs.filter((s: any) => s.status === "active").length;
    const trialSubs = allTenants.length - allSubs.filter((s: any) => s.status !== "trial").length;
    setStats({
      tenantCount: allTenants.length,
      activeSubs,
      trialSubs: Math.max(0, trialSubs),
      planCount: (plans ?? []).length,
      totalPaid: ((paidPayments ?? []) as any[]).reduce((acc: number, p: any) => acc + (p.amount ?? 0), 0),
      pendingCount: (pendingPayments ?? []).length,
      pendingTotal: ((pendingPayments ?? []) as any[]).reduce((acc: number, p: any) => acc + (p.amount ?? 0), 0),
    });
    setStatsLoading(false);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      setAdminEmail(user?.email ?? "");

      // Try to load platform_settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("platform_settings")
        .select("key, value");

      if (settingsError) {
        setTableError(true);
      } else {
        const m = new Map<string, string>((settingsData ?? []).map((s: any) => [s.key, s.value] as [string, string]));
        if (m.has("trial_code")) setTrialCode(m.get("trial_code") as string);
        if (m.has("trial_days")) setTrialDays(Number(m.get("trial_days")) || DEFAULT_TRIAL_DAYS);
      }
      setSettingsLoading(false);
      loadStats();
    }
    init();
  }, [loadStats]);

  async function saveSetting(key: string, value: string) {
    await supabase
      .from("platform_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  }

  async function saveTrialCode(v: string) {
    await saveSetting("trial_code", v);
    setTrialCode(v);
  }

  async function saveTrialDays(v: string) {
    const n = Math.max(1, Math.min(365, Number(v) || DEFAULT_TRIAL_DAYS));
    await saveSetting("trial_days", String(n));
    setTrialDays(n);
  }

  const loading = settingsLoading || statsLoading;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <div style={{ width: 36, height: 36, border: "3px solid #181824", borderTopColor: "#fb0f05", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "rgba(255,255,255,0.94)", margin: 0 }}>Ajustes</h1>
        <p style={{ color: "rgba(255,255,255,0.32)", fontSize: 14, margin: "4px 0 0" }}>Configuración de la plataforma Zyncra</p>
      </div>

      {/* Migration banner */}
      {tableError && (
        <div style={{ background: "rgba(248,113,113,0.08)", borderRadius: 14, padding: "16px 20px", border: "1px solid rgba(248,113,113,0.25)", marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f87171", marginBottom: 8 }}>⚠️ Tabla platform_settings no encontrada</div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", margin: "0 0 12px", lineHeight: 1.6 }}>
            Para activar los ajustes editables, ejecuta este SQL en tu Supabase Dashboard → SQL Editor:
          </p>
          <pre style={{ background: "rgba(0,0,0,0.4)", borderRadius: 9, padding: "12px 16px", fontSize: 12, color: "#a78bfa", margin: 0, overflowX: "auto", fontFamily: "var(--font-jetbrains-mono),'JetBrains Mono',monospace" }}>
{`CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO platform_settings (key, value) VALUES
  ('trial_code', 'Freetrialzyncra'),
  ('trial_days', '30')
ON CONFLICT (key) DO NOTHING;`}
          </pre>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS platform_settings (\n  key TEXT PRIMARY KEY,\n  value TEXT NOT NULL,\n  updated_at TIMESTAMPTZ DEFAULT NOW()\n);\n\nINSERT INTO platform_settings (key, value) VALUES\n  ('trial_code', 'Freetrialzyncra'),\n  ('trial_days', '30')\nON CONFLICT (key) DO NOTHING;`);
            }}
            style={{ marginTop: 10, padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(167,139,250,0.3)", background: "rgba(167,139,250,0.08)", color: "#a78bfa", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            Copiar SQL
          </button>
        </div>
      )}

      {/* Código de trial */}
      <section style={{ background: "rgba(255,255,255,0.08)", borderRadius: 18, padding: 24, border: "1px solid rgba(255,255,255,0.05)", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 18 }}>🎟️</span>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "rgba(255,255,255,0.94)" }}>Código de acceso gratuito</h2>
        </div>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "rgba(255,255,255,0.42)", lineHeight: 1.6 }}>
          Los nuevos clientes ingresan este código al registrarse para activar su período de prueba. Cámbialo cuando quieras para controlar quién puede acceder.
        </p>
        <EditableField
          label="Código activo"
          value={trialCode}
          type="text"
          onSave={saveTrialCode}
        />
        {tableError && (
          <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            Mostrando valor por defecto · Crea la tabla para activar edición persistente
          </div>
        )}
      </section>

      {/* Período de trial */}
      <section style={{ background: "rgba(255,255,255,0.08)", borderRadius: 18, padding: 24, border: "1px solid rgba(255,255,255,0.05)", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 18 }}>⏱️</span>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "rgba(255,255,255,0.94)" }}>Período de trial</h2>
        </div>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "rgba(255,255,255,0.42)", lineHeight: 1.6 }}>
          Duración del acceso gratuito que recibe cada nuevo cliente al activar su cuenta con el código.
        </p>
        <EditableField
          label="Duración"
          value={String(trialDays)}
          type="number"
          min={1}
          max={365}
          suffix="días"
          onSave={saveTrialDays}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
          <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Clientes en trial ahora</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#fbbf24" }}>{stats?.trialSubs ?? 0}</div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Tasa de conversión</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#34d399" }}>
              {stats && stats.tenantCount > 0
                ? `${Math.round((stats.activeSubs / stats.tenantCount) * 100)}%`
                : "—"}
            </div>
          </div>
        </div>
      </section>

      {/* Estado del sistema */}
      <section style={{ background: "rgba(255,255,255,0.08)", borderRadius: 18, padding: 24, border: "1px solid rgba(255,255,255,0.05)", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>📊</span>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "rgba(255,255,255,0.94)" }}>Estado del sistema</h2>
          </div>
          <button
            onClick={loadStats}
            disabled={statsLoading}
            style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.42)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            {statsLoading ? "..." : "↻ Actualizar"}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "Negocios registrados",  value: String(stats?.tenantCount ?? 0),   color: "#60a5fa" },
            { label: "Suscripciones activas", value: String(stats?.activeSubs ?? 0),    color: "#34d399" },
            { label: "Planes disponibles",    value: String(stats?.planCount ?? 0),     color: "#a78bfa" },
            { label: "Revenue cobrado total", value: fmt(stats?.totalPaid ?? 0),         color: "#ff7d72" },
            { label: "Cobros pendientes",     value: String(stats?.pendingCount ?? 0),  color: "#fbbf24" },
            { label: "Total pendiente",       value: fmt(stats?.pendingTotal ?? 0),      color: "#fb923c" },
          ].map(item => (
            <div key={item.label} style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.42)" }}>{item.label}</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: item.color }}>{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Cuenta de administrador */}
      <section style={{ background: "rgba(255,255,255,0.08)", borderRadius: 18, padding: 24, border: "1px solid rgba(255,255,255,0.05)", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 18 }}>👤</span>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "rgba(255,255,255,0.94)" }}>Cuenta de administrador</h2>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.42)" }}>Email de sesión activa</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#60a5fa" }}>{adminEmail || "—"}</span>
          </div>
          <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.42)" }}>Nivel de acceso</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "rgba(251,15,5,0.15)", color: "#ff7d72", fontFamily: "var(--font-jetbrains-mono),'JetBrains Mono',monospace", letterSpacing: "0.08em" }}>
              SUPER ADMIN
            </span>
          </div>
          <ChangePasswordField />
        </div>
      </section>

      {/* Acciones rápidas */}
      <section style={{ background: "rgba(255,255,255,0.08)", borderRadius: 18, padding: 24, border: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 18 }}>⚡</span>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "rgba(255,255,255,0.94)" }}>Acciones rápidas</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "Gestionar planes",  href: "/platform/plans",     desc: "Crear, editar o desactivar planes", icon: "📦" },
            { label: "Ver analytics",     href: "/platform/analytics", desc: "Tendencias y métricas de crecimiento", icon: "📊" },
            { label: "Gestionar cobros",  href: "/platform/billing",   desc: "Registrar pagos y crear facturas", icon: "💳" },
            { label: "Ver clientes",      href: "/platform/clients",   desc: "Lista completa de negocios registrados", icon: "👥" },
          ].map(item => (
            <a key={item.href} href={item.href} style={{ textDecoration: "none", background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 12, alignItems: "flex-start" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0.2)")}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.87)", marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{item.desc}</div>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

// ── Change password sub-component ─────────────────────────────────────────────

function ChangePasswordField() {
  const [editing, setEditing] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function save() {
    setMsg(null);
    if (newPw.length < 6) { setMsg({ text: "Mínimo 6 caracteres.", ok: false }); return; }
    if (newPw !== confirmPw) { setMsg({ text: "Las contraseñas no coinciden.", ok: false }); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setSaving(false);
    if (error) {
      setMsg({ text: error.message, ok: false });
    } else {
      setMsg({ text: "Contraseña actualizada correctamente.", ok: true });
      setNewPw(""); setConfirmPw("");
      setTimeout(() => { setEditing(false); setMsg(null); }, 2000);
    }
  }

  if (!editing) {
    return (
      <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.42)" }}>Contraseña</span>
        <button onClick={() => setEditing(true)} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Cambiar contraseña
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "16px", border: "1px solid rgba(251,15,5,0.3)" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <label style={lbl}>Nueva contraseña</label>
          <input
            type="password"
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
            placeholder="Mín. 6 caracteres"
            style={{ ...inp, width: "100%", boxSizing: "border-box" }}
          />
        </div>
        <div>
          <label style={lbl}>Confirmar contraseña</label>
          <input
            type="password"
            value={confirmPw}
            onChange={e => setConfirmPw(e.target.value)}
            placeholder="Repite la contraseña"
            style={{ ...inp, width: "100%", boxSizing: "border-box" }}
          />
        </div>
        {msg && (
          <div style={{ fontSize: 12, color: msg.ok ? "#34d399" : "#f87171", fontWeight: 600 }}>
            {msg.ok ? "✓ " : "✗ "}{msg.text}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={() => { setEditing(false); setNewPw(""); setConfirmPw(""); setMsg(null); }}
            style={{ padding: "7px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.42)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Cancelar
          </button>
          <button onClick={save} disabled={saving}
            style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "#fb0f05", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {saving ? "Guardando..." : "Actualizar contraseña"}
          </button>
        </div>
      </div>
    </div>
  );
}
