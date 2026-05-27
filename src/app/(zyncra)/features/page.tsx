"use client";
import Link from "next/link";

const Icon = ({ children, size = 20, style = {}, strokeWidth = 1.6 }: {
  children: React.ReactNode; size?: number; style?: React.CSSProperties; strokeWidth?: number;
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {children}
  </svg>
);

const IconCalendar = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></Icon>;
const IconWhatsapp = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M21 12a9 9 0 0 1-13.5 7.8L3 21l1.3-4.5A9 9 0 1 1 21 12z" /></Icon>;
const IconCard = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><rect x="2.5" y="6" width="19" height="13" rx="2" /><path d="M2.5 10h19M6 15h3" /></Icon>;
const IconStar = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.8 6.6 19.5l1.2-6L3.3 9.3l6.1-.7L12 3z" /></Icon>;
const IconUsers = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.6" /><path d="M16 14.2c2.8.5 5 2.8 5 5.8" /></Icon>;
const IconChart = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M3 21V3M3 21h18" /><path d="M7 17V10M11 17V7M15 17V12M19 17V5" /></Icon>;
const IconCheck = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M4 12.5l5 5L20 6.5" /></Icon>;
const IconArrow = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M5 12h14M13 5l7 7-7 7" /></Icon>;
const IconBolt = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M11 2L4 13h6l-1 9 8-12h-7l1-8z" /></Icon>;
const IconGlobe = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></Icon>;
const IconScissors = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M20 4L8.5 15.5M20 20L8.5 8.5M14 12l6 0" /></Icon>;
const IconBrush = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M16 3l5 5-11 11H5v-5L16 3z" /><path d="M14 5l5 5M5 19l-2 2" /></Icon>;
const IconSpa = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M12 22c0-5 0-9 0-9M7 13c0-3 2-5 5-5s5 2 5 5" /><path d="M12 8c-2-2-5-2-7 0 2 3 5 4 7 4M12 8c2-2 5-2 7 0-2 3-5 4-7 4" /></Icon>;
const IconHand = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M8 11V5a1.5 1.5 0 0 1 3 0v6M11 9V4a1.5 1.5 0 0 1 3 0v7M14 9V5a1.5 1.5 0 0 1 3 0v9c0 3.5-2 7-6 7-3 0-5-2-6-4l-3-5c-.5-1 .5-2 1.5-1.5L8 13" /></Icon>;
const IconHeart = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M12 21s-8-5-8-11a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 6-8 11-8 11z" /></Icon>;
const IconX = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M6 6l12 12M18 6L6 18" /></Icon>;
const IconSparkle = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></Icon>;

export default function FeaturesPage() {
  const features = [
    { icon: <IconCalendar size={22} />, title: "Agenda inteligente", desc: "Reservas 24/7 desde tu link público. Tus clientes eligen, confirman y pagan solos.", color: "#A78BFA", span: 2, points: ["Link de reservas personalizado", "Confirmaciones automáticas", "Recordatorios por WhatsApp", "Calendarios por profesional"] },
    { icon: <IconWhatsapp size={22} />, title: "Marketing WhatsApp", desc: "Campañas segmentadas, recordatorios y reseñas automáticas.", color: "#34D399", points: ["Bot 24/7 para reservas", "Campañas de reactivación", "Recordatorios automáticos"] },
    { icon: <IconCard size={22} />, title: "POS + DIAN", desc: "Cobra con Nequi, Daviplata, efectivo o tarjeta. CUFE y XML automáticos.", color: "#EC4899", points: ["Múltiples métodos de pago", "Factura DIAN con CUFE", "Caja por profesional"] },
    { icon: <IconStar size={22} />, title: "Reseñas Google", desc: "Solicita reseñas después de cada visita. Tu ranking sube solo.", color: "#FBBF24", points: ["Solicitud automática post-cita", "Link directo a Google", "Dashboard de valoraciones"] },
    { icon: <IconUsers size={22} />, title: "Comisiones", desc: "Liquida comisiones de tu equipo en un clic. Sin disputas, sin errores.", color: "#22D3EE", points: ["Comisiones por servicio", "Reporte por profesional", "Historial de pagos"] },
    { icon: <IconChart size={22} />, title: "Reportes en tiempo real", desc: "Mira qué servicios y profesionales generan más. Decide con datos.", color: "#FB923C", span: 2, points: ["Ingresos por día/semana/mes", "Top servicios y profesionales", "Exportar a Excel"] },
  ];

  const steps = [
    { n: "01", title: "Configura en minutos", desc: "Agrega tus servicios, equipo, precios y horarios. Sube tu logo. Activa tu agenda pública.", color: "#A78BFA", icon: <IconBolt size={20} /> },
    { n: "02", title: "Comparte tu enlace", desc: "tuyo.zyncra.com — tus clientes reservan en segundos, sin apps, sin descargas.", color: "#EC4899", icon: <IconGlobe size={20} /> },
    { n: "03", title: "Crece sin estrés", desc: "Recordatorios automáticos, POS integrado y dashboards en tiempo real. Tú haces tu arte.", color: "#FB923C", icon: <IconChart size={20} /> },
  ];

  const industries = [
    { icon: <IconScissors size={20} />, label: "Barberías", color: "#A78BFA" },
    { icon: <IconBrush size={20} />, label: "Salones", color: "#EC4899" },
    { icon: <IconSpa size={20} />, label: "Spas", color: "#22D3EE" },
    { icon: <IconHand size={20} />, label: "Manicuristas", color: "#FB923C" },
    { icon: <IconHeart size={20} />, label: "Estética", color: "#34D399" },
    { icon: <IconChart size={20} />, label: "Fitness", color: "#FBBF24" },
  ];

  const beforeItems = ["Cuadernos y Excel para anotar citas", "Llamadas manuales para confirmar", "No-shows sin aviso que cuestan plata", "Sin control de comisiones ni ingresos", "WhatsApps a toda hora, sin descanso", "Facturas a mano o en Word"];
  const afterItems = ["Agenda online — tus clientes reservan solos", "Recordatorios automáticos por WhatsApp", "−60% no-shows comprobado", "Dashboard de ingresos y comisiones en vivo", "Bot que responde y agenda 24/7", "Factura DIAN con CUFE en 1 clic"];

  return (
    <>
      {/* Page Hero */}
      <section style={{ position: "relative", paddingTop: 150, paddingBottom: 60, overflow: "hidden", textAlign: "center" }}>
        <div aria-hidden style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, #A78BFA 0%, transparent 65%)", filter: "blur(120px)", opacity: 0.25, left: "-10%", top: "-30%", pointerEvents: "none" }} />
        <div aria-hidden style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, #EC4899 0%, transparent 65%)", filter: "blur(120px)", opacity: 0.18, left: "75%", top: "-10%", pointerEvents: "none" }} />
        <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(20,15,30,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(20,15,30,0.04) 1px, transparent 1px)", backgroundSize: "64px 64px", maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)", WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)", pointerEvents: "none", opacity: 0.5 } as React.CSSProperties} />
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 28px", position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, border: "1px solid var(--line-strong)", background: "rgba(167,139,250,0.08)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500, color: "var(--violet-2)", fontFamily: "var(--font-mono)" }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--violet-2)", boxShadow: "0 0 10px var(--violet-2)", animation: "pulseGlow 1.8s ease-in-out infinite" }} />
              Funciones
            </div>
          </div>
          <h1 style={{ fontSize: "clamp(42px, 6.4vw, 88px)", lineHeight: 0.96, letterSpacing: "-0.045em", fontWeight: 500, margin: 0, marginBottom: 22, textWrap: "balance" }}>
            Todo en uno.{" "}
            <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}>Sin pestañas.</span>{" "}
            Sin caos.
          </h1>
          <p style={{ fontSize: "clamp(15px, 1.3vw, 18px)", lineHeight: 1.55, color: "var(--fg-dim)", margin: "0 auto", maxWidth: 600 }}>
            Una plataforma completa para negocios de servicios. Reemplaza 5 herramientas con una sola.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: "60px 0 120px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="feat-grid">
            {features.map((f, i) => (
              <div key={i} style={{ gridColumn: (f as {span?: number}).span === 2 ? "span 2" : "span 1", padding: 24, background: "linear-gradient(180deg, rgba(20,15,30,0.04) 0%, rgba(20,15,30,0.015) 100%)", border: "1px solid var(--line)", borderRadius: 20, backdropFilter: "blur(10px)" }} className={(f as {span?: number}).span === 2 ? "feat-wide" : ""}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${f.color}33, ${f.color}11)`, border: `1px solid ${f.color}44`, display: "grid", placeItems: "center", color: f.color, marginBottom: 16 }}>{f.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.02em", marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 13.5, color: "var(--fg-dim)", lineHeight: 1.5, marginBottom: 16 }}>{f.desc}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {f.points.map((p, j) => (
                    <div key={j} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                      <IconCheck size={13} style={{ color: f.color }} />
                      <span style={{ color: "var(--fg-dim)" }}>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section style={{ padding: "80px 0 120px", position: "relative", overflow: "hidden" }}>
        <div aria-hidden style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, #A78BFA 0%, transparent 65%)", filter: "blur(120px)", opacity: 0.12, left: "60%", top: "20%", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, border: "1px solid var(--line-strong)", background: "rgba(167,139,250,0.08)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500, color: "var(--violet-2)", fontFamily: "var(--font-mono)" }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--violet-2)", boxShadow: "0 0 10px var(--violet-2)", animation: "pulseGlow 1.8s ease-in-out infinite" }} />
                Proceso
              </div>
            </div>
            <h2 style={{ fontSize: "clamp(34px, 4.6vw, 56px)", lineHeight: 1.04, letterSpacing: "-0.035em", margin: "0 0 18px", fontWeight: 500 }}>
              De cero a operando,{" "}
              <span style={{ background: "var(--gradient)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>en 5 minutos.</span>
            </h2>
            <p style={{ fontSize: "clamp(15px, 1.4vw, 18px)", lineHeight: 1.55, color: "var(--fg-dim)", margin: 0, maxWidth: 500, marginLeft: "auto", marginRight: "auto" }}>
              Sin instalaciones. Sin tarjeta. Sin llamadas con vendedores.
            </p>
          </div>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", top: 40, left: "12%", right: "12%", height: 1, background: "linear-gradient(90deg, transparent, var(--line-strong), var(--line-strong), transparent)", zIndex: 0 }} className="process-line" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 30, position: "relative", zIndex: 1 }} className="process-grid">
              {steps.map((s, i) => (
                <div key={i} style={{ textAlign: "left" }}>
                  <div style={{ width: 80, height: 80, borderRadius: 20, background: `linear-gradient(135deg, ${s.color}22, ${s.color}05)`, border: `1px solid ${s.color}44`, display: "grid", placeItems: "center", marginBottom: 24, position: "relative" }}>
                    <span style={{ fontSize: 24, fontWeight: 500, color: s.color, fontFamily: "var(--font-mono)" }}>{s.n}</span>
                    <span style={{ position: "absolute", top: -6, right: -6, width: 26, height: 26, borderRadius: 8, background: "var(--bg)", border: `1px solid ${s.color}44`, display: "grid", placeItems: "center", color: s.color }}>{s.icon}</span>
                  </div>
                  <h3 style={{ fontSize: 22, margin: 0, marginBottom: 10, letterSpacing: "-0.02em", fontWeight: 500 }}>{s.title}</h3>
                  <p style={{ margin: 0, color: "var(--fg-dim)", fontSize: 14.5, lineHeight: 1.55, maxWidth: 320 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section style={{ padding: "60px 0 80px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, border: "1px solid var(--line-strong)", background: "rgba(167,139,250,0.08)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500, color: "var(--violet-2)", fontFamily: "var(--font-mono)" }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--violet-2)", boxShadow: "0 0 10px var(--violet-2)", animation: "pulseGlow 1.8s ease-in-out infinite" }} />
                Industrias
              </div>
            </div>
            <h2 style={{ fontSize: "clamp(34px, 4.6vw, 56px)", lineHeight: 1.04, letterSpacing: "-0.035em", margin: 0, fontWeight: 500 }}>Para tu tipo de negocio</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16 }} className="industry-grid">
            {industries.map((ind, i) => (
              <div key={i} style={{ padding: "24px 16px", borderRadius: 16, border: "1px solid var(--line)", background: "rgba(20,15,30,0.02)", textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${ind.color}22`, border: `1px solid ${ind.color}44`, display: "grid", placeItems: "center", color: ind.color, margin: "0 auto 12px" }}>{ind.icon}</div>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{ind.label}</div>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @media (max-width: 880px) { .industry-grid { grid-template-columns: repeat(3, 1fr) !important; } }
          @media (max-width: 560px) { .industry-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        `}</style>
      </section>

      {/* Before / After */}
      <section style={{ padding: "80px 0 120px", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontSize: "clamp(34px, 4.6vw, 56px)", lineHeight: 1.04, letterSpacing: "-0.035em", margin: 0, fontWeight: 500 }}>
              Tu negocio, antes y después{" "}
              <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}>de Zyncra.</span>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 1fr", gap: 0, alignItems: "stretch" }} className="ba-grid">
            <div style={{ padding: 32, background: "rgba(255,255,255,0.02)", border: "1px solid var(--line)", borderRadius: 20, height: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, opacity: 0.7 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(20,15,30,0.04)", border: "1px solid var(--line)", display: "grid", placeItems: "center", color: "var(--fg-mute)" }}><IconX size={18} /></div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 500 }}>Sin Zyncra</div>
                  <div style={{ fontSize: 12, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>EL CAOS DE SIEMPRE</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {beforeItems.map((t, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", color: "var(--fg-mute)", fontSize: 14, lineHeight: 1.4 }}>
                    <IconX size={15} style={{ color: "var(--fg-mute)", flexShrink: 0, marginTop: 3 }} />
                    <span style={{ textDecoration: "line-through", textDecorationColor: "rgba(0,0,0,0.15)" }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", placeItems: "center" }} className="ba-divider">
              <div style={{ width: 50, height: 50, borderRadius: 999, background: "linear-gradient(135deg, #A78BFA, #EC4899)", display: "grid", placeItems: "center", boxShadow: "0 0 40px rgba(167,139,250,0.6)", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 12, color: "white" }}>VS</div>
            </div>
            <div style={{ padding: 32, background: "linear-gradient(180deg, rgba(167,139,250,0.08) 0%, rgba(236,72,153,0.03) 100%)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 20, height: "100%", boxShadow: "0 0 80px -30px rgba(167,139,250,0.5)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #A78BFA, #EC4899)", display: "grid", placeItems: "center", color: "white", boxShadow: "0 0 20px rgba(167,139,250,0.5)" }}><IconSparkle size={18} /></div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 500 }}>Con Zyncra</div>
                  <div style={{ fontSize: 12, color: "var(--violet-2)", fontFamily: "var(--font-mono)" }}>TU NEGOCIO EN AUTOPILOT</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {afterItems.map((t, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", color: "var(--fg)", fontSize: 14, lineHeight: 1.4 }}>
                    <IconCheck size={15} style={{ color: "var(--green)", flexShrink: 0, marginTop: 3 }} />
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "0 0 120px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px" }}>
          <div style={{ position: "relative", padding: "80px 60px", borderRadius: 28, background: "linear-gradient(135deg, rgba(167,139,250,0.18) 0%, rgba(236,72,153,0.12) 50%, rgba(251,146,60,0.08) 100%)", border: "1px solid rgba(167,139,250,0.3)", overflow: "hidden", textAlign: "center" }} className="cta-wrap">
            <div aria-hidden style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, #A78BFA 0%, transparent 65%)", filter: "blur(80px)", opacity: 0.4, left: "-10%", top: "-30%", pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <h2 style={{ fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1.02, letterSpacing: "-0.04em", fontWeight: 500, margin: "0 0 18px" }}>Empieza hoy, gratis.</h2>
              <p style={{ fontSize: 17, color: "var(--fg-dim)", margin: "0 auto 32px", maxWidth: 480, lineHeight: 1.55 }}>14 días con todas las funciones. Sin tarjeta, sin compromisos.</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 16, padding: "14px 22px", borderRadius: 14, background: "linear-gradient(135deg, #A78BFA 0%, #EC4899 60%, #FB923C 100%)", color: "white", fontFamily: "var(--font-sans)", fontWeight: 500, boxShadow: "0 8px 30px -10px rgba(167,139,250,0.55)", textDecoration: "none" }}>
                  Empezar gratis <IconArrow size={16} />
                </Link>
                <Link href="/pricing" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 16, padding: "14px 22px", borderRadius: 14, background: "rgba(20,15,30,0.06)", color: "var(--fg)", border: "1px solid var(--line-strong)", fontFamily: "var(--font-sans)", fontWeight: 500, textDecoration: "none" }}>
                  Ver precios
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
