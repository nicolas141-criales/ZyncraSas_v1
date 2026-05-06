"use client";

import styles from "../admin.module.css";

export default function ClientsPage() {
  const clients = [
    { id: 1, name: "Michael Chen", phone: "+1 555-0101", lastVisit: "12 Oct, 2023", totalAppointments: 5, noShows: 0 },
    { id: 2, name: "Sarah Jenkins", phone: "+1 555-0102", lastVisit: "10 Oct, 2023", totalAppointments: 12, noShows: 1 },
    { id: 3, name: "David Torres", phone: "+1 555-0103", lastVisit: "28 Sep, 2023", totalAppointments: 3, noShows: 0 },
    { id: 4, name: "Emily Watson", phone: "+1 555-0104", lastVisit: "15 Sep, 2023", totalAppointments: 8, noShows: 2 },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-xl)" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700 }}>Base de Datos de Clientes</h1>
        <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
          <input 
            type="text" 
            placeholder="Buscar clientes..." 
            className="input-field" 
            style={{ width: "250px", border: "1px solid var(--border-light)", padding: "8px 12px", borderRadius: "var(--radius-sm)" }} 
          />
          <button className="btn-primary">Añadir Cliente</button>
        </div>
      </div>
      
      <div className={styles.listCard} style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--bg-base)", borderBottom: "1px solid var(--border-light)" }}>
              <th style={{ padding: "var(--spacing-md)", fontWeight: 600, color: "var(--text-secondary)" }}>Nombre</th>
              <th style={{ padding: "var(--spacing-md)", fontWeight: 600, color: "var(--text-secondary)" }}>Teléfono</th>
              <th style={{ padding: "var(--spacing-md)", fontWeight: 600, color: "var(--text-secondary)" }}>Última Visita</th>
              <th style={{ padding: "var(--spacing-md)", fontWeight: 600, color: "var(--text-secondary)" }}>Total Citas</th>
              <th style={{ padding: "var(--spacing-md)", fontWeight: 600, color: "var(--text-secondary)" }}>No-Shows</th>
              <th style={{ padding: "var(--spacing-md)", fontWeight: 600, color: "var(--text-secondary)" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <tr key={client.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                <td style={{ padding: "var(--spacing-md)", fontWeight: 500 }}>{client.name}</td>
                <td style={{ padding: "var(--spacing-md)", color: "var(--text-secondary)" }}>{client.phone}</td>
                <td style={{ padding: "var(--spacing-md)", color: "var(--text-secondary)" }}>{client.lastVisit}</td>
                <td style={{ padding: "var(--spacing-md)" }}>{client.totalAppointments}</td>
                <td style={{ padding: "var(--spacing-md)" }}>
                  <span style={{ 
                    padding: "4px 8px", borderRadius: "var(--radius-full)", fontSize: "12px", fontWeight: 600,
                    backgroundColor: client.noShows > 0 ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
                    color: client.noShows > 0 ? "var(--error)" : "var(--success)"
                  }}>
                    {client.noShows}
                  </span>
                </td>
                <td style={{ padding: "var(--spacing-md)" }}>
                  <button style={{ background: "none", border: "none", color: "var(--accent-blue)", cursor: "pointer", fontWeight: 600 }}>Ver Detalle</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
