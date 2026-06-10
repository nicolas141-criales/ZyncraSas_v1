# ZyncraSas v1

SaaS B2B para salones de belleza, barberías, spas y negocios similares en Colombia. Permite a los dueños gestionar citas, clientes, pagos, comisiones, facturación electrónica, marketing por WhatsApp y rentabilidad del negocio.

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16.2.4 + React 19.2.4 |
| Lenguaje | TypeScript (strict) |
| Estilos | Tailwind CSS v4 + CSS Modules |
| DB / Auth | Supabase (PostgreSQL + RLS + Storage) |
| Email | Resend API |
| Facturación | Factus API (Colombia) |
| Deploy | Vercel |
| Node | 22.x |

---

## Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/              # Login y Register
│   ├── (zyncra)/            # Landing pública: home, blog, features, pricing, reviews
│   ├── admin/               # Panel del tenant (dueño del negocio)
│   ├── api/                 # API routes: factus, send-confirmation, manage/[token], cron/reminders
│   ├── book/[tenantId]/     # Página de reserva pública para clientes
│   ├── manage/[token]/      # Gestión de cita por cliente (cancelar/reprogramar)
│   ├── platform/            # Super-admin de Zyncra (billing, clientes, planes)
│   └── review/[tenantId]/   # Formulario de reseña
├── components/
│   └── landing/             # Componentes de la landing page
└── lib/
    ├── email.ts              # Templates HTML de recordatorios (24h, 2h, post-visita)
    ├── supabase.ts           # Cliente Supabase (browser)
    └── supabase-server.ts    # Cliente Supabase (server)

supabase/
├── migrations/              # Migraciones SQL
└── schema.sql               # Esquema actual completo
```

---

## Módulos del admin panel

| Ruta | Descripción |
|------|-------------|
| `/admin` | Dashboard con KPIs, sparklines, filtros de fecha, rendimiento por staff, top servicios |
| `/admin/calendar` | Calendario de citas + modal nueva cita + notificaciones de email automáticas |
| `/admin/pos` | Punto de venta |
| `/admin/caja` | Apertura/cierre de caja con desglose por método de pago |
| `/admin/invoices` | Factura electrónica vía Factus API (Colombia) |
| `/admin/commissions` | Reglas de comisiones por profesional |
| `/admin/profitability` | Rentabilidad: costos fijos, plantillas, pagos de comisiones, ventas POS |
| `/admin/clients` | CRM básico de clientes |
| `/admin/services` | CRUD de servicios + campos personalizados |
| `/admin/professionals` | Equipo + horarios por profesional |
| `/admin/reminders` | Recordatorios automáticos por email (24h, 2h, post-visita) vía cron |
| `/admin/whatsapp` | Campañas de marketing WhatsApp por segmento |
| `/admin/reviews-google` | Solicitar reseñas de Google a clientes |
| `/admin/reviews-site` | Reseñas internas del negocio |
| `/admin/branding` | Logo, colores, imagen de portada |
| `/admin/settings` | Configuración del negocio (horarios, notificaciones) |
| `/admin/custom-fields` | Campos personalizados para clientes/citas |

---

## Sistema de email

Todos los correos usan un diseño minimalista con "la cinta" (stripe de 7px) como firma visual de marca.

### Correos de confirmación (`/api/send-confirmation`)

Enviados automáticamente vía Resend desde `bookings@zyncra.app`. La cinta siempre usa el gradiente de Zyncra (`#fb0f05 → #0027fe`).

| Tipo (`type`) | Cuándo se envía | CTA |
|---------------|----------------|-----|
| `confirmation` | Cliente reserva en `/book/[tenantId]` o admin crea cita desde calendario | Gestionar + Reagendar + Cancelar |
| `modification` | Admin edita fecha/hora · Cliente reprograma desde `/manage/[token]` | Gestionar + Reagendar + Cancelar |
| `cancellation` | Admin cancela cita · Cliente cancela desde `/manage/[token]` | Ninguno (cinta gris) |

### Recordatorios automáticos (`/api/cron/reminders`)

Cron job de Vercel (cada hora). La cinta usa `primary_color` del tenant, el logo del negocio se muestra en el header. Zyncra solo aparece en el pie.

| Template | Cuándo | Descripción |
|----------|--------|-------------|
| `24h` | 24 horas antes | "Tienes cita mañana" |
| `2h` | 2 horas antes | "¡Ya casi es tu hora!" |
| `post` | 1 hora después | "¿Cómo estuvo tu visita?" con bloque de estrellas |

