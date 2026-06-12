-- location_admins: usuarios invitados por el dueño de un tenant para administrar una sede específica

CREATE TABLE IF NOT EXISTS location_admins (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  location_id  UUID        NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  email        TEXT        NOT NULL,
  name         TEXT        NOT NULL,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  invited_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at  TIMESTAMPTZ,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (email, location_id)
);

ALTER TABLE location_admins ENABLE ROW LEVEL SECURITY;

-- Dueño del tenant gestiona todos sus admins de sede
CREATE POLICY "owner manages location_admins"
  ON location_admins FOR ALL
  USING      (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- El propio location_admin lee su fila (por user_id, tras aceptar el invite)
CREATE POLICY "location_admin reads own"
  ON location_admins FOR SELECT
  USING (user_id = auth.uid());

-- Platform admins leen todo
CREATE POLICY "platform admin reads location_admins"
  ON location_admins FOR SELECT
  USING (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_location_admins_tenant   ON location_admins(tenant_id);
CREATE INDEX IF NOT EXISTS idx_location_admins_location ON location_admins(location_id);
CREATE INDEX IF NOT EXISTS idx_location_admins_user     ON location_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_location_admins_email    ON location_admins(email);

-- ── Función SECURITY DEFINER ──────────────────────────────────────────────────
-- Devuelve el contexto completo (tenant + sede) para un location_admin.
-- También auto-vincula user_id en el primer login (cuando invited pero aún user_id IS NULL).
CREATE OR REPLACE FUNCTION get_location_admin_context(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email TEXT;
  result  JSON;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;

  -- Auto-link: primera vez que el usuario acepta la invitación
  UPDATE location_admins
  SET user_id     = p_user_id,
      accepted_at = now()
  WHERE email    = v_email
    AND user_id  IS NULL
    AND is_active = true;

  SELECT json_build_object(
    'location_id',     la.location_id,
    'location_name',   l.name,
    'tenant_id',       t.id,
    'tenant_slug',     t.slug,
    'tenant_name',     t.name,
    'tenant_settings', t.settings,
    'logo_url',        b.logo_url
  )
  INTO result
  FROM location_admins la
  JOIN locations l ON l.id = la.location_id
  JOIN tenants   t ON t.id = la.tenant_id
  LEFT JOIN branding b ON b.tenant_id = la.tenant_id
  WHERE (la.user_id = p_user_id OR la.email = v_email)
    AND la.is_active = true
  LIMIT 1;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_location_admin_context(UUID) TO authenticated;
