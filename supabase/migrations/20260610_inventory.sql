-- =====================================================================
-- Zyncra — Módulo de Inventario de Productos
-- =====================================================================

-- Tabla de productos (separados de servicios)
CREATE TABLE IF NOT EXISTS public.products (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sku             text,
  name            text NOT NULL,
  description     text,
  photo_url       text,
  cost_price      numeric NOT NULL DEFAULT 0,
  sale_price      numeric NOT NULL DEFAULT 0,
  discount_type   text CHECK (discount_type IN ('percent', 'fixed')),
  discount_value  numeric NOT NULL DEFAULT 0,
  stock_quantity  integer NOT NULL DEFAULT 0,
  low_stock_alert integer NOT NULL DEFAULT 5,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, sku)
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_products" ON public.products
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- Tabla de movimientos de inventario
-- quantity positivo = entrada, negativo = salida
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('purchase', 'sale', 'adjustment', 'return')),
  quantity    integer NOT NULL,
  reference   text,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_inventory_movements" ON public.inventory_movements
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));

-- Trigger: actualiza stock_quantity automáticamente al insertar un movimiento
CREATE OR REPLACE FUNCTION public.fn_update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET    stock_quantity = GREATEST(0, stock_quantity + NEW.quantity),
         updated_at     = now()
  WHERE  id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_product_stock ON public.inventory_movements;
CREATE TRIGGER trg_update_product_stock
  AFTER INSERT ON public.inventory_movements
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_product_stock();

-- Ampliar pos_sale_items para soportar productos además de servicios
ALTER TABLE public.pos_sale_items
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES public.products(id) ON DELETE SET NULL;

ALTER TABLE public.pos_sale_items
  ADD COLUMN IF NOT EXISTS item_type text NOT NULL DEFAULT 'service'
    CHECK (item_type IN ('service', 'product', 'free'));

-- Bucket de Storage para fotos de productos
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY IF NOT EXISTS "products_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

CREATE POLICY IF NOT EXISTS "products_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'products' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "products_auth_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'products' AND auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "products_auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'products' AND auth.role() = 'authenticated');
