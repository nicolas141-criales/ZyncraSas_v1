"use client";
import { use } from "react";
import Link from "next/link";
import ZyncraNav from "../../ZyncraNav";
import ZyncraFooter from "../../ZyncraFooter";
import ZyncraReveal from "../../ZyncraReveal";

// ── Data ─────────────────────────────────────────────────────────────────────

const CATS: Record<string, { bg: string; text: string }> = {
  "Agenda":      { bg: "rgba(251,15,5,.1)",   text: "#fb0f05" },
  "Marketing":   { bg: "rgba(22,163,74,.1)",  text: "#16a34a" },
  "Facturación": { bg: "rgba(0,39,254,.09)",  text: "#0027fe" },
  "Negocios":    { bg: "rgba(123,47,190,.1)", text: "#7B2FBE" },
};

const ARTICLES: Record<string, {
  category: string; title: string; readTime: number; date: string; author: string; emoji: string;
  lead: string; content: React.ReactNode;
}> = {
  "como-reducir-no-shows-barberia": {
    category: "Agenda", emoji: "📅", readTime: 5, date: "20 mayo 2026", author: "Equipo Zyncra",
    title: "Cómo reducir los no-shows en tu negocio hasta un 60%",
    lead: "Los no-shows son silenciosos pero devastadores. Un cliente que no llega sin avisar te hace perder el tiempo de ese servicio y bloquea el espacio para otros que sí querían venir. En Colombia, el promedio es del 22-28% de las citas agendadas — casi 1 de cada 4.",
    content: (
      <>
        <h2>El costo real de un no-show</h2>
        <p>Para un negocio con 8 servicios al día a $45.000 promedio, un 25% de no-shows son 2 servicios perdidos diarios: <strong>$90.000/día · $2.7M/mes · $32M/año.</strong> No es un problema menor — es el mayor problema operativo de los negocios de servicios.</p>

        <blockquote className="z-blog-pullquote">
          "Desde que activamos los recordatorios automáticos, los no-shows bajaron del 28% al 8% en el primer mes. Fue el cambio más impactante que hemos hecho en 4 años."
          <div style={{ marginTop: 12, fontSize: 14, fontWeight: 500, fontStyle: "normal", color: "var(--fg-dim)" }}>— Alejandro Ruiz, Black Fade Barbershop · Bogotá</div>
        </blockquote>

        <h2>1. El recordatorio es lo más importante</h2>
        <p>El 80% de los no-shows no son clientes que deciden no ir — son clientes que simplemente olvidan. Un recordatorio bien diseñado resuelve la mayoría del problema:</p>
        <ul>
          <li><strong>24 horas antes</strong>: Mensaje recordatorio con los detalles de la cita</li>
          <li><strong>2 horas antes</strong>: Mensaje de confirmación final ("¿Vienes hoy?") con botón para confirmar o reprogramar</li>
          <li>Envíalo por WhatsApp — tiene tasa de apertura del 98% vs 20% del email</li>
        </ul>

        <h2>2. La confirmación activa cambia todo</h2>
        <p>No basta con recordar — pide al cliente que confirme activamente. Un mensaje como "¿Confirmas tu cita de mañana a las 3pm? Responde Sí o No" convierte un recordatorio pasivo en una confirmación real. Los negocios que usan confirmación activa ven una reducción adicional del 15-20% en no-shows.</p>

        <h2>3. Facilita la reprogramación</h2>
        <p>Muchos clientes no van porque les surgió algo pero no saben cómo avisar. Si ofreces un enlace directo para reprogramar en el mismo mensaje de recordatorio, el cliente reprograma en lugar de desaparecer. Resultado: no pierdes el cliente, solo mueves la cita.</p>

        <h2>4. Cobra un depósito en servicios de larga duración</h2>
        <p>Para servicios de más de 60 minutos (keratinas, tattoos, tratamientos), pedir un depósito del 20-30% reduce los no-shows a casi cero. Un cliente que ha pagado algo siempre avisa si no puede ir.</p>

        <h2>5. Mide y actúa sobre los patrones</h2>
        <p>Algunos clientes tienen historial de no-shows repetidos. Con datos puedes identificarlos y agregarles un recordatorio extra o requerir depósito preventivo. La data que tienes en tu sistema es tu mejor herramienta.</p>

        <p>Implementado correctamente, este sistema lleva los no-shows del 25% al 8-10% en los primeros 30 días. Para un negocio mediano, eso son <strong>$1.5-2M mensuales adicionales</strong> — sin nuevos clientes, solo recuperando lo que ya tenías.</p>
      </>
    ),
  },
};

const DEFAULT_ARTICLE = ARTICLES["como-reducir-no-shows-barberia"];

