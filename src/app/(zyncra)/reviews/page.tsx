import Link from "next/link";
import ZyncraNav from "../ZyncraNav";
import ZyncraFooter from "../ZyncraFooter";
import ZyncraReveal from "../ZyncraReveal";

const reviews = [
  { emoji: "💈", stars: "★★★★★", text: "Los no-shows bajaron un 70% desde que activamos los recordatorios. Nunca pensé que algo así pudiera impactar tanto en mis ingresos.", name: "Alejandro Ruiz", biz: "Black Fade Barbershop · Bogotá", badge: "📅 Agenda + WhatsApp" },
  { emoji: "✂️", stars: "★★★★★", text: "La facturación electrónica integrada nos ahorró horas de trabajo. Los clientes reciben su factura al instante y cumplimos con la DIAN sin complicaciones.", name: "Carlos Medina", biz: "Barber Club Premium · Medellín", badge: "🧾 Facturación DIAN" },
  { emoji: "🪒", stars: "★★★★★", text: "El sistema de comisiones automáticas fue un cambio total. Mis barberos confían más en los números y el ambiente del local mejoró notablemente.", name: "Luis Pedraza", biz: "The Sharp Cut · Cali", badge: "💼 Comisiones" },
  { emoji: "💇", stars: "★★★★★", text: "Las campañas de WhatsApp me trajeron clientes inactivos de vuelta. En la primera campaña recuperé 12 clientes que no venían hace 3 meses.", name: "María Torres", biz: "Estudio Hair · Bucaramanga", badge: "💬 Marketing WA" },
  { emoji: "🏪", stars: "★★★★★", text: "Con el POS integrado el cobro se volvió mucho más rápido. Nequi, Daviplata, tarjeta en un solo sistema. Los clientes quedan impresionados.", name: "Ricardo Gómez", biz: "Cortes & Estilo · Barranquilla", badge: "💳 Sistema POS" },
  { emoji: "⭐", stars: "★★★★★", text: "Las reseñas en Google subieron de 4.1 a 4.8 en dos meses gracias a las solicitudes automáticas. Ahora aparecemos primeros en búsquedas locales.", name: "Diana Vásquez", biz: "Studio V · Manizales", badge: "⭐ Reseñas Google" },
];

const videos = [
  { emoji: "💈", name: "Alejandro Ruiz",  biz: "Black Fade · Bogotá",    gradient: "linear-gradient(160deg,#E8192C 0%,#9B3FC8 100%)" },
  { emoji: "✂️", name: "Carlos Medina",   biz: "Barber Club · Medellín", gradient: "linear-gradient(160deg,#9B3FC8 0%,#2042E8 100%)" },
  { emoji: "🪒", name: "Luis Pedraza",    biz: "The Sharp Cut · Cali",   gradient: "linear-gradient(160deg,#2042E8 0%,#E8192C 100%)" },
];

export default function ReviewsPage() {
  return (
    <div className="zyncra">
      <ZyncraReveal />
      <ZyncraNav active="resenas" />

      {/* ── PAGE HERO ── */}
      <div className="z-page-hero">
        <div className="z-label z-fadein" style={{ justifyContent: "center" }}>Reseñas & Testimonios</div>
        <h1 className="z-section-title z-fadeup z-d1" style={{ fontSize: "clamp(36px,5vw,56px)" }}>
          Lo que dicen<br />nuestros clientes
        </h1>
        <p className="z-section-sub z-fadeup z-d2" style={{ maxWidth: 480, margin: "0 auto" }}>
          Barberías reales que transformaron su operación con Zyncra.
        </p>
      </div>

      {/* ── METRICS ── */}
      <section style={{ background: "var(--z-cream-2)" }}>
        <div className="z-metrics-grid">
          {[["500+","Barberías activas"],["4.9★","Calificación promedio"],["−60%","Reducción de no-shows"],["98%","Clientes satisfechos"]].map(([val, label], i) => (
            <div key={i} className={`z-metric-card z-reveal z-d${i + 1}`}>
              <span className="z-metric-val">{val}</span>
              <div className="z-metric-label">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BIG QUOTE ── */}
      <section style={{ background: "white" }}>
        <div className="z-big-quote z-reveal">
          <p className="z-big-quote-text">&ldquo;Desde que usamos Zyncra los no-shows bajaron un 70%. Los recordatorios por WhatsApp son increíbles. No volvería a trabajar sin él.&rdquo;</p>
          <div className="z-big-quote-author">— Alejandro Ruiz · Black Fade Barbershop, Bogotá &nbsp; ⭐⭐⭐⭐⭐</div>
        </div>

        <div style={{ marginTop: 40 }} className="z-reveal">
          <div className="z-google-strip">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 18 }}>🔍</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--z-ink-3)" }}>Google</span>
              </div>
              <div className="z-google-rating">4.9</div>
              <div className="z-google-stars">★★★★★</div>
              <div style={{ fontSize: 12, color: "var(--z-ink-4)", marginTop: 4 }}>Basado en 1.2k+ reseñas</div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              {[["★★★★★","85%"],["★★★★☆","12%"],["★★★☆☆","3%"]].map(([stars, pct], i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                  <span style={{ color: "#fbbc04" }}>{stars}</span>
                  <div style={{ flex: 1, height: 6, background: "var(--z-cream-3)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: pct, height: "100%", background: "var(--z-gradient)", borderRadius: 3 }} />
                  </div>
                  <span style={{ color: "var(--z-ink-4)" }}>{pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── REVIEW CARDS ── */}
      <section style={{ background: "var(--z-cream)" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }} className="z-reveal">
          <div className="z-label" style={{ justifyContent: "center" }}>Testimonios</div>
          <h2 className="z-section-title">Historias de éxito</h2>
        </div>
        <div className="z-reviews-grid">
          {reviews.map((r, i) => (
            <div key={i} className={`z-review-card z-reveal z-d${(i % 3) + 1}`}>
              <div className="z-review-avatar">{r.emoji}</div>
              <div className="z-stars">{r.stars}</div>
              <p className="z-review-text">{r.text}</p>
              <div className="z-reviewer-name">{r.name}</div>
              <div className="z-reviewer-biz">{r.biz}</div>
              <div className="z-review-badge">{r.badge}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── VIDEO TESTIMONIALS ── */}
      <section style={{ background: "white" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }} className="z-reveal">
          <div className="z-label" style={{ justifyContent: "center" }}>Video testimonios</div>
          <h2 className="z-section-title">Ellos lo cuentan mejor</h2>
          <p className="z-section-sub" style={{ maxWidth: 480, margin: "0 auto" }}>Escucha directamente a los dueños de barbería que ya usan Zyncra.</p>
        </div>
        <div className="z-video-grid">
          {videos.map((v, i) => (
            <div key={i} className={`z-video-card z-reveal z-d${i + 1}`}>
              <div className="z-video-bg" style={{ background: v.gradient }}>
                <div className="z-video-emoji">{v.emoji}</div>
                <div className="z-video-play">▶</div>
              </div>
              <div className="z-video-info">
                <div className="z-video-name">{v.name}</div>
                <div className="z-video-biz">{v.biz}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <div className="z-cta-banner z-reveal">
        <h2 className="z-cta-title">Únete a las barberías<br />que ya crecen con Zyncra</h2>
        <p className="z-cta-sub">Empieza gratis, sin tarjeta de crédito.</p>
        <div className="z-cta-actions">
          <Link href="/pricing" className="z-btn-white">Ver planes →</Link>
          <Link href="/features" className="z-btn-outline-white">Ver funciones</Link>
        </div>
      </div>

      <ZyncraFooter />
    </div>
  );
}
