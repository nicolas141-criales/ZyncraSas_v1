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