const RELATED = [
  { slug: "whatsapp-marketing-clientes-inactivos", category: "Marketing", title: "WhatsApp Marketing: Cómo traer clientes inactivos de vuelta", readTime: 7, date: "15 mayo 2026" },
  { slug: "resenas-google-estrategia",             category: "Marketing", title: "Reseñas Google: la estrategia que más trae clientes nuevos",       readTime: 5, date: "22 abril 2026" },
  { slug: "5-errores-estan-costando-clientes",     category: "Negocios",  title: "5 errores que están costándote clientes hoy mismo",               readTime: 4, date: "28 abril 2026" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const article = ARTICLES[slug] ?? DEFAULT_ARTICLE;
  const cat = CATS[article.category];

  return (
    <div className="zyncra">
      <ZyncraReveal />
      <ZyncraNav active="blog" />

      {/* ── ARTICLE HEADER ── */}
      <div style={{ background: "var(--bg)", paddingTop: 110, paddingBottom: 0, borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 52px" }}>

          {/* Back link */}
          <Link href="/blog" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--fg-mute)", textDecoration: "none", marginBottom: 32, transition: "color .2s" }}>
            ← Volver al Blog
          </Link>

          {/* Category + read time */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
            <span style={{ background: cat.bg, color: cat.text, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", padding: "5px 12px", borderRadius: 20 }}>
              {article.category}
            </span>
            <span style={{ fontSize: 13, color: "var(--fg-mute)", fontWeight: 500 }}>{article.readTime} min lectura</span>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#d0d0e0", display: "inline-block" }} />
            <span style={{ fontSize: 13, color: "var(--fg-mute)", fontWeight: 500 }}>{article.date}</span>
          </div>

          {/* Title */}
          <h1 style={{ fontSize: "clamp(28px,4.5vw,48px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-1.5px", color: "var(--fg)", marginBottom: 20 }}>
            {article.title}
          </h1>

          {/* Lead */}
          <p style={{ fontSize: 18, color: "var(--fg-dim)", lineHeight: 1.75, marginBottom: 36, fontWeight: 400 }}>
            {article.lead}
          </p>

          {/* Author row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 24, borderTop: "1px solid var(--line)" }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--z-gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "white", flexShrink: 0 }}>Z</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--fg)" }}>{article.author}</div>
              <div style={{ fontSize: 12, color: "var(--fg-mute)" }}>Zyncra · {article.date}</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              {["WhatsApp", "Copiar enlace"].map((s, i) => (
                <button key={i} style={{ padding: "7px 14px", borderRadius: 9, border: "1.5px solid var(--line-strong)", background: "var(--bg-card)", fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, color: "var(--fg-dim)", cursor: "pointer" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ARTICLE BODY ── */}
      <section style={{ background: "var(--z-cream-2)" }}>
        <div className="z-blog-article-body">
          {article.content}
        </div>
      </section>

      {/* ── INLINE CTA ── */}
      <section style={{ background: "var(--bg)", padding: "0 48px 80px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", background: "linear-gradient(135deg,#fb0f05,#9B3FC8,#0027fe)", backgroundSize: "200%", borderRadius: 22, padding: "44px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,.06)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>{article.emoji}</div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: "white", marginBottom: 10, letterSpacing: "-.5px" }}>
              ¿Listo para implementarlo en tu negocio?
            </h3>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,.75)", marginBottom: 24, lineHeight: 1.6 }}>
              Zyncra automatiza todo lo que leíste en este artículo. Empieza gratis hoy — sin tarjeta.
            </p>
            <Link href="/register" className="z-btn-white">Empezar gratis →</Link>
          </div>
        </div>
      </section>

      {/* ── RELATED POSTS ── */}
      <section style={{ background: "var(--z-cream)" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }} className="z-reveal">
          <div className="z-label" style={{ justifyContent: "center" }}>Seguir leyendo</div>
          <h2 className="z-section-title" style={{ fontSize: "clamp(24px,3vw,36px)" }}>Más artículos para ti</h2>
        </div>
        <div className="z-blog-grid">
          {RELATED.map((r, i) => {
            const rc = CATS[r.category];
            return (
              <Link key={r.slug} href={`/blog/${r.slug}`} className={`z-blog-card z-reveal z-d${i + 1}`}>
                <div className="z-blog-num">0{i + 1}</div>
                <div className="z-blog-cat" style={{ background: rc.bg, color: rc.text }}>{r.category}</div>
                <div className="z-blog-title">{r.title}</div>
                <div className="z-blog-meta" style={{ marginTop: "auto" }}>
                  <span>{r.readTime} min</span>
                  <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#d0d0e0", display: "inline-block" }} />
                  <span>{r.date}</span>
                  <span style={{ marginLeft: "auto", color: "#fb0f05", fontWeight: 600, fontSize: 12 }}>Leer →</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <ZyncraFooter />
    </div>
  );
}