---

## Base de datos

Tablas principales:

| Tabla | Descripción |
|-------|-------------|
| `tenants` | Negocios registrados |
| `services` | Servicios ofrecidos por el negocio |
| `clients` | Clientes del negocio |
| `professionals` | Equipo / profesionales |
| `appointments` | Citas — `manage_token` UUID habilita gestión sin autenticación |
| `branding` | Logo, colores (`primary_color`, `logo_url`), portada del negocio |
| `business_profiles` | Perfil del negocio (onboarding: tipo, tamaño, objetivos) |
| `cash_sessions` | Sesiones de apertura/cierre de caja |
| `commissions` | Reglas de comisiones por profesional y servicio |
| `commission_payments` | Pagos de comisiones realizados |
| `business_costs` | Costos fijos/variables del negocio |
| `business_cost_templates` | Plantillas de costos reutilizables |
| `pos_sales` | Ventas desde el punto de venta |
| `wa_templates` | Plantillas de mensajes WhatsApp |
| `wa_campaigns` | Campañas de marketing WhatsApp |
| `reminder_settings` | Configuración de recordatorios (qué templates enviar) |
| `reminder_logs` | Historial de recordatorios — `source`: `"auto"` (cron) o `"manual"` |

Migraciones en `supabase/migrations/` — aplica en orden cronológico.

---

## Variables de entorno

Crea un archivo `.env.local` con:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=

# Email (Resend)
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Cron (Vercel)
CRON_SECRET=

# Facturación (Factus - Colombia)
FACTUS_CLIENT_ID=
FACTUS_CLIENT_SECRET=
FACTUS_BASE_URL=
```

---

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

```bash
# Build de producción
npm run build

# Lint
npm run lint
```

---

## API Routes

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/factus` | POST | Emitir factura electrónica vía Factus |
| `/api/send-confirmation` | POST | Enviar email de confirmación, modificación o cancelación de cita |
| `/api/manage/[token]` | GET | Obtener datos de cita por token público |
| `/api/manage/[token]` | POST | Cancelar o reprogramar cita (acción del cliente) |
| `/api/cron/reminders` | GET | Cron job de recordatorios automáticos (autenticado con `CRON_SECRET`) |
| `/api/reminders/send` | POST | Enviar recordatorio manual desde el panel |

---

## Flujos principales

**Booking público:**  
`/book/[tenantId]` → seleccionar profesional → fecha → hora → confirmar → email de confirmación automático

**Gestión de cita por cliente:**  
Link en email → `/manage/[token]` → cancelar (email de cancelación) o reprogramar (email de modificación)

**Admin crea cita:**  
Calendario → Nueva cita → guardar → email de confirmación al cliente

**Admin modifica cita:**  
Calendario → editar fecha/hora → guardar → email de modificación al cliente

**Admin cancela cita:**  
Calendario → cambiar status a cancelada → guardar → email de cancelación al cliente

**Cobro de cita:**  
Calendario → botón "Cobrar" → pre-carga en POS → cobro → cita marcada como completada → ingreso automático en Caja

**Facturación electrónica:**  
`/admin/invoices` → crear factura → envío vía Factus API → DIAN (Colombia)

**Recordatorios automáticos:**  
Vercel Cron (cada hora) → `/api/cron/reminders` → busca citas en ventanas 24h/2h/post → envía email con diseño de marca del tenant

---

## Notas de arquitectura

- **Multi-tenant con RLS**: cada negocio tiene su propio espacio aislado en la DB mediante Row Level Security de Supabase.
- **Auth por tenant**: el dueño se autentica con Supabase Auth; el `tenant_id` se asocia al usuario en la tabla `tenants`.
- **`manage_token`**: UUID en cada cita que permite al cliente cancelar/reprogramar sin estar autenticado.
- **Diseño de email**: "la cinta" (7px horizontal) es la firma visual. En confirmaciones usa el gradiente de Zyncra; en recordatorios usa el `primary_color` del tenant.
- **Next.js 16 breaking changes**: esta versión tiene cambios de API respecto a versiones anteriores. Leer docs en `node_modules/next/dist/docs/` antes de modificar configuración o estructura de rutas.
- **Moneda**: pesos colombianos (COP), formato `$ 1.000.000`.
- **Zona horaria**: Colombia (America/Bogota, UTC-5).
