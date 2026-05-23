import Link from "next/link";
import ZyncraNav from "./ZyncraNav";
import ZyncraFooter from "./ZyncraFooter";
import ZyncraReveal from "./ZyncraReveal";

export default function HomePage() {
  return (
    <div className="zyncra">
      <ZyncraReveal />
      <ZyncraNav active="inicio" />

      {/* ── HERO ── */}
      <section className="z-hero" style={{ padding: "110px 48px 80px" }}>
        <div className="z-blob z-blob-1" />
        <div className="z-blob z-blob-2" />

        {/* Left */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="z-hero-chip z-fadein">
            <span className="z-chip-badge">Nuevo</span>
            <span className="z-chip-dot" />
            Zyncra Business Suite 2025
          </div>
          <h1 className="z-hero-title z-fadeup z-d1">
            Software de gestión<br />para tu <span className="accent">negocio.</span>
          </h1>
          <p className="z-hero-sub z-fadeup z-d2">
            Agenda inteligente, marketing por WhatsApp, sistema POS y facturación electrónica DIAN. Para barberías, spas, salones, manicuristas y más.
          </p>
          <div className="z-hero-actions z-fadeup z-d3">
            <Link href="/pricing" className="z-btn-xl">Empezar gratis →</Link>
            <Link href="/features" className="z-btn-xl-ghost">Ver funciones</Link>
          </div>
          <div className="z-hero-trust z-fadeup z-d4">
            <div className="z-trust-item"><span className="z-trust-dot">✓</span> Sin tarjeta requerida</div>
            <div className="z-trust-item"><span className="z-trust-dot">✓</span> Configuración en minutos</div>
            <div className="z-trust-item"><span className="z-trust-dot">✓</span> Soporte en español</div>
          </div>
        </div>

        {/* Right – App mockup */}
        <div className="z-hero-right z-slider z-d2" style={{ position: "relative", zIndex: 1 }}>
          <div className="z-float-1">
            <span className="z-wa-dot" />
            <div>
              <div className="z-float-title">Nueva reserva</div>
              <div className="z-float-sub">vía WhatsApp · ahora</div>
            </div>
          </div>

          <div className="z-app-card">
            <div className="z-app-topbar">
              <div className="z-app-dots">
                <div className="z-app-dot" style={{ background: "#ff5f57" }} />
                <div className="z-app-dot" style={{ background: "#ffbd2e" }} />
                <div className="z-app-dot" style={{ background: "#28c840" }} />
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <span className="z-app-pill active">Agenda</span>
                <span className="z-app-pill inactive">POS</span>
                <span className="z-app-pill inactive">Reportes</span>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Hoy · Jueves</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--z-ink-3)", background: "var(--z-cream-2)", padding: "3px 10px", borderRadius: 20 }}>19 Jun 2025</span>
            </div>
            <div className="z-slot-row">
              <span className="z-slot-time">9:00</span>
              <div className="z-slot z-slot-red">
                <div>Corte + Barba<div className="z-slot-name">Juan García</div></div>
                <span className="z-slot-dur red">45m</span>
              </div>
            </div>
            <div className="z-slot-row">
              <span className="z-slot-time">10:30</span>
              <div className="z-slot z-slot-purple">
                <div>Degradado<div className="z-slot-name">Miguel Ríos</div></div>
                <span className="z-slot-dur purple">30m</span>
              </div>
            </div>
            <div className="z-slot-row">
              <span className="z-slot-time">12:00</span>
              <div className="z-slot z-slot-gray"><div>Disponible</div></div>
            </div>
            <div className="z-slot-row">
              <span className="z-slot-time">13:30</span>
              <div className="z-slot z-slot-blue">
                <div>Pack Premium<div className="z-slot-name">Andrés Polo</div></div>
                <span className="z-slot-dur blue">60m</span>
              </div>
            </div>
          </div>

          <div className="z-float-2">
            <div className="z-float-icon">💰</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "var(--z-ink)", letterSpacing: "-.5px", lineHeight: 1 }}>$3.2M</div>
              <div style={{ fontSize: 11, color: "var(--z-ink-4)", marginTop: 2 }}>Ingresos del mes</div>
              <div style={{ color: "#28be64", fontSize: 11, fontWeight: 700 }}>↑ +22% vs anterior</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <div className="z-stats-strip">
        <div className="z-stat-item z-reveal"><span className="z-stat-val">500+</span><div className="z-stat-label">Negocios activos</div></div>
        <div className="z-stat-item z-reveal z-d1"><span className="z-stat-val">1M+</span><div className="z-stat-label">Citas gestionadas</div></div>
        <div className="z-stat-item z-reveal z-d2"><span className="z-stat-val">4.9★</span><div className="z-stat-label">Valoración promedio</div></div>
        <div className="z-stat-item z-reveal z-d3"><span className="z-stat-val">−60%</span><div className="z-stat-label">Reducción no-shows</div></div>
      </div>

      {/* ── TICKER ── */}
      <div className="z-ticker">
        <div className="z-ticker-track">
          {[
            ["📅", "Agendamiento online"], ["💬", "Marketing por WhatsApp"], ["🧾", "Factura Electrónica DIAN"],
            ["⭐", "Reseñas Google Maps"], ["💳", "Sistema POS"], ["🤖", "Chat Bot IA"],
            ["📊", "Sistema de Caja"], ["📱", "App iOS & Android"], ["💼", "Gestión de Comisiones"],
            ["📅", "Agendamiento online"], ["💬", "Marketing por WhatsApp"], ["🧾", "Factura Electrónica DIAN"],
            ["⭐", "Reseñas Google Maps"], ["💳", "Sistema POS"], ["🤖", "Chat Bot IA"],
            ["📊", "Sistema de Caja"], ["📱", "App iOS & Android"], ["💼", "Gestión de Comisiones"],
          ].map(([icon, text], i) => (
            <span key={i} className="z-ticker-item">
              <span className="z-ticker-icon">{icon}</span> {text}
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURES GRID ── */}
      <section style={{ background: "var(--z-cream)" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }} className="z-reveal">
          <div className="z-label" style={{ justifyContent: "center" }}>Funcionalidades</div>
          <h2 className="z-section-title">Todo lo que tu negocio necesita</h2>
          <p className="z-section-sub" style={{ maxWidth: 500, margin: "0 auto" }}>Una plataforma completa para negocios de servicios que trabajan con citas.</p>
        </div>
        <div className="z-features-grid">
          {[
            { icon: "📅", title: "Agenda inteligente",    desc: "Reservas 24/7, recordatorios automáticos y confirmaciones por WhatsApp.", href: "/features" },
            { icon: "💬", title: "Marketing WhatsApp",    desc: "Campañas segmentadas, recordatorios y solicitud de reseñas automáticas.", href: "/features" },
            { icon: "💳", title: "Sistema POS",           desc: "Cobra con Nequi, Daviplata, efectivo o tarjeta. Factura DIAN incluida.", href: "/features" },
            { icon: "⭐", title: "Reseñas Google",        desc: "Solicita reseñas automáticamente después de cada visita y sube tu ranking.", href: "/features" },
            { icon: "💼", title: "Comisiones",            desc: "Liquida comisiones de tu equipo automáticamente. Sin errores ni disputas.", href: "/features" },
            { icon: "🧾", title: "Facturación DIAN",      desc: "Cumple con la DIAN sin salir de Zyncra. CUFE y XML automáticos.", href: "/features" },
          ].map((f, i) => (
            <div key={i} className={`z-feat-card z-reveal z-d${(i % 3) + 1}`}>
              <span className="z-feat-icon">{f.icon}</span>
              <div className="z-feat-title">{f.title}</div>
              <p className="z-feat-desc">{f.desc}</p>
              <Link href={f.href} className="z-feat-link">Ver más →</Link>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 48 }} className="z-reveal">
          <Link href="/features" className="z-btn-xl">Ver todas las funciones →</Link>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <div className="z-cta-banner z-reveal">
        <h2 className="z-cta-title">¿Listo para transformar<br />tu negocio?</h2>
        <p className="z-cta-sub">Únete a más de 500 negocios de servicios que ya usan Zyncra.</p>
        <div className="z-cta-actions">
          <Link href="/pricing" className="z-btn-white">Empezar gratis →</Link>
          <Link href="/features" className="z-btn-outline-white">Ver funciones</Link>
        </div>
        <p className="z-cta-note">✓ 14 días gratis &nbsp;·&nbsp; ✓ Sin tarjeta &nbsp;·&nbsp; ✓ Cancela cuando quieras</p>
      </div>

      <ZyncraFooter />
    </div>
  );
}
