"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const TRIAL_CODE = "Freetrialzyncra";
const TRIAL_DAYS = 30;

function fmt(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button onClick={copy} style={{
      padding: "5px 12px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
      background: copied ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.08)",
      color: copied ? "#34d399" : "rgba(255,255,255,0.42)",
      transition: "all .2s",
    }}>
      {copied ? "✓ Copiado" : "Copiar"}
    </button>
  );
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

export default function PlatformSettingsPage() {
  const [stats, setStats] = useState<SysStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      setAdminEmail(user?.email ?? "");

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
      setLoading(false);
    }
    load();
  }, []);

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

      {/* Código de trial */}
      <section style={{ background: "rgba(255,255,255,0.08)", borderRadius: 18, padding: 24, border: "1px solid rgba(255,255,255,0.05)", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 18 }}>🎟️</span>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "rgba(255,255,255,0.94)" }}>Código de acceso gratuito</h2>
        </div>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "rgba(255,255,255,0.42)", lineHeight: 1.6 }}>
          Los nuevos clientes necesitan este código para activar el plan Trial. Sin él, no pueden registrarse en el plan gratuito.
        </p>
        <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "16px 20px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Código activo</div>
            <code style={{ fontSize: 20, fontWeight: 800, color: "#fbbf24", fontFamily: "var(--font-jetbrains-mono),'JetBrains Mono',monospace", letterSpacing: "0.04em" }}>
              {TRIAL_CODE}
            </code>
          </div>
          <CopyButton text={TRIAL_CODE} />
        </div>
        <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(251,191,36,0.06)", borderRadius: 10, border: "1px solid rgba(251,191,36,0.12)", fontSize: 12, color: "rgba(255,255,255,0.42)", lineHeight: 1.6 }}>
          ⚠️ Para cambiar el código debes actualizar la constante <code style={{ color: "#fbbf24", fontFamily: "monospace" }}>TRIAL_CODE</code> en <code style={{ color: "#60a5fa", fontFamily: "monospace" }}>src/app/(auth)/register/page.tsx</code> y en <code style={{ color: "#60a5fa", fontFamily: "monospace" }}>src/app/platform/settings/page.tsx</code>
        </div>
      </section>

      {/* Trial period */}
      <section style={{ background: "rgba(255,255,255,0.08)", borderRadius: 18, padding: 24, border: "1px solid rgba(255,255,255,0.05)", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 18 }}>⏱️</span>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "rgba(255,255,255,0.94)" }}>Período de trial</h2>
        </div>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "rgba(255,255,255,0.42)", lineHeight: 1.6 }}>
          Duración del acceso gratuito que recibe cada nuevo cliente al activar su cuenta.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "16px 20px", border: "1px solid rgba(255,255,255,0.08)", flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Duración</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#60a5fa" }}>{TRIAL_DAYS} <span style={{ fontSize: 16, fontWeight: 500, color: "rgba(255,255,255,0.55)" }}>días</span></div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "16px 20px", border: "1px solid rgba(255,255,255,0.08)", flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Clientes en trial ahora</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#fbbf24" }}>{stats?.trialSubs ?? 0}</div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "16px 20px", border: "1px solid rgba(255,255,255,0.08)", flex: 1 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Tasa de conversión</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#34d399" }}>
              {stats && stats.tenantCount > 0
                ? `${Math.round((stats.activeSubs / stats.tenantCount) * 100)}%`
                : "—"}
            </div>
          </div>
        </div>
      </section>

      {/* System health */}
      <section style={{ background: "rgba(255,255,255,0.08)", borderRadius: 18, padding: 24, border: "1px solid rgba(255,255,255,0.05)", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <span style={{ fontSize: 18 }}>📊</span>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "rgba(255,255,255,0.94)" }}>Estado del sistema</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "Negocios registrados", value: String(stats?.tenantCount ?? 0),   color: "#60a5fa" },
            { label: "Suscripciones activas", value: String(stats?.activeSubs ?? 0),   color: "#34d399" },
            { label: "Planes disponibles",    value: String(stats?.planCount ?? 0),    color: "#a78bfa" },
            { label: "Revenue cobrado total", value: fmt(stats?.totalPaid ?? 0),        color: "#ff7d72" },
            { label: "Cobros pendientes",     value: String(stats?.pendingCount ?? 0), color: "#fbbf24" },
            { label: "Total pendiente",       value: fmt(stats?.pendingTotal ?? 0),     color: "#fb923c" },
          ].map(item => (
            <div key={item.label} style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.42)" }}>{item.label}</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: item.color }}>{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Admin info */}
      <section style={{ background: "rgba(255,255,255,0.08)", borderRadius: 18, padding: 24, border: "1px solid rgba(255,255,255,0.05)", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
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
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "rgba(251,15,5,0.15)", color: "#ff7d72", fontFamily: "var(--font-jetbrains-mono),'JetBrains Mono',monospace", letterSpacing: "0.08em" }}>SUPER ADMIN</span>
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section style={{ background: "rgba(255,255,255,0.08)", borderRadius: 18, padding: 24, border: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 18 }}>⚡</span>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "rgba(255,255,255,0.94)" }}>Acciones rápidas</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "Gestionar planes", href: "/platform/plans", desc: "Crear, editar o desactivar planes", icon: "📦" },
            { label: "Ver analytics", href: "/platform/analytics", desc: "Tendencias y métricas de crecimiento", icon: "📊" },
            { label: "Gestionar cobros", href: "/platform/billing", desc: "Registrar pagos y crear facturas", icon: "💳" },
            { label: "Ver clientes", href: "/platform/clients", desc: "Lista completa de negocios registrados", icon: "👥" },
          ].map(item => (
            <a key={item.href} href={item.href} style={{ textDecoration: "none", background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", transition: "background .15s" }}
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
