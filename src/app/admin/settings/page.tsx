"use client";

import { useState } from "react";
import { IconCog, IconBell, IconCreditCard, IconPalette, IconArrowRight } from "../ZyncraIcons";
import Link from "next/link";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} style={{
      width: "48px", height: "26px", borderRadius: "13px", border: "none", cursor: "pointer", padding: "3px",
      background: checked ? "#fb0f05" : "#e8e6e2",
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
        <div style={{ fontWeight: 600, fontSize: "14px", color: "#111118" }}>{title}</div>
        {description && <div style={{ fontSize: "13px", color: "#a0a0b0", marginTop: "3px", lineHeight: 1.5 }}>{description}</div>}
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
          <div style={{ fontWeight: 700, fontSize: "14px", color: "#111118" }}>{title}</div>
          {subtitle && <div style={{ fontSize: "12px", color: "#a0a0b0", marginTop: "2px" }}>{subtitle}</div>}
        </div>
      </div>
      <div style={{ padding: "4px 22px 6px" }}>{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [requireDeposit, setRequireDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState("20");
  const [whatsappReminders, setWhatsappReminders] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [autoConfirm, setAutoConfirm] = useState(false);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Header */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05", flexShrink: 0 }}>
          <IconCog size={20} />
        </div>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 800, color: "#111118", letterSpacing: "-0.5px", margin: 0 }}>Configuración</h1>
          <p style={{ color: "#a0a0b0", fontSize: "13px", marginTop: "2px" }}>Ajusta el comportamiento de tu negocio</p>
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
            <div style={{ background: "#f7f5f2", border: "1px solid #e8e6e2", borderRadius: "12px", padding: "16px", display: "flex", gap: "14px", alignItems: "center" }}>
              <label style={{ fontWeight: 600, fontSize: "13px", color: "#3a3a48", whiteSpace: "nowrap" }}>Monto del depósito ($)</label>
              <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)}
                style={{ flex: 1, maxWidth: "120px", padding: "9px 12px", border: "1.5px solid #e8e6e2", borderRadius: "10px", fontSize: "14px", fontFamily: "'Plus Jakarta Sans', sans-serif", background: "white", color: "#111118", outline: "none" }} />
            </div>
          </div>
        )}
      </SectionCard>

      {/* Enlace rápido a Mi Marca */}
      <div style={{ background: "white", border: "1px solid #e8e6e2", borderRadius: "18px", overflow: "hidden" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #e8e6e2", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(251,15,5,0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb0f05", flexShrink: 0 }}>
            <IconPalette size={17} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "14px", color: "#111118" }}>Identidad visual</div>
            <div style={{ fontSize: "12px", color: "#a0a0b0", marginTop: "2px" }}>Logo, colores y mensaje de tu página de citas</div>
          </div>
        </div>
        <div style={{ padding: "16px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: "13px", color: "#6b6b80", lineHeight: 1.6, margin: 0, maxWidth: "480px" }}>
            Personaliza cómo ven tu negocio tus clientes cuando llegan a reservar. Cambia el logo, los colores de marca y el mensaje de bienvenida.
          </p>
          <Link href="/admin/branding" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "10px", border: "1.5px solid #e8e6e2", background: "white", color: "#fb0f05", fontWeight: 700, fontSize: "13px", textDecoration: "none", whiteSpace: "nowrap", marginLeft: "20px", flexShrink: 0, transition: "all 0.15s" }}>
            Ir a Mi Marca <IconArrowRight size={14} color="#fb0f05" />
          </Link>
        </div>
      </div>

      {/* Save button */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="btn-primary" style={{ padding: "12px 32px", fontSize: "14px" }}>
          Guardar configuración
        </button>
      </div>
    </div>
  );
}
