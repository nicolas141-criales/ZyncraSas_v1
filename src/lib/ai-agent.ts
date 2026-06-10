// ── Tool definitions (Ollama / OpenAI function-calling format) ─────────────────

export const BOOKING_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_client",
      description:
        "Busca al cliente por su número de teléfono. " +
        "Retorna sus datos y próximas citas si existe. " +
        "SIEMPRE llama primero, antes de cualquier otra acción.",
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

// ── Tool execution (calls internal Zyncra API) ─────────────────────────────────

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
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${secret}`,
      },
      body:   JSON.stringify({ ...args, tenant_id: tenantId }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(`[tool:${name}] error:`, err);
    return { error: `Error ejecutando ${name}: ${String(err)}` };
  }
}

// ── Tool call normalizer ───────────────────────────────────────────────────────
// Handles two formats:
//  A) proper:  msg.tool_calls = [{ function: { name, arguments } }]
//  B) content: msg.content = '{"name":"fn","arguments":{...}}'  (qwen2.5-coder)

function normalizeToolCalls(msg: any): { function: { name: string; arguments: any } }[] {
  if (msg.tool_calls?.length) return msg.tool_calls;

  const raw = (msg.content ?? "").trim();
  if (!raw.startsWith("{") && !raw.startsWith("[")) return [];

  try {
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    const calls = items.filter((x: any) => typeof x.name === "string");
    if (!calls.length) return [];
    return calls.map((c: any) => ({ function: { name: c.name, arguments: c.arguments ?? c.args ?? {} } }));
  } catch {
    return [];
  }
}

// ── Agentic loop ───────────────────────────────────────────────────────────────

export async function runAgentLoop(
  messages: any[],
  tenantId: string,
): Promise<{ reply: string; updatedMessages: any[] }> {
  const ollamaUrl = (process.env.OLLAMA_BASE_URL ?? "http://localhost:11434").replace(/\/$/, "");
  const model     = process.env.OLLAMA_MODEL ?? "qwen3:14b";
  const history   = [...messages];

  for (let round = 0; round < 12; round++) {
    const res = await fetch(`${ollamaUrl}/api/chat`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: history,
        tools:    BOOKING_TOOLS,
        stream:   false,
        think:    false,   // disable extended reasoning — keeps responses fast on CPU
        options: {
          temperature:    0.2,
          top_p:          0.9,
          num_ctx:        32768,
          repeat_penalty: 1.1,
        },
      }),
      signal: AbortSignal.timeout(300_000), // 5 min — large models on CPU can be slow
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[agent round ${round}] Ollama error ${res.status}:`, errText);
      throw new Error(`Ollama ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const msg  = data.message as any;
    console.log(`[agent round ${round}] role=${msg?.role} tool_calls=${msg?.tool_calls?.length ?? 0} content_len=${msg?.content?.length ?? 0}`);
    if (!msg) throw new Error("Ollama no retornó mensaje");

    history.push(msg);

    // Normalize tool calls: some models (qwen2.5-coder) put them in content as JSON
    const toolCalls = normalizeToolCalls(msg);

    // No tool calls → final response
    if (!toolCalls.length) {
      const reply = (msg.content ?? "")
        .replace(/<think>[\s\S]*?<\/think>/gi, "")
        .trim();
      return { reply, updatedMessages: history };
    }

    // Execute every tool call in this round
    for (const tc of toolCalls) {
      const toolName = tc.function?.name ?? "";
      const rawArgs  = tc.function?.arguments ?? {};

      let args: Record<string, unknown>;
      try {
        args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;
      } catch (parseErr) {
        console.error(`[AI tool] JSON.parse failed for ${toolName}:`, rawArgs);
        history.push({ role: "tool", content: JSON.stringify({ error: "Argumentos inválidos" }) });
        continue;
      }

      console.log(`[AI → tool] ${toolName}`, JSON.stringify(args));
      const result = await executeTool(toolName, args, tenantId);
      console.log(`[AI ← tool] ${toolName}`, JSON.stringify(result));

      history.push({
        role:    "tool",
        content: JSON.stringify(result),
      });
    }
  }

  return {
    reply: "Disculpa, no pude completar la acción. ¿Puedes intentarlo de nuevo?",
    updatedMessages: history,
  };
}
