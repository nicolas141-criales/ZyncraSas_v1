-- ─────────────────────────────────────────────────────────────────
--  Módulo Proveedores
-- ─────────────────────────────────────────────────────────────────

-- 1. Proveedores (empresa que vende insumos a los negocios Zyncra)
CREATE TABLE suppliers (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name      TEXT        NOT NULL,
  nit               TEXT,
  description       TEXT,
  logo_url          TEXT,
  phone             TEXT,
  email             TEXT        NOT NULL,
  city              TEXT,
  address           TEXT,
  categories        TEXT[]      DEFAULT '{}',   -- ['uñas','barbería','spa',...]
  status            TEXT        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending','approved','rejected','suspended')),
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- 2. Catálogo de productos del proveedor
CREATE TABLE supplier_products (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id   UUID        NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  name          TEXT        NOT NULL,
  description   TEXT,
  category      TEXT,
  price         NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  unit          TEXT        DEFAULT 'unidad',   -- unidad, caja, kit, ml, g ...
  min_order_qty INTEGER     DEFAULT 1,
  stock         INTEGER,
  images        TEXT[]      DEFAULT '{}',
  is_active     BOOLEAN     DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- 3. Secuencia para número de pedido legible
CREATE SEQUENCE supplier_order_seq START 1;

-- 4. Pedidos (tenant → proveedor)
CREATE TABLE supplier_orders (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number      TEXT        NOT NULL UNIQUE,
  tenant_id         UUID        REFERENCES tenants(id) ON DELETE SET NULL,
  supplier_id       UUID        REFERENCES suppliers(id) ON DELETE SET NULL,
  status            TEXT        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending','confirmed','preparing','shipped','delivered','cancelled')),
  subtotal          NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_cost     NUMERIC(12,2) NOT NULL DEFAULT 0,
  total             NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_address  TEXT,
  notes             TEXT,
  -- Pago
  payment_status    TEXT        NOT NULL DEFAULT 'pending'
                                  CHECK (payment_status IN ('pending','proof_uploaded','confirmed','refunded')),
  payment_method    TEXT,                        -- transfer, nequi, daviplata
  payment_proof_url TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- 5. Ítems del pedido (snapshot de precio al momento del pedido)
CREATE TABLE supplier_order_items (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID        NOT NULL REFERENCES supplier_orders(id) ON DELETE CASCADE,
  product_id    UUID        REFERENCES supplier_products(id) ON DELETE SET NULL,
  product_name  TEXT        NOT NULL,
  product_price NUMERIC(12,2) NOT NULL,
  quantity      INTEGER     NOT NULL CHECK (quantity > 0),
  subtotal      NUMERIC(12,2) NOT NULL
);

-- ── Índices ──────────────────────────────────────────────────────
CREATE INDEX idx_supplier_products_supplier ON supplier_products(supplier_id);
CREATE INDEX idx_supplier_products_active   ON supplier_products(supplier_id, is_active);
CREATE INDEX idx_supplier_orders_tenant     ON supplier_orders(tenant_id);
CREATE INDEX idx_supplier_orders_supplier   ON supplier_orders(supplier_id);
CREATE INDEX idx_supplier_order_items_order ON supplier_order_items(order_id);

-- ── Trigger: updated_at automático ──────────────────────────────
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_suppliers_updated
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_supplier_products_updated
  BEFORE UPDATE ON supplier_products
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER trg_supplier_orders_updated
  BEFORE UPDATE ON supplier_orders
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ── Función: generar número de pedido ────────────────────────────
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT LANGUAGE plpgsql AS $$
BEGIN
  RETURN 'ZP-' || to_char(now(), 'YYYY') || '-' ||
         lpad(nextval('supplier_order_seq')::text, 5, '0');
END;
$$;

-- ── RLS ──────────────────────────────────────────────────────────
ALTER TABLE suppliers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_products  ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_orders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_order_items ENABLE ROW LEVEL SECURITY;

-- Helper: es plataforma admin
CREATE OR REPLACE FUNCTION is_platform_admin(uid UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM platform_admins WHERE user_id = uid);
$$;

-- Helper: proveedor propietario
CREATE OR REPLACE FUNCTION supplier_id_for_user(uid UUID)
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT id FROM suppliers WHERE user_id = uid LIMIT 1;
$$;

-- Helper: tenant del usuario autenticado
CREATE OR REPLACE FUNCTION tenant_id_for_user(uid UUID)
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT id FROM tenants WHERE owner_id = uid LIMIT 1;
$$;

-- suppliers
CREATE POLICY "suppliers: owner read"    ON suppliers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "suppliers: owner update"  ON suppliers FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "suppliers: owner insert"  ON suppliers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "suppliers: public approved" ON suppliers FOR SELECT USING (status = 'approved');
CREATE POLICY "suppliers: platform all"  ON suppliers FOR ALL USING (is_platform_admin(auth.uid()));

-- supplier_products
CREATE POLICY "sp: owner crud" ON supplier_products
  FOR ALL USING (supplier_id = supplier_id_for_user(auth.uid()));
CREATE POLICY "sp: public read active" ON supplier_products
  FOR SELECT USING (
    is_active = true AND
    EXISTS (SELECT 1 FROM suppliers s WHERE s.id = supplier_id AND s.status = 'approved')
  );

-- supplier_orders
CREATE POLICY "so: tenant read" ON supplier_orders
  FOR SELECT USING (tenant_id = tenant_id_for_user(auth.uid()));
CREATE POLICY "so: tenant insert" ON supplier_orders
  FOR INSERT WITH CHECK (tenant_id = tenant_id_for_user(auth.uid()));
CREATE POLICY "so: tenant update payment" ON supplier_orders
  FOR UPDATE USING (tenant_id = tenant_id_for_user(auth.uid()));
CREATE POLICY "so: supplier read" ON supplier_orders
  FOR SELECT USING (supplier_id = supplier_id_for_user(auth.uid()));
CREATE POLICY "so: supplier update status" ON supplier_orders
  FOR UPDATE USING (supplier_id = supplier_id_for_user(auth.uid()));
CREATE POLICY "so: platform all" ON supplier_orders
  FOR ALL USING (is_platform_admin(auth.uid()));

-- supplier_order_items
CREATE POLICY "soi: tenant read" ON supplier_order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM supplier_orders o
            WHERE o.id = order_id AND o.tenant_id = tenant_id_for_user(auth.uid()))
  );
CREATE POLICY "soi: tenant insert" ON supplier_order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM supplier_orders o
            WHERE o.id = order_id AND o.tenant_id = tenant_id_for_user(auth.uid()))
  );
CREATE POLICY "soi: supplier read" ON supplier_order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM supplier_orders o
            WHERE o.id = order_id AND o.supplier_id = supplier_id_for_user(auth.uid()))
  );
CREATE POLICY "soi: platform all" ON supplier_order_items
  FOR ALL USING (is_platform_admin(auth.uid()));
