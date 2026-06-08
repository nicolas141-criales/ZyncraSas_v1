import type { Metadata } from "next";
import {
  Container,
  Eyebrow,
  GradientOrb,
  GridBackdrop,
} from "@/components/landing/primitives";
import { ARTICLE_LIST, getArticlesMeta } from "./articles";
import BlogFilters from "./BlogFilters";

// ── SEO ───────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Blog · Estrategias para Salones y Barberías en Colombia | Zyncra",
  description:
    "Artículos prácticos sobre agenda online, WhatsApp marketing, reseñas Google y factura electrónica DIAN para salones de belleza y barberías en Colombia.",
  keywords: [
    "blog salon de belleza colombia",
    "tips barberia colombia",
    "como gestionar salon belleza",
    "marketing salon de belleza",
    "factura electronica barberia",
    "agenda online peluqueria colombia",
  ],
  alternates: { canonical: "https://zyncra.app/blog" },
  openGraph: {
    title: "Blog Zyncra · Estrategias para Salones y Barberías",
    description:
      "Artículos cortos, prácticos y sin relleno para dueños de salones, barberías y spas en Colombia.",
    url: "https://zyncra.app/blog",
    siteName: "Zyncra",
    type: "website",
    images: [{ url: "https://zyncra.app/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog Zyncra · Estrategias para Salones y Barberías",
    description: "Artículos prácticos para salones de belleza y barberías en Colombia.",
    images: ["https://zyncra.app/og-image.png"],
  },
};

// JSON-LD Blog schema
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "Blog Zyncra",
  description:
    "Estrategias y recursos prácticos para dueños de salones de belleza, barberías y spas en Colombia.",
  url: "https://zyncra.app/blog",
  publisher: {
    "@type": "Organization",
    name: "Zyncra",
    url: "https://zyncra.app",
    logo: { "@type": "ImageObject", url: "https://zyncra.app/zyncra-logo.png" },
  },
  inLanguage: "es-CO",
  blogPost: ARTICLE_LIST.map((a) => ({
    "@type": "BlogPosting",
    headline: a.title,
    description: a.metaDescription,
    datePublished: a.dateISO,
    url: `https://zyncra.app/blog/${a.slug}`,
    keywords: a.keywords.join(", "),
  })),
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BlogPage() {
  const articles = getArticlesMeta();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section style={{ position: "relative", padding: "110px 0 0", overflowX: "clip", textAlign: "center" }}>
        <GradientOrb color="#fb0f05" size={700} x="-10%" y="-20%" opacity={0.18} />
        <GradientOrb color="#0027fe" size={600} x="75%" y="-10%" opacity={0.22} />
        <GridBackdrop style={{ opacity: 0.6 }} />
        <Container max={1240} style={{ position: "relative", zIndex: 2, paddingBottom: 40 }}>
          <div style={{ marginBottom: 24, display: "flex", justifyContent: "center" }}>
            <Eyebrow accent>Blog Zyncra</Eyebrow>
          </div>
          <h1 style={{ fontSize: "clamp(40px, 6vw, 80px)", lineHeight: 1.05, letterSpacing: "-0.04em", fontWeight: 500, margin: "24px auto 22px", maxWidth: 900 }}>
            Estrategias que{" "}
            <span className="serif gradient-text">sí funcionan</span>
            <br />
            para tu negocio de servicios.
          </h1>
          <p style={{ fontSize: "clamp(16px, 1.4vw, 19px)", color: "var(--fg-dim)", lineHeight: 1.55, maxWidth: 560, margin: "0 auto" }}>
            Artículos cortos, prácticos, sin relleno. Para dueños de barberías, salones y spas en Colombia.
          </p>
        </Container>
      </section>

      {/* BlogFilters: chips + featured card + article grid (client-side filtering) */}
      <BlogFilters articles={articles} />

      {/* Newsletter */}
      <section style={{ padding: "0 24px 100px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ padding: "56px 40px", borderRadius: 24, background: "linear-gradient(135deg, rgba(251,15,5,0.08) 0%, rgba(0,39,254,0.06) 100%)", border: "1px solid rgba(0,39,254,0.3)", textAlign: "center", boxShadow: "0 30px 80px -30px rgba(0,39,254,0.35)", position: "relative", overflow: "hidden" }}>
            <GradientOrb color="#fb0f05" size={400} x="-10%" y="-30%" opacity={0.4} blur={100} />
            <GradientOrb color="#0027fe" size={400} x="80%" y="60%" opacity={0.35} blur={100} />
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                <Eyebrow accent>Newsletter semanal</Eyebrow>
              </div>
              <h3 style={{ fontSize: "clamp(26px, 3vw, 38px)", margin: "16px 0 12px", letterSpacing: "-0.03em", fontWeight: 500 }}>
                1 estrategia. Cada lunes.{" "}
                <span className="serif gradient-text">7 minutos.</span>
              </h3>
              <p style={{ color: "var(--fg-dim)", margin: "0 auto 28px", maxWidth: 480, lineHeight: 1.5 }}>
                Sin spam. Solo tácticas reales para dueños de salones y barberías en Colombia. Cancelas con 1 clic.
              </p>
              <form style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", maxWidth: 500, margin: "0 auto" }}>
                <input type="email" placeholder="tu@email.com" required style={{ flex: 1, minWidth: 240, padding: "12px 16px", background: "rgba(20,15,30,0.06)", border: "1px solid var(--line-strong)", borderRadius: 12, color: "var(--fg)", fontFamily: "var(--font-sans)", fontSize: 14, outline: "none" }} />
                <button type="submit" style={{ padding: "11px 18px", background: "linear-gradient(135deg, #fb0f05 0%, #0027fe 100%)", color: "white", border: "none", borderRadius: 12, fontFamily: "var(--font-sans)", fontSize: 14.5, fontWeight: 500, cursor: "pointer" }}>
                  Suscribirme →
                </button>
              </form>
              <div style={{ fontSize: 12, color: "var(--fg-mute)", marginTop: 18, fontFamily: "var(--font-mono)" }}>
                1.247 dueños de negocio ya leen Zyncra Weekly
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
