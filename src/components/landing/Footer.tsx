"use client";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--line)", padding: "60px 0 32px", position: "relative", background: "var(--bg)", fontFamily: "var(--font-sans)" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
            gap: 40,
            marginBottom: 48,
          }}
          className="footer-grid"
        >
          <div>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <Image src="/zyncra-icon.png" alt="Zyncra" width={32} height={32} style={{ borderRadius: 9 }} />
              <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--fg)" }}>Zyncra</span>
            </Link>
            <p style={{ fontSize: 13.5, color: "var(--fg-dim)", lineHeight: 1.55, maxWidth: 320, margin: 0, marginBottom: 16 }}>
              Software de gestión todo en uno para negocios de servicios en Colombia y Latinoamérica.
            </p>
            <div style={{ fontSize: 12, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>
              ● status: todos los sistemas operativos
            </div>
          </div>

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
            <div key={i}>
              <div style={{ fontSize: 12, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
                {col.t}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {col.items.map(([label, href]) => (
                  <Link
                    key={label}
                    href={href}
                    style={{ fontSize: 14, color: "var(--fg-dim)", transition: "color .15s ease" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--fg)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--fg-dim)")}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

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
              <Link key={l} href="#" style={{ color: "inherit" }}>{l}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
