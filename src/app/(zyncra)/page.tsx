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

        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="z-hero-chip z-fadein">
            <span className="z-chip-badge">Nuevo</span>
            <span className="z-chip-dot" />
            Zyncra Business Suite 2026
          </div>
          <h1 className="z-hero-title z-fadeup z-d1">
            Software de gestión<br />para tu <span className="accent">negocio.</span>
          </h1>
          <p className="z-hero-sub z-fadeup z-d2">
            Agenda inteligente, marketing por WhatsApp, sistema POS y facturación electrónica DIAN. Para barberías, spas, salones, manicuristas y más.
          </p>
          <div className="z-hero-actions z-fadeup z-d3">
            <Link href="/register" className="z-btn-xl">Empezar gratis →</Link>
            <Link href="/features" className="z-btn-xl-ghost">Ver funciones</Link>
          </div>
          <div className="z-hero-trust z-fadeup z-d4">
            <div className="z-trust-item"><span className="z-trust-dot">✓</span> Sin tarjeta requerida</div>
            <div className="z-trust-item"><span className="z-trust-dot">✓</span> Configuración en 5 minutos</div>
            <div className="z-trust-item"><span className="z-trust-dot">✓</span> Soporte en español</div>
          </div>
        </div>

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
              <span style={{ fontSize: 14, fontWeight: 700 }}>Hoy · Lunes</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--z-ink-3)", background: "var(--z-cream-2)", padding: "3px 10px", borderRadius: 20 }}>19 May 2026</span>
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
            ["⭐", "Reseñas Google Maps"], ["💳", "Sistema POS"], ["📊", "Sistema de Caja"],
            ["💼", "Gestión de Comisiones"], ["🔔", "Recordatorios Automáticos"], ["🗂️", "Campos Personalizados"],
            ["📅", "Agendamiento online"], ["💬", "Marketing por WhatsApp"], ["🧾", "Factura Electrónica DIAN"],
            ["⭐", "Reseñas Google Maps"], ["💳", "Sistema POS"], ["📊", "Sistema de Caja"],
            ["💼", "Gestión de Comisiones"], ["🔔", "Recordatorios Automáticos"], ["🗂️", "Campos Personalizados"],
          ].map(([icon, text], i) => (
            <span key={i} className="z-ticker-item">
              <span className="z-ticker-icon">{icon}</span> {text}
            </span>
          ))}
        </div>
      </div>

      {/* ── BRIDGE: cream → dark ── */}
      <div style={{ height: 80, background: "linear-gradient(to bottom, var(--z-cream-2), var(--z-ink))" }} />

      {/* ════════════════════════════════════════════════
          DARK BLOCK — Tipos de negocio + Cómo funciona
          (un solo bloque oscuro, sin cortes de color)
          ════════════════════════════════════════════════ */}
      <section style={{ background: "var(--z-ink)", padding: 0 }}>

        {/* Biz types header */}
        <div style={{ textAlign: "center", padding: "0 48px 52px" }} className="z-reveal">
          <div className="z-label" style={{ justifyContent: "center", color: "rgba(251,15,5,.9)" }}>Diseñado para ti</div>
          <h2 className="z-section-title" style={{ color: "white" }}>Para cualquier negocio<br />que trabaje con citas</h2>
          <p className="z-section-sub" style={{ maxWidth: 480, margin: "0 auto", color: "rgba(255,255,255,.45)" }}>Si tu negocio agenda servicios por hora, Zyncra es tu plataforma.</p>
        </div>

        {/* Marquee row 1 — forward */}
        <div className="z-biz-marquee" style={{ marginBottom: 12 }}>
          <div className="z-biz-track z-biz-track-fwd">
            {([
              ["💈","Barberías"],["✂️","Salones de belleza"],["💆","Spas & bienestar"],
              ["💅","Manicuristas"],["🏥","Clínicas estéticas"],["🧖","Masajes"],
              ["💈","Barberías"],["✂️","Salones de belleza"],["💆","Spas & bienestar"],
              ["💅","Manicuristas"],["🏥","Clínicas estéticas"],["🧖","Masajes"],
            ] as [string,string][]).map(([e, l], i) => (
              <div key={i} className="z-biz-card">
                <span className="z-biz-emoji">{e}</span>
                <span className="z-biz-label">{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Marquee row 2 — reverse */}
        <div className="z-biz-marquee">
          <div className="z-biz-track z-biz-track-rev">
            {([
              ["🎨","Tatuadores"],["👁️","Micropigmentación"],["🦷","Odontología estética"],
              ["🐾","Veterinarias"],["🧘","Yoga & fitness"],["📸","Fotografía"],
              ["🎨","Tatuadores"],["👁️","Micropigmentación"],["🦷","Odontología estética"],
              ["🐾","Veterinarias"],["🧘","Yoga & fitness"],["📸","Fotografía"],
            ] as [string,string][]).map(([e, l], i) => (
              <div key={i} className="z-biz-card">
                <span className="z-biz-emoji">{e}</span>
                <span className="z-biz-label">{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Thin internal separator */}
        <div style={{ height: 1, background: "rgba(255,255,255,.07)", margin: "68px 48px 0" }} />

        {/* Cómo funciona — within same dark block */}
        <div style={{ padding: "68px 48px 76px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }} className="z-reveal">
            <div className="z-label" style={{ justifyContent: "center", color: "rgba(251,15,5,.9)" }}>Proceso</div>
            <h2 className="z-section-title" style={{ color: "white" }}>Listo en 3 pasos</h2>
            <p className="z-section-sub" style={{ maxWidth: 440, margin: "0 auto", color: "rgba(255,255,255,.45)" }}>Sin instalaciones. Sin configuración compleja. Tu negocio online en minutos.</p>
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", top: 52, left: "15%", right: "15%", height: 1, background: "linear-gradient(90deg,rgba(251,15,5,0),rgba(155,63,200,.5),rgba(0,39,254,.5),rgba(251,15,5,0))", pointerEvents: "none" }} />
            <div className="z-how-grid">
              {([
                { num: "01", cls: "z-how-num-1", icon: "🏪", title: "Configura tu negocio", desc: "Agrega tus servicios, precios, equipo y personaliza tu marca. Sube tu logo y activa tu agenda pública." },
                { num: "02", cls: "z-how-num-2", icon: "🔗", title: "Comparte tu enlace", desc: "Tus clientes reservan desde tuyo.zyncra.com — sin apps, sin formularios complicados, en segundos." },
                { num: "03", cls: "z-how-num-3", icon: "📈", title: "Crece sin estrés", desc: "Los recordatorios van solos, el POS registra todo y ves en tiempo real cómo crece tu negocio." },
              ]).map((s, i) => (
                <div key={i} className={`z-how-card z-reveal z-d${i + 1}`}>
                  <div className={`z-how-num ${s.cls}`}>{s.num}</div>
                  <span className="z-how-icon">{s.icon}</span>
                  <div className="z-how-title">{s.title}</div>
                  <p className="z-how-desc">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 48 }} className="z-reveal">
            <Link href="/register" className="z-btn-xl">Empezar gratis →</Link>
          </div>
        </div>

      </section>

      {/* ── BRIDGE: dark → cream ── */}
      <div style={{ height: 80, background: "linear-gradient(to bottom, var(--z-ink), var(--z-cream))" }} />

      {/* ════════════════════════════════════════════════
          CREAM BLOCK — Features + Antes vs Después
          (fondo continuo, sin salto visual entre ambas)
          ════════════════════════════════════════════════ */}

      {/* Features grid */}
      <section style={{ background: "var(--z-cream)" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }} className="z-reveal">
          <div className="z-label" style={{ justifyContent: "center" }}>Funcionalidades</div>
          <h2 className="z-section-title">Todo lo que tu negocio necesita</h2>
          <p className="z-section-sub" style={{ maxWidth: 500, margin: "0 auto" }}>Una plataforma completa para negocios de servicios que trabajan con citas.</p>
        </div>
        <div className="z-features-grid">
          {[
            { icon: "📅", title: "Agenda inteligente",    desc: "Reservas 24/7, recordatorios automáticos y confirmaciones por WhatsApp." },
            { icon: "💬", title: "Marketing WhatsApp",    desc: "Campañas segmentadas, recordatorios y solicitud de reseñas automáticas." },
            { icon: "💳", title: "Sistema POS",           desc: "Cobra con Nequi, Daviplata, efectivo o tarjeta. Factura DIAN incluida." },
            { icon: "⭐", title: "Reseñas Google",        desc: "Solicita reseñas automáticamente después de cada visita y sube tu ranking." },
            { icon: "💼", title: "Comisiones",            desc: "Liquida comisiones de tu equipo automáticamente. Sin errores ni disputas." },
            { icon: "🧾", title: "Facturación DIAN",      desc: "Cumple con la DIAN sin salir de Zyncra. CUFE y XML automáticos." },
          ].map((f, i) => (
            <div key={i} className={`z-feat-card z-reveal z-d${(i % 3) + 1}`}>
              <span className="z-feat-icon">{f.icon}</span>
              <div className="z-feat-title">{f.title}</div>
              <p className="z-feat-desc">{f.desc}</p>
              <Link href="/features" className="z-feat-link">Ver más →</Link>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 48 }} className="z-reveal">
          <Link href="/features" className="z-btn-xl">Ver todas las funciones →</Link>
        </div>
      </section>

      {/* Antes vs Después — mismo fondo cream, sin section break visual */}
      <section style={{ background: "var(--z-cream)", paddingTop: 0 }}>
        <div style={{ textAlign: "center", marginBottom: 52 }} className="z-reveal">
          <div className="z-label" style={{ justifyContent: "center" }}>Transformación</div>
          <h2 className="z-section-title">Tu negocio, antes y después<br />de Zyncra</h2>
        </div>
        <div className="z-compare-wrap z-reveal">
          <div className="z-compare-before">
            <div className="z-compare-head z-compare-head-before"><span>😓</span> Sin Zyncra</div>
            {[
              "Cuadernos y hojas de Excel para anotar citas",
              "Llamadas manuales para confirmar o recordar",
              "No-shows sin aviso que cuestan dinero",
              "Sin control de ingresos ni comisiones",
              "Responder WhatsApps a toda hora",
              "Facturas a mano o en Excel",
              "Sin visibilidad de qué servicios generan más",
            ].map((t, i) => (
              <div key={i} className="z-compare-item z-compare-item-before">
                <span className="z-compare-x">✕</span> {t}
              </div>
            ))}
          </div>
          <div className="z-compare-vs">
            <span className="z-compare-vs-text">VS</span>
          </div>
          <div className="z-compare-after">
            <div className="z-compare-head z-compare-head-after"><span>🚀</span> Con Zyncra</div>
            {[
              "Agenda online que tus clientes reservan solos",
              "Recordatorios automáticos por WhatsApp",
              "−60% de no-shows garantizado",
              "Dashboard de ingresos y comisiones en tiempo real",
              "Bot que responde y agenda por WhatsApp",
              "Factura electrónica DIAN con 1 clic",
              "Reportes claros de cada servicio y profesional",
            ].map((t, i) => (
              <div key={i} className="z-compare-item z-compare-item-after">
                <span className="z-compare-check">✓</span> {t}
              </div>
            ))}
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 48 }} className="z-reveal">
          <Link href="/register" className="z-btn-xl">Quiero transformar mi negocio →</Link>
        </div>
      </section>

      {/* ── BRIDGE: cream → dark ── */}
      <div style={{ height: 80, background: "linear-gradient(to bottom, var(--z-cream), #0a0a14)" }} />

      {/* ── TESTIMONIALS ── */}
      <section className="z-testi-section">
        <div style={{ textAlign: "center", marginBottom: 56 }} className="z-reveal">
          <div className="z-label" style={{ justifyContent: "center", color: "rgba(251,15,5,.9)" }}>Testimonios</div>
          <h2 className="z-section-title" style={{ color: "white" }}>Lo que dicen nuestros clientes</h2>
          <p className="z-section-sub" style={{ color: "rgba(255,255,255,.4)", maxWidth: 440, margin: "0 auto" }}>Negocios reales, resultados reales.</p>
        </div>
        <div className="z-testi-grid">
          {[
            {
              emoji: "💈", stars: "★★★★★",
              text: "Los no-shows bajaron un 70% desde que activamos los recordatorios. Nunca pensé que algo así pudiera impactar tanto en mis ingresos.",
              name: "Alejandro Ruiz", biz: "Black Fade Barbershop · Bogotá",
            },
            {
              emoji: "💇", stars: "★★★★★",
              text: "Las campañas de WhatsApp me trajeron clientes inactivos de vuelta. En la primera campaña recuperé 12 clientes que no venían hace 3 meses.",
              name: "María Torres", biz: "Estudio Hair · Bucaramanga",
            },
            {
              emoji: "⭐", stars: "★★★★★",
              text: "Las reseñas en Google subieron de 4.1 a 4.8 en dos meses. Ahora aparecemos primeros en búsquedas locales y llegan clientes nuevos cada semana.",
              name: "Diana Vásquez", biz: "Studio V · Manizales",
            },
          ].map((r, i) => (
            <div key={i} className={`z-testi-card z-reveal z-d${i + 1}`}>
              <span className="z-testi-avatar">{r.emoji}</span>
              <span className="z-testi-stars">{r.stars}</span>
              <span className="z-testi-quote-mark">&ldquo;</span>
              <p className="z-testi-text">{r.text}</p>
              <div className="z-testi-name">{r.name}</div>
              <div className="z-testi-biz">{r.biz}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 48 }} className="z-reveal">
          <Link href="/reviews" style={{ fontSize: 14, fontWeight: 600, color: "rgba(251,15,5,.9)", textDecoration: "none" }}>
            Ver más testimonios →
          </Link>
        </div>
      </section>

      {/* ── BRIDGE: dark → cream (before CTA) ── */}
      <div style={{ height: 80, background: "linear-gradient(to bottom, #0a0a14, var(--z-cream))" }} />

      {/* ── CTA BANNER ── */}
      <div className="z-cta-banner z-reveal">
        <h2 className="z-cta-title">¿Listo para transformar<br />tu negocio?</h2>
        <p className="z-cta-sub">Únete a más de 500 negocios de servicios que ya usan Zyncra.</p>
        <div className="z-cta-actions">
          <Link href="/register" className="z-btn-white">Empezar gratis →</Link>
          <Link href="/features" className="z-btn-outline-white">Ver funciones</Link>
        </div>
        <p className="z-cta-note">✓ 14 días gratis &nbsp;·&nbsp; ✓ Sin tarjeta &nbsp;·&nbsp; ✓ Cancela cuando quieras</p>
      </div>

      <ZyncraFooter />

      {/* ── WhatsApp float CTA ── */}
      <a
        href="https://wa.me/573000000000?text=Hola%2C+me+interesa+Zyncra+para+mi+negocio+%F0%9F%91%8B"
        target="_blank"
        rel="noopener noreferrer"
        className="z-wa-float"
        aria-label="Contactar por WhatsApp"
      >
        <span className="z-wa-tooltip">Responderemos en segundos 💬</span>
        <span className="z-wa-btn">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.096.54 4.064 1.487 5.777L.057 23.143a.75.75 0 0 0 .916.916l5.399-1.43A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.807 9.807 0 0 1-5.028-1.382l-.36-.213-3.734.989.988-3.734-.213-.36A9.807 9.807 0 0 1 2.182 12C2.182 6.566 6.566 2.182 12 2.182S21.818 6.566 21.818 12 17.434 21.818 12 21.818z" />
          </svg>
          ¡Hablemos!
        </span>
      </a>
    </div>
  );
}
