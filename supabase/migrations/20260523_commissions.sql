-- =====================================================================
-- Zyncra – Módulo de Comisiones
-- Ejecutar en el SQL Editor de Supabase
-- =====================================================================

-- Regla de comisión por profesional
CREATE TABLE IF NOT EXISTS public.commission_rules (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id         uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  professional_id   uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  type              text NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value             numeric NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, professional_id)
);

-- Liquidaciones registradas
CREATE TABLE IF NOT EXISTS public.commission_payments (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id           uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  professional_id     uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  period_start        date NOT NULL,
  period_end          date NOT NULL,
  appointments_count  integer NOT NULL DEFAULT 0,
  revenue_total       numeric NOT NULL DEFAULT 0,
  commission_amount   numeric NOT NULL DEFAULT 0,
  paid_at             timestamptz NOT NULL DEFAULT now(),
  note                text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- RLS: mismas políticas que las demás tablas del tenant
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_commission_rules" ON public.commission_rules
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

CREATE POLICY "tenant_commission_payments" ON public.commission_payments
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- =====================================================================
-- Zyncra – Sistema de Caja
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.cash_sessions (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id      uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  opened_at      timestamptz NOT NULL DEFAULT now(),
  closed_at      timestamptz,
  opening_amount numeric NOT NULL DEFAULT 0,
  closing_amount numeric,
  opening_note   text,
  closing_note   text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cash_movements (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id  uuid NOT NULL REFERENCES public.cash_sessions(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('ingreso', 'egreso')),
  amount      numeric NOT NULL,
  description text NOT NULL,
  category    text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_cash_sessions" ON public.cash_sessions
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

CREATE POLICY "tenant_cash_movements" ON public.cash_movements
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- =====================================================================
-- Zyncra – Sistema POS
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.pos_sales (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id      uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id      uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  subtotal       numeric NOT NULL DEFAULT 0,
  discount_type  text CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL DEFAULT 0,
  total          numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'efectivo',
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pos_sale_items (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id    uuid NOT NULL REFERENCES public.pos_sales(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  name       text NOT NULL,
  price      numeric NOT NULL,
  quantity   integer NOT NULL DEFAULT 1
);

ALTER TABLE public.pos_sales      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_pos_sales" ON public.pos_sales
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

CREATE POLICY "tenant_pos_sale_items" ON public.pos_sale_items
  USING (sale_id IN (
    SELECT id FROM public.pos_sales
    WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  ));

-- =====================================================================
-- Zyncra – Factura Electrónica DIAN (Factus)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.invoice_settings (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id            uuid NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  environment          text NOT NULL DEFAULT 'sandbox',
  factus_client_id     text,
  factus_client_secret text,
  factus_username      text,
  factus_password      text,
  numbering_range_id   integer,
  nit                  text,
  dv                   text,
  company_name         text,
  address              text,
  municipality_id      integer DEFAULT 149,
  phone                text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id        uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  factus_id        text,
  cufe             text,
  number           text,
  status           text NOT NULL DEFAULT 'draft',
  customer_name    text NOT NULL,
  customer_id_type integer NOT NULL DEFAULT 13,
  customer_id      text NOT NULL,
  customer_email   text,
  customer_address text,
  customer_phone   text,
  municipality_id  integer DEFAULT 149,
  payment_method   text NOT NULL DEFAULT '10',
  subtotal         numeric NOT NULL DEFAULT 0,
  tax_total        numeric NOT NULL DEFAULT 0,
  total            numeric NOT NULL DEFAULT 0,
  pdf_url          text,
  factus_response  jsonb,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id  uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  name        text NOT NULL,
  quantity    numeric NOT NULL DEFAULT 1,
  price       numeric NOT NULL,
  tax_rate    text NOT NULL DEFAULT '0.00',
  is_excluded integer NOT NULL DEFAULT 1,
  total       numeric NOT NULL DEFAULT 0
);

ALTER TABLE public.invoice_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_invoice_settings" ON public.invoice_settings
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

CREATE POLICY "tenant_invoices" ON public.invoices
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

CREATE POLICY "tenant_invoice_items" ON public.invoice_items
  USING (invoice_id IN (
    SELECT id FROM public.invoices
    WHERE tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  ));

-- =====================================================================
-- Zyncra – Reseñas Google & Reseñas del Negocio
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.google_review_settings (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id           uuid NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  google_maps_url     text,
  message_template    text,
  show_on_booking     boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.review_requests (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id    uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id    uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name  text NOT NULL,
  client_phone text,
  sent_via     text NOT NULL DEFAULT 'manual',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.site_reviews (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  rating      integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     text,
  service     text,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.google_review_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_requests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_reviews           ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_google_review_settings" ON public.google_review_settings
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

CREATE POLICY "tenant_review_requests" ON public.review_requests
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

CREATE POLICY "tenant_site_reviews_admin" ON public.site_reviews
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- Allow anyone to insert a site_review (public form)
CREATE POLICY "public_insert_site_reviews" ON public.site_reviews
  FOR INSERT WITH CHECK (true);

-- =====================================================================
-- Zyncra – Marketing WhatsApp
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.wa_campaigns (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id        uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name             text NOT NULL,
  message          text NOT NULL,
  segment          text NOT NULL DEFAULT 'all',
  recipients_count integer NOT NULL DEFAULT 0,
  status           text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent')),
  sent_at          timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wa_templates (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id  uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name       text NOT NULL,
  message    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wa_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_wa_campaigns" ON public.wa_campaigns
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

CREATE POLICY "tenant_wa_templates" ON public.wa_templates
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- =====================================================================
-- Zyncra – Platform Admin (Super Admin del SaaS)
-- =====================================================================

-- Administradores de la plataforma
CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Planes de suscripción
CREATE TABLE IF NOT EXISTS public.saas_plans (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name           text NOT NULL,
  price          numeric NOT NULL DEFAULT 0,
  billing_cycle  text NOT NULL DEFAULT 'monthly',
  description    text,
  features       jsonb NOT NULL DEFAULT '[]',
  active         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Suscripción de cada tenant
CREATE TABLE IF NOT EXISTS public.saas_subscriptions (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id            uuid NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id              uuid REFERENCES public.saas_plans(id) ON DELETE SET NULL,
  status               text NOT NULL DEFAULT 'trial'
                         CHECK (status IN ('trial','active','overdue','suspended','cancelled')),
  trial_ends_at        timestamptz,
  current_period_start date,
  current_period_end   date,
  amount               numeric NOT NULL DEFAULT 0,
  notes                text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- Registro de pagos
CREATE TABLE IF NOT EXISTS public.saas_payments (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.saas_subscriptions(id) ON DELETE SET NULL,
  amount          numeric NOT NULL,
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','paid','failed')),
  due_date        date,
  paid_at         timestamptz,
  method          text,
  reference       text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- RLS: solo platform_admins leen todo
ALTER TABLE public.platform_admins   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_plans        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_payments     ENABLE ROW LEVEL SECURITY;

-- platform_admins se gestiona solo (el admin se inserta directamente)
CREATE POLICY "platform_admin_self" ON public.platform_admins
  USING (user_id = auth.uid());

-- saas_plans: cualquier autenticado puede leer (para mostrar pricing público)
CREATE POLICY "public_read_saas_plans" ON public.saas_plans
  FOR SELECT USING (true);

CREATE POLICY "platform_admin_manage_plans" ON public.saas_plans
  USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()));

-- saas_subscriptions: solo platform_admin
CREATE POLICY "platform_admin_subscriptions" ON public.saas_subscriptions
  USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()));

-- saas_payments: solo platform_admin
CREATE POLICY "platform_admin_payments" ON public.saas_payments
  USING (EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid()));

-- Permite al platform_admin leer TODOS los tenants (además de la política existente)
CREATE POLICY "platform_admin_read_all_tenants" ON public.tenants
  FOR SELECT USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid())
  );

-- Insertar el platform admin (criales66@gmail.com)
-- IMPORTANTE: Ejecutar DESPUÉS de que el usuario haya creado su cuenta
INSERT INTO public.platform_admins (user_id)
SELECT id FROM auth.users WHERE email = 'criales66@gmail.com'
ON CONFLICT (user_id) DO NOTHING;
