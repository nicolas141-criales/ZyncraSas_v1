-- =====================================================================
-- BookSalon - Migraciones de Base de Datos
-- Ejecutar en el SQL Editor de Supabase
-- =====================================================================

-- ─── TABLA: branding ───────────────────────────────────────────────
-- Almacena la personalización visual por tenant (logo, colores, fondo)
CREATE TABLE IF NOT EXISTS public.branding (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id             uuid NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  business_name         text NOT NULL DEFAULT 'Mi Salón',
  logo_url              text,
  primary_color         text NOT NULL DEFAULT '#6366f1',
  secondary_color       text NOT NULL DEFAULT '#a78bfa',
  background_image_url  text,
  welcome_message       text NOT NULL DEFAULT 'Reserva tu cita fácil y rápido',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- RLS para branding
ALTER TABLE public.branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden leer branding" ON public.branding
  FOR SELECT USING (true);

CREATE POLICY "Tenant puede modificar su branding" ON public.branding
  FOR ALL USING (true);

-- ─── TABLA: integrations ───────────────────────────────────────────
-- Almacena integraciones externas por tenant (Google Calendar, etc.)
CREATE TABLE IF NOT EXISTS public.integrations (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id             uuid NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  google_calendar_id    text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- RLS para integrations
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant puede gestionar sus integraciones" ON public.integrations
  FOR ALL USING (true);

-- ─── TABLA: clients ────────────────────────────────────────────────
-- CRM de clientes por tenant
CREATE TABLE IF NOT EXISTS public.clients (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id             uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name                  text NOT NULL,
  phone                 text NOT NULL,
  email                 text,
  last_visit            date,
  total_appointments    integer NOT NULL DEFAULT 0,
  no_shows              integer NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Índice para búsquedas rápidas por tenant
CREATE INDEX IF NOT EXISTS clients_tenant_id_idx ON public.clients(tenant_id);

-- RLS para clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant puede gestionar sus clientes" ON public.clients
  FOR ALL USING (true);

-- ─── TABLA: services (extender con precio y duración) ──────────────
-- Si tu tabla services ya existe, agrega las columnas faltantes:
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS description    text,
  ADD COLUMN IF NOT EXISTS duration_min   integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS price          numeric(10,2) NOT NULL DEFAULT 0;

-- Si la tabla services NO existe aún, créala completa:
CREATE TABLE IF NOT EXISTS public.services (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id     uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text,
  duration_min  integer NOT NULL DEFAULT 30,
  price         numeric(10,2) NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS services_tenant_id_idx ON public.services(tenant_id);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden leer servicios" ON public.services
  FOR SELECT USING (true);

CREATE POLICY "Tenant puede gestionar sus servicios" ON public.services
  FOR ALL USING (true);
