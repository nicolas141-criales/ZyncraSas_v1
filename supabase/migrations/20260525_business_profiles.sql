-- =====================================================================
-- Zyncra – Perfil de negocio (recopilado durante el onboarding)
-- Ejecutar en el SQL Editor de Supabase
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.business_profiles (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id             uuid NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  biz_type              text,                        -- barberia, salon, spa, manicure, estetica, masajes, tatuajes, otro
  collaborators         text,                        -- solo, 2-3, 4-7, 8+
  appointments_per_day  text,                        -- <5, 5-15, 16-30, 30+
  multi_sede            boolean DEFAULT false,
  goals                 text[] DEFAULT '{}',         -- noshows, whatsapp, pos, billing, reviews, commissions, marketing, team
  whatsapp              text,
  plan_recommended      text DEFAULT 'Esencial',     -- Esencial, Pro, Personalizado
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_own_business_profile" ON public.business_profiles
  USING (tenant_id IN (
    SELECT id FROM public.tenants WHERE owner_id = auth.uid()
  ));

CREATE POLICY "tenant_insert_business_profile" ON public.business_profiles
  FOR INSERT WITH CHECK (tenant_id IN (
    SELECT id FROM public.tenants WHERE owner_id = auth.uid()
  ));

CREATE POLICY "tenant_update_business_profile" ON public.business_profiles
  FOR UPDATE USING (tenant_id IN (
    SELECT id FROM public.tenants WHERE owner_id = auth.uid()
  ));
