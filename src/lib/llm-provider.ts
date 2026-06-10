// LLM provider abstraction — Ollama and Groq (OpenAI-compatible)
//
// Internal history format (stored in DB and used in runAgentLoop):
//   assistant: { role, content, tool_calls: [{ id, function: { name, arguments: object } }] }
//   tool:      { role: "tool", tool_call_id, content }
//
// Each provider converts this format before sending (Ollama wants args as object;
// Groq requires args as JSON string + tool_call_id).

let _tcCounter = 0;
function genId(): string { return `tc${++_tcCounter}`; }

export interface NormalizedToolCall {
  id: string;
  function: { name: string; arguments: Record<string, unknown> };
}

export interface LLMResponse {
  role: "assistant";
  content: string | null;
  toolCalls: NormalizedToolCall[];
  usage: { promptTokens: number; completionTokens: number };
}

// ── Message format converters ─────────────────────────────────────────────────

// Ollama /api/chat: tool_calls.arguments as object, no id/type, no tool_call_id
function toOllamaMessages(messages: any[]): any[] {
  return messages.map(m => {
    if (m.role === "assistant" && m.tool_calls?.length) {
      return {
        role:    "assistant",
        content: m.content ?? "",
        tool_calls: (m.tool_calls as any[]).map(tc => ({
          function: {
            name:      tc.function.name,
            arguments: typeof tc.function.arguments === "string"
              ? JSON.parse(tc.function.arguments)
              : (tc.function.arguments ?? {}),
          },
        })),
      };
    }
    if (m.role === "tool") {
      return { role: "tool", content: m.content };
    }
    return m;
  });
}

// Groq/OpenAI: tool_calls.arguments as JSON string, id + type required, tool_call_id required
function toGroqMessages(messages: any[]): any[] {
  return messages.map(m => {
    if (m.role === "assistant" && m.tool_calls?.length) {
      return {
        role:    "assistant",
        content: m.content ?? null,
        tool_calls: (m.tool_calls as any[]).map(tc => ({
          id:   tc.id ?? genId(),
          type: "function",
          function: {
            name:      tc.function.name,
            arguments: typeof tc.function.arguments === "string"
              ? tc.function.arguments
              : JSON.stringify(tc.function.arguments ?? {}),
          },
        })),
      };
    }
    if (m.role === "tool") {
      return {
        role:         "tool",
        tool_call_id: m.tool_call_id ?? genId(),
        content:      m.content,
      };
    }
    return m;
  });
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function fetchWithRetry(url: string, headers: Record<string, string>, body: string): Promise<any> {
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 5000));
    const res = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(300_000),
    });
    if (res.ok) return res.json();
    const errText = await res.text();
    console.error(`[llm] attempt ${attempt + 1} failed — ${res.status}: ${errText.slice(0, 200)}`);
    if (attempt === 1) throw new Error(`LLM ${res.status}: ${errText.slice(0, 200)}`);
  }
}

function parseArgs(raw: unknown): Record<string, unknown> {
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return (raw as Record<string, unknown>) ?? {};
}

// Fallback: some Ollama models (qwen2.5-coder) emit tool calls as JSON in content
function extractContentToolCalls(content: string | null): NormalizedToolCall[] {
  const raw = (content ?? "").trim();
  if (!raw.startsWith("{") && !raw.startsWith("[")) return [];
  try {
    const parsed = JSON.parse(raw);
    const items  = Array.isArray(parsed) ? parsed : [parsed];
    const calls  = items.filter((x: any) => typeof x.name === "string");
    if (!calls.length) return [];
    return calls.map((c: any) => ({
      id:       genId(),
      function: { name: c.name, arguments: c.arguments ?? c.args ?? {} },
    }));
  } catch { return []; }
}

// ── Provider implementations ──────────────────────────────────────────────────

async function callOllama(messages: any[], tools: any[]): Promise<LLMResponse> {
  const url   = `${(process.env.OLLAMA_BASE_URL ?? "http://localhost:11434").replace(/\/$/, "")}/api/chat`;
  const model = process.env.OLLAMA_MODEL ?? "qwen3:8b";

  const data = await fetchWithRetry(url, { "Content-Type": "application/json" }, JSON.stringify({
    model,
    messages: toOllamaMessages(messages),
    tools,
    stream: false,
    think:  false,
    options: { temperature: 0.2, top_p: 0.9, num_ctx: 32768, repeat_penalty: 1.1 },
  }));

  const msg = data.message ?? {};

  let toolCalls: NormalizedToolCall[] = (msg.tool_calls ?? []).map((tc: any) => ({
    id:       genId(),
    function: { name: tc.function?.name ?? "", arguments: parseArgs(tc.function?.arguments) },
  }));
  if (!toolCalls.length) toolCalls = extractContentToolCalls(msg.content);

  return {
    role:      "assistant",
    content:   msg.content ?? null,
    toolCalls,
    usage: {
      promptTokens:     data.prompt_eval_count ?? 0,
      completionTokens: data.eval_count        ?? 0,
    },
  };
}

async function callGroq(messages: any[], tools: any[]): Promise<LLMResponse> {
  const apiKey = process.env.GROQ_API_KEY ?? "";
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

  const data = await fetchWithRetry(
    "https://api.groq.com/openai/v1/chat/completions",
    { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    JSON.stringify({ model, messages: toGroqMessages(messages), tools, stream: false, temperature: 0.2, top_p: 0.9 }),
  );

  const msg = data.choices?.[0]?.message ?? {};

  const toolCalls: NormalizedToolCall[] = (msg.tool_calls ?? []).map((tc: any) => ({
    id:       tc.id ?? genId(),
    function: { name: tc.function?.name ?? "", arguments: parseArgs(tc.function?.arguments) },
  }));

  return {
    role:      "assistant",
    content:   msg.content ?? null,
    toolCalls,
    usage: {
      promptTokens:     data.usage?.prompt_tokens     ?? 0,
      completionTokens: data.usage?.completion_tokens ?? 0,
    },
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function callLLM(
  messages: any[],
  tools: any[],
  providerOverride?: string,
): Promise<LLMResponse> {
  const provider = (providerOverride ?? process.env.LLM_PROVIDER ?? "ollama").toLowerCase();
  console.log(`[llm] provider=${provider}`);
  return provider === "groq" ? callGroq(messages, tools) : callOllama(messages, tools);
}
