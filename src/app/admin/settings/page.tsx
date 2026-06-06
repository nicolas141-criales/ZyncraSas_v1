"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAdmin } from "../admin-context";
import { IconCog, IconBell, IconCreditCard, IconPalette, IconArrowRight, IconClock } from "../ZyncraIcons";

const COUNTRIES = [
  { code: "CO", name: "Colombia",          currency: "COP", locale: "es-CO" },
  { code: "MX", name: "México",            currency: "MXN", locale: "es-MX" },
  { code: "AR", name: "Argentina",         currency: "ARS", locale: "es-AR" },
  { code: "CL", name: "Chile",             currency: "CLP", locale: "es-CL" },
  { code: "PE", name: "Perú",              currency: "PEN", locale: "es-PE" },
  { code: "EC", name: "Ecuador",           currency: "USD", locale: "es-EC" },
  { code: "VE", name: "Venezuela",         currency: "VES", locale: "es-VE" },
  { code: "BO", name: "Bolivia",           currency: "BOB", locale: "es-BO" },
  { code: "PY", name: "Paraguay",          currency: "PYG", locale: "es-PY" },
  { code: "UY", name: "Uruguay",           currency: "UYU", locale: "es-UY" },
  { code: "CR", name: "Costa Rica",        currency: "CRC", locale: "es-CR" },
  { code: "PA", name: "Panamá",            currency: "PAB", locale: "es-PA" },
  { code: "GT", name: "Guatemala",         currency: "GTQ", locale: "es-GT" },
  { code: "DO", name: "Rep. Dominicana",   currency: "DOP", locale: "es-DO" },
  { code: "US", name: "Estados Unidos",    currency: "USD", locale: "en-US" },
  { code: "ES", name: "España",            currency: "EUR", locale: "es-ES" },
] as const;

// Claves numéricas "0"-"6" = Date.getDay() → igual que la app mobile
const DAY_KEYS = ["1","2","3","4","5","6","0"] as const; // Lun→Dom
type DayKey = typeof DAY_KEYS[number];
const DAY_LABELS: Record<DayKey, string> = {
  "1": "Lunes", "2": "Martes", "3": "Miércoles",
  "4": "Jueves", "5": "Viernes", "6": "Sábado", "0": "Domingo",
};
const DEFAULT_HOURS: Record<DayKey, { open: boolean; start: string; end: string }> = {
  "1": { open: true,  start: "09:00", end: "18:00" },
  "2": { open: true,  start: "09:00", end: "18:00" },
  "3": { open: true,  start: "09:00", end: "18:00" },
  "4": { open: true,  start: "09:00", end: "18:00" },
  "5": { open: true,  start: "09:00", end: "18:00" },
  "6": { open: false, start: "09:00", end: "14:00" },
  "0": { open: false, start: "09:00", end: "14:00" },
};
import Link from "next/link";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} style={{
      width: "48px", height: "26px", borderRadius: "13px", border: "none", cursor: "pointer", padding: "3px",
      background: checked ? "#fb0f05" : "rgba(20,15,30,0.08)",
      display: "flex", alignItems: "center",
      justifyContent: checked ? "flex-end" : "flex-start",
      transition: "background 0.2s", flexShrink: 0,
    }}>
      <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "white", boxShadow: "0 1px 4px rgba(0,0,0,0.18)", display: "block", transition: "all 0.2s" }} />
    </button>
  );
}

