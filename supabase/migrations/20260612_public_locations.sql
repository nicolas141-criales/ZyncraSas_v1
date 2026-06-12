-- Exposes active locations for a tenant to anonymous (public booking page).
-- SECURITY DEFINER bypasses RLS safely — only returns id/name/address/phone of
-- active locations for the given tenant_id (no sensitive data).

CREATE OR REPLACE FUNCTION get_public_locations(p_tenant_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result JSON;
BEGIN
  SELECT json_agg(
    json_build_object('id', id, 'name', name, 'address', address, 'phone', phone)
    ORDER BY name
  )
  INTO result
  FROM locations
  WHERE tenant_id = p_tenant_id AND is_active = true;
  RETURN COALESCE(result, '[]'::json);
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_locations(UUID) TO anon, authenticated;
