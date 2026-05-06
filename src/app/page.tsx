"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./landing.module.css";

// Counter animation hook
function useCountUp(target: number, duration = 1800, suffix = "") {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let startTime: number | null = null;
          const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

function AnimatedStat({ value, label, suffix = "" }: { value: number | null; label: string; suffix?: string }) {
  const { count, ref } = useCountUp(value ?? 0, 1800);
  if (value === null) return (
    <div className={styles.statItem}>
      <span ref={ref} className={styles.statNumber}>∞</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
  return (
    <div className={styles.statItem}>
      <span ref={ref} className={styles.statNumber}>{count}{suffix}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

// Animated headline words
function AnimatedHeadline() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <h1 ref={ref} className={styles.heroTitle} aria-label="Reservas inteligentes. Sin fricción. Sin faltas.">
      <span className={`${styles.heroWord} ${styles.heroWordWhite} ${visible ? styles.wordVisible : ""}`} style={{ transitionDelay: "0ms" }}>
        Reservas
      </span>{" "}
      <span className={`${styles.heroWord} ${styles.heroWordWhite} ${visible ? styles.wordVisible : ""}`} style={{ transitionDelay: "80ms" }}>
        inteligentes.
      </span>
      <br />
      <span className={`${styles.heroSpan} ${styles.heroWord} ${visible ? styles.wordVisible : ""}`} style={{ transitionDelay: "200ms", color: "#ffffff" }}>
        Sin fricción.
      </span>{" "}
      <span className={`${styles.heroSpan} ${styles.heroWord} ${visible ? styles.wordVisible : ""}`} style={{ transitionDelay: "320ms", color: "#ffffff" }}>
        Sin faltas.
      </span>
    </h1>
  );
}

export default function LandingPage() {
  return (
    <div className={styles.landing}>
      {/* ─── NAV ─── */}
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <span>◆</span>BookSalon
        </div>
        <div className={styles.navLinks}>
          <a href="#features" className={styles.navLink}>Características</a>
          <a href="#reviews" className={styles.navLink}>Reseñas</a>
          <a href="#pricing" className={styles.navLink}>Precios</a>
        </div>
        <div className={styles.navActions}>
          <Link href="/login" className="btn-secondary" style={{ padding: "8px 18px", fontSize: "14px", color: "rgba(220,228,255,0.8)", borderColor: "rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.08)" }}>
            Ingresar
          </Link>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <header className={styles.hero}>
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeDot} />
          Plataforma SaaS para salones y barberías
        </div>

        <AnimatedHeadline />

        <p>
          Automatiza tu agenda, elimina inasistencias con depósitos Stripe y da a tus clientes una experiencia de reserva de nivel premium — desde cualquier dispositivo.
        </p>

        <div className={styles.ctaGroup}>
          <a 
            href="https://wa.me/573000000000?text=Hola,%20quiero%20m%C3%A1s%20informaci%C3%B3n%20sobre%20BookSalon." 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.btnWhatsApp}
          >
            Hablar con Ventas 💬
          </a>
        </div>

        <div className={styles.statsBar}>
          <AnimatedStat value={40} label="Reducción de inasistencias" suffix="%" />
          <AnimatedStat value={60} label="Tiempo de reserva (seg)" suffix="s" />
          <AnimatedStat value={100} label="Multi-dispositivo" suffix="%" />
          <AnimatedStat value={null} label="Clientes y Citas" />
        </div>
      </header>

      {/* ─── FEATURES ─── */}
      <section id="features" className={styles.featuresSection} style={{ scrollMarginTop: "80px" }}>
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
      <section id="reviews" className={styles.reviewsSection} style={{ scrollMarginTop: "80px" }}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionEyebrow}>Testimonios</span>
          <h2>Lo que dicen nuestros clientes</h2>
          <p>Barberías y salones que ya transformaron su negocio.</p>
        </div>
        <div className={styles.reviewsGrid}>
          <div className={styles.reviewsTrack}>
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
              },
              // Duplicados para el carrusel infinito
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
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className={styles.pricing} style={{ scrollMarginTop: "80px" }}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionEyebrow}>Precio</span>
          <h2>Un Solo Plan. Todo Incluido.</h2>
          <p>Sin contratos, sin sorpresas. Prueba 1 mes gratis, luego decide.</p>
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div className={`${styles.priceCard} ${styles.popular}`} style={{ maxWidth: "420px", width: "100%" }}>
            <div style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "white", padding: "4px 16px", borderRadius: "9999px", fontSize: "11px", fontWeight: 800, display: "inline-block", marginBottom: "16px", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              🎁 1 MES GRATIS AL REGISTRARTE
            </div>
            <h3 style={{ fontSize: "22px" }}>Plan Profesional</h3>
            <div className={styles.price}>
              $60.000<span>/mes</span>
            </div>
            <p style={{ fontSize: "13px", color: "rgba(200,210,255,0.5)", marginTop: "-12px", marginBottom: "24px" }}>
              Pesos colombianos (COP) · IVA no incluido
            </p>
            <ul className={styles.priceList}>
              <li>✓ Profesionales ilimitados</li>
              <li>✓ Reservas ilimitadas</li>
              <li>✓ Landing de citas personalizada</li>
              <li>✓ Recordatorios WhatsApp automáticos</li>
              <li>✓ Depósitos anti no-shows con Stripe</li>
              <li>✓ CRM de clientes integrado</li>
              <li>✓ Google Calendar sincronizado</li>
              <li>✓ Soporte prioritario 24/7</li>
            </ul>
            <a 
              href="https://wa.me/573000000000?text=Hola,%20quiero%20m%C3%A1s%20informaci%C3%B3n%20sobre%20BookSalon." 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.btnWhatsApp} 
              style={{ width: "100%", justifyContent: "center", marginTop: "8px", boxSizing: "border-box" }}
            >
              Hablar con Ventas 💬
            </a>
            <p style={{ fontSize: "12px", color: "rgba(200,210,255,0.4)", marginTop: "12px", textAlign: "center" }}>
              Sin tarjeta de crédito para el período de prueba
            </p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className={styles.footer}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
          <div>© 2026 BookSalon. Todos los derechos reservados.</div>
          <div style={{ fontSize: "12px", color: "rgba(200, 210, 255, 0.4)" }}>
            Creado por <a href="https://www.instagram.com/soypipecontreras/" target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>Felipe Contreras</a> y <a href="https://www.instagram.com/nicolascrialess/" target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>Nicolas Criales</a>
          </div>
        </div>
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <Link href="#">Privacidad</Link>
          <Link href="#">Términos</Link>
          <Link href="#">Contacto</Link>
        </div>
      </footer>
    </div>
  );
}
