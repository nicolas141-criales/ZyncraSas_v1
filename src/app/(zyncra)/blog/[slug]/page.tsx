import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ARTICLES, ARTICLE_LIST, CATS } from "../articles";

const BASE = "https://zyncra.app";

// ── Static generation ─────────────────────────────────────────────────────────

export function generateStaticParams() {
  return ARTICLE_LIST.map((a) => ({ slug: a.slug }));
}

// ── SEO metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES[slug];
  if (!article) return { title: "Artículo no encontrado" };

  return {
    title: article.metaTitle,
    description: article.metaDescription,
    keywords: article.keywords,
    alternates: { canonical: `${BASE}/blog/${slug}` },
    openGraph: {
      title: article.metaTitle,
      description: article.metaDescription,
      url: `${BASE}/blog/${slug}`,
      siteName: "Zyncra",
      type: "article",
      publishedTime: article.dateISO,
      authors: [article.author],
      tags: article.keywords,
      images: [{ url: `${BASE}/og-image.png`, width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.metaTitle,
      description: article.metaDescription,
      images: [`${BASE}/og-image.png`],
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = ARTICLES[slug];
  if (!article) notFound();

  const cat = CATS[article.category] ?? CATS["Negocios"];

  // Related: 3 other articles excluding current
  const related = ARTICLE_LIST.filter((a) => a.slug !== slug).slice(0, 3);

  // JSON-LD BlogPosting schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.metaDescription,
    image: `${BASE}/og-image.png`,
    datePublished: article.dateISO,
    dateModified: article.dateISO,
    author: { "@type": "Organization", name: "Zyncra", url: BASE },
    publisher: {
      "@type": "Organization",
      name: "Zyncra",
      logo: { "@type": "ImageObject", url: `${BASE}/zyncra-logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE}/blog/${slug}` },
    keywords: article.keywords.join(", "),
    inLanguage: "es-CO",
  };

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── ARTICLE HEADER ── */}
      <div style={{ background: "var(--bg)", paddingTop: 110, borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px 52px" }}>

          <Link href="/blog" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--fg-mute)", textDecoration: "none", marginBottom: 32 }}>
            ← Volver al Blog
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
            <span style={{ background: cat.bg, color: cat.text, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", padding: "5px 12px", borderRadius: 20 }}>
              {article.category}
            </span>
            <span style={{ fontSize: 13, color: "var(--fg-mute)", fontWeight: 500 }}>{article.readTime} min lectura</span>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: "#d0d0e0", display: "inline-block" }} />
            <span style={{ fontSize: 13, color: "var(--fg-mute)", fontWeight: 500 }}>{article.date}</span>
          </div>

          <h1 style={{ fontSize: "clamp(28px,4.5vw,48px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-1.5px", color: "var(--fg)", marginBottom: 20 }}>
            {article.title}
          </h1>

          <p style={{ fontSize: 18, color: "var(--fg-dim)", lineHeight: 1.75, marginBottom: 36, fontWeight: 400 }}>
            {article.lead}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 24, borderTop: "1px solid var(--line)" }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#fb0f05,#0027fe)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "white", flexShrink: 0 }}>Z</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--fg)" }}>{article.author}</div>
              <div style={{ fontSize: 12, color: "var(--fg-mute)" }}>Zyncra · {article.date}</div>
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
      <section style={{ background: "var(--bg)", padding: "64px 24px 80px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", background: "linear-gradient(135deg,#fb0f05,#9B3FC8,#0027fe)", borderRadius: 22, padding: "44px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
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
      <section style={{ background: "var(--z-cream)", padding: "64px 24px 80px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div className="z-label" style={{ justifyContent: "center" }}>Seguir leyendo</div>
            <h2 className="z-section-title" style={{ fontSize: "clamp(24px,3vw,36px)" }}>Más artículos para ti</h2>
          </div>
          <div className="z-blog-grid">
            {related.map((r, i) => {
              const rc = CATS[r.category] ?? CATS["Negocios"];
              return (
                <Link key={r.slug} href={`/blog/${r.slug}`} className={`z-blog-card z-fadeup z-d${i + 1}`}>
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
        </div>
      </section>
    </>
  );
}
