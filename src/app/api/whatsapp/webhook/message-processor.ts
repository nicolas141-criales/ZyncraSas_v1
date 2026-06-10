import { serviceDb } from "@/lib/ai-auth";
import { runAgentLoop } from "@/lib/ai-agent";

const MAX_HISTORY = 24;

async function loadHistory(tenantId: string, phone: string): Promise<any[]> {
  const { data } = await serviceDb()
    .from("ai_conversations")
    .select("messages")
    .eq("tenant_id", tenantId)
    .eq("phone", phone)
    .maybeSingle();
  return (data?.messages ?? []) as any[];
}

async function saveHistory(tenantId: string, phone: string, messages: any[]) {
  const systemMsg = messages.find((m: any) => m.role === "system");
  const rest      = messages.filter((m: any) => m.role !== "system").slice(-MAX_HISTORY);
  const toSave    = systemMsg ? [systemMsg, ...rest] : rest;

  await serviceDb()
    .from("ai_conversations")
    .upsert(
      { tenant_id: tenantId, phone, messages: toSave, last_message_at: new Date().toISOString() },
      { onConflict: "tenant_id,phone" }
    );
}

function buildSystemMessage(tenantId: string, phone: string, businessName: string): any {
  const bogota   = new Date().toLocaleString("en-US", { timeZone: "America/Bogota" });
  const todayDt  = new Date(bogota);
  const todayISO = todayDt.toISOString().substring(0, 10);

  const tomorrowDt = new Date(todayDt);
  tomorrowDt.setDate(tomorrowDt.getDate() + 1);
  const tomorrowISO = tomorrowDt.toISOString().substring(0, 10);

  const todayLabel = todayDt.toLocaleDateString("es-CO", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return {
    role: "system",
    content: `Eres el asistente de reservas de ${businessName} en WhatsApp.

CONTEXTO DEL SISTEMA (no lo muestres al cliente):
- tenant_id: "${tenantId}"
- Teléfono del cliente: "${phone}"
- Hoy: ${todayLabel} (${todayISO})
- Mañana: ${tomorrowISO}
- Siempre incluye tenant_id en cada herramienta

FLUJO A — NUEVA CITA (cliente pide agendar/reservar):
1. get_client(phone="${phone}") → identificar si el cliente existe
2. list_services() → obtener el service_id según lo que pide el cliente
3. check_availability(service_id, date) → consultar slots reales
4. Presenta las opciones al cliente (máx 5 horarios)
5. El cliente elige → muestra resumen: Servicio · Profesional · Fecha · Hora
6. Espera confirmación explícita ("sí", "confirmo", "dale", etc.)
7. book_appointment() → solo después de confirmación

FLUJO B — REAGENDAR (cliente pide mover/cambiar una cita):
1. get_client(phone="${phone}") → identifica al cliente y sus citas futuras activas
   - Si no tiene citas futuras, informa que no hay citas que mover
2. Muestra las citas del array appointments (fecha, hora, servicio) y pregunta cuál desea mover
3. Cliente indica cuál → usa ese appointment_id y service_id para los siguientes pasos
4. Pregunta la nueva fecha preferida
5. check_availability(service_id, new_date) → consulta slots disponibles en la nueva fecha
6. Presenta las opciones (máx 5 horarios)
7. El cliente elige → muestra resumen: Servicio · Profesional · Nueva Fecha · Nueva Hora
8. Espera confirmación explícita
9. reschedule_appointment(appointment_id, new_date, new_time) → solo después de confirmación

REGLAS:
- NUNCA inventes horarios ni disponibilidad
- NUNCA llames book_appointment ni reschedule_appointment sin confirmación previa
- Mensajes cortos (WhatsApp, máx 4 líneas)
- Solo español
- Usa ✅ para confirmaciones, 📅 para fechas`,
  };
}

async function sendWA(phoneNumberId: string, to: string, text: string, token: string) {
  const res = await fetch(
    `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
    {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text, preview_url: false },
      }),
    }
  );
  if (!res.ok) console.error("[WA] send error:", await res.text());
}

export async function processMessage({
  phone,
  text,
  phoneNumberId,
  tenantId,
  accessToken,
}: {
  phone:         string;
  text:          string;
  phoneNumberId: string;
  tenantId:      string;
  accessToken:   string;
}) {
  const stored = await loadHistory(tenantId, phone);

  let messages: any[];
  if (stored.length === 0) {
    const { data: branding } = await serviceDb()
      .from("branding")
      .select("business_name")
      .eq("tenant_id", tenantId)
      .maybeSingle();
    const businessName = (branding as any)?.business_name ?? "el negocio";
    messages = [buildSystemMessage(tenantId, phone, businessName)];
  } else {
    messages = stored;
  }

  messages.push({ role: "user", content: text });

  let reply: string;
  let updatedMessages: any[];

  try {
    ({ reply, updatedMessages } = await runAgentLoop(messages, tenantId));
  } catch (err) {
    console.error("[agent] error:", err);
    reply           = "Disculpa, tuve un problema técnico. ¿Puedes intentarlo de nuevo?";
    updatedMessages = [...messages, { role: "assistant", content: reply }];
  }

  await saveHistory(tenantId, phone, updatedMessages);

  if (accessToken && phoneNumberId) {
    await sendWA(phoneNumberId, phone, reply, accessToken);
  } else {
    console.log(`\n[WA → ${phone}]\n${reply}\n`);
  }
}
