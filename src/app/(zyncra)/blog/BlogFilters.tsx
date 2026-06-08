"use client";

import { useState } from "react";
import Link from "next/link";
import type { ArticleMeta } from "./articles";
import { CATS } from "./articles";

const CATEGORIES = ["Todos", "Agenda", "WhatsApp", "Marketing", "Facturación", "Operación", "Negocios"];

const CAT_COVER: Record<string, { from: string; to: string }> = {
  Agenda:      { from: "rgba(251,15,5,0.32)",   to: "rgba(251,15,5,0.05)" },
  Marketing:   { from: "rgba(22,163,74,0.32)",  to: "rgba(22,163,74,0.05)" },
  Facturación: { from: "rgba(0,39,254,0.32)",   to: "rgba(0,39,254,0.05)" },
  Negocios:    { from: "rgba(123,47,190,0.32)", to: "rgba(123,47,190,0.05)" },
  WhatsApp:    { from: "rgba(37,211,102,0.32)", to: "rgba(37,211,102,0.05)" },
  Operación:   { from: "rgba(234,179,8,0.32)",  to: "rgba(234,179,8,0.05)" },
};

function coverGradient(category: string) {
  const c = CAT_COVER[category] ?? { from: "rgba(0,39,254,0.32)", to: "rgba(0,39,254,0.05)" };
  return `linear-gradient(135deg, ${c.from}, ${c.to})`;
}

export default function BlogFilters({ articles }: { articles: ArticleMeta[] }) {
  const [active, setActive] = useState("Todos");

  const filtered = active === "Todos" ? articles : articles.filter((a) => a.category === active);
  const [featured, ...rest] = filtered;

  return (
    <>
      {/* Category chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", margin: "36px 0 0", padding: "0 24px" }}>
        {CATEGORIES.map((c) => {
          const isActive = c === active;
          return (
            <button
              key={c}
              onClick={() => setActive(c)}
              style={{
                padding: "8px 14px",
                border: isActive ? "1px solid rgba(0,39,254,0.4)" : "1px solid var(--line)",
                background: isActive
                  ? "linear-gradient(135deg, rgba(251,15,5,0.12), rgba(0,39,254,0.06))"
                  : "rgba(20,15,30,0.025)",
                borderRadius: 999,
                fontSize: 13,
                color: isActive ? "var(--fg)" : "var(--fg-dim)",
                cursor: "pointer",
                transition: "all .2s ease",
                fontFamily: "var(--font-sans)",
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Featured */}
      {featured ? (
        <section style={{ padding: "60px 0 40px" }}>
          <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ fontSize: 12, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 18 }}>
              ★ Destacado de la semana
            </div>
            <Link
              href={`/blog/${featured.slug}`}
              style={{
                display: "grid", gridTemplateColumns: "1.1fr 1fr",
                border: "1px solid var(--line-strong)", borderRadius: 24, overflow: "hidden",
                background: "linear-gradient(180deg, rgba(20,15,30,0.03), rgba(20,15,30,0.005))",
                textDecoration: "none", color: "inherit",
              }}
              className="blog-featured"
            >
              <div style={{ background: coverGradient(featured.category), position: "relative", minHeight: 360, display: "grid", placeItems: "center", overflow: "hidden" }}>
                <div aria-hidden style={{
                  position: "absolute", inset: 0,
                  backgroundImage: "linear-gradient(rgba(20,15,30,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(20,15,30,0.06) 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                  maskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
                  WebkitMaskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
                }} />
                <span className="serif" style={{ position: "relative", fontSize: "clamp(96px, 12vw, 180px)", color: "var(--fg)", opacity: 0.85, lineHeight: 0.9 }}>
                  {featured.emoji}
                </span>
              </div>
              <div style={{ padding: 40, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-mute)", marginBottom: 14 }}>
                  <span style={{
                    padding: "4px 10px", borderRadius: 999,
                    background: CATS[featured.category]?.bg ?? "rgba(0,39,254,0.10)",
                    border: `1px solid ${CATS[featured.category]?.text ?? "#0027fe"}40`,
                    color: CATS[featured.category]?.text ?? "var(--violet-2)",
                    textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>
                    {featured.category}
                  </span>
                  <span>{featured.date}</span>
                  <span>·</span>
                  <span>{featured.readTime} min lectura</span>
                </div>
                <h2 style={{ fontSize: "clamp(26px, 3vw, 38px)", lineHeight: 1.1, letterSpacing: "-0.03em", margin: "0 0 14px", fontWeight: 500 }}>
                  {featured.title}
                </h2>
                <p style={{ color: "var(--fg-dim)", lineHeight: 1.55, margin: "0 0 24px", fontSize: 15 }}>
                  {featured.lead}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #fb0f05, #0027fe)", display: "grid", placeItems: "center", fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 500, color: "white" }}>Z</div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{featured.author}</div>
                    <div style={{ fontSize: 11.5, color: "var(--fg-mute)" }}>Zyncra</div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      ) : (
        <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--fg-mute)", fontFamily: "var(--font-mono)", fontSize: 14 }}>
          No hay artículos en esta categoría aún.
        </div>
      )}

      {/* Article grid */}
      {rest.length > 0 && (
        <section style={{ padding: "0 0 60px" }}>
          <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 28, letterSpacing: "-0.02em", fontWeight: 500, margin: 0 }}>
                {active === "Todos" ? "Lo más reciente" : `Artículos · ${active}`}
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="article-grid">
              {rest.map((a) => {
                const cat = CATS[a.category] ?? CATS["Negocios"];
                return (
                  <Link
                    key={a.slug}
                    href={`/blog/${a.slug}`}
                    style={{
                      background: "linear-gradient(180deg, rgba(20,15,30,0.03), rgba(20,15,30,0.01))",
                      border: "1px solid var(--line)", borderRadius: 18, overflow: "hidden",
                      textDecoration: "none", color: "inherit",
                      display: "flex", flexDirection: "column",
                      transition: "transform .25s ease, border-color .25s ease",
                    }}
                  >
                    <div style={{
                      aspectRatio: "16 / 9", position: "relative", overflow: "hidden",
                      display: "grid", placeItems: "center",
                      background: coverGradient(a.category),
                    }}>
                      <div aria-hidden style={{
                        position: "absolute", inset: 0,
                        backgroundImage: "linear-gradient(rgba(20,15,30,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(20,15,30,0.05) 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                        maskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
                        WebkitMaskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
                      }} />
                      <span className="serif" style={{ position: "relative", fontSize: "clamp(48px, 7vw, 80px)", lineHeight: 0.9 }}>
                        {a.emoji}
                      </span>
                    </div>
                    <div style={{ padding: "20px 22px 22px", display: "flex", flexDirection: "column", flex: 1 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-mute)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        <span style={{ color: cat.text, fontWeight: 700 }}>{a.category}</span>
                        <span style={{ width: 3, height: 3, borderRadius: 999, background: "var(--fg-mute)" }} />
                        <span>{a.readTime} min</span>
                      </div>
                      <h3 style={{ fontSize: 19, lineHeight: 1.25, letterSpacing: "-0.02em", margin: "0 0 10px", fontWeight: 500 }}>
                        {a.title}
                      </h3>
                      <p style={{ color: "var(--fg-dim)", lineHeight: 1.5, margin: 0, fontSize: 13.5, flex: 1 }}>
                        {a.lead.substring(0, 140)}…
                      </p>
                      <span style={{ marginTop: 18, fontSize: 12.5, color: "var(--violet-2)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", letterSpacing: "0.02em" }}>
                        LEER →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
