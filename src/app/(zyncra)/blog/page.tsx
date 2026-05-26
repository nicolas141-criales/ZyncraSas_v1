import Link from "next/link";
import ZyncraNav from "../ZyncraNav";
import ZyncraFooter from "../ZyncraFooter";
import ZyncraReveal from "../ZyncraReveal";

// ── Data ─────────────────────────────────────────────────────────────────────

const CATS: Record<string, { bg: string; text: string; dot: string }> = {
  "Agenda":      { bg: "rgba(251,15,5,.1)",   text: "#fb0f05",  dot: "#fb0f05" },
  "Marketing":   { bg: "rgba(22,163,74,.1)",  text: "#16a34a",  dot: "#16a34a" },
  "Facturación": { bg: "rgba(0,39,254,.09)",  text: "#0027fe",  dot: "#0027fe" },
  "Negocios":    { bg: "rgba(123,47,190,.1)", text: "#7B2FBE",  dot: "#7B2FBE" },
};

const FEATURED = {
  slug: "como-reducir-no-shows-barberia",
  category: "Agenda",
  emoji: "📅",
  gradient: "linear-gradient(145deg, #0d0d1a 0%, #1a0820 40%, #050510 100%)",
  title: "Cómo reducir los no-shows en tu negocio hasta un 60%",
  excerpt: "Los no-shows son el mayor enemigo de cualquier negocio de servicios. Aquí está el sistema exacto que usan más de 500 negocios activos para eliminarlos casi por completo — sin perder clientes ni subir precios.",
  readTime: 5,
  date: "20 mayo 2026",
  author: "Equipo Zyncra",
};

