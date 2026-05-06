-- =====================================================================
-- BookSalon - Autenticación y RLS con auth.uid()
-- Ejecutar en el SQL Editor de Supabase
-- =====================================================================

-- 1. Añadir owner_id a tenants
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Crear un índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS tenants_owner_id_idx ON public.tenants(owner_id);

-- 2. Políticas para Tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public tenants are viewable by everyone" ON public.tenants;
CREATE POLICY "Public tenants are viewable by everyone" ON public.tenants
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owner can manage tenant" ON public.tenants;
CREATE POLICY "Owner can manage tenant" ON public.tenants
  FOR ALL USING (owner_id = auth.uid());

-- 3. Políticas para Profesionales
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos pueden gestionar profesionales" ON public.professionals;
CREATE POLICY "Propietario gestiona profesionales" ON public.professionals
  FOR ALL USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  );
CREATE POLICY "Public puede ver profesionales" ON public.professionals FOR SELECT USING (true);

-- 4. Políticas para Servicios
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos pueden gestionar servicios" ON public.services;
CREATE POLICY "Propietario gestiona servicios" ON public.services
  FOR ALL USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  );
CREATE POLICY "Public puede ver servicios" ON public.services FOR SELECT USING (true);

-- 5. Políticas para Clientes
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos pueden gestionar clientes" ON public.clients;
CREATE POLICY "Propietario gestiona clientes" ON public.clients
  FOR ALL USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  );

-- 6. Políticas para Branding
ALTER TABLE public.branding ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos pueden gestionar branding" ON public.branding;
CREATE POLICY "Propietario gestiona branding" ON public.branding
  FOR ALL USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  );
CREATE POLICY "Public puede ver branding" ON public.branding FOR SELECT USING (true);

-- 7. Políticas para Integrations
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos pueden gestionar integraciones" ON public.integrations;
CREATE POLICY "Propietario gestiona integraciones" ON public.integrations
  FOR ALL USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  );

-- 8. Políticas para Appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos pueden gestionar citas" ON public.appointments;
CREATE POLICY "Propietario gestiona citas" ON public.appointments
  FOR ALL USING (
    tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())
  );
CREATE POLICY "Public puede insertar citas" ON public.appointments FOR INSERT WITH CHECK (true);
