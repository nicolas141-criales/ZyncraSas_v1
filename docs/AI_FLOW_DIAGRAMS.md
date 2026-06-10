# Zyncra AI Booking Assistant — Diagramas de Flujo

---

## 1. Arquitectura general

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          ORACLE CLOUD FREE TIER (ARM)                        │
│                                                                              │
│   ┌─────────┐    ┌──────────────────────────────────────────────────────┐   │
│   │  Nginx  │    │  Docker Network: zyncra_ai_net                       │   │
│   │  :443   ├───►│                                                      │   │
│   └────┬────┘    │  ┌────────────┐   ┌───────────┐   ┌─────────────┐  │   │
│        │         │  │  Zyncra    │   │ OpenClaw  │   │   Ollama    │  │   │
│        │         │  │ (Next.js)  │◄──│  :8080    │──►│   :11434   │  │   │
│        └─────────┼─►│  :3000     │   │           │   │ qwen3:14b  │  │   │
│                  │  └─────┬──────┘   └─────┬─────┘   └─────────────┘  │   │
│                  │        │                │                            │   │
│                  └────────┼────────────────┼────────────────────────────┘   │
└───────────────────────────┼────────────────┼────────────────────────────────┘
                            │ service_role   │ AI_API_SECRET
                            ▼                ▼
                    ┌───────────────────────────────┐
                    │        SUPABASE               │
                    │  PostgreSQL + RLS             │
                    │  appointments / clients       │
                    │  ai_conversations             │
                    │  whatsapp_config              │
                    └───────────────────────────────┘

                    ┌───────────────────────────────┐
WHATSAPP USER ─────►│  WhatsApp Cloud API (Meta)    │
                    └───────────────┬───────────────┘
                                    │ webhook POST
                                    ▼
                            https://your-domain.com
                            /api/whatsapp/webhook
