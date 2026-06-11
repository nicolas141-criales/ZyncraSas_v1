-- =====================================================================
-- Zyncra · Security hardening — Multi-tenant RLS lockdown
-- =====================================================================
-- CONTEXT
--   Early migrations created permissive demo policies (FOR ALL USING (true)).
--   A later migration (20260506_add_auth_and_dashboard) added correct
--   owner-scoped policies but DID NOT drop the older `USING (true)` ones
--   created in 20260506_add_branding_clients_integrations. Because RLS
--   policies are PERMISSIVE (combined with OR), a single surviving
--   `USING (true)` policy leaves the whole table world-readable/writable to
--   the anon key used by the browser. Result: any visitor could read/modify
--   every tenant's clients (PII), integrations (secrets) and catalog.
--
-- THIS MIGRATION
--   * Drops every leftover permissive policy on the affected tables.
--   * Re-creates clean, least-privilege policies:
--       - clients / appointments / integrations -> owner-only (no anon).
--       - services / professionals / branding   -> owner write + public READ.
--       - custom_fields / google_review_settings -> owner write + public READ
--         (the public booking page needs to read these).
--   * The public booking page no longer touches clients/appointments from the
--     browser; those go through /api/public/booking (service-role), so anon
--     access to them is fully revoked here.
--
-- SAFE TO RE-RUN: all statements are idempotent (DROP ... IF EXISTS).
-- DEPLOY NOTE: ship together with the booking server endpoint + booking page
--   refactor in the same release.
-- =====================================================================

-- Helper: owner check is inlined as
--   tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid())

-- ── clients (PII) ────────────────────────────────────────────────────
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant puede gestionar sus clientes" ON public.clients;   -- legacy USING(true)
DROP POLICY IF EXISTS "Todos pueden gestionar clientes"     ON public.clients;   -- legacy USING(true)
DROP POLICY IF EXISTS "Propietario gestiona clientes"       ON public.clients;
CREATE POLICY "clients_owner_all" ON public.clients
  FOR ALL
  USING      (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- ── appointments (PII + business data) ───────────────────────────────
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos pueden gestionar citas"            ON public.appointments; -- legacy USING(true)
DROP POLICY IF EXISTS "Public puede insertar citas"             ON public.appointments; -- anon INSERT, now via service role
-- anon SELECT/UPDATE gated only by `manage_token IS NOT NULL` (true for ~every
-- row) => anon could read ALL appointments and update any of them. The /manage
-- flow now uses the service-role API route, so these are removed.
DROP POLICY IF EXISTS "Manage page lee por manage_token"        ON public.appointments;
DROP POLICY IF EXISTS "Manage page actualiza por manage_token"  ON public.appointments;
DROP POLICY IF EXISTS "Propietario gestiona citas"              ON public.appointments;
CREATE POLICY "appointments_owner_all" ON public.appointments
  FOR ALL
  USING      (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- ── integrations (stores credentials/tokens) ─────────────────────────
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant puede gestionar sus integraciones" ON public.integrations; -- legacy USING(true)
DROP POLICY IF EXISTS "Todos pueden gestionar integraciones"     ON public.integrations; -- legacy USING(true)
DROP POLICY IF EXISTS "Propietario gestiona integraciones"       ON public.integrations;
CREATE POLICY "integrations_owner_all" ON public.integrations
  FOR ALL
  USING      (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- ── services (public catalog: read-public, write-owner) ──────────────
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant puede gestionar sus servicios" ON public.services; -- legacy USING(true) write
DROP POLICY IF EXISTS "Todos pueden gestionar servicios"     ON public.services; -- legacy USING(true)
DROP POLICY IF EXISTS "Todos pueden leer servicios"          ON public.services; -- dup public select
DROP POLICY IF EXISTS "Public puede ver servicios"           ON public.services;
DROP POLICY IF EXISTS "Propietario gestiona servicios"       ON public.services;
CREATE POLICY "services_owner_all" ON public.services
  FOR ALL
  USING      (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));
CREATE POLICY "services_public_read" ON public.services
  FOR SELECT USING (true);

-- ── professionals (public catalog) ───────────────────────────────────
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos pueden gestionar profesionales" ON public.professionals; -- legacy USING(true)
DROP POLICY IF EXISTS "Public puede ver profesionales"       ON public.professionals;
DROP POLICY IF EXISTS "Propietario gestiona profesionales"   ON public.professionals;
CREATE POLICY "professionals_owner_all" ON public.professionals
  FOR ALL
  USING      (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));
CREATE POLICY "professionals_public_read" ON public.professionals
  FOR SELECT USING (true);

-- ── branding (public catalog) ────────────────────────────────────────
ALTER TABLE public.branding ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant puede modificar su branding" ON public.branding; -- legacy USING(true) write
DROP POLICY IF EXISTS "Todos pueden gestionar branding"    ON public.branding; -- legacy USING(true)
DROP POLICY IF EXISTS "Todos pueden leer branding"         ON public.branding; -- dup public select
DROP POLICY IF EXISTS "Public puede ver branding"          ON public.branding;
DROP POLICY IF EXISTS "Propietario gestiona branding"      ON public.branding;
CREATE POLICY "branding_owner_all" ON public.branding
  FOR ALL
  USING      (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));
CREATE POLICY "branding_public_read" ON public.branding
  FOR SELECT USING (true);

-- ── custom_fields (booking needs to read field definitions) ──────────
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "custom_fields_public_read" ON public.custom_fields;
CREATE POLICY "custom_fields_public_read" ON public.custom_fields
  FOR SELECT USING (true);
-- owner policy "tenant_custom_fields" already exists from a prior migration.

-- ── google_review_settings (booking needs the public review link) ────
ALTER TABLE public.google_review_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "google_review_settings_public_read" ON public.google_review_settings;
CREATE POLICY "google_review_settings_public_read" ON public.google_review_settings
  FOR SELECT USING (true);
-- owner policy "tenant_google_review_settings" already exists from a prior migration.

-- =====================================================================
-- NOTE (follow-up, not done here to avoid behavioural change):
--   `tenants` currently has a `FOR SELECT USING (true)` policy so the public
--   booking page can resolve a tenant by slug. That also exposes the full row
--   (incl. owner_id and settings JSON) to anon. Recommended hardening: expose
--   only public columns via a SECURITY DEFINER view / RPC and drop the broad
--   public SELECT on tenants. Audit tenants.settings for any secrets first.
-- =====================================================================
