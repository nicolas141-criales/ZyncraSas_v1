"use client";

import { useState } from "react";
import styles from "../admin.module.css";

export default function SettingsPage() {
  const [requireDeposit, setRequireDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState("20");

  return (
    <div>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "var(--spacing-xl)" }}>Configuración</h1>
      
      <div className={styles.listCard} style={{ maxWidth: "800px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "var(--spacing-md)" }}>Protección contra No-Shows y Pagos</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "var(--spacing-lg)", fontSize: "14px" }}>
          Configura cómo deseas manejar las reservas online para reducir las inasistencias. Por defecto, utilizamos recordatorios automáticos por WhatsApp.
        </p>

        <div style={{ padding: "var(--spacing-lg)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-base)", marginBottom: "var(--spacing-lg)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: requireDeposit ? "var(--spacing-md)" : "0" }}>
            <div>
              <div style={{ fontWeight: 600 }}>Requerir Depósito Anticipado (Stripe)</div>
              <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Pide a los clientes que paguen una cantidad parcial al reservar.</div>
            </div>
            
            <label style={{ display: "flex", alignItems: "center", cursor: "pointer", position: "relative" }}>
              <input 
                type="checkbox" 
                checked={requireDeposit} 
                onChange={(e) => setRequireDeposit(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0, position: "absolute" }}
              />
              <span style={{
                display: "inline-block",
                width: "48px",
                height: "24px",
                backgroundColor: requireDeposit ? "#fb0f05" : "var(--border-light)",
                borderRadius: "var(--radius-full)",
                position: "relative",
                transition: "background-color 0.2s"
              }}>
                <span style={{
                  position: "absolute",
                  top: "2px",
                  left: requireDeposit ? "26px" : "2px",
                  width: "20px",
                  height: "20px",
                  backgroundColor: "white",
                  borderRadius: "50%",
                  transition: "left 0.2s",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                }} />
              </span>
            </label>
          </div>

          {requireDeposit && (
            <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "var(--spacing-md)", display: "flex", gap: "var(--spacing-md)", alignItems: "center" }}>
              <label style={{ fontWeight: 500, fontSize: "14px" }}>Monto del Depósito ($):</label>
              <input 
                type="number" 
                value={depositAmount} 
                onChange={(e) => setDepositAmount(e.target.value)}
                style={{
                  padding: "8px 12px",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-sm)",
                  width: "100px",
                  fontFamily: "var(--font-body)"
                }}
              />
            </div>
          )}
        </div>

        <div style={{ padding: "var(--spacing-lg)", border: "1px solid rgba(251,15,5,0.15)", borderRadius: "var(--radius-base)", background: "rgba(251,15,5,0.04)" }}>
          <div style={{ fontWeight: 600, marginBottom: "4px" }}>💡 Personalización de Marca</div>
          <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "12px" }}>
            Para cambiar el logo, colores y mensaje de bienvenida de tu landing de citas, ve a la sección <strong>Mi Marca</strong> en el menú lateral.
          </div>
          <a href="/admin/branding" style={{ color: "#fb0f05", fontWeight: 600, fontSize: "14px", textDecoration: "none" }}>
            → Ir a Mi Marca
          </a>
        </div>

        <div style={{ marginTop: "var(--spacing-xl)" }}>
          <button className="btn-primary">Guardar Configuración</button>
        </div>
      </div>
    </div>
  );
}
