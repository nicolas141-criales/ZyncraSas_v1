"use client";

import type { CSSProperties } from "react";
import {
  IconBrush,
  IconHand,
  IconReceipt,
  IconScissors,
  IconStar,
  IconUsers,
} from "./icons";
import {
  Card,
  Container,
  SectionTitle,
} from "./primitives";

export default function Testimonials() {
  const items = [
    {
      quote:
        "Los no-shows bajaron 70% desde que activamos los recordatorios. Nunca pensé que algo así pudiera impactar tanto en mis ingresos.",
      name: "Alejandro Ruiz",
      biz: "Black Fade Barbershop",
      city: "Bogotá",
      icon: <IconScissors size={18} />,
      color: "#A78BFA",
      metric: "+70% asistencia",
    },
    {
      quote:
        "Las campañas de WhatsApp me trajeron clientes inactivos de vuelta. Recuperé 12 clientes que no venían hace 3 meses.",
      name: "María Torres",
      biz: "Estudio Hair",
      city: "Bucaramanga",
      icon: <IconBrush size={18} />,
      color: "#EC4899",
      metric: "12 clientes recuperados",
    },
    {
      quote:
        "Las reseñas en Google subieron de 4.1 a 4.8 en dos meses. Ahora aparecemos primero en búsquedas locales.",
      name: "Diana Vásquez",
      biz: "Studio V",
      city: "Manizales",
      icon: <IconStar size={18} />,
      color: "#FBBF24",
      metric: "4.1 → 4.8 ★",
    },
    {
      quote:
        "Liquidar comisiones era un dolor de cabeza con Excel. Ahora se calcula solo y mi equipo confía 100% en los números.",
      name: "Camilo Mejía",
      biz: "Barbería The Cut",
      city: "Medellín",
      icon: <IconUsers size={18} />,
      color: "#22D3EE",
      metric: "4 horas/semana ahorradas",
    },
    {
      quote:
        "Facturar DIAN con CUFE solía tomarme dos horas al día. Ahora es 1 clic. Literal.",
      name: "Valentina Gómez",
      biz: "Spa Aurora",
      city: "Cali",
      icon: <IconReceipt size={18} />,
      color: "#34D399",
      metric: "2h/día ahorradas",
    },
    {
      quote:
        "El POS es tan sencillo que mi mamá lo usa. Y eso lo cambia todo cuando estoy ocupada con clientes.",
      name: "Sofía Restrepo",
      biz: "Nails by Sofi",
      city: "Pereira",
      icon: <IconHand size={18} />,
      color: "#FB923C",
      metric: "Onboarding: 8 min",
    },
  ];

  return (
    <section id="resenas" style={{ padding: "120px 0", position: "relative", overflow: "hidden" }}>
      <Container max={1240}>
        <SectionTitle
          eyebrow="Reseñas verificadas"
          title={
            <>
              Negocios reales. <span className="gradient-text">Resultados reales.</span>
            </>
          }
          sub="No tomamos solo dinero, también nos importa que tu negocio crezca. Estos son algunos de los nuestros."
          align="center"
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
          }}
          className="tm-grid"
        >
          {items.map((t, i) => (
            <Card key={i} hover style={{ padding: 24, height: "100%", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
                {Array.from({ length: 5 }).map((_, k) => (
                  <IconStar
                    key={k}
                    size={13}
                    style={{ color: "var(--amber)", fill: "var(--amber)" } as CSSProperties}
                  />
                ))}
              </div>
              <p
                style={{
                  fontSize: 14.5,
                  lineHeight: 1.55,
                  color: "var(--fg)",
                  flex: 1,
                  margin: 0,
                  marginBottom: 18,
                }}
              >
                &ldquo;{t.quote}&rdquo;
              </p>
              <div
                style={{
                  padding: "8px 12px",
                  border: `1px solid ${t.color}44`,
                  background: `${t.color}11`,
                  borderRadius: 999,
                  fontSize: 12,
                  color: t.color,
                  alignSelf: "flex-start",
                  marginBottom: 18,
                  fontFamily: "var(--font-mono)",
                  fontWeight: 500,
                }}
              >
                ↗ {t.metric}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  paddingTop: 14,
                  borderTop: "1px solid var(--line)",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: `linear-gradient(135deg, ${t.color}33, ${t.color}11)`,
                    border: `1px solid ${t.color}33`,
                    display: "grid",
                    placeItems: "center",
                    color: t.color,
                  }}
                >
                  {t.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: "var(--fg-mute)" }}>
                    {t.biz} · {t.city}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
