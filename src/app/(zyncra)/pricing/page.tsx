"use client";
import { useState } from "react";
import Link from "next/link";
import ZyncraNav from "../ZyncraNav";
import ZyncraFooter from "../ZyncraFooter";
import ZyncraReveal from "../ZyncraReveal";

// ── Types ────────────────────────────────────────────────────────────────────

type CellVal = boolean | string;
interface TableRow  { name: string; e: CellVal; p: CellVal; c: CellVal; }
interface TableGroup { section: string; items: TableRow[]; }

// ── Data ─────────────────────────────────────────────────────────────────────

const faqs = [
  { q: "¿Puedo cambiar de plan después?", a: "Sí, puedes subir o bajar de plan en cualquier momento desde tu panel. El cambio aplica al siguiente ciclo de facturación." },
  { q: "¿Necesito tarjeta de crédito para el período de prueba?", a: "No. Los 14 días son completamente gratis y no requieren tarjeta. Solo necesitas tu correo electrónico." },
  { q: "¿Qué pasa si cancelo mi suscripción?", a: "Puedes cancelar cuando quieras sin penalización. Tendrás acceso hasta el final del período pagado y podrás exportar todos tus datos." },
  { q: "¿El precio incluye IVA?", a: "Los precios mostrados no incluyen IVA. Para empresas puede aplicar deducción de impuestos — consulta con tu contador." },
  { q: "¿Cómo funciona la facturación electrónica DIAN?", a: "Está integrada directamente. Al cerrar una venta, la factura se genera y envía automáticamente al cliente. Incluye CUFE, XML y habilitación DIAN." },
  { q: "¿Funciona para negocios distintos a barberías?", a: "Sí. Zyncra está diseñado para cualquier negocio de citas: spas, salones, estéticas, manicuristas, clínicas de bienestar, tatuadores y más." },
];

const tableData: TableGroup[] = [
  {
    section: "Equipo",
    items: [
      { name: "Colaboradores incluidos", e: "Hasta 3",     p: "Ilimitados",  c: "Ilimitados" },
      { name: "Servicios configurables", e: "Ilimitados",  p: "Ilimitados",  c: "Ilimitados" },
      { name: "Agenda personalizada",    e: true,           p: true,          c: true },
    ],
  },
  {
    section: "Agenda & Clientes",
    items: [
      { name: "Agendamiento online 24/7",       e: true,  p: true,  c: true },
      { name: "Recordatorios por WhatsApp",      e: true,  p: true,  c: true },
      { name: "Confirmación automática de citas",e: true,  p: true,  c: true },
      { name: "Reprogramación de citas",         e: true,  p: true,  c: true },
      { name: "Dashboard de rendimiento",        e: true,  p: true,  c: true },
    ],
  },
  {
    section: "POS & Pagos",
    items: [
      { name: "Sistema POS completo",         e: false, p: true, c: true },
      { name: "Cierre de caja y reportes",    e: false, p: true, c: true },
      { name: "Facturación electrónica DIAN", e: false, p: true, c: true },
      { name: "Comisiones por colaborador",   e: false, p: true, c: true },
    ],
  },
  {
    section: "Marketing & Crecimiento",
    items: [
      { name: "Campañas por WhatsApp",          e: false, p: true, c: true },
      { name: "Solicitud de reseñas Google",    e: false, p: true, c: true },
      { name: "Segmentación de clientes",       e: false, p: true, c: true },
      { name: "Campos personalizados",          e: false, p: true, c: true },
    ],
  },
  {
    section: "Avanzado",
    items: [
      { name: "Gestión de comisiones",     e: false,   p: true,    c: true },
      { name: "Chat Bot IA",               e: false,   p: "add",   c: true },
      { name: "Múltiples sedes",           e: false,   p: false,   c: true },
      { name: "API e integraciones",       e: false,   p: false,   c: true },
      { name: "Soporte prioritario 24/7",  e: false,   p: false,   c: true },
      { name: "Onboarding personalizado",  e: false,   p: false,   c: true },
    ],
  },
];

