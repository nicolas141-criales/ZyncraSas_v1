-- =====================================================================
-- Zyncra — Etiquetas de color para servicios y productos
-- =====================================================================

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS tags jsonb NOT NULL DEFAULT '[]';

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS tags jsonb NOT NULL DEFAULT '[]';
