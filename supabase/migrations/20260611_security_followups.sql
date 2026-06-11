-- =====================================================================
-- Zyncra · Security follow-ups (advisor WARN items + tenants exposure)
-- =====================================================================
-- DEPLOY ORDER: the `tenants` public-SELECT drop at the bottom must be applied
-- AFTER the booking code that uses get_public_tenant() is live, otherwise the
-- public booking page cannot resolve a tenant by slug.
-- =====================================================================

-- #1 site_reviews: anon INSERT only for real tenants (was WITH CHECK true).
DROP POLICY IF EXISTS "public_insert_site_reviews" ON public.site_reviews;
CREATE POLICY "public_insert_site_reviews" ON public.site_reviews
  FOR INSERT
  WITH CHECK (tenant_id IN (SELECT id FROM public.tenants));

-- #2 Storage bucket `professionals` (public): drop the broad SELECT policy that
-- allowed LISTING all files. Per-object access via the public URL does not use
-- RLS, so photos still render; only directory listing is disabled.
DROP POLICY IF EXISTS "Public read professionals photos" ON storage.objects;

-- #4 Public booking tenant resolver — exposes ONLY public columns, hiding
-- owner_id / push_token / plan / address from the anon role.
CREATE OR REPLACE FUNCTION public.get_public_tenant(p_slug text)
RETURNS TABLE (id uuid, slug text, name text, phone text, settings jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT id, slug, name, phone, settings
  FROM public.tenants
  WHERE slug = p_slug
  LIMIT 1
$$;
REVOKE EXECUTE ON FUNCTION public.get_public_tenant(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_tenant(text) TO anon, authenticated;

-- #4 (final step — apply AFTER the new booking code is deployed):
-- Remove anon's broad read of `tenants`. Owner + platform-admin SELECT remain.
DROP POLICY IF EXISTS "Public tenants are viewable by everyone" ON public.tenants;
