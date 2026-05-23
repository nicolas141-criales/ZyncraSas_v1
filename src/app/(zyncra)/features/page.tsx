import Link from "next/link";
import ZyncraNav from "../ZyncraNav";
import ZyncraFooter from "../ZyncraFooter";
import ZyncraReveal from "../ZyncraReveal";

export default function FeaturesPage() {
  return (
    <div className="zyncra">
      <ZyncraReveal />
      <ZyncraNav active="funciones" />

      {/* ── PAGE HERO ── */}
      <div className="z-page-hero">
        <div className="z-page-hero-blob" />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="z-label z-fadein" style={{ justifyContent: "center" }}>Funcionalidades</div>
          <h1 className="z-section-title z-fadeup z-d1" style={{ fontSize: "clamp(36px,5vw,58px)" }}>
            Todo para hacer crecer<br />tu negocio
          </h1>
          <p className="z-section-sub z-fadeup z-d2" style={{ maxWidth: 520, margin: "0 auto" }}>
            Cada función fue diseñada para negocios de servicios que gestionan citas: spas, salones, clínicas, estudios y más.
          </p>
        </div>
      </div>

      {/* ── AGENDA ── */}
      <section style={{ background: "white" }}>
        <div className="z-feat-full-grid">
          <div className="z-reveal-l">
            <div className="z-label">Agenda & Recordatorios</div>
            <h2 className="z-section-title">Reservas automáticas,<br />cero no-shows</h2>
            <p className="z-section-sub">Tus clientes agendan 24/7. Confirmaciones y recordatorios automáticos reducen los no-shows hasta un 60%.</p>
            <div className="z-feat-list">
              <div className="z-feat-li">
                <div className="z-feat-li-icon">📅</div>
                <div><div className="z-feat-li-title">Agenda online 24/7</div><div className="z-feat-li-desc">Los clientes reservan en cualquier momento, desde cualquier dispositivo.</div></div>
              </div>
              <div className="z-feat-li">
                <div className="z-feat-li-icon">🔔</div>
                <div><div className="z-feat-li-title">Recordatorios automáticos</div><div className="z-feat-li-desc">WA e email 24h y 1h antes. El cliente puede confirmar o reprogramar.</div></div>
              </div>
              <div className="z-feat-li">
                <div className="z-feat-li-icon">🔄</div>
                <div><div className="z-feat-li-title">Reprogramación fácil</div><div className="z-feat-li-desc">Con un mensaje, el cliente reagenda sin que tengas que intervenir.</div></div>
              </div>
            </div>
            <div style={{ marginTop: 32 }}><Link href="/pricing" className="z-btn-xl">Activar agenda →</Link></div>
          </div>
          <div className="z-reveal-r">
            <div className="z-feat-visual-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Agenda · Hoy</span>
                <span style={{ fontSize: 11, background: "var(--z-cream-2)", padding: "3px 10px", borderRadius: 20, fontWeight: 600, color: "var(--z-ink-3)" }}>Lunes 19 Jun</span>
              </div>
              <div className="z-slot2-row"><span className="z-slot2-time">9:00</span><div className="z-slot2 z-slot2-red">Corte + Barba — Juan García</div></div>
              <div className="z-slot2-row"><span className="z-slot2-time">10:30</span><div className="z-slot2 z-slot2-purple">Degradado — Miguel Ríos</div></div>
              <div className="z-slot2-row"><span className="z-slot2-time">12:00</span><div className="z-slot2 z-slot2-blue">Pack Premium — Andrés Polo</div></div>
              <div className="z-slot2-row"><span className="z-slot2-time">14:00</span><div className="z-slot2 z-slot2-gray">Disponible</div></div>
              <div style={{ marginTop: 16, padding: 12, background: "rgba(37,211,102,.08)", border: "1px solid rgba(37,211,102,.2)", borderRadius: 10, fontSize: 12, color: "#1a9e55", fontWeight: 600 }}>
                ✅ Recordatorio enviado a Juan García · hace 2 min
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="z-section-sep" />

      {/* ── WHATSAPP ── */}
      <section style={{ background: "var(--z-cream-2)" }}>
        <div className="z-feat-full-grid" style={{ direction: "rtl" }}>
          <div className="z-reveal-l" style={{ direction: "ltr" }}>
            <div className="z-chat-phone">
              <div className="z-chat-top">
                <div className="z-chat-av">✂️</div>
                <div>
                  <div className="z-chat-name">Zyncra Bot · Tu Barbería</div>
                  <div className="z-chat-online">● En línea — responde al instante</div>
                </div>
              </div>
              <div className="z-chat-body">
                <div className="z-msg z-msg-in">Hola! Quiero reservar un corte para mañana 🙋</div>
                <div className="z-msg z-msg-out">¡Hola Juan! Tengo disponibilidad mañana a las 3:00pm con Diego ✂️ ¿Te confirmo?</div>
                <div className="z-msg z-msg-in">Sí, confirmo!</div>
                <div className="z-msg-confirmed">✅ Reserva confirmada · Juan · 3:00pm con Diego</div>
                <div className="z-msg z-msg-out">¡Listo! Te recordamos mañana. 💈</div>
              </div>
            </div>
          </div>
          <div className="z-reveal-r" style={{ direction: "ltr" }}>
            <div className="z-label">WhatsApp & Marketing</div>
            <h2 className="z-section-title">Tu negocio activo 24/7<br />por WhatsApp</h2>
            <p className="z-section-sub">Reservas automáticas, recordatorios y campañas de marketing desde tu número, sin importar el tipo de servicio que ofrezcas.</p>
            <div className="z-feat-list">
              <div className="z-feat-li">
                <div className="z-feat-li-icon">📲</div>
                <div><div className="z-feat-li-title">Reservas conversacionales</div><div className="z-feat-li-desc">El cliente agenda chateando, sin descargar nada.</div></div>
              </div>
              <div className="z-feat-li">
                <div className="z-feat-li-icon">📣</div>
                <div><div className="z-feat-li-title">Campañas segmentadas</div><div className="z-feat-li-desc">Envía promos por cumpleaños, clientes inactivos o tipo de servicio.</div></div>
              </div>
              <div className="z-feat-li">
                <div className="z-feat-li-icon">⭐</div>
                <div><div className="z-feat-li-title">Solicitud de reseñas Google</div><div className="z-feat-li-desc">Pide reseñas automáticamente después de cada visita exitosa.</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="z-section-sep" />

      {/* ── POS ── */}
      <section style={{ background: "white" }}>
        <div className="z-feat-full-grid">
          <div className="z-reveal-l">
            <div className="z-label">POS & Caja</div>
            <h2 className="z-section-title">Cobra más rápido,<br />controla todo</h2>
            <p className="z-section-sub">Sistema POS integrado con tu agenda. Al finalizar la cita, el cobro ya está listo. Factura DIAN con un clic.</p>
            <div className="z-feat-list">
              <div className="z-feat-li">
                <div className="z-feat-li-icon">🧾</div>
                <div><div className="z-feat-li-title">Factura electrónica DIAN</div><div className="z-feat-li-desc">Genera y envía facturas al cerrar cada venta. CUFE automático.</div></div>
              </div>
              <div className="z-feat-li">
                <div className="z-feat-li-icon">📊</div>
                <div><div className="z-feat-li-title">Cierre de caja diario</div><div className="z-feat-li-desc">Reportes por día, por colaborador o por servicio en tiempo real.</div></div>
              </div>
              <div className="z-feat-li">
                <div className="z-feat-li-icon">💼</div>
                <div><div className="z-feat-li-title">Comisiones automáticas</div><div className="z-feat-li-desc">Liquida comisiones de tu equipo según los servicios cobrados.</div></div>
              </div>
            </div>
            <div style={{ marginTop: 32 }}><Link href="/pricing" className="z-btn-xl">Activar POS →</Link></div>
          </div>
          <div className="z-reveal-r">
            <div className="z-feat-visual-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>💳 Cobro en caja</span>
                <span style={{ fontSize: 11, color: "#1a9e55", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 6, height: 6, background: "#1a9e55", borderRadius: "50%", display: "inline-block" }} />En vivo
                </span>
              </div>
              <div className="z-pos-item"><span>✂️ Corte degradado</span><span style={{ fontWeight: 700 }}>$35.000</span></div>
              <div className="z-pos-item"><span>🪒 Afeitado clásico</span><span style={{ fontWeight: 700 }}>$25.000</span></div>
              <div className="z-pos-item"><span>💆 Tratamiento capilar</span><span style={{ fontWeight: 700 }}>$18.000</span></div>
              <hr style={{ border: "none", borderTop: "1px solid var(--z-border)", margin: "12px 0" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                <span style={{ color: "var(--z-ink-3)" }}>Total</span>
                <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.5px" }}>$78.000</span>
              </div>
              <button className="z-pos-pay">💳 Cobrar ahora</button>
              <div className="z-pos-methods">
                <div className="z-method">💵 Efectivo</div>
                <div className="z-method">💳 Tarjeta</div>
                <div className="z-method">📱 Nequi</div>
                <div className="z-method">🏦 Daviplata</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <div className="z-cta-banner z-reveal">
        <h2 className="z-cta-title">Una sola plataforma<br />para todo tu equipo</h2>
        <p className="z-cta-sub">Empieza gratis, sin tarjeta de crédito.</p>
        <div className="z-cta-actions">
          <Link href="/pricing" className="z-btn-white">Ver planes →</Link>
        </div>
      </div>

      <ZyncraFooter />
    </div>
  );
}
