"use client";
import { useState } from "react";
import Link from "next/link";

const Icon = ({ children, size = 20, style = {}, strokeWidth = 1.6 }: {
  children: React.ReactNode; size?: number; style?: React.CSSProperties; strokeWidth?: number;
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {children}
  </svg>
);

const IconArrow = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M5 12h14M13 5l7 7-7 7" /></Icon>;
const IconCalendar = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></Icon>;
const IconClock = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>;

const CATEGORIES = ["Todos", "Negocio", "Marketing", "Tecnología", "Casos de éxito", "Tutoriales"];

const ARTICLES = [
  { slug: "reducir-no-shows-60-porciento", title: "Cómo reducir los no-shows un 60% con recordatorios automáticos por WhatsApp", category: "Negocio", date: "22 mayo 2026", readTime: "5 min", gradient: "linear-gradient(135deg, #A78BFA, #EC4899)", featured: true, excerpt: "Descubre la estrategia exacta que usan 500+ negocios en Colombia para eliminar las ausencias de clientes y recuperar miles de pesos al mes." },
  { slug: "campanas-whatsapp-reactivacion", title: "WhatsApp marketing para barberías: guía completa 2026", category: "Marketing", date: "18 mayo 2026", readTime: "8 min", gradient: "linear-gradient(135deg, #34D399, #22D3EE)" },
  { slug: "pos-facturacion-dian-colombia", title: "POS + Factura DIAN: todo lo que necesitas saber en 2026", category: "Tecnología", date: "14 mayo 2026", readTime: "6 min", gradient: "linear-gradient(135deg, #EC4899, #FB923C)" },
  { slug: "studio-v-caso-exito", title: "Studio V aumentó sus reseñas de 4.1 a 4.8 en 2 meses", category: "Casos de éxito", date: "10 mayo 2026", readTime: "4 min", gradient: "linear-gradient(135deg, #FBBF24, #FB923C)" },
  { slug: "configurar-agenda-5-minutos", title: "Configura tu agenda en 5 minutos: paso a paso", category: "Tutoriales", date: "6 mayo 2026", readTime: "3 min", gradient: "linear-gradient(135deg, #A78BFA, #22D3EE)" },
  { slug: "comisiones-equipo-automaticas", title: "Adiós al Excel: liquida comisiones automáticamente", category: "Negocio", date: "2 mayo 2026", readTime: "5 min", gradient: "linear-gradient(135deg, #34D399, #A78BFA)" },
  { slug: "google-reviews-ranking-local", title: "Cómo subir tu ranking en Google Maps en 30 días", category: "Marketing", date: "28 abril 2026", readTime: "7 min", gradient: "linear-gradient(135deg, #EC4899, #A78BFA)" },
  { slug: "black-fade-barbershop-historia", title: "Black Fade: de Excel a facturar $8M mensuales con Zyncra", category: "Casos de éxito", date: "24 abril 2026", readTime: "6 min", gradient: "linear-gradient(135deg, #FB923C, #FBBF24)" },
  { slug: "integraciones-nequi-daviplata", title: "Acepta Nequi, Daviplata y Bancolombia en tu negocio hoy", category: "Tecnología", date: "20 abril 2026", readTime: "4 min", gradient: "linear-gradient(135deg, #22D3EE, #34D399)" },
];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const featured = ARTICLES.find((a) => a.featured);
  const rest = ARTICLES.filter((a) => !a.featured);
  const filtered = activeCategory === "Todos" ? rest : rest.filter((a) => a.category === activeCategory);

  return (
    <>
      {/* Featured Hero */}
      <section style={{ position: "relative", paddingTop: 140, paddingBottom: 80, overflow: "hidden" }}>
        <div aria-hidden style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, #A78BFA 0%, transparent 65%)", filter: "blur(120px)", opacity: 0.22, left: "-10%", top: "-30%", pointerEvents: "none" }} />
        <div aria-hidden style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, #EC4899 0%, transparent 65%)", filter: "blur(120px)", opacity: 0.18, left: "75%", top: "-10%", pointerEvents: "none" }} />
        <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(20,15,30,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(20,15,30,0.04) 1px, transparent 1px)", backgroundSize: "64px 64px", maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)", WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)", pointerEvents: "none", opacity: 0.5 } as React.CSSProperties} />

        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px", position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 48 }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, border: "1px solid var(--line-strong)", background: "rgba(167,139,250,0.08)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500, color: "var(--violet-2)", fontFamily: "var(--font-mono)", marginBottom: 20 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--violet-2)", boxShadow: "0 0 10px var(--violet-2)", animation: "pulseGlow 1.8s ease-in-out infinite" }} />
                Blog · Zyncra
              </div>
              <h1 style={{ fontSize: "clamp(42px, 5.5vw, 72px)", lineHeight: 0.96, letterSpacing: "-0.045em", fontWeight: 500, margin: 0 }}>
                Ideas para hacer<br />
                <span style={{ background: "var(--gradient)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>crecer tu negocio.</span>
              </h1>
            </div>
          </div>

          {/* Featured article */}
          {featured && (
            <Link href={`/blog/${featured.slug}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, borderRadius: 24, overflow: "hidden", border: "1px solid var(--line-strong)", textDecoration: "none", color: "inherit", background: "var(--bg-card)" }}>
              <div style={{ padding: "48px 44px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.3)", fontSize: 11, color: "var(--violet-2)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em", marginBottom: 20 }}>
                    DESTACADO
                  </div>
                  <h2 style={{ fontSize: "clamp(24px, 2.5vw, 34px)", lineHeight: 1.15, letterSpacing: "-0.025em", fontWeight: 500, margin: 0, marginBottom: 18 }}>{featured.title}</h2>
                  <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--fg-dim)", margin: 0, marginBottom: 28 }}>{featured.excerpt}</p>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 12, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", marginBottom: 20 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><IconCalendar size={12} /> {featured.date}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><IconClock size={12} /> {featured.readTime} lectura</span>
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 500, color: "var(--violet-2)" }}>
                    Leer artículo <IconArrow size={14} />
                  </div>
                </div>
              </div>
              <div style={{ background: featured.gradient, position: "relative", minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
                <div style={{ position: "relative", textAlign: "center", padding: 40 }}>
                  <div style={{ fontSize: "clamp(56px, 6vw, 80px)", fontWeight: 700, color: "white", opacity: 0.15, fontFamily: "var(--font-mono)", lineHeight: 1 }}>−60%</div>
                  <div style={{ fontSize: 16, color: "white", fontWeight: 500 }}>no-shows</div>
                </div>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* Category chips */}
      <section style={{ padding: "0 0 48px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: "8px 16px", borderRadius: 999, border: activeCategory === cat ? "1px solid var(--violet-2)" : "1px solid var(--line)", background: activeCategory === cat ? "rgba(167,139,250,0.12)" : "rgba(20,15,30,0.025)", color: activeCategory === cat ? "var(--violet-2)" : "var(--fg-dim)", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)", transition: "all .2s ease" }}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section style={{ padding: "0 0 80px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="blog-grid">
            {filtered.map((a, i) => (
              <Link key={i} href={`/blog/${a.slug}`} style={{ display: "block", textDecoration: "none", color: "inherit" }}>
                <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid var(--line)", transition: "transform .25s ease, border-color .25s ease" }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--line-strong)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--line)"; }}>
                  <div style={{ height: 160, background: a.gradient, position: "relative" }}>
                    <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
                    <div style={{ position: "absolute", bottom: 14, left: 16 }}>
                      <span style={{ fontSize: 10.5, padding: "4px 10px", borderRadius: 999, background: "rgba(0,0,0,0.3)", color: "white", fontFamily: "var(--font-mono)", letterSpacing: "0.06em", backdropFilter: "blur(8px)" }}>{a.category.toUpperCase()}</span>
                    </div>
                  </div>
                  <div style={{ padding: 20 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 500, letterSpacing: "-0.015em", lineHeight: 1.4, margin: 0, marginBottom: 14 }}>{a.title}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11.5, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><IconCalendar size={11} /> {a.date}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}><IconClock size={11} /> {a.readTime}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <style>{`
          @media (max-width: 880px) { .blog-grid { grid-template-columns: 1fr 1fr !important; } }
          @media (max-width: 560px) { .blog-grid { grid-template-columns: 1fr !important; } }
          @media (max-width: 760px) { .featured-article-grid { grid-template-columns: 1fr !important; } }
        `}</style>
      </section>

      {/* Newsletter */}
      <section style={{ padding: "80px 0 120px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center", padding: "56px 40px", background: "linear-gradient(180deg, rgba(167,139,250,0.08) 0%, rgba(236,72,153,0.04) 100%)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 24 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, border: "1px solid var(--line-strong)", background: "rgba(167,139,250,0.08)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500, color: "var(--violet-2)", fontFamily: "var(--font-mono)", marginBottom: 20 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--violet-2)", boxShadow: "0 0 10px var(--violet-2)", animation: "pulseGlow 1.8s ease-in-out infinite" }} />
              Newsletter
            </div>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 40px)", lineHeight: 1.1, letterSpacing: "-0.03em", fontWeight: 500, margin: "0 0 14px" }}>
              Consejos cada semana,{" "}
              <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}>gratis.</span>
            </h2>
            <p style={{ fontSize: 15, color: "var(--fg-dim)", margin: "0 0 28px", lineHeight: 1.6 }}>
              Cada martes, un tip para hacer crecer tu negocio. Sin spam, sin relleno.
            </p>
            {subscribed ? (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 22px", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 14, fontSize: 14, color: "var(--green)", fontFamily: "var(--font-mono)" }}>
                Estás suscrito — gracias!
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: "1px solid var(--line-strong)", background: "rgba(255,255,255,0.6)", fontSize: 14, fontFamily: "var(--font-sans)", color: "var(--fg)", outline: "none" }}
                />
                <button
                  onClick={() => { if (email) setSubscribed(true); }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 20px", borderRadius: 12, background: "linear-gradient(135deg, #A78BFA 0%, #EC4899 60%, #FB923C 100%)", color: "white", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, fontFamily: "var(--font-sans)", whiteSpace: "nowrap" }}
                >
                  Suscribirme <IconArrow size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
