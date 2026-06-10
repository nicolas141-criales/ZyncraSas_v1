import { callLLM } from "./llm-provider";

// ── Tool definitions (provider-agnostic — same format for Ollama and OpenAI) ──

export const BOOKING_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_client",
      description:
        "Busca al cliente por su número de teléfono. " +
        "Retorna sus datos y próximas citas activas. " +
        "OBLIGATORIO: llama esta herramienta como PRIMERA ACCIÓN ante cualquier mensaje del usuario. " +
        "El teléfono ya está disponible en el contexto del sistema. " +
        "NUNCA pidas el teléfono ni el nombre al cliente antes de llamar esta herramienta.",
      parameters: {
        type: "object",
        required: ["tenant_id", "phone"],
        properties: {
          tenant_id: { type: "string" },
          phone:     { type: "string", description: "Número de teléfono del cliente" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_services",
      description:
        "Lista los servicios del negocio con id, nombre, duración y precio. " +
        "Úsala para obtener el service_id correcto cuando el cliente nombra un servicio.",
      parameters: {
        type: "object",
        required: ["tenant_id"],
        properties: {
          tenant_id: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_availability",
      description:
        "Consulta horarios disponibles para un servicio en una fecha. " +
        "Retorna slots con time (HH:MM), professional_id y professional_name. " +
        "SIEMPRE llama antes de agendar — nunca inventes disponibilidad.",
      parameters: {
        type: "object",
        required: ["tenant_id", "service_id", "date"],
        properties: {
          tenant_id:       { type: "string" },
          service_id:      { type: "string" },
          date:            { type: "string", description: "YYYY-MM-DD" },
          professional_id: { type: "string", description: "Filtrar por profesional (opcional)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "book_appointment",
      description:
        "Crea la cita en el sistema. " +
        "SOLO llama después de que el cliente confirme explícitamente. " +
        "Usa service_id, professional_id, date y time de los pasos anteriores.",
      parameters: {
        type: "object",
        required: ["tenant_id", "service_id", "professional_id", "date", "time"],
        properties: {
          tenant_id:       { type: "string" },
          service_id:      { type: "string" },
          professional_id: { type: "string" },
          date:            { type: "string", description: "YYYY-MM-DD" },
          time:            { type: "string", description: "HH:MM formato 24h (ej: 15:00)" },
          client_id:       { type: "string", description: "ID del cliente si ya existe" },
          client_phone:    { type: "string", description: "Teléfono si el cliente no existe" },
          client_name:     { type: "string", description: "Nombre si el cliente es nuevo" },
          client_email:    { type: "string", description: "Email del cliente (opcional)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reschedule_appointment",
      description:
        "Mueve una cita existente a una nueva fecha y hora. " +
        "SOLO llama después de que el cliente confirme explícitamente la nueva fecha y hora. " +
        "El appointment_id viene del array appointments que retorna get_client.",
      parameters: {
        type: "object",
        required: ["tenant_id", "appointment_id", "date", "time"],
        properties: {
          tenant_id:      { type: "string" },
          appointment_id: { type: "string", description: "ID de la cita a reagendar (de get_client)" },
          date:           { type: "string", description: "Nueva fecha YYYY-MM-DD" },
          time:           { type: "string", description: "Nueva hora HH:MM en formato 24h" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancel_appointment",
      description:
        "Cancela una cita existente. " +
        "SOLO llama después de que el cliente confirme explícitamente que desea cancelar. " +
        "El appointment_id viene del array appointments que retorna get_client.",
      parameters: {
        type: "object",
        required: ["tenant_id", "appointment_id"],
        properties: {
          tenant_id:      { type: "string" },
          appointment_id: { type: "string", description: "ID de la cita a cancelar (de get_client)" },
        },
      },
    },
  },
];

// ── Tool execution (calls internal Zyncra API endpoints) ──────────────────────

const TOOL_PATHS: Record<string, string> = {
  get_client:             "/api/ai/client",
  list_services:          "/api/ai/services",
  list_professionals:     "/api/ai/professionals",
  check_availability:     "/api/ai/availability",
  book_appointment:       "/api/ai/book",
  reschedule_appointment: "/api/ai/reschedule",
  cancel_appointment:     "/api/ai/cancel",
};

async function executeTool(
  name: string,
  args: Record<string, unknown>,
  tenantId: string,
): Promise<unknown> {
  const path = TOOL_PATHS[name];
  if (!path) return { error: `Tool desconocida: ${name}` };

  const base   = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const secret = process.env.AI_API_SECRET ?? "";

  try {
    const res = await fetch(`${base}${path}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body:    JSON.stringify({ ...args, tenant_id: tenantId }),
      signal:  AbortSignal.timeout(30_000),
    });
    return await res.json();
  } catch (err) {
    console.error(`[tool:${name}] error:`, err);
    return { error: `Error ejecutando ${name}: ${String(err)}` };
  }
}

// ── Agentic loop ───────────────────────────────────────────────────────────────

export interface AgentResult {
  reply: string;
  updatedMessages: any[];
  usage: { promptTokens: number; completionTokens: number };
}

export async function runAgentLoop(
  messages: any[],
  tenantId: string,
  providerOverride?: string,
): Promise<AgentResult> {
  const history: any[]  = [...messages];
  let promptTokens      = 0;
  let completionTokens  = 0;

  for (let round = 0; round < 12; round++) {
    const response = await callLLM(history, BOOKING_TOOLS, providerOverride);
    promptTokens     += response.usage.promptTokens;
    completionTokens += response.usage.completionTokens;

    console.log(`[agent round ${round}] tool_calls=${response.toolCalls.length} content_len=${response.content?.length ?? 0} prompt_tok=${response.usage.promptTokens} compl_tok=${response.usage.completionTokens}`);

    // Store in internal format: arguments as object, id present, tool_call_id present.
    // llm-provider converts to each provider's wire format before sending.
    const assistantMsg: any = { role: "assistant", content: response.content ?? "" };
    if (response.toolCalls.length) {
      assistantMsg.tool_calls = response.toolCalls.map(tc => ({
        id:       tc.id,
        function: { name: tc.function.name, arguments: tc.function.arguments },
      }));
    }
    history.push(assistantMsg);

    // No tool calls → final text response
    if (!response.toolCalls.length) {
      const reply = (response.content ?? "")
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .trim();
      return { reply, updatedMessages: history, usage: { promptTokens, completionTokens } };
    }

    // Execute each tool call and push results
    for (const tc of response.toolCalls) {
      console.log(`[AI → tool] ${tc.function.name}`, JSON.stringify(tc.function.arguments));
      const result = await executeTool(tc.function.name, tc.function.arguments, tenantId);
      console.log(`[AI ← tool] ${tc.function.name}`, JSON.stringify(result));

      history.push({
        role:         "tool",
        tool_call_id: tc.id,   // Required by Groq; ignored by Ollama
        content:      JSON.stringify(result),
      });
    }
  }

  return {
    reply:           "Disculpa, no pude completar la acción. ¿Puedes intentarlo de nuevo?",
    updatedMessages: history,
    usage:           { promptTokens, completionTokens },
  };
}
