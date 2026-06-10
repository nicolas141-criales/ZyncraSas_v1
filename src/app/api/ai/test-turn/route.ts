import { NextRequest, NextResponse } from "next/server";
import { checkAIAuth, serviceDb } from "@/lib/ai-auth";
import { runAgentLoop } from "@/lib/ai-agent";

// Diagnostic endpoint: runs one turn synchronously and returns the full result.
// Optional `provider` field overrides LLM_PROVIDER env var — used by benchmark scripts.
export async function POST(req: NextRequest) {
  const authErr = checkAIAuth(req);
  if (authErr) return authErr;

  const { tenant_id, phone, text, reset, provider } = await req.json();
  if (!tenant_id || !phone || !text) {
    return NextResponse.json({ error: "tenant_id, phone, text required" }, { status: 400 });
  }

  const db = serviceDb();

  if (reset) {
    await db.from("ai_conversations").delete().eq("tenant_id", tenant_id).eq("phone", phone);
  }

  const { data: stored } = await db
    .from("ai_conversations")
    .select("messages")
    .eq("tenant_id", tenant_id)
    .eq("phone", phone)
    .maybeSingle();

  let messages: any[] = (stored?.messages ?? []) as any[];

  if (messages.length === 0) {
    const { data: branding } = await db
      .from("branding")
      .select("business_name")
      .eq("tenant_id", tenant_id)
      .maybeSingle();
    const businessName = (branding as any)?.business_name ?? "el negocio";

    const bogota  = new Date().toLocaleString("en-US", { timeZone: "America/Bogota" });
    const todayDt = new Date(bogota);
    const todayISO = todayDt.toISOString().substring(0, 10);
    const tomorrowDt = new Date(todayDt);
    tomorrowDt.setDate(tomorrowDt.getDate() + 1);
    const tomorrowISO = tomorrowDt.toISOString().substring(0, 10);
    const todayLabel = todayDt.toLocaleDateString("es-CO", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    messages = [{
      role: "system",
      content:
        `Eres el asistente de reservas de ${businessName} en WhatsApp.\n\n` +
        `CONTEXTO DEL SISTEMA (no lo muestres al cliente):\n` +
        `- tenant_id: "${tenant_id}"\n` +
        `- Teléfono del cliente: "${phone}"\n` +
        `- Hoy: ${todayLabel} (${todayISO})\n` +
        `- Mañana: ${tomorrowISO}\n` +
        `- Siempre incluye tenant_id en cada herramienta\n\n` +
        `REGLA CRÍTICA — TOOL-FIRST:\n` +
        `- Ante CUALQUIER mensaje del usuario, llama get_client INMEDIATAMENTE como primera acción.\n` +
        `- El teléfono del cliente ya está en el contexto. JAMÁS se lo pidas.\n` +
        `- JAMÁS pidas nombre ni datos antes de llamar get_client.\n` +
        `- Ejecuta herramientas primero; responde texto solo después.\n\n` +
        `FLUJO A — NUEVA CITA (cliente pide agendar/reservar):\n` +
        `1. get_client → list_services → check_availability → presentar opciones → confirmar → book_appointment\n\n` +
        `FLUJO B — REAGENDAR (cliente pide mover/cambiar):\n` +
        `1. get_client → mostrar citas → pedir cuál → nueva fecha → check_availability → confirmar → reschedule_appointment\n\n` +
        `FLUJO C — CANCELAR (cliente pide cancelar):\n` +
        `1. get_client → mostrar citas activas → confirmar cuál → cancel_appointment\n\n` +
        `REGLAS: mensajes cortos (máx 4 líneas), solo español, nunca inventes disponibilidad.`,
    }];
  }

  messages.push({ role: "user", content: text });

  const t = Date.now();
  let result: Awaited<ReturnType<typeof runAgentLoop>>;
  try {
    result = await runAgentLoop(messages, tenant_id, provider ?? undefined);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err), elapsed_ms: Date.now() - t });
  }

  // Persist
  const systemMsg = result.updatedMessages.find((m: any) => m.role === "system");
  const rest      = result.updatedMessages.filter((m: any) => m.role !== "system").slice(-24);
  const toSave    = systemMsg ? [systemMsg, ...rest] : rest;
  await db.from("ai_conversations").upsert(
    { tenant_id, phone, messages: toSave, last_message_at: new Date().toISOString() },
    { onConflict: "tenant_id,phone" }
  );

  return NextResponse.json({
    ok:            true,
    reply:         result.reply,
    message_count: result.updatedMessages.length,
    elapsed_ms:    Date.now() - t,
    usage:         result.usage,
    tool_calls: result.updatedMessages
      .filter((m: any) => m.tool_calls?.length)
      .flatMap((m: any) => (m.tool_calls as any[]).map((tc: any) => tc.function?.name as string)),
  });
}
