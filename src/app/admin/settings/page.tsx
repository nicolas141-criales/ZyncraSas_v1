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
            
            {/* Toggle Switch */}
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
                backgroundColor: requireDeposit ? "var(--accent-blue)" : "var(--border-light)",
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

        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "var(--spacing-md)", marginTop: "var(--spacing-2xl)" }}>Personalización de Marca</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "var(--spacing-lg)", fontSize: "14px" }}>
          Modifica cómo se ve tu portal de reservas para tus clientes.
        </p>

        <div style={{ padding: "var(--spacing-lg)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-base)", marginBottom: "var(--spacing-xl)" }}>
          <div style={{ marginBottom: "var(--spacing-lg)" }}>
            <label style={{ display: "block", fontWeight: 600, fontSize: "14px", marginBottom: "8px" }}>Nombre del Salón</label>
            <input 
              type="text" 
              defaultValue="Demo Salon"
              style={{ width: "100%", padding: "10px", border: "1px solid var(--border-light)", borderRadius: "var(--radius-sm)", fontFamily: "inherit" }}
            />
          </div>
          
          <div style={{ marginBottom: "var(--spacing-lg)" }}>
            <label style={{ display: "block", fontWeight: 600, fontSize: "14px", marginBottom: "8px" }}>Color Principal (Acento)</label>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <input type="color" defaultValue="#2563EB" style={{ width: "40px", height: "40px", padding: 0, border: "none", borderRadius: "4px", cursor: "pointer" }} />
              <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Este color se usará en botones y detalles de tu portal.</span>
            </div>
          </div>

          <div style={{ marginBottom: "var(--spacing-lg)" }}>
            <label style={{ display: "block", fontWeight: 600, fontSize: "14px", marginBottom: "8px" }}>URL de Imagen Principal</label>
            <input 
              type="url" 
              placeholder="https://..."
              style={{ width: "100%", padding: "10px", border: "1px solid var(--border-light)", borderRadius: "var(--radius-sm)", fontFamily: "inherit" }}
            />
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>Se mostrará como cabecera en tu página de reservas.</p>
          </div>
        </div>

        <button className="btn-primary">Guardar Configuración</button>
      </div>
    </div>
  );
}