function SettingRow({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "24px", padding: "18px 0", borderBottom: "1px solid #f0eeeb" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: "14px", color: "#14111C" }}>{title}</div>
        {description && <div style={{ fontSize: "13px", color: "#8E879B", marginTop: "3px", lineHeight: 1.5 }}>{description}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function SectionCard({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "white", border: "1px solid #e8e6e2", borderRadius: "18px", overflow: "hidden" }}>
      <div style={{ padding: "18px 22px", borderBottom: "1px solid #e8e6e2", display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05", flexShrink: 0 }}>
          {icon}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "14px", color: "#14111C" }}>{title}</div>
          {subtitle && <div style={{ fontSize: "12px", color: "#8E879B", marginTop: "2px" }}>{subtitle}</div>}
        </div>
      </div>
      <div style={{ padding: "4px 22px 6px" }}>{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { tenantId, refreshCurrency } = useAdmin();

  const [whatsappReminders, setWhatsappReminders] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [autoConfirm, setAutoConfirm] = useState(false);
  const [requireDeposit, setRequireDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState("20");
  const [businessHours, setBusinessHours] = useState<Record<DayKey, { open: boolean; start: string; end: string }>>(DEFAULT_HOURS);
  const [country, setCountry] = useState("CO");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("tenant_settings")
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle();
      if (data) {
        setWhatsappReminders(data.whatsapp_reminders ?? true);
        setEmailNotifs(data.email_notifications ?? false);
        setAutoConfirm(data.auto_confirm ?? false);
        setRequireDeposit(data.require_deposit ?? false);
        setDepositAmount(String(data.deposit_amount ?? 20));
      }
      const { data: tenantData } = await supabase
        .from("tenants").select("settings").eq("id", tenantId).maybeSingle();
      if (tenantData?.settings?.schedule) {
        setBusinessHours({ ...DEFAULT_HOURS, ...tenantData.settings.schedule });
      }
      if (tenantData?.settings?.country) {
        setCountry(tenantData.settings.country);
      }
    }
    load();
  }, [tenantId]);

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    const { error } = await supabase.from("tenant_settings").upsert({
      tenant_id: tenantId,
      whatsapp_reminders: whatsappReminders,
      email_notifications: emailNotifs,
      auto_confirm: autoConfirm,
      require_deposit: requireDeposit,
      deposit_amount: parseFloat(depositAmount) || 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: "tenant_id" });

    // Guarda el horario en tenants.settings.schedule (igual que la app mobile)
    const { data: currentTenant } = await supabase
      .from("tenants").select("settings").eq("id", tenantId).maybeSingle();
    const selected = COUNTRIES.find(c => c.code === country) ?? COUNTRIES[0];
    const newSettings = {
      ...(currentTenant?.settings ?? {}),
      schedule: businessHours,
      country: selected.code,
      currency: selected.currency,
      locale: selected.locale,
    };
    await supabase.from("tenants").update({ settings: newSettings }).eq("id", tenantId);

    setSaving(false);
    if (error) {
      setMsg({ type: "err", text: error.message });
    } else {
      await refreshCurrency();
      setMsg({ type: "ok", text: "Configuración guardada." });
    }
    setTimeout(() => setMsg(null), 3000);
  }

  function setDay(day: DayKey, patch: Partial<{ open: boolean; start: string; end: string }>) {
    setBusinessHours(prev => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  }

  return (
    <div style={{ fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif", display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Header */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05", flexShrink: 0 }}>
          <IconCog size={20} />
        </div>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#14111C", letterSpacing: "-0.5px", margin: 0 }}>Configuración</h1>
          <p style={{ color: "#8E879B", fontSize: "13px", marginTop: "2px" }}>Ajusta el comportamiento de tu negocio</p>
        </div>
      </div>

      {/* Recordatorios y notificaciones */}
      <SectionCard icon={<IconBell size={17} />} title="Recordatorios y notificaciones" subtitle="Cómo avisas a tus clientes sobre sus citas">
        <SettingRow title="Recordatorios por WhatsApp" description="Envía mensajes automáticos 24h antes de cada cita.">
          <Toggle checked={whatsappReminders} onChange={setWhatsappReminders} />
        </SettingRow>
        <SettingRow title="Notificaciones por correo" description="Envía confirmaciones y recordatorios por email (requiere integración).">
          <Toggle checked={emailNotifs} onChange={setEmailNotifs} />
        </SettingRow>
        <SettingRow title="Confirmar citas automáticamente" description="Las nuevas reservas se confirman sin revisión manual.">
          <Toggle checked={autoConfirm} onChange={setAutoConfirm} />
        </SettingRow>
      </SectionCard>

      {/* Pagos y depósitos */}
      <SectionCard icon={<IconCreditCard size={17} />} title="Pagos y depósitos" subtitle="Reduce los no-shows con pagos anticipados">
        <SettingRow title="Requerir depósito anticipado" description="Los clientes pagan una parte al reservar vía Stripe.">
          <Toggle checked={requireDeposit} onChange={setRequireDeposit} />
        </SettingRow>
        {requireDeposit && (
          <div style={{ paddingBottom: "16px" }}>
            <div style={{ background: "rgba(20,15,30,0.025)", border: "1px solid #e8e6e2", borderRadius: "12px", padding: "16px", display: "flex", gap: "14px", alignItems: "center" }}>
              <label style={{ fontWeight: 600, fontSize: "13px", color: "#3a3548", whiteSpace: "nowrap" }}>Monto del depósito ($)</label>
              <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)}
                style={{ flex: 1, maxWidth: "120px", padding: "9px 12px", border: "1.5px solid #e8e6e2", borderRadius: "10px", fontSize: "14px", fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif", background: "white", color: "#14111C", outline: "none" }} />
            </div>
          </div>
        )}
      </SectionCard>

      {/* Región y moneda */}
      <SectionCard icon={<IconCreditCard size={17} />} title="Región y moneda" subtitle="Determina el formato de precios en todo el panel">
        <SettingRow title="País de operación" description="Los precios se mostrarán con la moneda local del país seleccionado.">
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            style={{
              padding: "8px 14px", borderRadius: "10px", border: "1.5px solid #e8e6e2",
              fontSize: "13px", fontWeight: 600, color: "#14111C", background: "white",
              fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
              cursor: "pointer", outline: "none", minWidth: "180px",
            }}
          >
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>
                {c.name} — {c.currency}
              </option>
            ))}
          </select>
        </SettingRow>
        {(() => {
          const sel = COUNTRIES.find(c => c.code === country);
          if (!sel) return null;
          const preview = new Intl.NumberFormat(sel.locale, { style: "currency", currency: sel.currency, maximumFractionDigits: 0 }).format(125000);
          return (
            <div style={{ padding: "12px 0 8px", fontSize: "12px", color: "#8E879B" }}>
              Vista previa: <strong style={{ color: "#fb0f05", fontWeight: 700 }}>{preview}</strong>
            </div>
          );
        })()}
      </SectionCard>

      {/* Horarios de atención */}
      <SectionCard icon={<IconClock size={17} />} title="Horarios de atención" subtitle="Días y horas en que recibes clientes">
        {DAY_KEYS.map((day, idx) => {
          const h = businessHours[day];
          const isLast = idx === DAY_KEYS.length - 1;
          return (
            <div key={day} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 0", borderBottom: isLast ? "none" : "1px solid #f0eeeb", flexWrap: "wrap" }}>
              <span style={{ width: "88px", fontWeight: 600, fontSize: "13px", color: "#14111C", flexShrink: 0 }}>
                {DAY_LABELS[day]}
              </span>
              <Toggle checked={h.open} onChange={v => setDay(day, { open: v })} />
              {h.open ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
                  <input type="time" value={h.start} onChange={e => setDay(day, { start: e.target.value })}
                    style={{ padding: "6px 10px", border: "1.5px solid #e8e6e2", borderRadius: "8px", fontSize: "13px", color: "#14111C", background: "white", fontFamily: "inherit", outline: "none" }} />
                  <span style={{ fontSize: "12px", color: "#8E879B" }}>—</span>
                  <input type="time" value={h.end} onChange={e => setDay(day, { end: e.target.value })}
                    style={{ padding: "6px 10px", border: "1.5px solid #e8e6e2", borderRadius: "8px", fontSize: "13px", color: "#14111C", background: "white", fontFamily: "inherit", outline: "none" }} />
                </div>
              ) : (
                <span style={{ marginLeft: "auto", fontSize: "12px", color: "#8E879B", fontWeight: 500 }}>Cerrado</span>
              )}
            </div>
          );
        })}
      </SectionCard>

      {/* Enlace rápido a Mi Marca */}
      <div style={{ background: "white", border: "1px solid #e8e6e2", borderRadius: "18px", overflow: "hidden" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #e8e6e2", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05", flexShrink: 0 }}>
            <IconPalette size={17} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "#14111C" }}>Identidad visual</div>
            <div style={{ fontSize: "12px", color: "#8E879B", marginTop: "2px" }}>Logo, colores y mensaje de tu página de citas</div>
          </div>
        </div>
        <div style={{ padding: "16px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: "13px", color: "#564E66", lineHeight: 1.6, margin: 0, maxWidth: "480px" }}>
            Personaliza cómo ven tu negocio tus clientes cuando llegan a reservar. Cambia el logo, los colores de marca y el mensaje de bienvenida.
          </p>
          <Link href="/admin/branding" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "10px", border: "1.5px solid #e8e6e2", background: "white", color: "#fb0f05", fontWeight: 700, fontSize: "13px", textDecoration: "none", whiteSpace: "nowrap", marginLeft: "20px", flexShrink: 0, transition: "all 0.15s" }}>
            Ir a Mi Marca <IconArrowRight size={14} color="#fb0f05" />
          </Link>
        </div>
      </div>

      {/* Save */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 14 }}>
        {msg && (
          <span style={{ fontSize: 13, fontWeight: 600, color: msg.type === "ok" ? "#388e3c" : "#c62828" }}>
            {msg.type === "ok" ? "✓ " : "✕ "}{msg.text}
          </span>
        )}
        <button onClick={handleSave} disabled={saving} className="btn-primary" style={{ padding: "12px 32px", fontSize: "14px", opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "Guardando..." : "Guardar configuración"}
        </button>
      </div>
    </div>
  );
}
