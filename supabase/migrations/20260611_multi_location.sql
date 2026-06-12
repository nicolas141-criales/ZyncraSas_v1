-- Multi-sede: tabla locations + location_id en tablas operacionales
-- Cada tenant arranca con una "Sede principal" automática (migración no destructiva).

-- ── 1. Tabla locations ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS locations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  address    TEXT,
  phone      TEXT,
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner manages own locations"
  ON locations FOR ALL
  USING      (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid()));

-- Platform admins can read all locations
CREATE POLICY "platform admin reads locations"
  ON locations FOR SELECT
  USING (EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid()));

-- ── 2. Agregar location_id a tablas operacionales (nullable) ─────────────────

ALTER TABLE professionals       ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;
ALTER TABLE services            ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;
ALTER TABLE appointments        ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;
ALTER TABLE cash_sessions       ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;
ALTER TABLE pos_sales           ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;
ALTER TABLE products            ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- ── 3. Crear sede principal para todos los tenants existentes ─────────────────

INSERT INTO locations (tenant_id, name)
SELECT id, 'Sede principal'
FROM tenants
WHERE id NOT IN (SELECT DISTINCT tenant_id FROM locations);

-- ── 4. Backfill location_id en registros existentes ───────────────────────────
-- Usa la única sede del tenant (o la primera si ya existían varias).

UPDATE professionals p
SET    location_id = (SELECT id FROM locations WHERE tenant_id = p.tenant_id ORDER BY created_at LIMIT 1)
WHERE  p.location_id IS NULL;

UPDATE services s
SET    location_id = (SELECT id FROM locations WHERE tenant_id = s.tenant_id ORDER BY created_at LIMIT 1)
WHERE  s.location_id IS NULL;

UPDATE appointments a
SET    location_id = (SELECT id FROM locations WHERE tenant_id = a.tenant_id ORDER BY created_at LIMIT 1)
WHERE  a.location_id IS NULL;

UPDATE cash_sessions cs
SET    location_id = (SELECT id FROM locations WHERE tenant_id = cs.tenant_id ORDER BY created_at LIMIT 1)
WHERE  cs.location_id IS NULL;

UPDATE pos_sales ps
SET    location_id = (SELECT id FROM locations WHERE tenant_id = ps.tenant_id ORDER BY created_at LIMIT 1)
WHERE  ps.location_id IS NULL;

UPDATE products pr
SET    location_id = (SELECT id FROM locations WHERE tenant_id = pr.tenant_id ORDER BY created_at LIMIT 1)
WHERE  pr.location_id IS NULL;

UPDATE inventory_movements im
SET    location_id = (SELECT id FROM locations WHERE tenant_id = im.tenant_id ORDER BY created_at LIMIT 1)
WHERE  im.location_id IS NULL;

-- ── 5. Índices de performance ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_locations_tenant        ON locations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_professionals_location  ON professionals(location_id);
CREATE INDEX IF NOT EXISTS idx_services_location       ON services(location_id);
CREATE INDEX IF NOT EXISTS idx_appointments_location   ON appointments(location_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_location  ON cash_sessions(location_id);
CREATE INDEX IF NOT EXISTS idx_pos_sales_location      ON pos_sales(location_id);
CREATE INDEX IF NOT EXISTS idx_products_location       ON products(location_id);
CREATE INDEX IF NOT EXISTS idx_inv_movements_location  ON inventory_movements(location_id);
