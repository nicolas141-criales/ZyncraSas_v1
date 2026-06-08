"use client";
import { useState } from "react";
import TabResumen  from "./TabResumen";
import TabCaja     from "./TabCaja";
import TabVentas   from "./TabVentas";
import TabReportes from "./TabReportes";

type Tab = "resumen" | "caja" | "ventas" | "reportes";
const TABS: { id: Tab; label: string }[] = [
  { id: "resumen",  label: "Resumen"  },
  { id: "caja",     label: "Caja"     },
  { id: "ventas",   label: "Ventas"   },
  { id: "reportes", label: "Reportes" },
];

export default function FinanzasPage() {
  const [tab, setTab] = useState<Tab>("resumen");
  return (
    <div style={{ fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif" }}>
      <div style={{
        display: "flex", gap: 4, padding: 4,
        background: "white", border: "1px solid #e8e6e2", borderRadius: 14,
        width: "fit-content", marginBottom: 24,
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "9px 22px", borderRadius: 11, fontSize: 13, fontWeight: 600,
            cursor: "pointer", border: "none", transition: "all 0.15s",
            fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif",
            background: tab === t.id ? "linear-gradient(135deg,#fb0f05,#0027fe)" : "transparent",
            color: tab === t.id ? "#fff" : "#564E66",
            boxShadow: tab === t.id ? "0 2px 10px rgba(251,15,5,.2)" : "none",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "resumen"  && <TabResumen  />}
      {tab === "caja"     && <TabCaja     />}
      {tab === "ventas"   && <TabVentas   />}
      {tab === "reportes" && <TabReportes />}
    </div>
  );
}
