"use client";

import { Fragment, useEffect, useState } from "react";
import {
  IconCalendar,
  IconCard,
  IconCheck,
  IconShield,
  IconWhatsapp,
} from "./icons";
import {
  Container,
  Counter,
  GradientOrb,
  SectionTitle,
} from "./primitives";

// ============ DEMO 1: Live Agenda ============
type Appt = {
  id: number;
  time: string;
  dur: number;
  service: string;
  client: string;
  stylist: string;
  color: string;
};

const DemoAgenda = () => {
  const [appointments, setAppointments] = useState<Appt[]>([
    { id: 1, time: "09:00", dur: 45, service: "Corte + Barba", client: "Juan García", stylist: "Carlos", color: "#fb0f05" },
    { id: 2, time: "10:30", dur: 30, service: "Degradado", client: "Miguel Ríos", stylist: "Carlos", color: "#0027fe" },
    { id: 3, time: "13:30", dur: 60, service: "Pack Premium", client: "Andrés Polo", stylist: "Diana", color: "#FB923C" },
    { id: 4, time: "15:00", dur: 45, service: "Color + Corte", client: "Sara López", stylist: "Diana", color: "#22D3EE" },
  ]);
  const [pulseId, setPulseId] = useState<number | null>(null);
  const [bookingFlash, setBookingFlash] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setBookingFlash(true);
      const flashTimer = setTimeout(() => setBookingFlash(false), 2200);
      const newAppt: Appt = {
        id: Date.now(),
        time: ["11:30", "14:15", "16:30", "17:00"][Math.floor(Math.random() * 4)],
        dur: [30, 45, 60][Math.floor(Math.random() * 3)],
        service: ["Manicure", "Corte clásico", "Spa facial", "Tinte"][Math.floor(Math.random() * 4)],
        client: ["Laura M.", "Pedro V.", "Carmen R.", "Daniela T."][Math.floor(Math.random() * 4)],
        stylist: ["Carlos", "Diana"][Math.floor(Math.random() * 2)],
        color: ["#fb0f05", "#0027fe", "#FB923C", "#22D3EE"][Math.floor(Math.random() * 4)],
      };
      setPulseId(newAppt.id);
      setAppointments((prev) =>
        [...prev, newAppt].sort((a, b) => a.time.localeCompare(b.time)).slice(-6),
      );
      const pulseTimer = setTimeout(() => setPulseId(null), 2500);
      return () => {
        clearTimeout(flashTimer);
        clearTimeout(pulseTimer);
      };
    }, 8000);
    return () => clearInterval(id);
  }, []);

  const hours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

  return (
    <div
      style={{
        padding: 24,
        display: "grid",
        gridTemplateColumns: "1fr 220px",
        gap: 20,
        height: "100%",
      }}
      className="demo-agenda-grid"
    >
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.02em" }}>Lunes, 19 de Mayo</div>
            <div style={{ fontSize: 12, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>
              {appointments.length} citas · 2 profesionales
            </div>
          </div>
          {bookingFlash && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(52,211,153,0.12)",
                border: "1px solid rgba(52,211,153,0.3)",
                color: "var(--green)",
                padding: "6px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                animation: "fadeUp .4s ease",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: "var(--green)",
                  animation: "pulseGlow 1s infinite",
                }}
              />
              Nueva reserva · WhatsApp
            </div>
          )}
        </div>

        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "50px 1fr 1fr",
            gap: 0,
            fontSize: 12,
          }}
        >
          <div></div>
          <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--line)", color: "var(--fg-dim)", fontWeight: 500 }}>Carlos</div>
          <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--line)", color: "var(--fg-dim)", fontWeight: 500 }}>Diana</div>

          {hours.map((h) => (
            <Fragment key={h}>
              <div
                className="mono"
                style={{
                  padding: "6px 8px",
                  color: "var(--fg-mute)",
                  fontSize: 11,
                  borderTop: "1px solid var(--line)",
                  height: 52,
                }}
              >
                {h}
              </div>
              {(["Carlos", "Diana"] as const).map((stylist) => (
                <div
                  key={stylist + h}
                  style={{
                    borderTop: "1px solid var(--line)",
                    borderLeft: "1px solid var(--line)",
                    height: 52,
                    position: "relative",
                  }}
                >
                  {appointments
                    .filter((a) => a.stylist === stylist && a.time.startsWith(h.split(":")[0]))
                    .map((a) => {
                      const minOffset = parseInt(a.time.split(":")[1] || "0");
                      const top = (minOffset / 60) * 52;
                      const height = (a.dur / 60) * 52 - 2;
                      return (
                        <div
                          key={a.id}
                          style={{
                            position: "absolute",
                            top,
                            left: 4,
                            right: 4,
                            height,
                            background: `linear-gradient(135deg, ${a.color}22 0%, ${a.color}11 100%)`,
                            border: `1px solid ${a.color}55`,
                            borderLeft: `3px solid ${a.color}`,
                            borderRadius: 6,
                            padding: "4px 8px",
                            fontSize: 11.5,
                            animation: pulseId === a.id ? "fadeUp .5s ease" : "none",
                            boxShadow: pulseId === a.id ? `0 0 30px ${a.color}66` : "none",
                            transition: "box-shadow .8s ease",
                            overflow: "hidden",
                          }}
                        >
                          <div style={{ fontWeight: 500, color: "var(--fg)" }}>{a.service}</div>
                          <div style={{ fontSize: 10.5, color: "var(--fg-dim)" }}>{a.client}</div>
                        </div>
                      );
                    })}
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }} className="demo-agenda-side">
        <div style={{ padding: 14, background: "rgba(20,15,30,0.025)", borderRadius: 12, border: "1px solid var(--line)" }}>
          <div style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Hoy</div>
          <div className="mono" style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.02em" }}>
            <Counter to={appointments.length} duration={800} />
          </div>
          <div style={{ fontSize: 11.5, color: "var(--fg-dim)" }}>citas agendadas</div>
        </div>
        <div style={{ padding: 14, background: "linear-gradient(135deg, rgba(251,15,5,0.08), rgba(0,39,254,0.04))", borderRadius: 12, border: "1px solid rgba(0,39,254,0.3)" }}>
          <div style={{ fontSize: 11, color: "var(--violet-2)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Ingresos</div>
          <div className="mono" style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em" }}>
            $<Counter to={840} duration={1400} />K
          </div>
          <div style={{ fontSize: 11.5, color: "var(--green)" }}>↑ +22% vs ayer</div>
        </div>
        <div style={{ padding: 14, background: "rgba(20,15,30,0.025)", borderRadius: 12, border: "1px solid var(--line)" }}>
          <div style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>No-shows</div>
          <div className="mono" style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--green)" }}>−60%</div>
          <div style={{ fontSize: 11.5, color: "var(--fg-dim)" }}>con recordatorios</div>
        </div>
      </div>
    </div>
  );
};

// ============ DEMO 2: WhatsApp ============
type WaMsg = { from: "bot" | "user"; text: string; t: string; actions?: string[] };

const DemoWhatsapp = () => {
  const conversation: WaMsg[] = [
    { from: "bot", text: "Hola Camila 👋 Te recuerdo que tu cita es mañana a las 10:30 con Diana.", t: "09:30" },
    { from: "bot", text: "¿Confirmas o necesitas reprogramar?", t: "09:30", actions: ["Confirmar ✓", "Reprogramar"] },
    { from: "user", text: "Confirmar ✓", t: "09:31" },
    { from: "bot", text: "¡Listo! Te esperamos. Si quieres llegar 5 min antes, te ofrecemos un té de cortesía 🍵", t: "09:31" },
    { from: "user", text: "Gracias!", t: "09:32" },
    { from: "bot", text: "Después de tu cita, ¿nos ayudas con una reseña en Google? Te enviamos el link automáticamente ⭐", t: "12:15" },
  ];
  const [visible, setVisible] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const advance = (i: number) => {
      if (i >= conversation.length) {
        timeouts.push(setTimeout(() => {
          setVisible(0);
          advance(0);
        }, 5000));
        return;
      }
      const msg = conversation[i];
      if (msg.from === "bot") {
        setTyping(true);
        timeouts.push(setTimeout(() => {
          setTyping(false);
          setVisible((v) => v + 1);
          timeouts.push(setTimeout(() => advance(i + 1), 1200));
        }, 1100));
      } else {
        setVisible((v) => v + 1);
        timeouts.push(setTimeout(() => advance(i + 1), 1400));
      }
    };
    advance(0);
    return () => timeouts.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        padding: 24,
        display: "grid",
        gridTemplateColumns: "1.2fr 1fr",
        gap: 24,
        height: "100%",
      }}
      className="demo-wa-grid"
    >
      <div
        style={{
          background: "var(--wa-panel-bg)",
          border: "1px solid rgba(52,211,153,0.2)",
          borderRadius: 20,
          padding: 16,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 30px 60px -20px rgba(20,15,30,0.10)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, borderBottom: "1px solid rgba(20,15,30,0.06)" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #25D366, #128C7E)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <IconWhatsapp size={18} style={{ color: "white" }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--fg)" }}>Studio V · Manizales</div>
            <div style={{ fontSize: 11, color: "var(--wa-online)" }}>● en línea — Zyncra Bot</div>
          </div>
        </div>

        <div style={{ flex: 1, padding: "12px 4px", display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" }}>
          {conversation.slice(0, visible).map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.from === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                animation: "fadeUp .35s ease",
              }}
            >
              <div
                style={{
                  background:
                    m.from === "user"
                      ? "linear-gradient(135deg, #15A85A, #0E7A40)"
                      : "var(--wa-bubble-in)",
                  color: m.from === "user" ? "white" : "var(--wa-text-in)",
                  padding: "9px 12px",
                  borderRadius: m.from === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  fontSize: 13,
                  lineHeight: 1.4,
                }}
              >
                {m.text}
              </div>
              {m.actions && (
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  {m.actions.map((a) => (
                    <span
                      key={a}
                      style={{
                        padding: "5px 10px",
                        background: "rgba(37,211,102,0.12)",
                        border: "1px solid rgba(37,211,102,0.3)",
                        color: "var(--wa-online)",
                        borderRadius: 999,
                        fontSize: 11,
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {a}
                    </span>
                  ))}
                </div>
              )}
              <div
                className="mono"
                style={{
                  fontSize: 9.5,
                  color: "var(--fg-mute)",
                  marginTop: 3,
                  textAlign: m.from === "user" ? "right" : "left",
                }}
              >
                {m.t} {m.from === "user" && "✓✓"}
              </div>
            </div>
          ))}
          {typing && (
            <div
              style={{
                alignSelf: "flex-start",
                background: "var(--wa-bubble-in)",
                padding: "10px 12px",
                borderRadius: "14px 14px 14px 4px",
                display: "flex",
                gap: 4,
              }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 999,
                    background: "var(--fg-dim)",
                    animation: `pulseGlow 1s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Campaña actual</div>
          <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.02em" }}>Reactivación · Clientes inactivos +60d</div>
        </div>
        <div
          style={{
            padding: 16,
            background: "linear-gradient(135deg, rgba(52,211,153,0.08), transparent)",
            border: "1px solid rgba(52,211,153,0.25)",
            borderRadius: 14,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: "var(--fg-dim)" }}>Enviados</span>
            <span className="mono" style={{ fontSize: 12 }}>
              <Counter to={342} duration={1400} />
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "var(--fg-dim)" }}>Leídos</span>
            <span className="mono" style={{ fontSize: 12, color: "var(--green)" }}>
              <Counter to={318} duration={1500} /> · 93%
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: "rgba(20,15,30,0.05)", overflow: "hidden", marginBottom: 14 }}>
            <div style={{ width: "93%", height: "100%", background: "linear-gradient(90deg, var(--green), #6EE7B7)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "var(--fg-dim)" }}>Citas reservadas</span>
            <span className="mono" style={{ fontSize: 18, fontWeight: 500, color: "var(--green)" }}>
              +<Counter to={47} duration={1700} />
            </span>
          </div>
        </div>
        <div style={{ padding: 14, background: "rgba(20,15,30,0.025)", border: "1px solid var(--line)", borderRadius: 12 }}>
          <div style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)", marginBottom: 6 }}>ROI estimado</div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em" }}>
            $<Counter to={2.8} duration={1600} decimals={1} />M
          </div>
          <div style={{ fontSize: 11.5, color: "var(--fg-dim)" }}>en clientes recuperados</div>
        </div>
      </div>
    </div>
  );
};

// ============ DEMO 3: POS ============
type Service = { name: string; price: number; c: string };

const DemoPos = () => {
  const services: Service[] = [
    { name: "Corte clásico", price: 25000, c: "#fb0f05" },
    { name: "Corte + Barba", price: 35000, c: "#0027fe" },
    { name: "Degradado", price: 30000, c: "#FB923C" },
    { name: "Color", price: 60000, c: "#22D3EE" },
    { name: "Manicure", price: 28000, c: "#34D399" },
    { name: "Pack premium", price: 85000, c: "#FBBF24" },
  ];
  const [cart, setCart] = useState<Service[]>([]);
  const [paid, setPaid] = useState(false);
  const [method, setMethod] = useState("Nequi");

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const loop = () => {
      setCart([]);
      setPaid(false);
      timeouts.push(setTimeout(() => setCart((c) => [...c, services[1]]), 1200));
      timeouts.push(setTimeout(() => setCart((c) => [...c, services[3]]), 2600));
      timeouts.push(setTimeout(() => setCart((c) => [...c, services[4]]), 4000));
      timeouts.push(
        setTimeout(() => {
          setMethod("Nequi");
          setPaid(true);
        }, 5800),
      );
      timeouts.push(setTimeout(loop, 11000));
    };
    loop();
    return () => timeouts.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = cart.reduce((s, x) => s + x.price, 0);

  return (
    <div
      style={{
        padding: 24,
        display: "grid",
        gridTemplateColumns: "1.2fr 1fr",
        gap: 20,
        height: "100%",
      }}
      className="demo-pos-grid"
    >
      <div>
        <div
          style={{
            fontSize: 11,
            color: "var(--fg-mute)",
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 12,
          }}
        >
          Servicios
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {services.map((s, i) => {
            const inCart = cart.includes(s);
            return (
              <div
                key={i}
                style={{
                  padding: "14px 12px",
                  borderRadius: 12,
                  border: `1px solid ${inCart ? s.c + "88" : "var(--line)"}`,
                  background: inCart
                    ? `linear-gradient(135deg, ${s.c}22, ${s.c}05)`
                    : "rgba(255,255,255,0.025)",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all .35s ease",
                  transform: inCart ? "scale(1.02)" : "scale(1)",
                  boxShadow: inCart ? `0 0 30px ${s.c}44` : "none",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    background: s.c,
                    boxShadow: `0 0 10px ${s.c}`,
                    opacity: inCart ? 1 : 0.4,
                  }}
                />
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{s.name}</div>
                <div className="mono" style={{ fontSize: 14, color: "var(--fg-dim)" }}>
                  ${(s.price / 1000).toFixed(0)}.000
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          background: "linear-gradient(180deg, var(--bg-card) 0%, var(--bg-elev) 100%)",
          border: "1px solid var(--line-strong)",
          borderRadius: 14,
          padding: 18,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <span style={{ fontSize: 12, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>VENTA #2841</span>
          <span
            style={{
              fontSize: 10,
              padding: "3px 9px",
              background: paid ? "rgba(52,211,153,0.15)" : "rgba(251,191,36,0.15)",
              color: paid ? "var(--green)" : "var(--amber)",
              borderRadius: 999,
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
              letterSpacing: "0.06em",
            }}
          >
            {paid ? "✓ PAGADO" : "EN CURSO"}
          </span>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {cart.length === 0 && (
            <div
              style={{
                color: "var(--fg-mute)",
                fontSize: 13,
                padding: "12px 0",
                textAlign: "center",
                fontStyle: "italic",
              }}
            >
              Esperando servicios…
            </div>
          )}
          {cart.map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 0",
                borderBottom: "1px dashed var(--line)",
                animation: "fadeUp .35s ease",
                fontSize: 13,
              }}
            >
              <span>{s.name}</span>
              <span className="mono">${(s.price / 1000).toFixed(0)}.000</span>
            </div>
          ))}
        </div>

        <div style={{ paddingTop: 10, borderTop: "1px solid var(--line)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 6,
              fontSize: 12,
              color: "var(--fg-dim)",
            }}
          >
            <span>Subtotal</span>
            <span className="mono">${(total / 1000).toFixed(0)}.000</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 14,
            }}
          >
            <span style={{ fontSize: 12, color: "var(--fg-mute)" }}>TOTAL</span>
            <span className="mono gradient-text" style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em" }}>
              ${(total / 1000).toFixed(0)}.000
            </span>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {["Nequi", "Daviplata", "Efectivo", "Tarjeta"].map((m) => (
              <span
                key={m}
                style={{
                  fontSize: 11,
                  padding: "5px 9px",
                  borderRadius: 8,
                  border: method === m && paid ? "1px solid var(--violet-2)" : "1px solid var(--line)",
                  background: method === m && paid ? "rgba(0,39,254,0.12)" : "transparent",
                  color: method === m && paid ? "var(--violet-2)" : "var(--fg-dim)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {m}
              </span>
            ))}
          </div>
          {paid && (
            <div
              style={{
                padding: "10px 12px",
                background: "rgba(52,211,153,0.08)",
                border: "1px solid rgba(52,211,153,0.25)",
                borderRadius: 10,
                fontSize: 11.5,
                color: "var(--green)",
                fontFamily: "var(--font-mono)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                animation: "fadeUp .4s ease",
              }}
            >
              <IconCheck size={14} />
              DIAN · CUFE emitido · XML enviado
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============ Wrapper ============
export default function DemosSection() {
  const tabs = [
    { id: "agenda", label: "Agenda en vivo", icon: <IconCalendar size={16} />, sub: "Mira cómo entran citas por WhatsApp en tiempo real", node: <DemoAgenda /> },
    { id: "wa", label: "Marketing WhatsApp", icon: <IconWhatsapp size={16} />, sub: "Bot que confirma, recuerda y reactiva clientes solo", node: <DemoWhatsapp /> },
    { id: "pos", label: "POS + Factura DIAN", icon: <IconCard size={16} />, sub: "Cobra y factura en segundos, sin doble registro", node: <DemoPos /> },
  ];
  const [active, setActive] = useState(0);

  return (
    <section id="demo" style={{ padding: "120px 0", position: "relative", overflow: "hidden" }}>
      <GradientOrb color="#0027fe" size={700} x="-15%" y="40%" opacity={0.16} />
      <GradientOrb color="#fb0f05" size={600} x="80%" y="10%" opacity={0.14} />

      <Container max={1240}>
        <SectionTitle
          eyebrow="Demos en vivo"
          title={
            <>
              El producto funciona, <span className="serif">no solo se ve bonito.</span>
            </>
          }
          sub="Mira cada herramienta en acción. Sin instalar nada, sin registrarte. Solo dale play."
          align="center"
        />

        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <div
            style={{
              display: "inline-flex",
              padding: 6,
              background: "rgba(20,15,30,0.04)",
              border: "1px solid var(--line)",
              borderRadius: 14,
              gap: 4,
            }}
            className="demo-tabs"
          >
            {tabs.map((t, i) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActive(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 16px",
                  background:
                    active === i
                      ? "linear-gradient(135deg, rgba(251,15,5,0.2), rgba(0,39,254,0.15))"
                      : "transparent",
                  border: active === i ? "1px solid var(--line-strong)" : "1px solid transparent",
                  borderRadius: 10,
                  color: active === i ? "var(--fg)" : "var(--fg-dim)",
                  fontSize: 13.5,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  transition: "all .25s ease",
                }}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            position: "relative",
            background: "linear-gradient(180deg, rgba(20,15,30,0.03) 0%, rgba(20,15,30,0.01) 100%)",
            border: "1px solid var(--line-strong)",
            borderRadius: 24,
            minHeight: 560,
            overflow: "hidden",
            boxShadow: "0 40px 80px -30px rgba(20,15,30,0.10), 0 0 100px -40px rgba(0,39,254,0.3)",
          }}
        >
          <div
            style={{
              padding: "10px 16px",
              borderBottom: "1px solid var(--line)",
              display: "flex",
              alignItems: "center",
              gap: 14,
              background: "rgba(20,15,30,0.02)",
            }}
          >
            <div style={{ display: "flex", gap: 6 }}>
              {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
                <span key={c} style={{ width: 10, height: 10, borderRadius: 999, background: c }} />
              ))}
            </div>
            <div
              style={{
                flex: 1,
                background: "rgba(20,15,30,0.04)",
                border: "1px solid var(--line)",
                padding: "4px 12px",
                borderRadius: 8,
                fontSize: 11.5,
                color: "var(--fg-mute)",
                fontFamily: "var(--font-mono)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <IconShield size={11} style={{ color: "var(--green)" }} />
              app.zyncra.com/{tabs[active].id}
            </div>
            <span style={{ fontSize: 11, color: "var(--fg-mute)", fontFamily: "var(--font-mono)" }}>● en vivo</span>
          </div>

          <div style={{ minHeight: 480 }}>{tabs[active].node}</div>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 24,
            color: "var(--fg-mute)",
            fontSize: 13,
            fontStyle: "italic",
          }}
        >
          {tabs[active].sub}
        </div>
      </Container>
    </section>
  );
}
