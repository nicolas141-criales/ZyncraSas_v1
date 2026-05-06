-- =====================================================================
-- BookSalon - Fix Tenants RLS
-- =====================================================================

-- Permitir que cualquier persona lea la tabla tenants (necesario para la landing de reservas y admin)
CREATE POLICY "Public tenants are viewable by everyone" ON public.tenants
  FOR SELECT USING (true);
