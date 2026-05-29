import type { ReactNode } from "react";
import {
  Container,
  Eyebrow,
  GradientOrb,
  GridBackdrop,
} from "@/components/landing/primitives";

type Article = {
  cat: string;
  title: string;
  excerpt: string;
  read: string;
  glyph: string;
  cover: "violet" | "magenta" | "orange" | "green" | "cyan" | "amber";
};

const CATEGORIES = [
  "Todos",
  "Agenda",
  "WhatsApp",
  "POS & Caja",
  "Reseñas Google",
  "Operación",
  "Casos de éxito",
];

const ARTICLES: Article[] = [
  {
    cat: "Agenda",
    glyph: "Aa",
    cover: "violet",
    read: "5 min",
    title: "El truco psicológico para que el cliente confirme su cita por WhatsApp",
    excerpt:
      "No es lo que pides. Es cómo lo pides. La diferencia entre 60% y 95% de confirmaciones está en una sola palabra.",
  },
  {
    cat: "POS & Caja",
    glyph: "$",
    cover: "magenta",
    read: "6 min",
    title: "Por qué tu caja nunca cuadra (y cómo arreglarlo esta semana)",
    excerpt:
      "El 80% de los descuadres no son robos. Son errores humanos en flujos manuales. Te mostramos los 4 más comunes y la fórmula para eliminarlos.",
  },
  {
    cat: "Reseñas Google",
    glyph: "★",
    cover: "orange",
    read: "4 min",
    title: "De 4.1 a 4.8 estrellas en 8 semanas: la fórmula exacta",
    excerpt:
      "Diana Vásquez nos cuenta el script que usa después de cada cita. Lo puedes copiar literal. Funciona.",
  },
  {
    cat: "WhatsApp",
    glyph: "Wa",
    cover: "green",
    read: "7 min",
    title:
      "Campañas de reactivación: cómo recuperar clientes que no vienen hace 60 días",
    excerpt:
      "Una plantilla, un horario y un descuento. María recuperó 12 clientes en su primera campaña. Te enseñamos cómo.",
  },
  {
    cat: "Operación",
    glyph: "%",
    cover: "cyan",
    read: "5 min",
    title: "Comisiones justas: la fórmula que tu equipo va a entender (y aceptar)",
    excerpt:
      "Olvídate del Excel. Olvídate de los reclamos. Una estructura clara, transparente y automática. Plantilla incluida.",
  },
  {
    cat: "Operación",
    glyph: "DIAN",
    cover: "amber",
    read: "9 min",
    title:
      "Factura electrónica DIAN para barberías: la guía que te ahorra 2 horas/día",
    excerpt:
      "CUFE, XML, resolución, soportes. Todo el papeleo desarmado en un solo flujo. Sin tecnicismos, sin contadores caros.",
  },
  {
    cat: "Casos de éxito",
    glyph: "∞",
    cover: "violet",
    read: "6 min",
    title: "Studio V en Manizales: de 12 a 84 clientes nuevos al mes",
    excerpt:
      "Tres cambios pequeños en su flujo cambiaron todo. El segundo es el que nadie hace y es el más importante.",
  },
  {
    cat: "Agenda",
    glyph: "UX",
    cover: "magenta",
    read: "4 min",
    title:
      "Tu link de reservas: 7 errores que están alejando clientes (y cómo arreglarlos hoy)",
    excerpt:
      "La mayoría de negocios pierde el 40% de sus reservas en el formulario. Te mostramos qué quitar para que cierre la cita.",
  },
  {
    cat: "Reseñas Google",
    glyph: "★★",
    cover: "green",
    read: "5 min",
    title:
      "El cliente difícil: cómo manejar una reseña negativa sin perder la cabeza (ni la calle)",
    excerpt:
      "Una mala reseña no es el fin del mundo — es una oportunidad. Una plantilla profesional para responder, paso a paso.",
  },
];

