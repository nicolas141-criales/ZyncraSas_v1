import Link from "next/link";

const Icon = ({ children, size = 20, style = {}, strokeWidth = 1.6 }: {
  children: React.ReactNode; size?: number; style?: React.CSSProperties; strokeWidth?: number;
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {children}
  </svg>
);

const IconStar = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.8 6.6 19.5l1.2-6L3.3 9.3l6.1-.7L12 3z" /></Icon>;
const IconArrow = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M5 12h14M13 5l7 7-7 7" /></Icon>;
const IconScissors = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M20 4L8.5 15.5M20 20L8.5 8.5M14 12l6 0" /></Icon>;
const IconBrush = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M16 3l5 5-11 11H5v-5L16 3z" /><path d="M14 5l5 5M5 19l-2 2" /></Icon>;
const IconUsers = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.6" /><path d="M16 14.2c2.8.5 5 2.8 5 5.8" /></Icon>;
const IconReceipt = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3z" /><path d="M9 8h6M9 12h6M9 16h4" /></Icon>;
const IconHand = (p: { size?: number; style?: React.CSSProperties }) => <Icon {...p}><path d="M8 11V5a1.5 1.5 0 0 1 3 0v6M11 9V4a1.5 1.5 0 0 1 3 0v7M14 9V5a1.5 1.5 0 0 1 3 0v9c0 3.5-2 7-6 7-3 0-5-2-6-4l-3-5c-.5-1 .5-2 1.5-1.5L8 13" /></Icon>;

const testimonials = [
  { quote: "Los no-shows bajaron 70% desde que activamos los recordatorios. Nunca pensé que algo así pudiera impactar tanto en mis ingresos.", name: "Alejandro Ruiz", biz: "Black Fade Barbershop", city: "Bogotá", icon: <IconScissors size={18} />, color: "#A78BFA", metric: "+70% asistencia" },
  { quote: "Las campañas de WhatsApp me trajeron clientes inactivos de vuelta. Recuperé 12 clientes que no venían hace 3 meses.", name: "María Torres", biz: "Estudio Hair", city: "Bucaramanga", icon: <IconBrush size={18} />, color: "#EC4899", metric: "12 clientes recuperados" },
  { quote: "Las reseñas en Google subieron de 4.1 a 4.8 en dos meses. Ahora aparecemos primero en búsquedas locales.", name: "Diana Vásquez", biz: "Studio V", city: "Manizales", icon: <IconStar size={18} />, color: "#FBBF24", metric: "4.1 → 4.8 ★" },
  { quote: "Liquidar comisiones era un dolor de cabeza con Excel. Ahora se calcula solo y mi equipo confía 100% en los números.", name: "Camilo Mejía", biz: "Barbería The Cut", city: "Medellín", icon: <IconUsers size={18} />, color: "#22D3EE", metric: "4 horas/semana ahorradas" },
  { quote: "Facturar DIAN con CUFE solía tomarme dos horas al día. Ahora es 1 clic. Literal.", name: "Valentina Gómez", biz: "Spa Aurora", city: "Cali", icon: <IconReceipt size={18} />, color: "#34D399", metric: "2h/día ahorradas" },
  { quote: "El POS es tan sencillo que mi mamá lo usa. Y eso lo cambia todo cuando estoy ocupada con clientes.", name: "Sofía Restrepo", biz: "Nails by Sofi", city: "Pereira", icon: <IconHand size={18} />, color: "#FB923C", metric: "Onboarding: 8 min" },
];

export default function ReviewsPage() {
  return (
    <>
      {/* Page Hero */}
      <section style={{ position: "relative", paddingTop: 150, paddingBottom: 60, overflow: "hidden", textAlign: "center" }}>
        <div aria-hidden style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, #FBBF24 0%, transparent 65%)", filter: "blur(120px)", opacity: 0.22, left: "-10%", top: "-30%", pointerEvents: "none" }} />
        <div aria-hidden style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, #A78BFA 0%, transparent 65%)", filter: "blur(120px)", opacity: 0.18, left: "75%", top: "-10%", pointerEvents: "none" }} />
        <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(20,15,30,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(20,15,30,0.04) 1px, transparent 1px)", backgroundSize: "64px 64px", maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)", WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)", pointerEvents: "none", opacity: 0.5 } as React.CSSProperties} />
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 28px", position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 999, border: "1px solid var(--line-strong)", background: "rgba(167,139,250,0.08)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500, color: "var(--violet-2)", fontFamily: "var(--font-mono)" }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--violet-2)", boxShadow: "0 0 10px var(--violet-2)", animation: "pulseGlow 1.8s ease-in-out infinite" }} />
              Reseñas verificadas
            </div>
          </div>
          <h1 style={{ fontSize: "clamp(42px, 6.4vw, 88px)", lineHeight: 0.96, letterSpacing: "-0.045em", fontWeight: 500, margin: 0, marginBottom: 22, textWrap: "balance" }}>
            Negocios reales.{" "}
            <span style={{ background: "var(--gradient)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Resultados reales.</span>
          </h1>
          <p style={{ fontSize: "clamp(15px, 1.3vw, 18px)", lineHeight: 1.55, color: "var(--fg-dim)", margin: "0 auto", maxWidth: 600 }}>
            Más de 500 negocios en Colombia confían en Zyncra. Estos son algunos de los que nos cuentan su historia.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: "40px 0 80px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, background: "linear-gradient(180deg, rgba(20,15,30,0.025) 0%, rgba(20,15,30,0.005) 100%)", border: "1px solid var(--line)", borderRadius: 22, overflow: "hidden" }} className="stats-grid">
            {[
              { val: "500+", label: "Negocios activos", sub: "En 24 ciudades" },
              { val: "1M+", label: "Citas gestionadas", sub: "Y subiendo" },
              { val: "4.9★", label: "Valoración promedio", sub: "548 reseñas" },
              { val: "−60%", label: "Reducción no-shows", sub: "En 90 días" },
            ].map((s, i) => (
              <div key={i} style={{ padding: "32px 28px", borderRight: i < 3 ? "1px solid var(--line)" : "none" }} className="stats-cell">
                <div style={{ fontSize: "clamp(34px, 4vw, 52px)", fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 10, fontFamily: "var(--font-mono)" }}>{s.val}</div>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--fg)", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: "var(--fg-mute)" }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section style={{ padding: "0 0 120px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="tm-grid">
            {testimonials.map((t, i) => (
              <div key={i} style={{ padding: 24, background: "linear-gradient(180deg, rgba(20,15,30,0.04) 0%, rgba(20,15,30,0.015) 100%)", border: "1px solid var(--line)", borderRadius: 20, backdropFilter: "blur(10px)", height: "100%", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
                  {Array.from({ length: 5 }).map((_, k) => (
                    <IconStar key={k} size={13} style={{ color: "var(--amber)", fill: "var(--amber)" } as React.CSSProperties} />
                  ))}
                </div>
                <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "var(--fg)", flex: 1, margin: 0, marginBottom: 18 }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div style={{ padding: "8px 12px", border: `1px solid ${t.color}44`, background: `${t.color}11`, borderRadius: 999, fontSize: 12, color: t.color, alignSelf: "flex-start", marginBottom: 18, fontFamily: "var(--font-mono)", fontWeight: 500 }}>
                  ↗ {t.metric}
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", paddingTop: 14, borderTop: "1px solid var(--line)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${t.color}33, ${t.color}11)`, border: `1px solid ${t.color}33`, display: "grid", placeItems: "center", color: t.color }}>
                    {t.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "var(--fg-mute)" }}>{t.biz} · {t.city}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "0 0 120px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 28px" }}>
          <div style={{ position: "relative", padding: "80px 60px", borderRadius: 28, background: "linear-gradient(135deg, rgba(167,139,250,0.18) 0%, rgba(236,72,153,0.12) 50%, rgba(251,146,60,0.08) 100%)", border: "1px solid rgba(167,139,250,0.3)", overflow: "hidden", textAlign: "center" }} className="cta-wrap">
            <div aria-hidden style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, #A78BFA 0%, transparent 65%)", filter: "blur(80px)", opacity: 0.4, left: "-10%", top: "-30%", pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <h2 style={{ fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1.02, letterSpacing: "-0.04em", fontWeight: 500, margin: "0 0 18px" }}>
                Únete a los que ya crecen con Zyncra.
              </h2>
              <p style={{ fontSize: 17, color: "var(--fg-dim)", margin: "0 auto 32px", maxWidth: 480, lineHeight: 1.55 }}>
                14 días gratis. Sin tarjeta. Sin compromisos.
              </p>
              <Link href="/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 16, padding: "14px 22px", borderRadius: 14, background: "linear-gradient(135deg, #A78BFA 0%, #EC4899 60%, #FB923C 100%)", color: "white", fontFamily: "var(--font-sans)", fontWeight: 500, boxShadow: "0 8px 30px -10px rgba(167,139,250,0.55)", textDecoration: "none" }}>
                Empezar gratis <IconArrow size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
