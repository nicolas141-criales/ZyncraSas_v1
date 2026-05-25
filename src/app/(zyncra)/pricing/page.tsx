"use client";
import { useState } from "react";
import Link from "next/link";
import ZyncraNav from "../ZyncraNav";
import ZyncraFooter from "../ZyncraFooter";
import ZyncraReveal from "../ZyncraReveal";

const faqs = [
  { q: "¿Puedo cambiar de plan después?", a: "Sí, puedes subir o bajar de plan en cualquier momento desde tu panel. El cambio aplica en el siguiente ciclo de facturación." },
  { q: "¿Necesito tarjeta de crédito para el período de prueba?", a: "No. Los 14 días de prueba son completamente gratis y no requieren tarjeta. Solo necesitas tu correo electrónico." },
  { q: "¿Qué pasa si cancelo mi suscripción?", a: "Puedes cancelar cuando quieras sin penalización. Tendrás acceso hasta el final del período pagado y podrás exportar tus datos." },
  { q: "¿El precio incluye IVA?", a: "Los precios mostrados no incluyen IVA. Para empresas puede aplicar deducción de impuestos. Consulta con tu contador." },
  { q: "¿Cómo funciona la facturación electrónica DIAN?", a: "Está integrada directamente en el sistema. Al cerrar una venta, la factura se genera y envía automáticamente al cliente. Incluye CUFE, XML y habilitación DIAN." },
  { q: "¿Funciona para negocios distintos a barberías?", a: "Sí. Zyncra está diseñado para cualquier negocio que gestione citas: spas, salones de belleza, centros de estética, manicuristas, clínicas de bienestar, estudios de tatuajes y más." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`z-faq-item${open ? " open" : ""}`}>
      <div className="z-faq-q" onClick={() => setOpen(o => !o)}>
        {q} <span className="z-faq-icon">▼</span>
      </div>
      <div className="z-faq-a">{a}</div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="zyncra">
      <ZyncraReveal />
      <ZyncraNav active="precios" />

      {/* ── PAGE HERO ── */}
      <div className="z-page-hero">
        <div className="z-label z-fadein" style={{ justifyContent: "center" }}>Precios</div>
        <h1 className="z-section-title z-fadeup z-d1" style={{ fontSize: "clamp(36px,5vw,56px)" }}>
          Precios claros,<br />sin sorpresas
        </h1>
        <p className="z-section-sub z-fadeup z-d2" style={{ maxWidth: 480, margin: "0 auto" }}>
          Sin permanencia. Sin letras pequeñas. Cancela o cambia cuando quieras.
        </p>
      </div>

      {/* ── PLANS ── */}
      <section style={{ background: "var(--z-cream)" }}>
        <div className="z-plans-grid">
          {/* Plan Esencial */}
          <div className="z-plan-card z-reveal">
            <div className="z-plan-name">Plan Esencial</div>
            <p className="z-plan-tagline">Para digitalizar tu negocio.</p>
            <div className="z-plan-price"><sup>$</sup>99.900</div>
            <div className="z-plan-period">/ mes · hasta 3 colaboradores</div>
            <hr className="z-plan-divider" />
            <ul className="z-plan-feats">
              {[
                [true,  "3 colaboradores"],
                [true,  "Sitio web de agendamiento"],
                [true,  "Recordatorios WA e email"],
                [true,  "Confirmación de citas"],
                [true,  "Dashboard personalizado"],
                [false, "Sistema POS"],
                [false, "Sistema de caja"],
                [false, "Facturación DIAN"],
                [false, "Marketing WhatsApp"],
                [false, "Reseñas Google"],
              ].map(([yes, label], i) => (
                <li key={i} className="z-plan-feat" style={!yes ? { color: "var(--z-ink-3)" } : {}}>
                  <span className={yes ? "z-check-yes" : "z-check-no"}>{yes ? "✓" : "—"}</span>
                  {label as string}
                </li>
              ))}
            </ul>
            <Link href="/register" className="z-plan-cta z-cta-outline-plan">Empezar gratis →</Link>
          </div>

          {/* Plan Pro */}
          <div className="z-plan-card featured z-reveal z-d2">
            <div className="z-plan-popular">Más popular</div>
            <div className="z-plan-name">Plan Pro</div>
            <p className="z-plan-tagline">Para negocios que quieren escalar.</p>
            <div className="z-plan-price"><sup>$</sup>199.900</div>
            <div className="z-plan-period">/ mes · colaboradores ilimitados</div>
            <hr className="z-plan-divider" />
            <ul className="z-plan-feats">
              {[
                [true,  "Colaboradores ilimitados"],
                [true,  "Sitio web de agendamiento"],
                [true,  "Recordatorios WA e email"],
                [true,  "Confirmación de citas"],
                [true,  "Dashboard personalizado"],
                [true,  "Sistema POS completo"],
                [true,  "Sistema de caja"],
                [true,  "Facturación DIAN"],
                [true,  "Marketing por WhatsApp"],
                [true,  "Reseñas Google Maps"],
                [true,  "Campos personalizados"],
                [true,  "Gestión de comisiones"],
                ["add", "Chat Bot IA (adicional)"],
              ].map(([type, label], i) => (
                <li key={i} className="z-plan-feat" style={type === "add" ? { color: "var(--z-ink-3)" } : {}}>
                  <span className={type === true ? "z-check-yes" : type === "add" ? "z-check-add" : "z-check-no"}>
                    {type === true ? "✓" : type === "add" ? "+" : "—"}
                  </span>
                  {label as string}
                </li>
              ))}
            </ul>
            <Link href="/register" className="z-plan-cta z-cta-solid">Empezar con Pro →</Link>
          </div>
        </div>
        <p style={{ textAlign: "center", marginTop: 28, fontSize: 14, color: "var(--z-ink-4)" }}>
          ¿Tienes múltiples sedes o un equipo grande?{" "}
          <a href="https://wa.me/573000000000?text=Hola%2C+quiero+info+sobre+un+plan+personalizado" target="_blank" rel="noopener noreferrer" style={{ color: "var(--z-red)", textDecoration: "none", fontWeight: 600 }}>Contáctanos</a>
          {" "}para un plan personalizado.
        </p>
      </section>

      {/* ── FAQ ── */}
      <section style={{ background: "white" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }} className="z-reveal">
          <div className="z-label" style={{ justifyContent: "center" }}>Preguntas frecuentes</div>
          <h2 className="z-section-title">Resolvemos tus dudas</h2>
        </div>
        <div className="z-faq-list z-reveal">
          {faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
        </div>
      </section>

      {/* ── CTA ── */}
      <div className="z-cta-banner z-reveal">
        <h2 className="z-cta-title">Empieza gratis hoy</h2>
        <p className="z-cta-sub">14 días de prueba, sin tarjeta de crédito.</p>
        <div className="z-cta-actions">
          <Link href="/register" className="z-btn-white">Crear cuenta gratis →</Link>
          <a href="https://wa.me/573000000000?text=Hola%2C+quisiera+hablar+con+ventas+sobre+Zyncra" target="_blank" rel="noopener noreferrer" className="z-btn-outline-white">Hablar con ventas</a>
        </div>
        <p className="z-cta-note">✓ Sin permanencia &nbsp;·&nbsp; ✓ Soporte en español &nbsp;·&nbsp; ✓ Cancela cuando quieras</p>
      </div>

      <ZyncraFooter />
    </div>
  );
}
