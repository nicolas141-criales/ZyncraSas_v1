-- 1. Añadir columna image_url a services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Crear los Buckets de Storage
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('services', 'services', true) ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de Storage (Permitir lectura pública y escritura a autenticados)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id IN ('logos', 'avatars', 'services') );

DROP POLICY IF EXISTS "Auth Insert" ON storage.objects;
CREATE POLICY "Auth Insert" ON storage.objects FOR INSERT WITH CHECK ( bucket_id IN ('logos', 'avatars', 'services') AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Auth Update" ON storage.objects;
CREATE POLICY "Auth Update" ON storage.objects FOR UPDATE USING ( bucket_id IN ('logos', 'avatars', 'services') AND auth.role() = 'authenticated' );

-- 4. Logo position/zoom in branding
ALTER TABLE public.branding ADD COLUMN IF NOT EXISTS logo_object_position TEXT DEFAULT 'center';
ALTER TABLE public.branding ADD COLUMN IF NOT EXISTS logo_size INTEGER DEFAULT 85;

-- 5. Blocked time slots table
CREATE TABLE IF NOT EXISTS public.blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant blocked_slots" ON public.blocked_slots;
CREATE POLICY "Tenant blocked_slots" ON public.blocked_slots
  USING (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE owner_id = auth.uid()));
