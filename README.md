# ZyncraSas v1

SaaS B2B para salones de belleza, barberías, spas y negocios similares en Colombia. Permite a los dueños gestionar citas, clientes, pagos, comisiones, facturación electrónica y marketing por WhatsApp.

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
│   ├── api/                 # API routes: factus, send-confirmation, manage/[token]
│   ├── book/[tenantId]/     # Página de reserva pública para clientes
│   ├── manage/[token]/      # Gestión de cita por cliente (cancelar/reprogramar)
│   ├── platform/            # Super-admin de Zyncra (billing, clientes, planes)
│   └── review/[tenantId]/   # Formulario de reseña
├── components/
│   └── landing/             # Componentes de la landing page
└── lib/
    ├── supabase.ts           # Cliente Supabase (browser)
    └── supabase-server.ts    # Cliente Supabase (server)

supabase/
├── migrations/              # 10 migraciones SQL
└── schema.sql               # Esquema actual completo
```

---

## Módulos del admin panel

| Ruta | Descripción |
|------|-------------|
| `/admin` | Dashboard con KPIs, sparklines, filtros de fecha, rendimiento por staff, top servicios |
| `/admin/calendar` | Calendario de citas + modal nueva cita |
| `/admin/pos` | Punto de venta |
| `/admin/caja` | Apertura/cierre de caja con desglose por método de pago |
| `/admin/invoices` | Factura electrónica vía Factus API (Colombia) |
| `/admin/commissions` | Reglas de comisiones por profesional |
| `/admin/clients` | CRM básico de clientes |
| `/admin/services` | CRUD de servicios + campos personalizados |
| `/admin/professionals` | Equipo + horarios por profesional |
| `/admin/reminders` | Recordatorios por WhatsApp antes de la cita (multi-plantilla, multi-momento) |
| `/admin/whatsapp` | Campañas de marketing WhatsApp por segmento |
| `/admin/reviews-google` | Solicitar reseñas de Google a clientes |
| `/admin/reviews-site` | Reseñas internas del negocio |
| `/admin/branding` | Logo, colores, imagen de portada |
| `/admin/settings` | Configuración del negocio (horarios, notificaciones) |
| `/admin/custom-fields` | Campos personalizados para clientes/citas |

---

## Base de datos

Tablas principales:

| Tabla | Descripción |
|-------|-------------|
| `tenants` | Negocios registrados |
| `services` | Servicios ofrecidos por el negocio |
| `clients` | Clientes del negocio |
| `professionals` | Equipo / profesionales |
| `appointments` | Citas (status: pending / confirmed / cancelled / no_show / completed) |
| `branding` | Logo, colores, portada del negocio |
| `business_profiles` | Perfil del negocio (onboarding: tipo, tamaño, objetivos) |
| `cash_sessions` | Sesiones de apertura/cierre de caja |
| `commissions` | Reglas de comisiones por profesional y servicio |
| `wa_templates` | Plantillas de mensajes WhatsApp |
| `wa_campaigns` | Campañas de marketing WhatsApp |
| `reminder_settings` | Configuración de recordatorios automáticos |
| `reminder_logs` | Historial de recordatorios enviados |

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

| Ruta | Descripción |
|------|-------------|
| `POST /api/factus` | Emitir factura electrónica vía Factus |
| `POST /api/send-confirmation` | Enviar email de confirmación de cita |
| `GET/POST /api/manage/[token]` | Gestión pública de cita por token (cancelar/reprogramar) |

---

## Scripts de utilidad

Scripts en la raíz para setup y pruebas locales:

```bash
node seed.js                  # Seed de datos de prueba
node create-test-tenant.js    # Crear tenant de prueba
node create-test-user.js      # Crear usuario de prueba
node insert-tenant.js         # Insertar tenant manualmente
node test-db.js               # Verificar conexión a DB
```

---

## Flujos principales

**Booking público:**  
`/book/[tenantId]` → seleccionar profesional → fecha → hora → confirmar → email de confirmación

**Gestión de cita por cliente:**  
Link en email → `/manage/[token]` → cancelar o reprogramar

**Cobro de cita:**  
Calendario → botón "Cobrar" → pre-carga en POS → cobro → cita marcada como completada → ingreso automático en Caja

**Facturación electrónica:**  
`/admin/invoices` → crear factura → envío vía Factus API → DIAN (Colombia)

---

## Notas de arquitectura

- **Multi-tenant con RLS**: cada negocio tiene su propio espacio aislado en la DB mediante Row Level Security de Supabase.
- **Auth por tenant**: el dueño se autentica con Supabase Auth; el `tenant_id` se asocia al usuario en la tabla `tenants`.
- **Next.js 16 breaking changes**: esta versión tiene cambios de API respecto a versiones anteriores. Leer docs en `node_modules/next/dist/docs/` antes de modificar configuración o estructura de rutas.
- **Moneda**: pesos colombianos (COP), formato `$ 1.000.000`.
- **Zona horaria**: Colombia (America/Bogota, UTC-5).
