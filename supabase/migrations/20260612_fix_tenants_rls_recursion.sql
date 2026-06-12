-- Fix: recursión infinita en RLS entre tenants ↔ location_admins.
--
-- La policy tenants_location_admin_read referenciaba location_admins, y la
-- policy owner_manages_location_admins en location_admins referencia tenants
-- → PostgreSQL detecta recursión y aborta la query con
-- "infinite recursion detected in policy for relation tenants".
--
-- Síntoma: criales66@gmail.com (y cualquier owner) no podía leer su tenant
-- después de login → layout caía a la rama de location_admin → push a /login
-- → usuario atrapado en /login.
--
-- Los location_admins acceden a su tenant via la función SECURITY DEFINER
-- get_location_admin_context (definida en 20260612_location_admins.sql),
-- que bypasea RLS de forma controlada y filtra por user_id explícito.

DROP POLICY IF EXISTS "tenants_location_admin_read" ON public.tenants;
