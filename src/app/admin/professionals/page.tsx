"use client";

import { useState } from "react";
import styles from "../admin.module.css";

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState([
    { id: "1", name: "Alex Rover", role: "Barbero Senior", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80", status: "Activo" },
    { id: "2", name: "Elena Smith", role: "Estilista", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80", status: "Activo" },
    { id: "3", name: "Carlos Ruiz", role: "Barbero", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80", status: "Inactivo" },
  ]);

  const handleDelete = (id: string) => {
    setProfessionals(professionals.filter(p => p.id !== id));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-xl)" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700 }}>Equipo (Profesionales)</h1>
        <button className="btn-primary">Añadir Profesional</button>
      </div>

      <div className={styles.listCard} style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--bg-base)", borderBottom: "1px solid var(--border-light)" }}>
              <th style={{ padding: "var(--spacing-md)", fontWeight: 600, color: "var(--text-secondary)" }}>Perfil</th>
              <th style={{ padding: "var(--spacing-md)", fontWeight: 600, color: "var(--text-secondary)" }}>Nombre</th>
              <th style={{ padding: "var(--spacing-md)", fontWeight: 600, color: "var(--text-secondary)" }}>Rol / Especialidad</th>
              <th style={{ padding: "var(--spacing-md)", fontWeight: 600, color: "var(--text-secondary)" }}>Estado</th>
              <th style={{ padding: "var(--spacing-md)", fontWeight: 600, color: "var(--text-secondary)" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {professionals.map(prof => (
              <tr key={prof.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                <td style={{ padding: "var(--spacing-md)" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundImage: `url(${prof.avatar})`, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "var(--border-light)" }} />
                </td>
                <td style={{ padding: "var(--spacing-md)", fontWeight: 600 }}>{prof.name}</td>
                <td style={{ padding: "var(--spacing-md)", color: "var(--text-secondary)" }}>{prof.role}</td>
                <td style={{ padding: "var(--spacing-md)" }}>
                  <span style={{ 
                    padding: "4px 8px", borderRadius: "var(--radius-full)", fontSize: "12px", fontWeight: 600,
                    backgroundColor: prof.status === "Activo" ? "rgba(16, 185, 129, 0.1)" : "rgba(100, 116, 139, 0.1)",
                    color: prof.status === "Activo" ? "var(--success)" : "var(--text-secondary)"
                  }}>
                    {prof.status}
                  </span>
                </td>
                <td style={{ padding: "var(--spacing-md)" }}>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button style={{ background: "none", border: "none", color: "var(--accent-blue)", cursor: "pointer", fontWeight: 600 }}>Editar</button>
                    <button onClick={() => handleDelete(prof.id)} style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer", fontWeight: 600 }}>Eliminar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