// ── Components ────────────────────────────────────────────────────────────────

function Cell({ val }: { val: CellVal }) {
  if (val === true)  return <span style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:22,height:22,borderRadius:"50%",background:"#edfff5",color:"#1a9e55",fontSize:11,fontWeight:700 }}>✓</span>;
  if (val === false) return <span style={{ color:"#d0d0e0",fontSize:18,lineHeight:1 }}>—</span>;
  if (val === "add") return <span title="Disponible como complemento" style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:22,height:22,borderRadius:"50%",background:"#f0f0ff",color:"#5a50d6",fontSize:12,fontWeight:700 }}>+</span>;
  return <span style={{ fontSize:13,fontWeight:600,color:"#3a3a48" }}>{val as string}</span>;
}

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  const prices = {
    esencial: annual ? "79.900" : "99.900",
    pro:      annual ? "159.900" : "199.900",
  };

  const btnBase: React.CSSProperties = {
    padding: "9px 22px", borderRadius: 10, border: "none",
    cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif",
    fontWeight: 600, fontSize: 14, transition: "all .2s",
  };

  return (
    <div className="zyncra">
      <ZyncraReveal />
      <ZyncraNav active="precios" />

      {/* ── HERO ── */}
      <div className="z-page-hero" style={{ paddingBottom: 56 }}>
        <div className="z-page-hero-blob" />
        <div style={{ position: "relative", zIndex: 1 }}>

          <div className="z-label z-fadein" style={{ justifyContent: "center" }}>Precios</div>
          <h1 className="z-section-title z-fadeup z-d1" style={{ fontSize: "clamp(36px,5vw,58px)" }}>
            Precio justo.<br />Sin letra pequeña.
          </h1>
          <p className="z-section-sub z-fadeup z-d2" style={{ maxWidth: 440, margin: "0 auto 28px" }}>
            Sin contratos de permanencia. Cancela o cambia de plan cuando quieras.
          </p>

          {/* Billing toggle */}
          <div className="z-fadeup z-d3" style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
            <div style={{ display: "inline-flex", background: "white", border: "1.5px solid #e8e6e2", borderRadius: 13, padding: 4, gap: 4, boxShadow: "0 2px 10px rgba(0,0,0,.06)" }}>
              <button onClick={() => setAnnual(false)} style={{ ...btnBase, background: !annual ? "#111118" : "transparent", color: !annual ? "white" : "#6b6b80" }}>
                Mensual
              </button>
              <button onClick={() => setAnnual(true)} style={{ ...btnBase, background: annual ? "#111118" : "transparent", color: annual ? "white" : "#6b6b80", display: "flex", alignItems: "center", gap: 8 }}>
                Anual
                <span style={{ background: "linear-gradient(135deg,#22c55e,#16a34a)", color: "white", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                  2 meses gratis
                </span>
              </button>
            </div>
          </div>

          {/* Trust strip */}
          <div className="z-fadeup z-d4" style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
            {["✓  Sin tarjeta requerida", "✓  14 días de prueba", "✓  Cancela cuando quieras", "✓  Soporte en español"].map((t, i) => (
              <span key={i} style={{ fontSize: 13, fontWeight: 500, color: "#6b6b80" }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── PLANS ── */}
      <section style={{ background: "var(--z-cream)" }}>
        <div className="z-plans-grid-3">

          {/* Esencial */}
          <div className="z-reveal" style={{ background: "white", border: "1.5px solid #e8e6e2", borderRadius: 24, padding: "36px 32px", display: "flex", flexDirection: "column", position: "relative" }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#111118", marginBottom: 5 }}>Esencial</div>
              <div style={{ fontSize: 13, color: "#6b6b80" }}>Para digitalizar tu negocio</div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 2, marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#a0a0b0", paddingTop: 10 }}>$</span>
              <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-2px", color: "#111118", lineHeight: 1 }}>{prices.esencial}</span>
            </div>
            <div style={{ fontSize: 13, color: "#a0a0b0", marginBottom: annual ? 6 : 24 }}>/ mes · hasta 3 colaboradores</div>
            {annual && <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 16, height: 16, borderRadius: "50%", background: "#dcfce7", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>✓</span>
              Ahorras $240.000/año
            </div>}
            <hr style={{ border: "none", borderTop: "1px solid #f0eeeb", margin: "0 0 20px" }} />
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, flex: 1 }}>
              {([
                [true,  "3 colaboradores"],
                [true,  "Sitio de agendamiento"],
                [true,  "Recordatorios WA + email"],
                [true,  "Confirmación automática"],
                [true,  "Dashboard personalizado"],
                [false, "Sistema POS"],
                [false, "Facturación DIAN"],
                [false, "Marketing WhatsApp"],
              ] as [boolean, string][]).map(([ok, label], i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: ok ? "#111118" : "#c0c0cc" }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, background: ok ? "#edfff5" : "#f5f5f7", color: ok ? "#1a9e55" : "#c0c0cc" }}>{ok ? "✓" : "—"}</span>
                  {label}
                </li>
              ))}
            </ul>
            <Link href="/register" style={{ display: "block", textAlign: "center", padding: "12px 0", borderRadius: 11, fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 15, fontWeight: 700, textDecoration: "none", color: "#111118", border: "1.5px solid #e8e6e2", background: "transparent", transition: "border-color .2s" }}>
              Empezar gratis →
            </Link>
          </div>

          {/* Pro — Featured */}
          <div className="z-plan-card featured z-reveal z-d1" style={{ borderRadius: 24, padding: "36px 32px", display: "flex", flexDirection: "column" }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "inline-block", marginBottom: 12, fontSize: 11, fontWeight: 700, letterSpacing: ".5px", padding: "5px 13px", background: "var(--z-gradient)", color: "white", borderRadius: 20 }}>
                ⭐ Más popular
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#111118", marginBottom: 5 }}>Plan Pro</div>
              <div style={{ fontSize: 13, color: "#6b6b80" }}>Para negocios que quieren escalar</div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 2, marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#a0a0b0", paddingTop: 10 }}>$</span>
              <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-2px", color: "#111118", lineHeight: 1 }}>{prices.pro}</span>
            </div>
            <div style={{ fontSize: 13, color: "#a0a0b0", marginBottom: annual ? 6 : 24 }}>/ mes · colaboradores ilimitados</div>
            {annual && <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 700, marginBottom: 20, display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 16, height: 16, borderRadius: "50%", background: "#dcfce7", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>✓</span>
              Ahorras $480.000/año
            </div>}
            <hr style={{ border: "none", borderTop: "1px solid #f0eeeb", margin: "0 0 20px" }} />
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, flex: 1 }}>
              {([
                [true,    "Colaboradores ilimitados"],
                [true,    "Sitio de agendamiento"],
                [true,    "Recordatorios WA + email"],
                [true,    "Confirmación automática"],
                [true,    "Dashboard personalizado"],
                [true,    "Sistema POS completo"],
                [true,    "Facturación electrónica DIAN"],
                [true,    "Marketing por WhatsApp"],
                [true,    "Reseñas Google Maps"],
                [true,    "Comisiones automáticas"],
                [true,    "Campos personalizados"],
                ["add",   "Chat Bot IA (adicional)"],
              ] as ([boolean, string] | [string, string])[]).map(([type, label], i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: type === false ? "#c0c0cc" : "#111118" }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: type === "add" ? 11 : 9, fontWeight: 700, background: type === true ? "#edfff5" : type === "add" ? "#f0f0ff" : "#f5f5f7", color: type === true ? "#1a9e55" : type === "add" ? "#5a50d6" : "#c0c0cc" }}>
                    {type === true ? "✓" : type === "add" ? "+" : "—"}
                  </span>
                  {label}
                </li>
              ))}
            </ul>
            <Link href="/register" className="z-btn-xl" style={{ justifyContent: "center", padding: "13px 0", fontSize: 15, width: "100%", boxSizing: "border-box" }}>
              Empezar con Pro →
            </Link>
          </div>

          {/* Personalizado */}
          <div className="z-reveal z-d2" style={{ background: "linear-gradient(160deg,#f8f7ff 0%,#f0ebff 100%)", border: "1.5px solid #e0d9ff", borderRadius: 24, padding: "36px 32px", display: "flex", flexDirection: "column" }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "inline-block", marginBottom: 12, fontSize: 11, fontWeight: 700, letterSpacing: ".5px", padding: "5px 13px", background: "rgba(124,58,237,.1)", color: "#7c3aed", borderRadius: 20 }}>
                🏢 Empresas
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#111118", marginBottom: 5 }}>Personalizado</div>
              <div style={{ fontSize: 13, color: "#6b6b80" }}>Múltiples sedes y equipos grandes</div>
            </div>
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-1px", color: "#111118" }}>A medida</span>
            </div>
            <div style={{ fontSize: 13, color: "#a0a0b0", marginBottom: 24 }}>Precio según tu equipo y sedes</div>
            <hr style={{ border: "none", borderTop: "1px solid #e0d9ff", margin: "0 0 20px" }} />
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, flex: 1 }}>
              {[
                "Todo lo del Plan Pro",
                "Múltiples sedes",
                "API e integraciones propias",
                "Onboarding personalizado",
                "Soporte prioritario 24/7",
                "Reportes avanzados a medida",
                "Usuarios administradores",
              ].map((f, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#111118" }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, background: "rgba(124,58,237,.12)", color: "#7c3aed" }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="https://wa.me/573000000000?text=Hola%2C+quiero+info+sobre+un+plan+personalizado+para+mi+empresa"
              target="_blank" rel="noopener noreferrer"
              style={{ display: "block", textAlign: "center", padding: "12px 0", borderRadius: 11, fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 15, fontWeight: 700, textDecoration: "none", color: "#7c3aed", border: "1.5px solid #c4b5fd", background: "white", transition: "all .2s" }}
            >
              Contactar ventas →
            </a>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#a0a0b0" }}>
          ¿Tienes dudas sobre cuál elegir?{" "}
          <a href="https://wa.me/573000000000?text=Hola%2C+quisiera+ayuda+para+elegir+un+plan+de+Zyncra" target="_blank" rel="noopener noreferrer" style={{ color: "#fb0f05", textDecoration: "none", fontWeight: 600 }}>Escríbenos y te orientamos →</a>
        </p>
      </section>

      {/* ── COMPARISON TABLE ── */}
      <section style={{ background: "white" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }} className="z-reveal">
          <div className="z-label" style={{ justifyContent: "center" }}>Comparativa</div>
          <h2 className="z-section-title">Mira todo en detalle</h2>
          <p className="z-section-sub" style={{ maxWidth: 440, margin: "0 auto" }}>Cada función que incluye cada plan, sin sorpresas.</p>
        </div>

        {/* Table — scrollable on mobile */}
        <div style={{ overflowX: "auto" }}>
          <div className="z-reveal" style={{ minWidth: 620, maxWidth: 900, margin: "0 auto", border: "1.5px solid #e8e6e2", borderRadius: 20, overflow: "hidden" }}>

            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", background: "#f7f5f2", padding: "16px 24px", borderBottom: "1px solid #e8e6e2" }}>
              <div style={thStyle}>Función</div>
              <div style={{ ...thStyle, textAlign: "center" }}>Esencial</div>
              <div style={{ ...thStyle, textAlign: "center", color: "#fb0f05" }}>Pro</div>
              <div style={{ ...thStyle, textAlign: "center", color: "#7c3aed" }}>Personalizado</div>
            </div>

            {/* Rows */}
            {tableData.map((group, gi) => (
              <div key={gi}>
                <div style={{ padding: "9px 24px", background: "#faf9f7", borderTop: gi > 0 ? "1px solid #f0eeeb" : "none", borderBottom: "1px solid #ebebeb" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1.5px", color: "#b0b0c0" }}>{group.section}</span>
                </div>
                {group.items.map((row, ri) => (
                  <div key={ri} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "13px 24px", borderBottom: "1px solid #f5f4f2", background: ri % 2 === 0 ? "white" : "#fdfcfa", alignItems: "center" }}>
                    <span style={{ fontSize: 14, color: "#3a3a48" }}>{row.name}</span>
                    <div style={{ textAlign: "center" }}><Cell val={row.e} /></div>
                    <div style={{ textAlign: "center" }}><Cell val={row.p} /></div>
                    <div style={{ textAlign: "center" }}><Cell val={row.c} /></div>
                  </div>
                ))}
              </div>
            ))}

            {/* Footer CTAs */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "18px 24px", background: "#f7f5f2", borderTop: "1px solid #e8e6e2", gap: 10, alignItems: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#6b6b80" }}>
                + disponible como complemento
              </div>
              <div style={{ textAlign: "center" }}>
                <Link href="/register" style={{ fontSize: 13, fontWeight: 700, color: "#111118", textDecoration: "none", padding: "8px 16px", border: "1.5px solid #e8e6e2", borderRadius: 9, background: "white", display: "inline-block" }}>Empezar</Link>
              </div>
              <div style={{ textAlign: "center" }}>
                <Link href="/register" style={{ fontSize: 13, fontWeight: 700, color: "white", textDecoration: "none", padding: "8px 16px", borderRadius: 9, background: "#fb0f05", display: "inline-block" }}>Empezar</Link>
              </div>
              <div style={{ textAlign: "center" }}>
                <a href="https://wa.me/573000000000?text=Hola%2C+info+plan+personalizado" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 700, color: "#7c3aed", textDecoration: "none", padding: "8px 16px", border: "1.5px solid #c4b5fd", borderRadius: 9, background: "white", display: "inline-block" }}>Contactar</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── GUARANTEE ── */}
      <section style={{ background: "var(--z-cream-2)" }}>
        <div style={{ maxWidth: 840, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }} className="z-reveal">
            <div className="z-label" style={{ justifyContent: "center" }}>Sin riesgos</div>
            <h2 className="z-section-title">Prueba 14 días sin comprometerte</h2>
            <p className="z-section-sub">Acceso completo a todos los módulos. Sin tarjeta. Sin presión.</p>
          </div>
          <div className="z-guarantee-grid">
            {[
              { emoji: "🔒", title: "Sin tarjeta de crédito", desc: "Empieza tu prueba sin ingresar datos de pago." },
              { emoji: "↩️", title: "Cancela cuando quieras", desc: "Sin permanencia ni penalización. Tú decides." },
              { emoji: "💬", title: "Soporte en español", desc: "Te ayudamos a configurar todo desde el primer día." },
            ].map((item, i) => (
              <div key={i} className={`z-reveal z-d${i + 1}`} style={{ background: "white", border: "1px solid #e8e6e2", borderRadius: 18, padding: "28px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 38, marginBottom: 14 }}>{item.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#111118", marginBottom: 6 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: "#6b6b80", lineHeight: 1.65 }}>{item.desc}</div>
              </div>
            ))}
          </div>
          <div className="z-reveal" style={{ textAlign: "center", marginTop: 36 }}>
            <Link href="/register" className="z-btn-xl">Empezar gratis — sin tarjeta →</Link>
          </div>
        </div>
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
        <p className="z-cta-sub">14 días con acceso completo. Sin tarjeta de crédito.</p>
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

const thStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "#a0a0b0",
  textTransform: "uppercase", letterSpacing: "1px",
};
