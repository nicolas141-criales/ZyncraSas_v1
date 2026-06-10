import { NextRequest, NextResponse } from "next/server";
import { checkAIAuth, serviceDb } from "@/lib/ai-auth";
import { runAgentLoop } from "@/lib/ai-agent";

// Diagnostic endpoint: runs one turn synchronously and returns the full result
export async function POST(req: NextRequest) {
  const authErr = checkAIAuth(req);
  if (authErr) return authErr;

  const { tenant_id, phone, text, reset } = await req.json();
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
      content: `Eres el asistente de reservas de ${businessName} en WhatsApp.\n\nCONTEXTO DEL SISTEMA:\n- tenant_id: "${tenant_id}"\n- Teléfono del cliente: "${phone}"\n- Hoy: ${todayLabel} (${todayISO})\n- Mañana: ${tomorrowISO}\n\nFLUJO A — NUEVA CITA:\n1. get_client → list_services → check_availability → confirmar → book_appointment\n\nFLUJO B — REAGENDAR:\n1. get_client → mostrar citas → pedir cuál → check_availability → confirmar → reschedule_appointment\n\nREGLAS: mensajes cortos, solo español.`,
    }];
  }

  messages.push({ role: "user", content: text });

  const t = Date.now();
  let result: { reply: string; updatedMessages: any[] };
  try {
    result = await runAgentLoop(messages, tenant_id);
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
    ok: true,
    reply: result.reply,
    message_count: result.updatedMessages.length,
    elapsed_ms: Date.now() - t,
    tool_calls: result.updatedMessages
      .filter((m: any) => m.role === "tool" || m.tool_calls?.length)
      .map((m: any) => m.role === "tool" ? `tool_result` : m.tool_calls?.[0]?.function?.name),
  });
}