const COVER_BG: Record<Article["cover"], string> = {
  violet:
    "linear-gradient(135deg, rgba(251,15,5,0.30), rgba(251,15,5,0.05))",
  magenta:
    "linear-gradient(135deg, rgba(0,39,254,0.30), rgba(0,39,254,0.05))",
  orange:
    "linear-gradient(135deg, rgba(251,146,60,0.30), rgba(251,146,60,0.05))",
  green:
    "linear-gradient(135deg, rgba(52,211,153,0.30), rgba(52,211,153,0.05))",
  cyan: "linear-gradient(135deg, rgba(34,211,238,0.30), rgba(34,211,238,0.05))",
  amber:
    "linear-gradient(135deg, rgba(251,191,36,0.30), rgba(251,191,36,0.05))",
};

const Chip = ({ children, active = false }: { children: ReactNode; active?: boolean }) => (
  <span
    style={{
      padding: "8px 14px",
      border: active
        ? "1px solid rgba(0,39,254,0.4)"
        : "1px solid var(--line)",
      background: active
        ? "linear-gradient(135deg, rgba(251,15,5,0.12), rgba(0,39,254,0.06))"
        : "rgba(20,15,30,0.025)",
      borderRadius: 999,
      fontSize: 13,
      color: active ? "var(--fg)" : "var(--fg-dim)",
      cursor: "pointer",
      transition: "all .2s ease",
      fontFamily: "var(--font-sans)",
    }}
  >
    {children}
  </span>
);

