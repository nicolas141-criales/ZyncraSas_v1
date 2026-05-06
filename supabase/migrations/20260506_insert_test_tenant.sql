-- Inserta el tenant para el usuario de prueba criales66@gmail.com
INSERT INTO public.tenants (id, owner_id, name, slug)
VALUES (
  gen_random_uuid(),
  'f1710593-0995-4d9d-bc2f-5bdc1f73ec63',
  'Salón Criales',
  'salon-criales'
) ON CONFLICT (slug) DO NOTHING;
