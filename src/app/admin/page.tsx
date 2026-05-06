"use client";

import styles from "./admin.module.css";

export default function AdminOverview() {
  return (
    <div>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "var(--spacing-xl)" }}>Resumen de Hoy</h1>
      
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Ingresos Estimados</div>
          <div className={styles.statValue}>$420.00</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Citas Agendadas</div>
          <div className={styles.statValue}>12</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Pendientes de Confirmar</div>
          <div className={styles.statValue}>3</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Tasa de Inasistencia</div>
          <div className={styles.statValue} style={{ color: "var(--success)" }}>2.1%</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--spacing-xl)" }}>
        <div className={styles.listCard}>
          <div className={styles.listHeader}>
            <div className={styles.listTitle}>Próximas Citas</div>
            <button className="btn-secondary" style={{ padding: "4px 12px", fontSize: "12px" }}>Ver Calendario</button>
          </div>
          <div>
            {[
              { time: "10:30 AM", client: "Michael Chen", service: "Corte Premium", status: "Confirmada" },
              { time: "11:15 AM", client: "Sarah Jenkins", service: "Color y Estilo", status: "Pendiente" },
              { time: "01:00 PM", client: "David Torres", service: "Afeitado Ejecutivo", status: "Confirmada" },
              { time: "02:30 PM", client: "Emily Watson", service: "Corte Cabello", status: "Confirmada" },
            ].map((apt, i) => (
              <div key={i} className={styles.listItem}>
                <div>
                  <div className={styles.itemMain}>{apt.time} - {apt.client}</div>
                  <div className={styles.itemSub}>{apt.service}</div>
                </div>
                <div className={styles.itemBadge} style={{ 
                  backgroundColor: apt.status === "Confirmada" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                  color: apt.status === "Confirmada" ? "var(--success)" : "var(--warning)"
                }}>
                  {apt.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.listCard}>
          <div className={styles.listHeader}>
            <div className={styles.listTitle}>Acciones Rápidas</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
            <button className="btn-primary" style={{ width: "100%", justifyContent: "flex-start" }}>
              + Nueva Cita
            </button>
            <button className="btn-secondary" style={{ width: "100%", justifyContent: "flex-start" }}>
              📋 Bloquear Horario
            </button>
            <button className="btn-secondary" style={{ width: "100%", justifyContent: "flex-start" }}>
              ✉️ Enviar Recordatorio Manual
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