```

---

## 2. Cadena de autenticación

```
┌─────────────────────────────────────────────────────────────────┐
│                     CAPAS DE AUTENTICACIÓN                      │
└─────────────────────────────────────────────────────────────────┘

  WhatsApp Cloud API
        │
        │  HMAC-SHA256 (X-Hub-Signature-256)
        │  Firmado con: WHATSAPP_APP_SECRET
        ▼
  /api/whatsapp/webhook  [Next.js]
        │
        │  Bearer OPENCLAW_API_SECRET
        │  (en Authorization header)
        ▼
  OpenClaw  :8080
        │
        │  Bearer AI_API_SECRET
        │  (en cada tool call hacia Zyncra)
        ▼
  /api/ai/*  [Next.js]
        │
        │  SUPABASE_SERVICE_ROLE_KEY
        │  (bypassa RLS — tenant_id validado manualmente)
        ▼
  Supabase PostgreSQL

  ┌─────────────────────────────────────────────────────────────┐
  │  NOTA: Supabase service_role ignora RLS.                   │
  │  Por eso cada endpoint /api/ai/* valida tenant_id          │
  │  explícitamente antes de cualquier query:                  │
  │                                                            │
  │    .eq("tenant_id", tenant_id)   ← siempre presente       │
  └─────────────────────────────────────────────────────────────┘
```

---

## 3. Flujo completo de un mensaje entrante

```mermaid
sequenceDiagram
    actor U as 👤 Cliente WhatsApp
    participant W as WhatsApp<br/>Cloud API
    participant N as Nginx<br/>:443
    participant WH as Webhook Handler<br/>/api/whatsapp/webhook
    participant DB as Supabase
    participant OC as OpenClaw<br/>:8080
    participant LLM as Ollama<br/>qwen3:14b
    participant ZA as Zyncra AI API<br/>/api/ai/*

    U->>W: "Quiero agendar un corte"
    W->>N: POST /api/whatsapp/webhook<br/>[X-Hub-Signature-256: hmac...]
    N->>WH: Proxy (rate-limit: 60r/m)

    Note over WH: Verificar firma HMAC
    WH->>WH: Extraer phone, text,<br/>phoneNumberId del payload

    WH->>DB: SELECT tenant_id, access_token<br/>FROM whatsapp_config<br/>WHERE phone_number_id = ?
    DB-->>WH: { tenant_id: "abc...", access_token: "EAAx..." }

    WH->>DB: SELECT messages<br/>FROM ai_conversations<br/>WHERE tenant_id=? AND phone=?
    DB-->>WH: [] (nueva conversación)

    Note over WH: Construir array messages:<br/>[{role:"system", content:"tenant_id:abc..."},<br/> {role:"user", content:"Quiero agendar..."}]

    WH->>WH: Lanzar processMessage() async<br/>(retorna 200 a WhatsApp inmediatamente)
    WH-->>W: HTTP 200 OK

    WH->>OC: POST /v1/chat/completions<br/>Authorization: Bearer OPENCLAW_API_SECRET<br/>{ model: "zyncra-booking-assistant",<br/>  messages: [...] }

    OC->>LLM: Inferencia + system prompt<br/>+ tool definitions (tools.yaml)
    LLM-->>OC: tool_call: list_services<br/>{ tenant_id: "abc..." }

    OC->>ZA: POST /api/ai/services<br/>Authorization: Bearer AI_API_SECRET<br/>{ tenant_id: "abc..." }
    ZA->>DB: SELECT id, name, duration_minutes, price<br/>FROM services WHERE tenant_id=?
    DB-->>ZA: [{ id, name, duration_minutes, price }, ...]
    ZA-->>OC: { services: [...] }

    OC->>LLM: Continuar con resultado de tool
    LLM-->>OC: tool_call: check_availability<br/>{ tenant_id, service_id, date }

    OC->>ZA: POST /api/ai/availability<br/>{ tenant_id, service_id, date }
    ZA->>DB: SELECT professional_id, appointment_time<br/>FROM appointments<br/>WHERE tenant_id=? AND date=? AND status≠cancelled
    DB-->>ZA: [{ professional_id, appointment_time }, ...]
    ZA-->>OC: { slots: ["10:00","10:30",...] }

    OC->>LLM: Continuar con disponibilidad real
    LLM-->>OC: Respuesta final en texto:<br/>"Tenemos estos horarios disponibles..."

    OC-->>WH: { choices:[{ message:{ content:"..." } }] }

    WH->>DB: UPSERT ai_conversations<br/>{ tenant_id, phone, messages:[...20 últimos] }

    WH->>W: POST /v20.0/{phone_number_id}/messages<br/>Authorization: Bearer EAAx...<br/>{ to: phone, text: { body: "Tenemos estos horarios..." } }
    W-->>U: 💬 "Tenemos estos horarios disponibles..."
```

---

## 4. Cómo OpenClaw descubre y ejecuta tools

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  CICLO DE TOOL CALLING EN OPENCLAW                          │
└─────────────────────────────────────────────────────────────────────────────┘

  STARTUP
  ───────
  OpenClaw lee tools.yaml en arranque
  → Construye JSON Schema de cada herramienta
  → Lo inyecta en cada llamada al LLM como "tools" parameter

  DESCUBRIMIENTO (compile-time)
  ──────────────────────────────
  tools.yaml                          JSON Schema → LLM
  ┌──────────────────────┐           ┌──────────────────────────────────────┐
  │ - name: check_avail  │  parse    │ {                                    │
  │   description: "..."  │ ──────► │   "type": "function",                │
  │   parameters:        │           │   "function": {                     │
  │     tenant_id: str   │           │     "name": "check_availability",   │
  │     service_id: str  │           │     "description": "...",           │
  │     date: str        │           │     "parameters": { ... }           │
  │   endpoint:          │           │   }                                  │
  │     url: ${ZYNCRA}   │           │ }                                    │
  │     method: POST     │           └──────────────────────────────────────┘
  └──────────────────────┘

  EJECUCIÓN (run-time — por cada tool call del LLM)
  ──────────────────────────────────────────────────

  Ollama devuelve:
  ┌──────────────────────────────────────────────────┐
  │ <tool_call>                                      │
  │ {                                                │
  │   "name": "check_availability",                  │
  │   "arguments": {                                 │
  │     "tenant_id": "abc-123",                      │
  │     "service_id": "svc-456",                     │
  │     "date": "2026-06-20"                         │
  │   }                                              │
  │ }                                                │
  │ </tool_call>                                     │
  └──────────────────────────────────────────────────┘
           │
           │  OpenClaw intercepta el token <tool_call>
           ▼
  Busca en tools.yaml:  name == "check_availability"
           │
           ▼
  Construye HTTP request:
  ┌──────────────────────────────────────────────────┐
  │ POST http://zyncra:3000/api/ai/availability      │
  │ Authorization: Bearer AI_API_SECRET              │
  │ Content-Type: application/json                   │
  │                                                  │
  │ {                                                │
  │   "tenant_id": "abc-123",    ← del LLM           │
  │   "service_id": "svc-456",   ← del LLM           │
  │   "date": "2026-06-20"       ← del LLM           │
  │ }                                                │
  └──────────────────────────────────────────────────┘
           │
           ▼
  Recibe respuesta: { slots: [...] }
           │
           ▼
  Inyecta en conversación:
  ┌──────────────────────────────────────────────────┐
  │ { role: "tool",                                  │
  │   name: "check_availability",                    │
  │   content: '{"slots":[{"time":"10:00",...}]}'    │
  │ }                                                │
  └──────────────────────────────────────────────────┘
           │
           ▼
  Segunda inferencia Ollama → respuesta final en texto
```

---

## 5. Flujo: Identificación del cliente por teléfono

```mermaid
sequenceDiagram
    participant OC as OpenClaw
    participant ZA as /api/ai/client
    participant DB as Supabase

    Note over OC: LLM decide llamar get_client<br/>al inicio de la conversación

    OC->>ZA: POST /api/ai/client<br/>{ phone: "+573001234567", tenant_id: "abc" }

    Note over ZA: Normalización del teléfono:<br/>"+573001234567" → digits: "573001234567"<br/>→ local: "3001234567"<br/>→ col: "573001234567"

    ZA->>DB: SELECT id, name, email, phone FROM clients<br/>WHERE tenant_id='abc'<br/>AND (phone='+573001234567'<br/>     OR phone='3001234567'<br/>     OR phone='573001234567')

    alt Cliente encontrado
        DB-->>ZA: { id, name, email, phone }
        ZA->>DB: SELECT id, date, time, status,<br/>manage_token, services(name), professionals(name)<br/>FROM appointments<br/>WHERE client_id=? AND date≥today<br/>AND status≠cancelled<br/>ORDER BY date LIMIT 5
        DB-->>ZA: [ { id, date, time, service, professional }, ... ]
        ZA-->>OC: { found: true, client: {...},<br/>             appointments: [...] }
        Note over OC: LLM: "Hola Carlos 👋<br/>Veo que tienes cita el viernes<br/>a las 10:00 AM con María.<br/>¿En qué te puedo ayudar?"
    else Cliente no encontrado
        DB-->>ZA: null
        ZA-->>OC: { found: false, client: null,<br/>             appointments: [] }
        Note over OC: LLM: "¡Hola! Es tu primera vez<br/>con nosotros. ¿Cómo te llamas?"
    end
```

---

## 6. Flujo completo: Creación de cita

```mermaid
flowchart TD
    A[Cliente: quiero agendar] --> B[get_client por teléfono]
    B --> C{¿Cliente existe?}
    C -->|No| D[LLM pide nombre al cliente]
    D --> E[Guarda nombre para crear cliente]
    C -->|Sí| F[LLM muestra citas existentes si las hay]

    E --> G[list_services]
    F --> G
    G --> H[LLM presenta servicios con precio y duración]
    H --> I[Cliente elige servicio]

    I --> J[LLM pregunta fecha preferida]
    J --> K[check_availability\ntenant_id + service_id + date]
    K --> L{¿Hay slots?}
    L -->|No| M[LLM sugiere otra fecha]
    M --> J
    L -->|Sí| N[LLM presenta hasta 6 horarios]
    N --> O[Cliente elige horario]

    O --> P[LLM confirma resumen:\nServicio + Profesional + Fecha + Hora]
    P --> Q{¿Cliente confirma?}
    Q -->|No| R[LLM pregunta qué cambiar]
    R --> I
    Q -->|Sí| S[book_appointment]

    S --> T{¿client_id existe?}
    T -->|Sí| U[INSERT appointments]
    T -->|No| V[INSERT clients primero]
    V --> U

    U --> W{¿Conflicto de horario?}
    W -->|409 Conflict| X[LLM: ese horario ya no está\ndisponible, elige otro]
    X --> N
    W -->|Éxito| Y[Retorna appointment_id + manage_token]

    Y --> Z[fire-and-forget: email confirmación]
    Y --> AA[LLM: ✅ ¡Cita agendada!\nCorte de Cabello con María\nViernes 20 jun, 10:00 AM]
```

---

## 7. Flujo completo: Reprogramación

```mermaid
sequenceDiagram
    actor U as Cliente
    participant OC as OpenClaw/LLM
    participant ZA as Zyncra API
    participant DB as Supabase
    participant EM as Email (Resend)

    U->>OC: "Quiero cambiar mi cita del viernes"

    OC->>ZA: POST /api/ai/client<br/>{ phone, tenant_id }
    ZA->>DB: SELECT appointments WHERE client_id=?<br/>AND date≥today AND status≠cancelled
    DB-->>ZA: [{ id: "apt-789", date: "2026-06-20",<br/>             time: "10:00", service: "Corte" }]
    ZA-->>OC: { found: true, appointments: [...] }

    OC->>U: "Tienes una cita el viernes 20 a las 10:00 AM.<br/>¿A qué fecha/hora quieres cambiarla?"

    U->>OC: "El lunes a las 3 de la tarde"

    OC->>ZA: POST /api/ai/availability<br/>{ tenant_id, service_id, date: "2026-06-22" }
    ZA->>DB: SELECT booked slots for professional<br/>on 2026-06-22
    DB-->>ZA: { slots: [..."15:00": free ✓"...] }
    ZA-->>OC: { slots: [{time:"15:00", professional_id, professional_name}] }

    OC->>U: "El lunes 22 a las 3:00 PM está disponible<br/>con María. ¿Confirmas el cambio?"

    U->>OC: "Sí, confirmo"

    OC->>ZA: POST /api/ai/reschedule<br/>{ appointment_id: "apt-789",<br/>  date: "2026-06-22", time: "15:00",<br/>  tenant_id: "abc" }

    ZA->>DB: SELECT appointment WHERE id=? AND tenant_id=?
    DB-->>ZA: appointment found (status: pending)

    ZA->>DB: SELECT conflicto: appointment<br/>WHERE professional_id=? AND date=? AND time=?<br/>AND status≠cancelled AND id≠apt-789
    DB-->>ZA: null (libre ✓)

    ZA->>DB: UPDATE appointments SET<br/>date="2026-06-22", time="15:00:00",<br/>status="pending"<br/>WHERE id="apt-789"
    DB-->>ZA: OK

    ZA->>EM: fire-and-forget POST /api/send-confirmation<br/>{ type: "modification", email, date, time, manageToken }
    ZA-->>OC: { ok: true }

    OC->>U: "📅 ¡Listo! Tu cita fue cambiada al<br/>lunes 22 de junio a las 3:00 PM<br/>con María. Te envié un email de confirmación."
```

---

## 8. Flujo completo: Cancelación

```mermaid
sequenceDiagram
    actor U as Cliente
    participant OC as OpenClaw/LLM
    participant ZA as Zyncra API
    participant DB as Supabase
    participant EM as Email (Resend)

    U->>OC: "Cancela mi cita"

    OC->>ZA: POST /api/ai/client { phone, tenant_id }
    ZA->>DB: SELECT appointments (upcoming)
    DB-->>ZA: [{ id:"apt-789", date:"2026-06-20",<br/>             time:"10:00", service:"Corte" }]
    ZA-->>OC: { appointments: [...] }

    OC->>U: "Tienes una cita el viernes 20 a las 10:00 AM<br/>para Corte de Cabello con María.<br/>¿Confirmas la cancelación? ❌"

    U->>OC: "Sí"

    OC->>ZA: POST /api/ai/cancel<br/>{ appointment_id: "apt-789", tenant_id: "abc" }

    ZA->>DB: SELECT appointment WHERE id=? AND tenant_id=?
    DB-->>ZA: { status: "pending" } (no cancelada aún ✓)

    ZA->>DB: UPDATE appointments SET status="cancelled"<br/>WHERE id="apt-789"
    DB-->>ZA: OK

    ZA->>EM: fire-and-forget POST /api/send-confirmation<br/>{ type: "cancellation", email, date, time }
    Note over EM: Email sin botón CTA<br/>Cinta gris (#374151)

    ZA-->>OC: { ok: true, cancelled: true }

    OC->>U: "❌ Tu cita del viernes 20 de junio<br/>a las 10:00 AM fue cancelada.<br/>Te llegará un email de confirmación.<br/>¡Cuando quieras puedes reagendar!"
```

---

## 9. Tenant_id a través del sistema

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    PROPAGACIÓN DEL TENANT_ID                                 │
└──────────────────────────────────────────────────────────────────────────────┘

  1. IDENTIFICACIÓN (Webhook)
  ───────────────────────────
  WhatsApp payload contiene:
    value.metadata.phone_number_id = "109876543210"

  Webhook consulta:
    SELECT tenant_id, access_token
    FROM whatsapp_config
    WHERE phone_number_id = "109876543210"
    → tenant_id = "abc-123-def-456"

  2. INYECCIÓN EN CONTEXTO (Webhook → OpenClaw)
  ──────────────────────────────────────────────
  Si es nueva conversación, se crea system message:
  {
    role: "system",
    content: "...tenant_id: \"abc-123-def-456\".
              Cuando uses herramientas siempre incluye
              tenant_id: \"abc-123-def-456\"."
  }

  Este message queda persistido en ai_conversations
  y se incluye en CADA llamada a OpenClaw.

  3. EXTRACCIÓN POR EL LLM (OpenClaw → Zyncra)
  ──────────────────────────────────────────────
  El LLM lee el tenant_id del system message
  y lo incluye en cada tool call:

  check_availability({ tenant_id: "abc-123-def-456", ... })
  book_appointment({   tenant_id: "abc-123-def-456", ... })
  cancel_appointment({ tenant_id: "abc-123-def-456", ... })

  4. VALIDACIÓN EN API (Zyncra)
  ──────────────────────────────
  Cada endpoint /api/ai/* valida:

  .eq("service_id", service_id).eq("tenant_id", tenant_id)
                                 ↑
                    Cross-tenant access imposible:
                    aunque el LLM enviara tenant_id incorrecto,
                    la query no devolvería datos de otro negocio.

  5. AISLAMIENTO EN SUPABASE
  ────────────────────────────
  Aunque se usa service_role (bypassa RLS),
  el WHERE tenant_id = ? garantiza que:

  ┌─────────────────────────────────────────────────────┐
  │  Negocio A (tenant aaa)  │  Negocio B (tenant bbb)  │
  │  ─────────────────────── │  ───────────────────────  │
  │  Solo ve sus citas       │  Solo ve sus citas        │
  │  Solo ve sus clientes    │  Solo ve sus clientes     │
  │  Solo sus servicios      │  Solo sus servicios       │
  └─────────────────────────────────────────────────────┘
```

---

## 10. Resumen de endpoints y seguridad

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ENDPOINT                     │ AUTH              │ TENANT VALIDATION        │
├───────────────────────────────┼───────────────────┼──────────────────────────┤
│  GET /api/whatsapp/webhook    │ hub.verify_token  │ —                        │
│  POST /api/whatsapp/webhook   │ HMAC signature    │ vía whatsapp_config table│
├───────────────────────────────┼───────────────────┼──────────────────────────┤
│  POST /api/ai/availability    │ AI_API_SECRET     │ .eq("tenant_id", ?)      │
│  POST /api/ai/services        │ AI_API_SECRET     │ .eq("tenant_id", ?)      │
│  POST /api/ai/professionals   │ AI_API_SECRET     │ .eq("tenant_id", ?)      │
│  POST /api/ai/client          │ AI_API_SECRET     │ .eq("tenant_id", ?)      │
│  POST /api/ai/book            │ AI_API_SECRET     │ .eq("tenant_id", ?) x2   │
│  POST /api/ai/reschedule      │ AI_API_SECRET     │ .eq("tenant_id", ?)      │
│  POST /api/ai/cancel          │ AI_API_SECRET     │ .eq("tenant_id", ?)      │
├───────────────────────────────┼───────────────────┼──────────────────────────┤
│  POST /api/send-confirmation  │ internal only     │ ninguno (email only)     │
│  GET/POST /api/manage/[token] │ manage_token UUID │ vía manage_token         │
│  GET /api/cron/reminders      │ CRON_SECRET       │ itera todos los tenants  │
└──────────────────────────────────────────────────────────────────────────────┘
```
