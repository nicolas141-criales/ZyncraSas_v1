-- =====================================================================
-- Fix 1: Recursión infinita en platform_admins RLS
-- La política anterior hacía EXISTS sobre la misma tabla → loop
-- =====================================================================
DROP POLICY IF EXISTS "platform_admin_self" ON public.platform_admins;

-- Política sin recursión: cada usuario solo puede leer su propia fila
CREATE POLICY "platform_admin_self" ON public.platform_admins
  FOR ALL USING (user_id = auth.uid());

-- =====================================================================
-- Fix 2: Agregar soypipecontreras@gmail.com como platform admin
-- =====================================================================
INSERT INTO public.platform_admins (user_id)
SELECT id FROM auth.users WHERE email = 'soypipecontreras@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================================
-- Fix 3: Refrescar schema cache de PostgREST
-- (para que la columna "tags" sea visible después de ALTER TABLE)
-- =====================================================================
NOTIFY pgrst, 'reload schema';
