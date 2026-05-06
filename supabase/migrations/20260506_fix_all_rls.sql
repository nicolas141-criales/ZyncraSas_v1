-- =====================================================================
-- BookSalon - Fix ALL RLS Policies para el Piloto (Demo)
-- IMPORTANTE: Estas políticas permiten acceso total para la prueba.
-- En producción, estas se reemplazarán por reglas con auth.uid()
-- =====================================================================

-- 1. Profesionales
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos pueden gestionar profesionales" ON public.professionals;
CREATE POLICY "Todos pueden gestionar profesionales" ON public.professionals
  FOR ALL USING (true);

-- 2. Servicios
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos pueden gestionar servicios" ON public.services;
CREATE POLICY "Todos pueden gestionar servicios" ON public.services
  FOR ALL USING (true);

-- 3. Clientes
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos pueden gestionar clientes" ON public.clients;
CREATE POLICY "Todos pueden gestionar clientes" ON public.clients
  FOR ALL USING (true);

-- 4. Branding
ALTER TABLE public.branding ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos pueden gestionar branding" ON public.branding;
CREATE POLICY "Todos pueden gestionar branding" ON public.branding
  FOR ALL USING (true);

-- 5. Integrations
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos pueden gestionar integraciones" ON public.integrations;
CREATE POLICY "Todos pueden gestionar integraciones" ON public.integrations
  FOR ALL USING (true);

-- 6. Appointments (Citas)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos pueden gestionar citas" ON public.appointments;
CREATE POLICY "Todos pueden gestionar citas" ON public.appointments
  FOR ALL USING (true);