export default function BlogPage() {
  return (
    <>
      {/* Hero */}
      <section
        style={{
          position: "relative",
          padding: "110px 0 56px",
          overflowX: "clip",
          textAlign: "center",
        }}
      >
        <GradientOrb color="#fb0f05" size={700} x="-10%" y="-20%" opacity={0.18} />
        <GradientOrb color="#0027fe" size={600} x="75%" y="-10%" opacity={0.22} />
        <GridBackdrop style={{ opacity: 0.6 }} />
        <Container max={1240} style={{ position: "relative", zIndex: 2 }}>
          <div style={{ marginBottom: 24, display: "flex", justifyContent: "center" }}>
            <Eyebrow accent>Blog Zyncra</Eyebrow>
          </div>
          <h1
            style={{
              fontSize: "clamp(40px, 6vw, 80px)",
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
              fontWeight: 500,
              margin: "24px auto 22px",
              maxWidth: 900,
            }}
          >
            Estrategias que{" "}
            <span className="serif gradient-text">sí funcionan</span>
            <br />
            para tu negocio de servicios.
          </h1>
          <p
            style={{
              fontSize: "clamp(16px, 1.4vw, 19px)",
              color: "var(--fg-dim)",
              lineHeight: 1.55,
              maxWidth: 560,
              margin: "0 auto",
            }}
          >
            Artículos cortos, prácticos, sin relleno. Escritos por dueños de
            barberías, salones y spas que ya lo lograron.
          </p>
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              justifyContent: "center",
              margin: "36px 0 0",
            }}
          >
            {CATEGORIES.map((c, i) => (
              <Chip key={c} active={i === 0}>
                {c}
              </Chip>
            ))}
          </div>
        </Container>
      </section>

      {/* Featured */}
      <section style={{ padding: "60px 0 40px" }}>
        <Container max={1240}>
          <div
            style={{
              fontSize: 12,
              color: "var(--fg-mute)",
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 18,
            }}
          >
            ★ Destacado de la semana
          </div>
          <a
            href="#"
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 1fr",
              border: "1px solid var(--line-strong)",
              borderRadius: 24,
              overflow: "hidden",
              background:
                "linear-gradient(180deg, rgba(20,15,30,0.03), rgba(20,15,30,0.005))",
              transition: "border-color .25s ease",
              textDecoration: "none",
              color: "inherit",
            }}
            className="blog-featured"
          >
            <div
              style={{
                background:
                  "linear-gradient(135deg, rgba(251,15,5,0.25), rgba(0,39,254,0.15))",
                position: "relative",
                minHeight: 360,
                display: "grid",
                placeItems: "center",
                overflow: "hidden",
              }}
            >
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage:
                    "linear-gradient(rgba(20,15,30,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(20,15,30,0.06) 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                  maskImage:
                    "radial-gradient(ellipse at center, black 20%, transparent 75%)",
                  WebkitMaskImage:
                    "radial-gradient(ellipse at center, black 20%, transparent 75%)",
                }}
              />
              <span
                className="serif"
                style={{
                  position: "relative",
                  fontSize: "clamp(96px, 12vw, 180px)",
                  color: "var(--fg)",
                  opacity: 0.85,
                  lineHeight: 0.9,
                }}
              >
                −60%
              </span>
            </div>
            <div
              style={{
                padding: 40,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "center",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--fg-mute)",
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    background: "rgba(0,39,254,0.10)",
                    border: "1px solid rgba(0,39,254,0.3)",
                    color: "var(--violet-2)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  CASO DE ÉXITO
                </span>
                <span>26 May 2026</span>
                <span>·</span>
                <span>8 min lectura</span>
              </div>
              <h2
                style={{
                  fontSize: "clamp(26px, 3vw, 38px)",
                  lineHeight: 1.1,
                  letterSpacing: "-0.03em",
                  margin: "0 0 14px",
                  fontWeight: 500,
                }}
              >
                Cómo Black Fade redujo sus no-shows un 70% en 90 días
              </h2>
              <p
                style={{
                  color: "var(--fg-dim)",
                  lineHeight: 1.55,
                  margin: "0 0 24px",
                  fontSize: 15,
                }}
              >
                Alejandro Ruiz tenía un problema clásico: 3 de cada 10 clientes
                no aparecían. Esto es exactamente lo que cambió — paso a paso —
                para recuperar más de $4M mensuales sin contratar a nadie.
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  paddingTop: 20,
                  borderTop: "1px solid var(--line)",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #fb0f05, #0027fe)",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "white",
                  }}
                >
                  AR
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>
                    Alejandro Ruiz · entrevistado
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--fg-mute)" }}>
                    Black Fade Barbershop · Bogotá
                  </div>
                </div>
              </div>
            </div>
          </a>
        </Container>
      </section>

      {/* Article grid */}
      <section style={{ padding: "40px 0 60px" }}>
        <Container max={1240}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <h2
              style={{
                fontSize: 28,
                letterSpacing: "-0.02em",
                fontWeight: 500,
                margin: 0,
              }}
            >
              Lo más reciente
            </h2>
            <a
              href="#"
              style={{
                color: "var(--violet-2)",
                fontSize: 13,
                fontFamily: "var(--font-mono)",
                textDecoration: "none",
              }}
            >
              VER TODO →
            </a>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 20,
            }}
            className="article-grid"
          >
            {ARTICLES.map((a, i) => (
              <a
                key={i}
                href="#"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(20,15,30,0.03), rgba(20,15,30,0.01))",
                  border: "1px solid var(--line)",
                  borderRadius: 18,
                  overflow: "hidden",
                  textDecoration: "none",
                  color: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform .25s ease, border-color .25s ease",
                }}
              >
                <div
                  style={{
                    aspectRatio: "16 / 9",
                    position: "relative",
                    overflow: "hidden",
                    display: "grid",
                    placeItems: "center",
                    background: COVER_BG[a.cover],
                  }}
                >
                  <div
                    aria-hidden
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage:
                        "linear-gradient(rgba(20,15,30,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(20,15,30,0.05) 1px, transparent 1px)",
                      backgroundSize: "24px 24px",
                      maskImage:
                        "radial-gradient(ellipse at center, black 20%, transparent 75%)",
                      WebkitMaskImage:
                        "radial-gradient(ellipse at center, black 20%, transparent 75%)",
                    }}
                  />
                  <span
                    className="serif"
                    style={{
                      position: "relative",
                      fontSize: "clamp(60px, 8vw, 96px)",
                      color: "var(--fg)",
                      opacity: 0.85,
                      lineHeight: 0.9,
                    }}
                  >
                    {a.glyph}
                  </span>
                </div>
                <div
                  style={{
                    padding: "20px 22px 22px",
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--fg-mute)",
                      marginBottom: 12,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    <span>{a.cat}</span>
                    <span
                      style={{
                        width: 3,
                        height: 3,
                        borderRadius: 999,
                        background: "var(--fg-mute)",
                      }}
                    />
                    <span>{a.read}</span>
                  </div>
                  <h3
                    style={{
                      fontSize: 19,
                      lineHeight: 1.25,
                      letterSpacing: "-0.02em",
                      margin: "0 0 10px",
                      fontWeight: 500,
                    }}
                  >
                    {a.title}
                  </h3>
                  <p
                    style={{
                      color: "var(--fg-dim)",
                      lineHeight: 1.5,
                      margin: 0,
                      fontSize: 13.5,
                      flex: 1,
                    }}
                  >
                    {a.excerpt}
                  </p>
                  <span
                    style={{
                      marginTop: 18,
                      fontSize: 12.5,
                      color: "var(--violet-2)",
                      fontWeight: 500,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    LEER →
                  </span>
                </div>
              </a>
            ))}
          </div>

          {/* Newsletter */}
          <div
            style={{
              margin: "60px auto 100px",
              padding: "56px 40px",
              borderRadius: 24,
              background:
                "linear-gradient(135deg, rgba(251,15,5,0.08) 0%, rgba(0,39,254,0.06) 100%)",
              border: "1px solid rgba(0,39,254,0.3)",
              textAlign: "center",
              boxShadow: "0 30px 80px -30px rgba(0,39,254,0.35)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <GradientOrb color="#fb0f05" size={400} x="-10%" y="-30%" opacity={0.4} blur={100} />
            <GradientOrb color="#0027fe" size={400} x="80%" y="60%" opacity={0.35} blur={100} />
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <Eyebrow accent>Newsletter semanal</Eyebrow>
              </div>
              <h3
                style={{
                  fontSize: "clamp(26px, 3vw, 38px)",
                  margin: "16px 0 12px",
                  letterSpacing: "-0.03em",
                  fontWeight: 500,
                }}
              >
                1 estrategia. Cada lunes.{" "}
                <span className="serif gradient-text">7 minutos.</span>
              </h3>
              <p
                style={{
                  color: "var(--fg-dim)",
                  margin: "0 auto 28px",
                  maxWidth: 480,
                  lineHeight: 1.5,
                }}
              >
                Sin spam. Solo tácticas reales para dueños de negocio. Cancelas con 1 clic.
              </p>
              <form
                style={{
                  display: "flex",
                  gap: 10,
                  justifyContent: "center",
                  flexWrap: "wrap",
                  maxWidth: 500,
                  margin: "0 auto",
                }}
              >
                <input
                  type="email"
                  placeholder="tu@email.com"
                  required
                  style={{
                    flex: 1,
                    minWidth: 240,
                    padding: "12px 16px",
                    background: "rgba(20,15,30,0.06)",
                    border: "1px solid var(--line-strong)",
                    borderRadius: 12,
                    color: "var(--fg)",
                    fontFamily: "var(--font-sans)",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: "11px 18px",
                    background:
                      "linear-gradient(135deg, #fb0f05 0%, #0027fe 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: 12,
                    fontFamily: "var(--font-sans)",
                    fontSize: 14.5,
                    fontWeight: 500,
                    cursor: "pointer",
                    boxShadow:
                      "0 8px 30px -10px rgba(0,39,254,0.45), inset 0 1px 0 rgba(255,255,255,0.25)",
                  }}
                >
                  Suscribirme →
                </button>
              </form>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--fg-mute)",
                  marginTop: 18,
                  fontFamily: "var(--font-mono)",
                }}
              >
                1.247 dueños de negocio ya leen Zyncra Weekly
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
