-- =====================================================================
-- BookSalon - Datos Iniciales (Seed)
-- Ejecutar en el SQL Editor de Supabase
-- =====================================================================

-- Crear el tenant principal para la demostración si no existe
INSERT INTO public.tenants (id, name, slug)
VALUES (gen_random_uuid(), 'Demo Salon', 'demo-salon')
ON CONFLICT (slug) DO NOTHING;
