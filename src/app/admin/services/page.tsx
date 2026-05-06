"use client";

import { useState } from "react";
import styles from "../admin.module.css";

export default function ServicesPage() {
  const [services, setServices] = useState([
    { id: "1", name: "Corte de Cabello Premium", duration: "45 min", price: "$40", description: "Corte clásico o moderno con asesoría de imagen y lavado." },
    { id: "2", name: "Corte y Barba", duration: "60 min", price: "$55", description: "Servicio completo. Incluye perfilado de barba con toalla caliente." },
    { id: "3", name: "Afeitado Ejecutivo", duration: "30 min", price: "$30", description: "Afeitado tradicional a navaja con productos premium." },
  ]);

  const handleDelete = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-xl)" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700 }}>Gestión de Servicios</h1>
        <button className="btn-primary">Añadir Nuevo Servicio</button>
      </div>

      <div className={styles.listCard} style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ backgroundColor: "var(--bg-base)", borderBottom: "1px solid var(--border-light)" }}>
              <th style={{ padding: "var(--spacing-md)", fontWeight: 600, color: "var(--text-secondary)" }}>Nombre del Servicio</th>
              <th style={{ padding: "var(--spacing-md)", fontWeight: 600, color: "var(--text-secondary)" }}>Descripción</th>
              <th style={{ padding: "var(--spacing-md)", fontWeight: 600, color: "var(--text-secondary)" }}>Duración</th>
              <th style={{ padding: "var(--spacing-md)", fontWeight: 600, color: "var(--text-secondary)" }}>Precio</th>
              <th style={{ padding: "var(--spacing-md)", fontWeight: 600, color: "var(--text-secondary)" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {services.map(service => (
              <tr key={service.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                <td style={{ padding: "var(--spacing-md)", fontWeight: 600 }}>{service.name}</td>
                <td style={{ padding: "var(--spacing-md)", color: "var(--text-secondary)", fontSize: "13px", maxWidth: "300px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{service.description}</td>
                <td style={{ padding: "var(--spacing-md)", color: "var(--text-secondary)" }}>{service.duration}</td>
                <td style={{ padding: "var(--spacing-md)", fontWeight: 600, color: "var(--text-primary)" }}>{service.price}</td>
                <td style={{ padding: "var(--spacing-md)" }}>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <button style={{ background: "none", border: "none", color: "var(--accent-blue)", cursor: "pointer", fontWeight: 600 }}>Editar</button>
                    <button onClick={() => handleDelete(service.id)} style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer", fontWeight: 600 }}>Eliminar</button>
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
