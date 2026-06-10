"use client";
import { useState } from "react";
import TabResumen      from "./TabResumen";
import TabCaja         from "./TabCaja";
import TabVentas       from "./TabVentas";
import TabReportes     from "./TabReportes";
import TabRentabilidad from "./TabRentabilidad";

type Tab = "resumen" | "caja" | "ventas" | "reportes" | "rentabilidad";
const TABS: { id: Tab; label: string }[] = [
  { id: "resumen",       label: "Resumen"       },
  { id: "caja",          label: "Caja"          },
  { id: "ventas",        label: "Ventas"        },
  { id: "reportes",      label: "Reportes"      },
  { id: "rentabilidad",  label: "Rentabilidad"  },
];

export default function FinanzasPage() {
  const [tab, setTab] = useState<Tab>("resumen");
  return (
    <div style={{ fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif" }}>
      <div style={{
        display: "flex", gap: 2, padding: 3,
        background: "white", border: "1px solid rgba(20,15,30,0.08)", borderRadius: 11,
        width: "fit-content", marginBottom: 22, maxWidth: "100%", overflowX: "auto",
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "7px 18px", borderRadius: 8, fontSize: 12.5, fontWeight: 600,
            cursor: "pointer", border: "none", whiteSpace: "nowrap",
            transition: "background .16s ease, color .16s ease",
            fontFamily: "var(--font-space-grotesk),'Space Grotesk',sans-serif",
            background: tab === t.id ? "#14111C" : "transparent",
            color: tab === t.id ? "#fff" : "#564E66",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      <div key={tab} style={{ animation: "znFadeUp .35s cubic-bezier(.22,1,.36,1) both" }}>
        {tab === "resumen"      && <TabResumen      />}
        {tab === "caja"         && <TabCaja         />}
        {tab === "ventas"       && <TabVentas       />}
        {tab === "reportes"     && <TabReportes     />}
        {tab === "rentabilidad" && <TabRentabilidad />}
      </div>
    </div>
  );
}
