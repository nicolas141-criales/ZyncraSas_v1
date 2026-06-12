"use client";

import Image from "next/image";
import Link from "next/link";

export default function SupplierPendingPage() {
  return (
    <div style={{
      minHeight: "100vh", background: "#07071a",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, fontFamily: "var(--font-space-grotesk,'Space Grotesk',sans-serif)",
    }}>
      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 48 }}>
        <Image src="/zyncra-icon.png" alt="Zyncra" height={28} width={28} style={{ height: 28, width: "auto" }} />
        <span style={{ fontWeight: 800, fontSize: 19, color: "white", letterSpacing: "-0.5px" }}>Zyncra</span>
      </Link>

      <div style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20, padding: "40px 48px", maxWidth: 480, width: "100%", textAlign: "center",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "rgba(251,186,5,0.12)", border: "1px solid rgba(251,186,5,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 28, margin: "0 auto 20px",
        }}>
          ⏳
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "white", marginBottom: 10 }}>
          Solicitud en revisión
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 24 }}>
          Recibimos tu solicitud para unirte como proveedor de Zyncra. Nuestro equipo la revisará en las próximas <strong style={{ color: "rgba(255,255,255,0.75)" }}>48 horas hábiles</strong> y te notificará por correo electrónico.
        </p>

        <div style={{
          background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "14px 16px",
          border: "1px solid rgba(255,255,255,0.06)", marginBottom: 28, textAlign: "left",
        }}>
          {[
            "Revisaremos tu información y categorías",
            "Verificaremos tu empresa",
            "Te activaremos el acceso al portal de proveedores",
          ].map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: i < 2 ? 10 : 0 }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                background: "rgba(251,186,5,0.15)", border: "1px solid rgba(251,186,5,0.3)",
                flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700, color: "#fbbf24",
              }}>
                {i + 1}
              </div>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{step}</span>
            </div>
          ))}
        </div>

        <Link href="/" style={{
          display: "block", padding: "12px", borderRadius: 10, textAlign: "center",
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: 13, fontWeight: 600,
        }}>
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
