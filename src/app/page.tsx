"use client";

import Link from "next/link";
import styles from "./landing.module.css";

export default function LandingPage() {
  return (
    <div className={styles.landing}>
      {/* ─── NAV ─── */}
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <span>◆</span>BookSalon
        </div>
        <div className={styles.navActions}>
          <Link href="/admin" className="btn-secondary" style={{ padding: "8px 18px", fontSize: "14px", color: "rgba(220,228,255,0.8)", borderColor: "rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.08)" }}>
            Admin
          </Link>
          <Link href="/book/demo-salon" className="btn-primary" style={{ padding: "8px 18px", fontSize: "14px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", boxShadow: "0 0 20px rgba(99,102,241,0.35)" }}>
            Ver Demo →
          </Link>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <header className={styles.hero}>
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeDot} />
          Plataforma SaaS para salones y barberías
        </div>

        <h1>
          Reservas inteligentes.<br />
          <span>Sin fricción. Sin faltas.</span>
        </h1>

        <p>
          Automatiza tu agenda, elimina inasistencias con depósitos Stripe y da a tus clientes una experiencia de reserva de nivel premium — desde cualquier dispositivo.
        </p>

        <div className={styles.ctaGroup}>
          <Link href="/book/demo-salon" className={styles.btnHeroPrimary}>
            🚀 Prueba la Demo
          </Link>
          <button className={styles.btnHeroSecondary}>
            Hablar con Ventas →
          </button>
        </div>

        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>40%</span>
            <span className={styles.statLabel}>Reducción de inasistencias</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>60s</span>
            <span className={styles.statLabel}>Tiempo de reserva</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>100%</span>
            <span className={styles.statLabel}>Multi-dispositivo</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>∞</span>
            <span className={styles.statLabel}>Clientes por plan Pro</span>
          </div>
        </div>
      </header>

      {/* ─── FEATURES ─── */}
      <section className={styles.featuresSection}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionEyebrow}>Características</span>
          <h2>Todo lo que necesitas para crecer</h2>
          <p>Herramientas de nivel corporativo, pensadas para el salón moderno.</p>
        </div>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>📅</div>
            <h3>Reserva en 3 Pasos</h3>
            <p>Un flujo de reserva sin fricción, diseñado para móvil. Tus clientes agendarán en menos de 60 segundos, sin apps ni registros.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>📱</div>
            <h3>WhatsApp Automático</h3>
            <p>Recordatorios automáticos antes de cada cita. Tus clientes llegan a tiempo y tú ganas dinero sin hacer nada.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>💳</div>
            <h3>Depósitos con Stripe</h3>
            <p>Cobra un adelanto seguro al momento de reservar. Las inasistencias se convierten en historia del pasado.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>📊</div>
            <h3>Panel de Control</h3>
            <p>Gestiona profesionales, servicios y monitorea el rendimiento de tu negocio en tiempo real desde un panel elegante.</p>
          </div>
        </div>
      </section>

      {/* ─── REVIEWS ─── */}
      <section className={styles.reviewsSection}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionEyebrow}>Testimonios</span>
          <h2>Lo que dicen nuestros clientes</h2>
          <p>Barberías y salones que ya transformaron su negocio.</p>
        </div>
        <div className={styles.reviewsGrid}>
          {[
            {
              stars: "★★★★★",
              text: "\"Desde que usamos BookSalon, las inasistencias se redujeron a cero gracias a los depósitos de Stripe. Es increíble.\"",
              name: "Carlos Mendoza",
              salon: "The Gentleman's Club",
              avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80"
            },
            {
              stars: "★★★★★",
              text: "\"La interfaz es súper limpia. Mis clientes mayores que no son buenos con la tecnología ahora reservan sin pedirme ayuda.\"",
              name: "Laura Gómez",
              salon: "Studio 54 Beauty",
              avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80"
            },
            {
              stars: "★★★★★",
              text: "\"El panel de administración me ahorra al menos 5 horas a la semana. Ya no uso cuadernos ni Excel para nada.\"",
              name: "Miguel Torres",
              salon: "Torres Barbershop",
              avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80"
            }
          ].map((r, i) => (
            <div key={i} className={styles.reviewCard}>
              <div className={styles.reviewStars}>{r.stars}</div>
              <p className={styles.reviewText}>{r.text}</p>
              <div className={styles.reviewAuthor}>
                <div className={styles.authorAvatar} style={{ backgroundImage: `url('${r.avatar}')` }} />
                <div>
                  <strong>{r.name}</strong>
                  <span>{r.salon}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section className={styles.pricing}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionEyebrow}>Precios</span>
          <h2>Planes Simples y Transparentes</h2>
          <p>Sin contratos, sin sorpresas. Cancela cuando quieras.</p>
        </div>
        <div className={styles.pricingGrid}>
          <div className={styles.priceCard}>
            <h3>Plan Básico</h3>
            <div className={styles.price}>$29<span>/mes</span></div>
            <ul className={styles.priceList}>
              <li>✓ Hasta 3 profesionales</li>
              <li>✓ Reservas ilimitadas</li>
              <li>✓ Dashboard básico</li>
              <li className={styles.disabled}>✗ Sin depósitos Stripe</li>
            </ul>
            <button className={styles.btnHeroSecondary} style={{ width: "100%", justifyContent: "center" }}>
              Empezar Gratis
            </button>
          </div>

          <div className={`${styles.priceCard} ${styles.popular}`}>
            <div style={{ background: "linear-gradient(135deg, #6366f1, #a78bfa)", color: "white", padding: "4px 14px", borderRadius: "9999px", fontSize: "11px", fontWeight: 800, display: "inline-block", marginBottom: "16px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              MÁS POPULAR
            </div>
            <h3>Plan Pro</h3>
            <div className={styles.price}>$59<span>/mes</span></div>
            <ul className={styles.priceList}>
              <li>✓ Profesionales ilimitados</li>
              <li>✓ Recordatorios WhatsApp</li>
              <li>✓ Depósitos con Stripe</li>
              <li>✓ Soporte Prioritario 24/7</li>
            </ul>
            <Link href="/book/demo-salon" className={styles.btnHeroPrimary} style={{ width: "100%", justifyContent: "center" }}>
              Obtener Pro →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className={styles.footer}>
        <div>© 2026 BookSalon. Todos los derechos reservados.</div>
        <div style={{ display: "flex", gap: "24px" }}>
          <Link href="#">Privacidad</Link>
          <Link href="#">Términos</Link>
          <Link href="#">Contacto</Link>
        </div>
      </footer>
    </div>
  );
}
