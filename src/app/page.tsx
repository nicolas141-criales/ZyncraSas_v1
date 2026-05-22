"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./landing.module.css";

function useCountUp(target: number, duration = 1800) {
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

function StatCount({ value, suffix = "" }: { value: number; suffix?: string }) {
  const { count, ref } = useCountUp(value);
  return <span ref={ref} className={styles.statNumber}>{count}{suffix}</span>;
}

const tickerItems = [
  { icon: "📅", text: "Reservas en 60 segundos" },
  { icon: "💳", text: "Depósitos anti no-shows con Stripe" },
  { icon: "📱", text: "Recordatorios WhatsApp automáticos" },
  { icon: "📊", text: "Panel de control en tiempo real" },
  { icon: "✅", text: "Sin apps, sin registro de cliente" },
  { icon: "🔒", text: "Pagos 100% seguros" },
];

const reviews = [
  {
    stars: "★★★★★",
    text: "\"Desde que usamos BookSalon, las inasistencias se redujeron a cero gracias a los depósitos de Stripe. Es increíble.\"",
    name: "Carlos Mendoza",
    salon: "The Gentleman's Club",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
  },
  {
    stars: "★★★★★",
    text: "\"La interfaz es súper limpia. Mis clientes mayores que no son buenos con la tecnología ahora reservan sin pedirme ayuda.\"",
    name: "Laura Gómez",
    salon: "Studio 54 Beauty",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
  },
  {
    stars: "★★★★★",
    text: "\"El panel de administración me ahorra al menos 5 horas a la semana. Ya no uso cuadernos ni Excel para nada.\"",
    name: "Miguel Torres",
    salon: "Torres Barbershop",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
  },
];

const WA_LINK = "https://wa.me/573000000000?text=Hola,%20quiero%20m%C3%A1s%20informaci%C3%B3n%20sobre%20BookSalon.";

export default function LandingPage() {
  return (
    <div className={styles.landing}>
      {/* ─── NAV ─── */}
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <span>◆</span>BookSalon
        </div>
        <ul className={styles.navLinks}>
          <li><a href="#features" className={styles.navLink}>Características</a></li>
          <li><a href="#reviews" className={styles.navLink}>Reseñas</a></li>
          <li><a href="#pricing" className={styles.navLink}>Precios</a></li>
        </ul>
        <div className={styles.navActions}>
          <Link href="/login" className={styles.btnGhost}>Ingresar</Link>
        </div>
      </nav>

      {/* ─── TICKER ─── */}
      <div className={styles.ticker}>
        <div className={styles.tickerTrack}>
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <div key={i} className={styles.tickerItem}>
              <span className={styles.tickerIcon}>{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>
      </div>

      {/* ─── HERO ─── */}
      <section className={styles.hero}>
        <div className={styles.blob + " " + styles.blob1} />
        <div className={styles.blob + " " + styles.blob2} />

        {/* Left */}
        <div className={styles.heroLeft}>
          <div className={styles.heroChip}>
            <span className={styles.chipBadge}>Nuevo</span>
            <span className={styles.chipDot} />
            Plataforma SaaS para salones y barberías
          </div>

          <h1 className={styles.heroTitle}>
            Reservas <span className={styles.accent}>inteligentes</span> para tu salón
          </h1>

          <p className={styles.heroSub}>
            Automatiza tu agenda, elimina inasistencias con depósitos Stripe y da a tus clientes una experiencia de reserva de nivel premium — desde cualquier dispositivo.
          </p>

          <div className={styles.heroActions}>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className={styles.btnXl}>
              Hablar con Ventas 💬
            </a>
            <a href="#features" className={styles.btnXlGhost}>Ver características →</a>
          </div>

          <div className={styles.heroTrust}>
            <div className={styles.trustItem}>
              <span className={styles.trustDot}>✓</span>
              Sin tarjeta al registrarte
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustDot}>✓</span>
              1 mes gratis
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustDot}>✓</span>
              Configuración en minutos
            </div>
          </div>
        </div>

        {/* Right – App Mockup */}
        <div className={styles.heroRight}>
          <div className={styles.appCard}>
            <div className={styles.appTopbar}>
              <div className={styles.appDots}>
                <div className={styles.appDot} style={{ background: "#ff5f57" }} />
                <div className={styles.appDot} style={{ background: "#febc2e" }} />
                <div className={styles.appDot} style={{ background: "#28c840" }} />
              </div>
              <span className={styles.appTitle}>Mi Agenda</span>
              <span className={styles.appDate}>Hoy</span>
            </div>

            <div className={styles.slotRow}>
              <span className={styles.slotTime}>9:00</span>
              <div className={`${styles.slot} ${styles.slotRed}`}>
                <span>Corte + Barba</span>
                <span className={styles.slotName}>Carlos M.</span>
              </div>
            </div>
            <div className={styles.slotRow}>
              <span className={styles.slotTime}>10:30</span>
              <div className={`${styles.slot} ${styles.slotPurple}`}>
                <span>Tinte + Corte</span>
                <span className={styles.slotName}>Ana G.</span>
              </div>
            </div>
            <div className={styles.slotRow}>
              <span className={styles.slotTime}>12:00</span>
              <div className={`${styles.slot} ${styles.slotBlue}`}>
                <span>Manicure</span>
                <span className={styles.slotName}>María L.</span>
              </div>
            </div>
            <div className={styles.slotRow}>
              <span className={styles.slotTime}>14:00</span>
              <div className={`${styles.slot} ${styles.slotGray}`}>
                <span>Disponible</span>
                <span className={styles.slotName}>—</span>
              </div>
            </div>
          </div>

          {/* Floating cards */}
          <div className={styles.floatCard1}>
            <span className={styles.waDot} />
            <div>
              <div className={styles.floatText}>Recordatorio enviado ✓</div>
              <div className={styles.floatSub}>WhatsApp · hace 2 min</div>
            </div>
          </div>
          <div className={styles.floatCard2}>
            <div className={styles.floatIcon}>💳</div>
            <div>
              <div className={styles.floatText}>Depósito recibido</div>
              <div className={styles.floatSub}>$15.000 · Stripe</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS STRIP ─── */}
      <div className={styles.statsStrip}>
        <div className={styles.statItem}>
          <StatCount value={40} suffix="%" />
          <div className={styles.statLabel}>Menos inasistencias</div>
        </div>
        <div className={styles.statItem}>
          <StatCount value={60} suffix="s" />
          <div className={styles.statLabel}>Para reservar</div>
        </div>
        <div className={styles.statItem}>
          <StatCount value={100} suffix="%" />
          <div className={styles.statLabel}>Multi-dispositivo</div>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>∞</span>
          <div className={styles.statLabel}>Clientes y Citas</div>
        </div>
      </div>

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
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>👥</div>
            <h3>CRM de Clientes</h3>
            <p>Historial completo de cada cliente, sus preferencias y citas anteriores. Construye relaciones duraderas.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>🎨</div>
            <h3>Branding Personalizado</h3>
            <p>Tu logo, tus colores, tu dominio. La experiencia de reserva lleva tu marca, no la nuestra.</p>
          </div>
        </div>
      </section>

      {/* ─── REVIEWS ─── */}
      <section id="reviews" className={styles.reviewsSection} style={{ scrollMarginTop: "80px" }}>
        <div className={styles.reviewsHeader}>
          <div className={styles.sectionTitle}>
            <span className={styles.sectionEyebrow}>Testimonios</span>
            <h2>Lo que dicen nuestros clientes</h2>
            <p>Barberías y salones que ya transformaron su negocio.</p>
          </div>
        </div>
        <div className={styles.reviewsGrid}>
          <div className={styles.reviewsTrack}>
            {[...reviews, ...reviews].map((r, i) => (
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
            <h3>Plan Profesional</h3>
            <div className={styles.price}>
              $60.000<span>/mes</span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--ink-4)", marginTop: "-12px", marginBottom: "24px" }}>
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
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.btnXl}
              style={{ width: "100%", justifyContent: "center", boxSizing: "border-box" }}
            >
              Hablar con Ventas 💬
            </a>
            <p style={{ fontSize: "12px", color: "var(--ink-4)", marginTop: "12px", textAlign: "center" }}>
              Sin tarjeta de crédito para el período de prueba
            </p>
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <div className={styles.ctaBanner}>
        <h2 className={styles.ctaBannerTitle}>¿Listo para transformar tu negocio?</h2>
        <p className={styles.ctaBannerSub}>Únete a los salones y barberías que ya automatizaron sus reservas.</p>
        <div className={styles.ctaActions}>
          <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className={styles.btnWhite}>
            Hablar con Ventas 💬
          </a>
          <a href="#features" className={styles.btnOutlineWhite}>Ver características</a>
        </div>
        <p className={styles.ctaNote}>Sin tarjeta de crédito · 1 mes gratis · Cancela cuando quieras</p>
      </div>

      {/* ─── FOOTER ─── */}
      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div>
            <div className={styles.footerLogo}>
              <span>◆</span>BookSalon
            </div>
            <p className={styles.footerDesc}>
              La plataforma de reservas inteligentes para salones y barberías modernas. Automatiza tu agenda, elimina inasistencias y crece sin esfuerzo.
            </p>
          </div>
          <div>
            <div className={styles.footerColTitle}>Producto</div>
            <ul className={styles.footerLinks}>
              <li><a href="#features">Características</a></li>
              <li><a href="#pricing">Precios</a></li>
              <li><a href="#reviews">Testimonios</a></li>
            </ul>
          </div>
          <div>
            <div className={styles.footerColTitle}>Empresa</div>
            <ul className={styles.footerLinks}>
              <li><a href="#">Acerca de</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href={WA_LINK} target="_blank" rel="noreferrer">Contacto</a></li>
            </ul>
          </div>
          <div>
            <div className={styles.footerColTitle}>Legal</div>
            <ul className={styles.footerLinks}>
              <li><a href="#">Privacidad</a></li>
              <li><a href="#">Términos</a></li>
              <li><a href="#">Cookies</a></li>
            </ul>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <div className={styles.footerCopy}>
            © 2026 BookSalon. Todos los derechos reservados. Creado por{" "}
            <a href="https://www.instagram.com/soypipecontreras/" target="_blank" rel="noreferrer" style={{ color: "#aaaabc" }}>Felipe Contreras</a>{" "}y{" "}
            <a href="https://www.instagram.com/nicolascrialess/" target="_blank" rel="noreferrer" style={{ color: "#aaaabc" }}>Nicolas Criales</a>
          </div>
          <div className={styles.footerLegal}>
            <a href="#">Privacidad</a>
            <a href="#">Términos</a>
            <a href="#">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
