"use client";

import styles from "../admin.module.css";

export default function CalendarPage() {
  const hours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-xl)" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700 }}>Calendario de Citas</h1>
        <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
          <button className="btn-secondary">{"<"}</button>
          <button className="btn-secondary" style={{ width: "150px" }}>Hoy</button>
          <button className="btn-secondary">{">"}</button>
        </div>
      </div>
      
      <div className={styles.listCard} style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", padding: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "80px repeat(5, 1fr)", borderBottom: "1px solid var(--border-light)", backgroundColor: "var(--bg-base)" }}>
          <div style={{ padding: "var(--spacing-sm)", borderRight: "1px solid var(--border-light)" }}></div>
          {["Lun 12", "Mar 13", "Mié 14", "Jue 15", "Vie 16"].map(day => (
            <div key={day} style={{ padding: "var(--spacing-sm)", textAlign: "center", fontWeight: 600, borderRight: "1px solid var(--border-light)" }}>
              {day}
            </div>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {hours.map((hour) => (
            <div key={hour} style={{ display: "grid", gridTemplateColumns: "80px repeat(5, 1fr)", borderBottom: "1px solid var(--border-light)", minHeight: "80px" }}>
              <div style={{ padding: "var(--spacing-sm)", textAlign: "center", color: "var(--text-secondary)", fontSize: "12px", borderRight: "1px solid var(--border-light)" }}>
                {hour}
              </div>
              {[1, 2, 3, 4, 5].map(day => (
                <div key={day} style={{ borderRight: "1px solid var(--border-light)", position: "relative" }}>
                  {/* Mock Appointment */}
                  {day === 2 && hour === "10:00" && (
                    <div style={{ 
                      position: "absolute", top: "10px", left: "10px", right: "10px", height: "60px", 
                      backgroundColor: "var(--accent-blue)", color: "white", borderRadius: "var(--radius-sm)",
                      padding: "8px", fontSize: "12px", boxShadow: "var(--shadow-level-1)"
                    }}>
                      <div style={{ fontWeight: 600 }}>Michael Chen</div>
                      <div>Corte de Cabello</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
