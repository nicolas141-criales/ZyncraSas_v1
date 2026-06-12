"use client";
import Link from "next/link";
import Image from "next/image";
import { Reveal, Stagger, StaggerItem } from "./motion";

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--line)",
        padding: "60px 0 32px",
        position: "relative",
        background: "var(--bg)",
        fontFamily: "var(--font-sans)",
        overflow: "hidden",
      }}
    >
      {/* Línea de luz superior */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -1,
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(720px, 80%)",
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(251,15,5,0.55), rgba(0,39,254,0.55), transparent)",
        }}
      />
      {/* Profundidad: resplandor ambiental */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -160,
          left: "50%",
          transform: "translateX(-50%)",
          width: 900,
          height: 320,
          background:
            "radial-gradient(ellipse at center, rgba(0,39,254,0.07), rgba(251,15,5,0.04) 50%, transparent 75%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px", position: "relative" }}>
        <Stagger
          gap={0.09}
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
            gap: 40,
            marginBottom: 48,
          }}
          className="footer-grid"
        >
          <StaggerItem>
            <Link
              href="/"
              style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, width: "fit-content" }}
            >
              <Image
                src="/zyncra-icon.png"
                alt="Zyncra"
                width={32}
                height={32}
                style={{ borderRadius: 9, transition: "transform .3s cubic-bezier(.22,1,.36,1)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1.1) rotate(-4deg)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1) rotate(0deg)")}
              />
              <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--fg)" }}>Zyncra</span>
            </Link>
            <p style={{ fontSize: 13.5, color: "var(--fg-dim)", lineHeight: 1.55, maxWidth: 320, margin: 0, marginBottom: 16 }}>
              Software de gestión todo en uno para negocios de servicios en Colombia y Latinoamérica.
            </p>
            <div
              style={{
                fontSize: 12,
                color: "var(--fg-mute)",
                fontFamily: "var(--font-mono)",
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  background: "var(--green)",
                  boxShadow: "0 0 10px rgba(52,211,153,0.8)",
                  animation: "pulseGlow 1.8s ease-in-out infinite",
                  display: "inline-block",
                }}
              />
              status: todos los sistemas operativos
            </div>
          </StaggerItem>

          {(
            [
              {
                t: "Producto",
                items: [
                  ["Funciones", "/features"],
                  ["WhatsApp", "/features"],
                  ["POS", "/features"],
                  ["Facturación", "/features"],
                  ["Precios", "/pricing"],
                ],
              },
              {
                t: "Empresa",
                items: [
                  ["Nosotros", "#"],
                  ["Blog", "/blog"],
                  ["Reseñas", "/reviews"],
                  ["Contacto", "#"],
                ],
              },
              {
                t: "Soporte",
                items: [
                  ["Centro de ayuda", "#"],
                  ["Estado del sistema", "#"],
                  ["WhatsApp", "#"],
                  ["Demo gratuita", "#"],
                ],
              },
            ] as { t: string; items: [string, string][] }[]
          ).map((col, i) => (
            <StaggerItem key={i}>
              <div style={{ fontSize: 12, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
                {col.t}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
                {col.items.map(([label, href]) => (
                  <Link
                    key={label}
                    href={href}
                    className="zn-foot-link"
                    style={{ fontSize: 14, color: "var(--fg-dim)" }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal y={12} amount={0.4}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 24,
              borderTop: "1px solid var(--line)",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div style={{ fontSize: 12.5, color: "var(--fg-mute)" }}>© 2026 Zyncra · Hecho en Colombia</div>
            <div style={{ display: "flex", gap: 20, fontSize: 12.5, color: "var(--fg-mute)" }}>
              {["Privacidad", "Términos", "Contacto"].map((l) => (
                <Link key={l} href="#" className="zn-foot-link" style={{ color: "inherit" }}>{l}</Link>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </footer>
  );
}