const POSTS = [
  {
    slug: "whatsapp-marketing-clientes-inactivos",
    category: "Marketing",
    num: "01",
    title: "WhatsApp Marketing: Cómo traer clientes inactivos de vuelta",
    excerpt: "Una sola campaña bien segmentada puede recuperar el 30% de tus clientes perdidos. Aprende la estrategia exacta que funciona para barberías y salones.",
    readTime: 7,
    date: "15 mayo 2026",
  },
  {
    slug: "guia-facturacion-dian-negocios-servicios",
    category: "Facturación",
    num: "02",
    title: "Guía de facturación electrónica DIAN para negocios de servicios",
    excerpt: "Todo lo que necesitas saber para cumplir con la DIAN sin complicaciones, desde el CUFE hasta el envío automático al cliente.",
    readTime: 10,
    date: "10 mayo 2026",
  },
  {
    slug: "como-fijar-precios-servicios",
    category: "Negocios",
    num: "03",
    title: "Cómo fijar los precios de tus servicios sin perder clientes",
    excerpt: "Subir precios da miedo, pero es necesario. Esta metodología te ayuda a hacerlo con confianza y sin ahuyentar tu base de clientes.",
    readTime: 6,
    date: "5 mayo 2026",
  },
  {
    slug: "5-errores-estan-costando-clientes",
    category: "Negocios",
    num: "04",
    title: "5 errores que están costándote clientes hoy mismo",
    excerpt: "Desde no confirmar citas hasta no tener presencia en Google — estos errores operativos están ahuyentando clientes sin que lo notes.",
    readTime: 4,
    date: "28 abril 2026",
  },
  {
    slug: "resenas-google-estrategia",
    category: "Marketing",
    num: "05",
    title: "Reseñas Google: la estrategia que más trae clientes nuevos",
    excerpt: "Pasar de 4.2 a 4.8 en Google puede duplicar el número de clientes nuevos. Así implementaron esta estrategia los mejores negocios de Bogotá.",
    readTime: 5,
    date: "22 abril 2026",
  },
  {
    slug: "sistema-pos-para-negocios-servicios",
    category: "Negocios",
    num: "06",
    title: "Por qué tu negocio necesita un sistema POS integrado en 2026",
    excerpt: "Cobrar con papelito es historia. Un POS bien implementado puede aumentar tus ingresos un 15% solo por reducir errores y agilizar el cobro.",
    readTime: 6,
    date: "15 abril 2026",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BlogPage() {
  const feat = FEATURED;
  const featCat = CATS[feat.category];

  return (
    <div className="zyncra">
      <ZyncraReveal />
      <ZyncraNav active="blog" />

      {/* ── HERO ── */}
      <div style={{ background: "white", borderBottom: "1px solid #f0eeeb", padding: "130px 48px 64px", position: "relative", overflow: "hidden" }}>
        {/* Subtle bg radial */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 80% at 50% 120%, rgba(251,15,5,.045) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div className="z-label z-fadein" style={{ justifyContent: "center", marginBottom: 20 }}>Blog</div>
          <h1 className="z-fadeup z-d1" style={{ fontSize: "clamp(36px,5.5vw,64px)", fontWeight: 900, lineHeight: 1.08, letterSpacing: "-2.5px", color: "#111118", margin: "0 0 18px" }}>
            Ideas para hacer crecer<br />
            <span style={{ background: "var(--z-gradient)", backgroundSize: "200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", animation: "z-gradientShift 4s ease infinite" }}>tu negocio.</span>
          </h1>
          <p className="z-fadeup z-d2" style={{ fontSize: 17, color: "#6b6b80", lineHeight: 1.7, marginBottom: 36, maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>
            Consejos, guías y estrategias para negocios de servicios que trabajan con citas.
          </p>
          {/* Category pills */}
          <div className="z-fadeup z-d3" style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
            {[{ label: "Todos", bg: "#111118", text: "white" }, ...Object.entries(CATS).map(([k, v]) => ({ label: k, bg: v.bg, text: v.text }))].map((c, i) => (
              <span key={i} style={{ padding: "7px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, background: c.bg, color: c.text, cursor: "pointer", transition: "opacity .2s" }}>
                {c.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURED POST ── */}
      <section style={{ background: "var(--z-cream-2)" }}>
        <Link href={`/blog/${feat.slug}`} style={{ textDecoration: "none", display: "block" }}>
          <div className="z-blog-featured z-reveal">

            {/* Visual panel */}
            <div className="z-blog-feat-visual" style={{ background: feat.gradient }}>
              {/* Noise texture overlay */}
              <div style={{ position: "absolute", inset: 0, opacity: 0.035, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")", backgroundSize: "200px" }} />

              {/* Featured label */}
              <div style={{ position: "absolute", top: 24, left: 24, display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,.5)" }}>
                <span style={{ width: 16, height: 1, background: "rgba(255,255,255,.4)", display: "inline-block" }} />
                Artículo destacado
              </div>

              {/* Emoji */}
              <div style={{ fontSize: 80, lineHeight: 1, zIndex: 1, filter: "drop-shadow(0 8px 32px rgba(0,0,0,.4))" }}>{feat.emoji}</div>

              {/* Category */}
              <div style={{ background: featCat.bg, color: featCat.text, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: `1px solid ${featCat.text}30`, padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", zIndex: 1 }}>
                {feat.category}
              </div>

              {/* Corner decoration */}
              <div style={{ position: "absolute", bottom: -40, right: -40, width: 180, height: 180, borderRadius: "50%", border: "1px solid rgba(255,255,255,.06)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: -80, right: -80, width: 280, height: 280, borderRadius: "50%", border: "1px solid rgba(255,255,255,.03)", pointerEvents: "none" }} />
            </div>

            {/* Content panel */}
            <div className="z-blog-feat-content">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <span style={{ fontSize: 12, color: "#a0a0b0", fontWeight: 500 }}>{feat.readTime} min lectura</span>
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#d0d0e0" }} />
                <span style={{ fontSize: 12, color: "#a0a0b0", fontWeight: 500 }}>{feat.date}</span>
              </div>
              <h2 style={{ fontSize: "clamp(22px,2.8vw,32px)", fontWeight: 800, lineHeight: 1.22, letterSpacing: "-0.8px", color: "#111118", marginBottom: 18 }}>
                {feat.title}
              </h2>
              <p style={{ fontSize: 15, color: "#6b6b80", lineHeight: 1.75, marginBottom: 32 }}>
                {feat.excerpt}
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--z-gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "white" }}>Z</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111118" }}>{feat.author}</div>
                    <div style={{ fontSize: 11, color: "#a0a0b0" }}>Zyncra</div>
                  </div>
                </div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 700, color: "#fb0f05" }}>
                  Leer artículo →
                </span>
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* ── POSTS GRID ── */}
      <section style={{ background: "var(--z-cream)" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }} className="z-reveal">
          <div className="z-label" style={{ justifyContent: "center" }}>Todos los artículos</div>
          <h2 className="z-section-title">Más para leer</h2>
        </div>
        <div className="z-blog-grid">
          {POSTS.map((post, i) => {
            const cat = CATS[post.category];
            return (
              <Link key={post.slug} href={`/blog/${post.slug}`} className={`z-blog-card z-reveal z-d${(i % 3) + 1}`}>
                <div className="z-blog-num">{post.num}</div>
                <div className="z-blog-cat" style={{ background: cat.bg, color: cat.text }}>
                  {post.category}
                </div>
                <div className="z-blog-title">{post.title}</div>
                <p className="z-blog-excerpt">{post.excerpt}</p>
                <div className="z-blog-meta">
                  <span>{post.readTime} min</span>
                  <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#d0d0e0", display: "inline-block" }} />
                  <span>{post.date}</span>
                  <span style={{ marginLeft: "auto", color: "#fb0f05", fontWeight: 600, fontSize: 12 }}>Leer →</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── NEWSLETTER CTA ── */}
      <section style={{ background: "white" }}>
        <div className="z-reveal" style={{ maxWidth: 680, margin: "0 auto", textAlign: "center", background: "#0d0d1a", borderRadius: 28, padding: "64px 52px", position: "relative", overflow: "hidden" }}>
          {/* Background decoration */}
          <div style={{ position: "absolute", top: -60, right: -60, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(251,15,5,.15) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -60, left: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,39,254,.12) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(251,15,5,.85)", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ width: 16, height: 1, background: "rgba(251,15,5,.6)" }} />
              Newsletter
              <span style={{ width: 16, height: 1, background: "rgba(251,15,5,.6)" }} />
            </div>
            <h2 style={{ fontSize: "clamp(24px,3vw,36px)", fontWeight: 800, color: "white", lineHeight: 1.2, letterSpacing: "-1px", marginBottom: 12 }}>
              Consejos cada semana,<br />directo a tu WhatsApp.
            </h2>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,.5)", lineHeight: 1.65, marginBottom: 32 }}>
              Sin spam. Solo ideas accionables para hacer crecer tu negocio de servicios.
            </p>
            <a
              href="https://wa.me/573000000000?text=Hola%2C+quiero+recibir+los+consejos+del+blog+de+Zyncra+%F0%9F%93%A7"
              target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "13px 28px", borderRadius: 12, background: "#25D366", color: "white", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700, fontSize: 15, textDecoration: "none", transition: "transform .2s, box-shadow .2s", boxShadow: "0 6px 24px rgba(37,211,102,.35)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.096.54 4.064 1.487 5.777L.057 23.143a.75.75 0 0 0 .916.916l5.399-1.43A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.807 9.807 0 0 1-5.028-1.382l-.36-.213-3.734.989.988-3.734-.213-.36A9.807 9.807 0 0 1 2.182 12C2.182 6.566 6.566 2.182 12 2.182S21.818 6.566 21.818 12 17.434 21.818 12 21.818z"/></svg>
              Suscribirme por WhatsApp
            </a>
          </div>
        </div>
      </section>

      <ZyncraFooter />
    </div>
  );
}
