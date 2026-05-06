"use client";

import Link from "next/link";
import styles from "./landing.module.css";

export default function LandingPage() {
  return (
    <div className={styles.landing}>
      {/* Navegación */}
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <span>Antigravity</span>Booking
        </div>
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <Link href="/admin" className="btn-secondary" style={{ padding: "8px 20px" }}>Admin Log In</Link>
          <Link href="/book/demo-salon" className="btn-primary" style={{ padding: "8px 20px" }}>Ver Demo</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className={styles.hero}>
        <h1>Organiza tu barbería con <span>precisión</span> ejecutiva.</h1>
        <p>
          La plataforma de reservas SaaS diseñada para salones de alta gama. 
          Reduce inasistencias en un 40% con recordatorios inteligentes y pagos seguros.
        </p>
        <div className={styles.ctaGroup}>
          <Link href="/book/demo-salon" className="btn-primary" style={{ padding: "16px 32px", fontSize: "18px" }}>
            Prueba la Demo Pública
          </Link>
          <button className="btn-secondary" style={{ padding: "16px 32px", fontSize: "18px" }}>
            Hablar con Ventas
          </button>
        </div>
      </header>

      {/* Features Section */}
      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <h2>Todo lo que necesitas para crecer</h2>
          <p>Potenciamos tu negocio con herramientas de nivel corporativo.</p>
        </div>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>📅</span>
            <h3>Reserva en 3 Pasos</h3>
            <p>Un flujo de reserva sin fricción diseñado para móvil. Tus clientes agendarán en menos de 60 segundos.</p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>📱</span>
            <h3>WhatsApp Automático</h3>
            <p>Recordatorios automáticos que aseguran que tus clientes lleguen a tiempo a cada cita.</p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>💳</span>
            <h3>Pagos de Depósito</h3>
            <p>Protege tu tiempo cobrando un adelanto seguro a través de Stripe para citas de alto valor.</p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>📊</span>
            <h3>Panel de Control</h3>
            <p>Gestiona profesionales, servicios y analiza el rendimiento de tu salón con métricas claras.</p>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className={styles.section} style={{ backgroundColor: "var(--bg-base)" }}>
        <div className={styles.sectionTitle}>
          <h2>Lo que dicen nuestros clientes</h2>
          <p>Barberías y salones que han transformado su negocio.</p>
        </div>
        <div className={styles.reviewsGrid}>
          <div className={styles.reviewCard}>
            <div className={styles.reviewStars}>⭐⭐⭐⭐⭐</div>
            <p className={styles.reviewText}>"Desde que usamos Antigravity Booking, las inasistencias se redujeron a cero gracias a los depósitos de Stripe. Es increíble."</p>
            <div className={styles.reviewAuthor}>
              <div className={styles.authorAvatar} style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80')" }}></div>
              <div>
                <strong>Carlos Mendoza</strong>
                <span>The Gentleman's Club</span>
              </div>
            </div>
          </div>
          <div className={styles.reviewCard}>
            <div className={styles.reviewStars}>⭐⭐⭐⭐⭐</div>
            <p className={styles.reviewText}>"La interfaz es súper limpia. Mis clientes mayores que no son buenos con la tecnología ahora reservan sin pedirme ayuda."</p>
            <div className={styles.reviewAuthor}>
              <div className={styles.authorAvatar} style={{ backgroundImage: "url('https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80')" }}></div>
              <div>
                <strong>Laura Gómez</strong>
                <span>Studio 54 Beauty</span>
              </div>
            </div>
          </div>
          <div className={styles.reviewCard}>
            <div className={styles.reviewStars}>⭐⭐⭐⭐⭐</div>
            <p className={styles.reviewText}>"El panel de administración me ahorra al menos 5 horas a la semana. Ya no uso cuadernos ni Excel."</p>
            <div className={styles.reviewAuthor}>
              <div className={styles.authorAvatar} style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80')" }}></div>
              <div>
                <strong>Miguel Torres</strong>
                <span>Torres Barbershop</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className={`${styles.section} ${styles.pricing}`}>
        <div className={styles.sectionTitle}>
          <h2>Planes Simples y Transparentes</h2>
        </div>
        <div className={styles.pricingGrid}>
          <div className={styles.priceCard}>
            <h3>Plan Básico</h3>
            <div className={styles.price}>$29<span>/mes</span></div>
            <ul style={{ listStyle: "none", padding: 0, textAlign: "left", marginBottom: "32px", color: "rgba(255,255,255,0.7)" }}>
              <li style={{ marginBottom: "12px" }}>✓ Hasta 3 profesionales</li>
              <li style={{ marginBottom: "12px" }}>✓ Reservas ilimitadas</li>
              <li style={{ marginBottom: "12px" }}>✓ Dashboard básico</li>
              <li style={{ marginBottom: "12px" }}>✗ Sin depósitos Stripe</li>
            </ul>
            <button className="btn-secondary" style={{ width: "100%", color: "white", borderColor: "rgba(255,255,255,0.2)" }}>Empezar Gratis</button>
          </div>
          
          <div className={`${styles.priceCard} ${styles.popular}`}>
            <div style={{ backgroundColor: "var(--accent-blue)", color: "white", padding: "4px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: "bold", display: "inline-block", marginBottom: "16px" }}>MÁS POPULAR</div>
            <h3>Plan Pro</h3>
            <div className={styles.price}>$59<span>/mes</span></div>
            <ul style={{ listStyle: "none", padding: 0, textAlign: "left", marginBottom: "32px" }}>
              <li style={{ marginBottom: "12px" }}>✓ Profesionales ilimitados</li>
              <li style={{ marginBottom: "12px" }}>✓ Recordatorios WhatsApp</li>
              <li style={{ marginBottom: "12px" }}>✓ Depósitos con Stripe</li>
              <li style={{ marginBottom: "12px" }}>✓ Soporte Prioritario</li>
            </ul>
            <button className="btn-primary" style={{ width: "100%" }}>Obtener Pro</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div>© 2026 Antigravity Booking. Todos los derechos reservados.</div>
        <div style={{ display: "flex", gap: "24px" }}>
          <Link href="#">Privacidad</Link>
          <Link href="#">Términos</Link>
          <Link href="#">Contacto</Link>
        </div>
      </footer>
    </div>
  );
}
