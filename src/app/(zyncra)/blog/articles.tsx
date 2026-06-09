import React from "react";
import Link from "next/link";

const IL = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} style={{ color: "#fb0f05", fontWeight: 700, textDecoration: "none", borderBottom: "1.5px solid rgba(251,15,5,0.25)", paddingBottom: 1 }}>{children}</a>
);

export const CATS: Record<string, { bg: string; text: string }> = {
  Agenda:        { bg: "rgba(251,15,5,.1)",   text: "#fb0f05" },
  Marketing:     { bg: "rgba(22,163,74,.1)",  text: "#16a34a" },
  Facturación:   { bg: "rgba(0,39,254,.09)",  text: "#0027fe" },
  Negocios:      { bg: "rgba(123,47,190,.1)", text: "#7B2FBE" },
  WhatsApp:      { bg: "rgba(37,211,102,.1)", text: "#128c5e" },
  Operación:     { bg: "rgba(234,179,8,.12)", text: "#b45309" },
};

export interface Article {
  slug: string;
  category: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  readTime: number;
  date: string;
  dateISO: string;
  author: string;
  emoji: string;
  lead: string;
  content: React.ReactNode;
}

export const ARTICLES: Record<string, Article> = {

  // ── 1 ─────────────────────────────────────────────────────────────────────
  "como-reducir-no-shows-barberia": {
    slug: "como-reducir-no-shows-barberia",
    category: "Agenda",
    emoji: "📅",
    readTime: 5,
    date: "20 mayo 2026",
    dateISO: "2026-05-20",
    author: "Equipo Zyncra",
    keywords: [
      "como reducir no shows barberia",
      "no shows salon de belleza colombia",
      "recordatorios citas whatsapp",
      "reducir inasistencias salon",
      "clientes que no llegan barberia",
    ],
    title: "Cómo Reducir los No-Shows en tu Barbería o Salón hasta un 60%",
    metaTitle: "Cómo Reducir No-Shows en tu Barbería · Zyncra",
    metaDescription:
      "Los no-shows cuestan hasta $2.7M mensuales en barberías y salones colombianos. Las 5 estrategias exactas para bajarlos del 25% al 8% con recordatorios WhatsApp.",
    lead:
      "Los no-shows son silenciosos pero devastadores. Un cliente que no llega sin avisar te hace perder el tiempo de ese servicio y bloquea el espacio para otros que sí querían venir. En Colombia, el promedio es del 22-28% de las citas agendadas — casi 1 de cada 4.",
    content: (
      <>
        <h2>El costo real de un no-show en tu negocio</h2>
        <p>Para un salón o barbería con 8 servicios al día a $45.000 promedio, un 25% de no-shows son 2 servicios perdidos diarios: <strong>$90.000/día · $2.7M/mes · $32M/año.</strong> No es un problema menor — es el mayor problema operativo de los negocios de servicios en Colombia.</p>

        <blockquote className="z-blog-pullquote">
          "Desde que activamos los recordatorios automáticos, los no-shows bajaron del 28% al 8% en el primer mes. Fue el cambio más impactante que hemos hecho en 4 años."
          <div style={{ marginTop: 12, fontSize: 14, fontWeight: 500, fontStyle: "normal", color: "var(--fg-dim)" }}>— Alejandro Ruiz, Black Fade Barbershop · Bogotá</div>
        </blockquote>

        <h2>1. El recordatorio de cita por WhatsApp es lo más importante</h2>
        <p>El 80% de los no-shows no son clientes que deciden no ir — son clientes que simplemente olvidan. Un <IL href="/features">recordatorio automático por WhatsApp</IL> bien diseñado resuelve la mayoría del problema:</p>
        <ul>
          <li><strong>24 horas antes:</strong> Mensaje con fecha, hora y servicio. Tasa de apertura en WhatsApp: 98% vs 20% del email.</li>
          <li><strong>2 horas antes:</strong> Mensaje de confirmación final con link para reagendar si no pueden.</li>
        </ul>

        <h2>2. La confirmación activa cambia todo</h2>
        <p>No basta con recordar — pide que el cliente confirme. Un mensaje como <em>"¿Confirmas tu cita de mañana a las 3pm? Responde Sí o escríbenos si necesitas cambiarla"</em> convierte un recordatorio pasivo en compromiso activo. Los salones que usan confirmación activa ven una reducción adicional del 15-20% en no-shows.</p>

        <h2>3. Facilita la reprogramación antes de que falten</h2>
        <p>Muchos clientes no van porque les surgió algo pero no saben cómo avisar. Si incluyes un enlace directo para reagendar en el mismo mensaje de recordatorio, el cliente reprograma en lugar de desaparecer. No pierdes el cliente — solo mueves la cita.</p>

        <h2>4. Cobra depósito en servicios de larga duración</h2>
        <p>Para servicios de más de 60 minutos (keratinas, coloraciones, tratamientos capilares), pedir un depósito del 20-30% reduce los no-shows a casi cero. Un cliente que ha pagado algo siempre avisa si no puede ir. En Colombia, puedes recibir el depósito por Nequi, Daviplata o transferencia.</p>

        <h2>5. Identifica a tus clientes reincidentes</h2>
        <p>Con un buen <IL href="/features">sistema de gestión</IL> puedes ver qué clientes tienen historial de no-shows repetidos. Con esa información puedes agregarles un recordatorio extra o requerir depósito preventivo. La data que ya tienes en tu sistema es tu mejor herramienta de prevención.</p>

        <p>Implementado correctamente, este sistema lleva los no-shows del 25% al 8-10% en los primeros 30 días. Para un negocio mediano en Colombia, eso son <strong>$1.5-2M mensuales adicionales</strong> — sin nuevos clientes, solo recuperando lo que ya tenías. <IL href="/reviews">Mira los resultados de negocios que ya lo implementaron →</IL></p>
      </>
    ),
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  "software-gestion-salon-belleza-colombia": {
    slug: "software-gestion-salon-belleza-colombia",
    category: "Negocios",
    emoji: "💻",
    readTime: 6,
    date: "15 mayo 2026",
    dateISO: "2026-05-15",
    author: "Equipo Zyncra",
    keywords: [
      "software para salon de belleza colombia",
      "programa para salon de belleza",
      "app para peluqueria colombia",
      "sistema de gestion salon belleza",
      "software barberia colombia",
      "mejor software salon colombia",
    ],
    title: "El Mejor Software para Salón de Belleza en Colombia (2026)",
    metaTitle: "Software para Salón de Belleza en Colombia 2026 · Zyncra",
    metaDescription:
      "Guía completa para elegir el mejor software de gestión para salones de belleza y barberías en Colombia. Agenda online, POS, WhatsApp y factura DIAN integrados.",
    lead:
      "El software correcto puede transformar un salón de belleza caótico en un negocio que funciona casi solo. En Colombia, más del 60% de salones aún usan WhatsApp y cuadernos para agendar citas — y eso les cuesta entre $1M y $3M al mes en ineficiencias.",
    content: (
      <>
        <h2>¿Por qué tu salón de belleza necesita un software de gestión?</h2>
        <p>Un salón sin software tiene problemas que parecen normales pero no lo son: citas dobles, caja descuadrada, profesionales que no saben cuánto ganaron, clientes que se van sin volver porque nadie les hizo seguimiento. Un software de gestión para salón resuelve todos esos problemas en un solo lugar.</p>

        <h2>Las 5 funciones esenciales que debe tener</h2>
        <ul>
          <li><strong><IL href="/features">Agenda online 24/7:</IL></strong> Los clientes reservan desde su celular sin llamar. El sistema bloquea el horario automáticamente.</li>
          <li><strong><IL href="/features">Recordatorios automáticos por WhatsApp:</IL></strong> Reduce no-shows del 25% al 8% sin hacer nada manual.</li>
          <li><strong><IL href="/features">POS integrado:</IL></strong> Cobra en efectivo, Nequi, Daviplata o tarjeta. La caja cuadra sola al final del día.</li>
          <li><strong><IL href="/features">Factura electrónica DIAN:</IL></strong> Cumple la obligación tributaria sin contratar un contador por cada factura.</li>
          <li><strong><IL href="/features">Comisiones automáticas:</IL></strong> Tus profesionales ven cuánto ganaron en tiempo real. Cero reclamos.</li>
        </ul>

        <h2>¿Cuánto cuesta un software para salón en Colombia?</h2>
        <p>El rango va de $0 (soluciones básicas) hasta $500.000/mes (software tipo ERP). Para la mayoría de salones y barberías en Colombia, la zona ideal está entre $80.000 y $200.000 al mes — lo que equivale a 2-4 servicios. Si el software te ayuda a retener 5 clientes más al mes, se paga solo. <IL href="/pricing">Ver planes y precios →</IL></p>

        <blockquote className="z-blog-pullquote">
          "En el primer mes con Zyncra recuperamos $1.8M que antes perdíamos en no-shows y caja descuadrada. El software se pagó en los primeros 10 días."
          <div style={{ marginTop: 12, fontSize: 14, fontWeight: 500, fontStyle: "normal", color: "var(--fg-dim)" }}>— Carolina Mejía, Belleza & Arte Studio · Medellín</div>
        </blockquote>

        <h2>Cómo implementarlo sin perder clientes en el proceso</h2>
        <p>El mayor miedo de los dueños de salón al cambiar de sistema es perder clientes en la transición. La clave es hacerlo gradual: primero migra la agenda, luego el POS, finalmente la facturación. La mayoría de plataformas permiten importar clientes desde Excel o contactos de WhatsApp. En 2 semanas tu equipo ya opera con el nuevo sistema sin fricción.</p>

        <h2>Red flags: software que debes evitar</h2>
        <p>Huye de cualquier software que no tenga soporte en horario colombiano, que cobre por cada usuario extra, que no se integre con WhatsApp, o que no emita factura electrónica DIAN. En 2026, esos tres son mínimos para operar en Colombia. <IL href="/reviews">Lee lo que dicen 500+ negocios que ya cambiaron →</IL></p>
      </>
    ),
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  "agenda-online-para-barberia-colombia": {
    slug: "agenda-online-para-barberia-colombia",
    category: "Agenda",
    emoji: "🗓️",
    readTime: 5,
    date: "10 mayo 2026",
    dateISO: "2026-05-10",
    author: "Equipo Zyncra",
    keywords: [
      "agenda online para barberia colombia",
      "sistema de citas online barberia",
      "reservas online barberia",
      "app agenda barberia colombia",
      "citas online peluqueria colombia",
      "link de reservas barberia",
    ],
    title: "Agenda Online para Barbería en Colombia: Guía Completa 2026",
    metaTitle: "Agenda Online para Barbería Colombia 2026 · Zyncra",
    metaDescription:
      "Cómo implementar una agenda online en tu barbería y conseguir más citas sin llamadas ni WhatsApps manuales. Guía práctica para barberías en Colombia.",
    lead:
      "Una barbería sin agenda online en 2026 es como una tienda sin vitrina. El 73% de los clientes prefieren reservar su cita por internet antes que llamar. Si no tienes un link de reservas, estás perdiendo clientes que ya querían ir contigo.",
    content: (
      <>
        <h2>¿Por qué tu barbería necesita una agenda digital?</h2>
        <p>El cuaderno de citas tiene tres problemas fatales: se puede perder, no funciona a las 11 pm cuando el cliente quiere reservar, y no te avisa cuando alguien cancela. Una agenda online para barbería funciona 24/7, bloquea horarios automáticamente y envía confirmaciones sin que hagas nada.</p>

        <h2>Cómo funciona el sistema de reservas online</h2>
        <p>El flujo es simple: el cliente entra a tu <IL href="/features">link de reservas</IL>, elige el servicio (corte, barba, combo), selecciona el barbero que prefiere y escoge el horario disponible. El sistema le envía una confirmación por WhatsApp y a ti te llega la notificación. Sin llamadas. Sin WhatsApps manuales. Sin citas dobles.</p>

        <h2>El link de reservas: la herramienta más subutilizada en Colombia</h2>
        <p>La mayoría de barberías que tienen agenda online cometen un error: no comparten el link. El link de reservas debe estar en:</p>
        <ul>
          <li>Tu bio de Instagram y TikTok</li>
          <li>Tu perfil de Google My Business (aumenta citas un 40%)</li>
          <li>El mensaje automático de WhatsApp Business</li>
          <li>Tus historias de Instagram cada viernes</li>
        </ul>

        <blockquote className="z-blog-pullquote">
          "Pusimos el link en la bio y en Google. En dos semanas teníamos 23 reservas nuevas de personas que nos encontraron buscando barbería cerca."
          <div style={{ marginTop: 12, fontSize: 14, fontWeight: 500, fontStyle: "normal", color: "var(--fg-dim)" }}>— Santiago Gómez, The Barbers Club · Cali</div>
        </blockquote>

        <h2>WhatsApp + agenda online: el combo perfecto para barberías</h2>
        <p>La agenda online captura la cita. WhatsApp mantiene la relación. Configura tu WhatsApp Business para que el mensaje automático incluya el link de reservas. Así, cada nuevo contacto que llega a tu WhatsApp recibe inmediatamente la opción de agendar. Conviertes consultas en citas sin responder manualmente.</p>

        <h2>Resultados reales en barberías colombianas</h2>
        <p>Las barberías que implementan <IL href="/features">agenda online</IL> en Colombia reportan entre 8 y 15 citas nuevas adicionales por mes en el primer trimestre — solo del tráfico orgánico en Google y de referencias de clientes actuales. Con publicidad en Instagram o TikTok ese número se multiplica porque el funnel ya está listo.</p>
      </>
    ),
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  "recordatorios-automaticos-whatsapp-salon": {
    slug: "recordatorios-automaticos-whatsapp-salon",
    category: "WhatsApp",
    emoji: "💬",
    readTime: 4,
    date: "5 mayo 2026",
    dateISO: "2026-05-05",
    author: "Equipo Zyncra",
    keywords: [
      "recordatorios automaticos whatsapp salon",
      "recordatorios citas salon de belleza",
      "mensajes automaticos barberia clientes",
      "recordatorio whatsapp barberia",
      "automatizar whatsapp salon belleza colombia",
    ],
    title: "Recordatorios Automáticos por WhatsApp para Salones y Barberías",
    metaTitle: "Recordatorios Automáticos WhatsApp Salón de Belleza · Zyncra",
    metaDescription:
      "Las 3 plantillas exactas de recordatorio por WhatsApp que usan los mejores salones de Colombia para reducir no-shows al 8%. Configúralo una vez y olvídate.",
    lead:
      "WhatsApp tiene una tasa de apertura del 98%. Ningún otro canal se acerca. El problema no es el medio — es que la mayoría de salones y barberías en Colombia todavía envían recordatorios manualmente, uno por uno, a las 7 de la mañana. Eso se puede automatizar completamente.",
    content: (
      <>
        <h2>Por qué WhatsApp es el canal perfecto para recordatorios de cita</h2>
        <p>En Colombia, el 94% de la población con smartphone usa WhatsApp todos los días. Es el primer canal que revisan en la mañana. Un recordatorio de cita por WhatsApp tiene 5 veces más probabilidad de ser leído que un SMS y 20 veces más que un email. No hay discusión sobre el canal — el debate es cuándo y cómo enviar.</p>

        <h2>La plantilla de recordatorio de 24 horas que más convierte</h2>
        <p>Esta plantilla tiene el formato óptimo según datos de 500+ salones y barberías en Colombia:</p>
        <div style={{ background: "var(--bg-card)", borderRadius: 12, padding: "16px 20px", border: "1px solid var(--line)", margin: "16px 0", fontFamily: "monospace", fontSize: 14, lineHeight: 1.7 }}>
          Hola [Nombre] 👋<br /><br />
          Te recordamos que tienes una cita mañana:<br />
          📅 [Día] [Fecha]<br />
          ⏰ [Hora]<br />
          ✂️ [Servicio]<br /><br />
          ¿Todo bien para esa hora? Si necesitas cambiarla escríbenos y buscamos otra opción 🙌
        </div>

        <h2>El recordatorio de 2 horas: el que más reduce no-shows</h2>
        <p>El recordatorio de 2 horas es el más efectivo para confirmación final. Debe ser corto y directo:</p>
        <div style={{ background: "var(--bg-card)", borderRadius: 12, padding: "16px 20px", border: "1px solid var(--line)", margin: "16px 0", fontFamily: "monospace", fontSize: 14, lineHeight: 1.7 }}>
          Hola [Nombre] 🔔 Tu cita de [Servicio] es en 2 horas ([Hora]). ¡Te esperamos!
        </div>

        <h2>El mensaje post-visita: el que nadie envía pero debería</h2>
        <p>Enviar un mensaje 2-3 horas después de la cita para preguntar cómo estuvo el servicio tiene dos efectos: consigues reseñas de Google y los clientes se sienten valorados. Los que responden positivamente son los más fáciles de convertir en clientes recurrentes.</p>

        <blockquote className="z-blog-pullquote">
          "Antes mandaba los recordatorios a mano desde mi celular. Era estresante y a veces se me olvidaban. Ahora el sistema los manda solo y mis no-shows bajaron a menos del 5%."
          <div style={{ marginTop: 12, fontSize: 14, fontWeight: 500, fontStyle: "normal", color: "var(--fg-dim)" }}>— Valentina Torres, Studio V · Manizales</div>
        </blockquote>

        <h2>Cómo configurar los recordatorios automáticos en tu salón</h2>
        <p>Con una herramienta como <IL href="/features">Zyncra</IL>, configuras las 3 plantillas una sola vez — con las variables de nombre, hora y servicio — y el sistema los envía automáticamente para cada cita. No tienes que hacer nada. Las plantillas se pueden personalizar con el nombre de tu negocio, emojis y el tono que uses con tus clientes. <IL href="/pricing">Ver planes →</IL></p>
      </>
    ),
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  "resenas-google-salon-de-belleza": {
    slug: "resenas-google-salon-de-belleza",
    category: "Marketing",
    emoji: "⭐",
    readTime: 5,
    date: "28 abril 2026",
    dateISO: "2026-04-28",
    author: "Equipo Zyncra",
    keywords: [
      "como conseguir resenas google salon de belleza",
      "resenas google barberia colombia",
      "mejorar calificacion google negocio belleza",
      "google my business salon belleza",
      "mas resenas 5 estrellas salon colombia",
    ],
    title: "Cómo Conseguir Más Reseñas en Google para tu Salón o Barbería",
    metaTitle: "Más Reseñas Google para Salón de Belleza · Zyncra",
    metaDescription:
      "El script exacto para pedirle reseñas Google a tus clientes y pasar de 4.1 a 4.8 estrellas en 8 semanas. Funciona para salones de belleza y barberías en Colombia.",
    lead:
      "El 87% de los colombianos lee reseñas de Google antes de elegir un salón o barbería nueva. No es redes sociales — es Google. Y la diferencia entre 4.1 y 4.7 estrellas puede significar 30-50 clientes más al mes sin gastar un peso en publicidad.",
    content: (
      <>
        <h2>Por qué las reseñas de Google valen más que cualquier pauta</h2>
        <p>Una barbería con 4.8 estrellas y 120 reseñas aparece primero en Google Maps cuando alguien busca "barbería cerca". Eso es tráfico gratuito, continuo y altamente calificado — personas que ya quieren el servicio y solo están eligiendo dónde ir. Ninguna pauta de Meta o TikTok compite con ese nivel de intención de compra. <IL href="/reviews">Ve cómo lo lograron negocios reales en Colombia →</IL></p>

        <h2>El momento exacto para pedir la reseña</h2>
        <p>El error más común: pedir la reseña al final de la cita cuando el cliente está de pie, apurado y pagando. El momento correcto es <strong>2-3 horas después</strong> de la cita, cuando el cliente ya llegó a su destino, se miró al espejo y está contento. Ese es el momento donde la emoción positiva es máxima.</p>

        <h2>El script exacto que funciona para salones en Colombia</h2>
        <div style={{ background: "var(--bg-card)", borderRadius: 12, padding: "16px 20px", border: "1px solid var(--line)", margin: "16px 0", fontFamily: "monospace", fontSize: 14, lineHeight: 1.7 }}>
          Hola [Nombre], gracias por visitarnos hoy 🙌<br /><br />
          ¿Cómo quedaste con el [servicio]? Tu opinión nos ayuda a mejorar y a que más personas nos conozcan.<br /><br />
          Si tienes 2 minuticos, nos ayudaría mucho una reseña en Google:<br />
          👉 [link directo a tu perfil de Google]<br /><br />
          ¡Gracias! Te esperamos pronto 💇
        </div>

        <blockquote className="z-blog-pullquote">
          "Pasamos de 4.1 a 4.8 estrellas en 8 semanas. Solo con enviar ese mensaje después de cada cita. Ahora nos llegan clientes nuevos de Google todos los días."
          <div style={{ marginTop: 12, fontSize: 14, fontWeight: 500, fontStyle: "normal", color: "var(--fg-dim)" }}>— Diana Vásquez, Glamour Studio · Bogotá</div>
        </blockquote>

        <h2>Cómo conseguir el link directo para dejar reseña</h2>
        <p>Entra a Google My Business → Inicio → "Obtener más reseñas" → Copia el link. Ese link lleva al cliente directamente a la pantalla de reseña sin que tenga que buscar tu negocio. Esa fricción eliminada duplica la tasa de conversión.</p>

        <h2>Cómo responder las reseñas negativas sin perder clientes</h2>
        <p>Responde siempre en menos de 24 horas. No te defiendas — agradece el feedback y ofrece una solución concreta. Los lectores de reseñas juzgan más tu respuesta que la queja misma. Una respuesta profesional a una reseña negativa puede convertirse en marketing positivo.</p>

        <h2>Automatiza el pedido de reseñas con cada cita</h2>
        <p>Con <IL href="/features">Zyncra</IL> puedes configurar el mensaje post-visita como plantilla automática que se envía por WhatsApp 2 horas después de cada cita. No tienes que recordar hacerlo — el sistema lo hace por cada cliente, con su nombre y el servicio específico que recibió.</p>
      </>
    ),
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  "factura-electronica-dian-para-barberia": {
    slug: "factura-electronica-dian-para-barberia",
    category: "Facturación",
    emoji: "🧾",
    readTime: 8,
    date: "22 abril 2026",
    dateISO: "2026-04-22",
    author: "Equipo Zyncra",
    keywords: [
      "factura electronica DIAN para barberia",
      "factura electronica salon de belleza colombia",
      "Factus barberia colombia",
      "facturar electronicamente peluqueria",
      "obligacion factura electronica salon colombia",
      "CUFE barberia",
    ],
    title: "Factura Electrónica DIAN para Barberías y Salones en Colombia: Guía 2026",
    metaTitle: "Factura Electrónica DIAN para Barbería · Zyncra",
    metaDescription:
      "Todo lo que debes saber sobre la factura electrónica DIAN en tu barbería o salón de belleza. CUFE, resolución, Factus y cómo automatizarla. Sin tecnicismos.",
    lead:
      "Desde 2023 la factura electrónica es obligatoria para la mayoría de negocios en Colombia, incluyendo barberías, salones de belleza y spas. Si tu salón aún emite tiquetes de caja o facturas en papel, estás acumulando sanciones. La buena noticia: implementarlo es mucho más fácil de lo que parece.",
    content: (
      <>
        <h2>¿Desde cuándo es obligatoria la factura electrónica para salones?</h2>
        <p>La DIAN ha ido incorporando a los contribuyentes por grupos. Para 2026, prácticamente todos los negocios que facturen (incluyendo salones de belleza, barberías y spas con cualquier nivel de ingresos) están obligados. Si tienes RUT con actividad comercial, debes facturar electrónicamente.</p>

        <h2>Los términos que debes entender (sin tecnicismos)</h2>
        <ul>
          <li><strong>CUFE:</strong> Es el "número de serie" único de cada factura electrónica. Lo genera automáticamente el software.</li>
          <li><strong>Resolución DIAN:</strong> Es el permiso que la DIAN te da para facturar. Se tramita una vez y es válida por rangos de numeración.</li>
          <li><strong>XML:</strong> El formato técnico de la factura. Tu software lo genera — tú nunca lo ves.</li>
          <li><strong>Proveedor tecnológico:</strong> La empresa que conecta tu software con la DIAN. Ejemplos: Factus, Alegra, Siigo.</li>
        </ul>

        <h2>El flujo real de la factura electrónica en un salón</h2>
        <p>En la práctica, facturar electrónicamente se ve así: el cliente paga → en el <IL href="/features">POS</IL> seleccionas "generar factura" → ingresas el NIT o cédula del cliente → el sistema genera el XML, lo envía a la DIAN, recibe el CUFE y le manda la factura al cliente por email o WhatsApp. Todo tarda menos de 10 segundos.</p>

        <blockquote className="z-blog-pullquote">
          "Antes le dedicaba 2 horas a la semana a cuadrar facturas con mi contadora. Ahora Zyncra las genera automáticas con cada cobro. No toco nada."
          <div style={{ marginTop: 12, fontSize: 14, fontWeight: 500, fontStyle: "normal", color: "var(--fg-dim)" }}>— Marcela Herrera, Éclat Spa · Barranquilla</div>
        </blockquote>

        <h2>¿Cuánto cuesta implementar la factura electrónica?</h2>
        <p>Los proveedores tecnológicos en Colombia cobran entre $30.000 y $150.000 al mes según el volumen de facturas. Para un salón con 30-100 transacciones al mes, el costo ronda los $50.000/mes. Si lo tienes integrado en tu <IL href="/features">software de gestión</IL> (como Zyncra con Factus), no pagas por separado. <IL href="/pricing">Ver qué incluye cada plan →</IL></p>

        <h2>Cómo sacar la resolución DIAN paso a paso</h2>
        <ol>
          <li>Ingresa al portal MUISCA de la DIAN con tu usuario</li>
          <li>Ve a "Numeración de facturación" → "Solicitar habilitación"</li>
          <li>Completa el formulario con los datos de tu negocio</li>
          <li>La DIAN aprueba en 1-3 días hábiles</li>
          <li>Configura los datos en tu proveedor tecnológico</li>
        </ol>

        <h2>El error más común y cómo evitarlo</h2>
        <p>El 70% de los salones que implementan facturación electrónica cometen el mismo error: usan el ambiente de pruebas (sandbox) sin saber que las facturas generadas ahí no son válidas ante la DIAN. Asegúrate de que tu proveedor te haya habilitado en el ambiente de producción antes de emitir la primera factura real.</p>
      </>
    ),
  },

  // ── 7 ─────────────────────────────────────────────────────────────────────
  "whatsapp-marketing-clientes-inactivos": {
    slug: "whatsapp-marketing-clientes-inactivos",
    category: "WhatsApp",
    emoji: "📲",
    readTime: 7,
    date: "15 abril 2026",
    dateISO: "2026-04-15",
    author: "Equipo Zyncra",
    keywords: [
      "whatsapp marketing salon de belleza colombia",
      "recuperar clientes inactivos salon",
      "campañas whatsapp barberia",
      "clientes que no vuelven salon",
      "mensaje whatsapp reactivacion clientes salon",
    ],
    title: "WhatsApp Marketing: Cómo Recuperar Clientes que No Vuelven a tu Salón",
    metaTitle: "WhatsApp Marketing para Salones: Recuperar Clientes · Zyncra",
    metaDescription:
      "La plantilla exacta de WhatsApp para recuperar clientes que no visitan tu salón en 60+ días. Campañas de reactivación que convierten para barberías y salones en Colombia.",
    lead:
      "El 68% de los clientes que dejan de visitar un salón de belleza lo hacen por indiferencia — no porque estén enojados, no porque el servicio fuera malo, sino porque simplemente se olvidaron de ti. Un mensaje de WhatsApp en el momento correcto puede recuperar hasta el 30% de esos clientes.",
    content: (
      <>
        <h2>¿Cuándo un cliente se considera "inactivo"?</h2>
        <p>Depende del servicio. Para cortes de cabello (ciclo de 3-4 semanas), un cliente que no ha venido en 60 días ya está en riesgo. Para coloraciones o tratamientos (ciclo de 6-8 semanas), el umbral es 90-120 días. Monitorear estos intervalos te dice exactamente quiénes necesitan un mensaje de reactivación.</p>

        <h2>La plantilla de reactivación que funciona en Colombia</h2>
        <div style={{ background: "var(--bg-card)", borderRadius: 12, padding: "16px 20px", border: "1px solid var(--line)", margin: "16px 0", fontFamily: "monospace", fontSize: 14, lineHeight: 1.7 }}>
          Hola [Nombre] 👋 Hace un tiempo no te vemos por el salón y te extrañamos.<br /><br />
          Esta semana tenemos disponibilidad para [Servicio] y queremos ofrecerte un [descuento/regalo] por volver.<br /><br />
          ¿Te agendamos? 📅 [link de reservas]
        </div>
        <p>El secreto está en tres elementos: personalización (nombre + servicio específico que usaba), escasez o beneficio concreto (no solo "te esperamos"), y fricción cero (<IL href="/features">link directo para agendar</IL>).</p>

        <h2>El momento exacto para enviar la campaña</h2>
        <p>Las campañas de WhatsApp enviadas entre martes y jueves entre 10 AM y 12 PM tienen la tasa de respuesta más alta en Colombia. Evita lunes (la gente está ocupada) y viernes (ya tienen planes). Los fines de semana funcionan para recordatorios, no para campañas de reactivación.</p>

        <blockquote className="z-blog-pullquote">
          "Mandé mensajes a 47 clientes que no venían hace más de 60 días. 14 agendaron en la primera semana. Recuperé más de $600.000 en una sola campaña."
          <div style={{ marginTop: 12, fontSize: 14, fontWeight: 500, fontStyle: "normal", color: "var(--fg-dim)" }}>— María Fernández, Peluquería La Moderna · Pereira</div>
        </blockquote>

        <h2>Cómo segmentar tu lista para mejores resultados</h2>
        <p>No mandes el mismo mensaje a todos los clientes inactivos. Segmenta por tiempo de inactividad:</p>
        <ul>
          <li><strong>60-90 días:</strong> Mensaje de "te extrañamos" sin descuento. Estos aún tienen buena relación contigo.</li>
          <li><strong>90-180 días:</strong> Incluye un beneficio concreto (descuento del 15%, servicio extra gratis).</li>
          <li><strong>Más de 180 días:</strong> Mensaje de "¿qué pasó?" más directo + oferta fuerte. Es tu última oportunidad.</li>
        </ul>

        <h2>Lo que nunca debes enviar por WhatsApp</h2>
        <p>Evita mensajes masivos sin personalización, listas de precios sin contexto, y mensajes después de las 8 PM. El spameo en WhatsApp hace que los clientes te bloqueen y pierdes el canal de comunicación para siempre. La clave es parecer una conversación, no publicidad. Si quieres profundizar, lee nuestra guía sobre <IL href="/blog/recordatorios-automaticos-whatsapp-salon">recordatorios automáticos por WhatsApp</IL>.</p>
      </>
    ),
  },

  // ── 8 ─────────────────────────────────────────────────────────────────────
  "como-conseguir-mas-clientes-salon-belleza": {
    slug: "como-conseguir-mas-clientes-salon-belleza",
    category: "Marketing",
    emoji: "📈",
    readTime: 7,
    date: "8 abril 2026",
    dateISO: "2026-04-08",
    author: "Equipo Zyncra",
    keywords: [
      "como conseguir mas clientes salon de belleza colombia",
      "atraer clientes barberia",
      "marketing para salon de belleza colombia",
      "como hacer crecer un salon de belleza",
      "estrategias para conseguir clientes salon",
      "publicidad para barberia colombia",
    ],
    title: "7 Estrategias para Conseguir Más Clientes en tu Salón de Belleza o Barbería",
    metaTitle: "Cómo Conseguir Más Clientes para tu Salón de Belleza · Zyncra",
    metaDescription:
      "Las 7 estrategias más efectivas para atraer nuevos clientes a tu salón de belleza o barbería en Colombia. Sin publicidad paga, sin agencias costosas.",
    lead:
      "Conseguir nuevos clientes para un salón de belleza o barbería en Colombia no requiere contratar una agencia ni gastar millones en publicidad. Las 7 estrategias de este artículo son todas gratuitas o de bajo costo, y están probadas por cientos de negocios como el tuyo.",
    content: (
      <>
        <h2>1. Optimiza tu perfil de Google My Business (es gratis y es lo más potente)</h2>
        <p>El 78% de los colombianos usa Google Maps para encontrar salones y barberías cerca. Un perfil de Google My Business completo — con fotos actuales, horarios correctos, categoría exacta y tu link de reservas — puede traerte 20-40 clientes nuevos al mes sin gastar nada. Publica al menos una foto a la semana para que Google te muestre más.</p>

        <h2>2. El programa de referidos: tus clientes son tu mejor vendedor</h2>
        <p>Un cliente satisfecho que refiere a un amigo tiene una tasa de conversión del 85% — mucho más alta que cualquier pauta. Implementa un sistema simple: "Trae un amigo y ambos obtienen $20.000 de descuento en su próxima visita." Anúncialo por WhatsApp a tus clientes actuales. Costo: lo que sea que inviertes en el descuento, que siempre es menor que el costo de adquirir un cliente nuevo.</p>

        <blockquote className="z-blog-pullquote">
          "El programa de referidos nos trajo 18 clientes nuevos en el primer mes. Es nuestro canal de adquisición más barato con diferencia."
          <div style={{ marginTop: 12, fontSize: 14, fontWeight: 500, fontStyle: "normal", color: "var(--fg-dim)" }}>— Andrés Morales, Barbería Estilo · Bucaramanga</div>
        </blockquote>

        <h2>3. TikTok e Instagram Reels: el contenido que se muestra solo</h2>
        <p>Los videos de transformaciones (antes y después) en TikTok e Instagram Reels tienen el mayor alcance orgánico de todas las redes sociales. Un video de 30 segundos mostrando un corte + barba puede llegar a 10.000-50.000 personas en Bogotá, Medellín o Cali sin gastar nada en pauta. Publica 3-4 videos por semana con música de moda.</p>

        <h2>4. Consigue reseñas de Google sistemáticamente</h2>
        <p>Como <IL href="/blog/resenas-google-salon-de-belleza">explicamos en nuestra guía de reseñas Google</IL>, un salón con 4.7+ estrellas y más de 50 reseñas aparece primero en búsquedas locales. Enviar un <IL href="/blog/recordatorios-automaticos-whatsapp-salon">mensaje de WhatsApp post-visita</IL> pidiendo la reseña es la estrategia de adquisición de clientes más subutilizada en Colombia.</p>

        <h2>5. Ofrece un servicio de entrada de bajo precio</h2>
        <p>Un corte express a precio reducido o una consulta gratis funciona como "prueba" para nuevos clientes que no se animan a pagar por el servicio completo la primera vez. Una vez entran, el 60% regresa al precio completo. El primer servicio no tiene que ser rentable — tiene que crear el hábito.</p>

        <h2>6. Alianzas con negocios del mismo barrio</h2>
        <p>Gimnasios, tiendas de ropa, restaurantes y cafés cercanos tienen clientes que son exactamente tu público. Un acuerdo de referidos mutuos — tu pones flyers en su negocio, ellos ponen en el tuyo — puede generar 5-15 clientes nuevos al mes sin inversión.</p>

        <h2>7. WhatsApp Status y grupos de vecinos</h2>
        <p>Los grupos de vecindad en WhatsApp (Conjunto X, Barrio Y) y tus estados de WhatsApp son los canales más subutilizados del marketing local en Colombia. Publicar en tu estado de WhatsApp con fotos de trabajos recientes, precios y tu <IL href="/features">link de reservas</IL> llega exactamente a las personas que te conocen — la audiencia más propensa a visitar tu negocio.</p>
      </>
    ),
  },

};

export const ARTICLE_LIST = Object.values(ARTICLES);

export type ArticleMeta = Omit<Article, "content">;

export function getArticlesMeta(): ArticleMeta[] {
  return ARTICLE_LIST.map(({ content: _c, ...meta }) => meta);
}
