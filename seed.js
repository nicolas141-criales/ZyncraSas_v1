require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Starting seed...");

  // Insert a tenant
  const { data: tenant, error: tenantErr } = await supabase
    .from('tenants')
    .upsert({
      slug: 'demo-salon',
      name: 'Demo Salon',
      phone: '+34 600 000 000',
      settings: {
        requireDeposit: false,
        depositAmount: 0,
        primaryColor: "#2563EB",
        coverImage: "https://images.unsplash.com/photo-1521590838186-b48520ec719c?q=80&w=1200",
        logo: ""
      }
    }, { onConflict: 'slug' })
    .select('*')
    .single();

  if (tenantErr) {
    console.error("Tenant error:", tenantErr);
    return;
  }
  
  const tenantId = tenant.id;
  console.log("Tenant ID:", tenantId);

  // Insert services
  const services = [
    { tenant_id: tenantId, name: "Corte de Cabello Premium", duration_minutes: 45, price: 40, description: "Corte clásico o moderno con asesoría de imagen y lavado." },
    { tenant_id: tenantId, name: "Corte y Barba", duration_minutes: 60, price: 55, description: "Servicio completo. Incluye perfilado de barba con toalla caliente." },
    { tenant_id: tenantId, name: "Afeitado Ejecutivo", duration_minutes: 30, price: 30, description: "Afeitado tradicional a navaja con productos premium." }
  ];

  for (const s of services) {
    await supabase.from('services').upsert(s, { onConflict: 'name,tenant_id' });
  }

  // Insert professionals
  const professionals = [
    { tenant_id: tenantId, name: "Alex Rover", role: "Barbero Senior", avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80" },
    { tenant_id: tenantId, name: "Elena Smith", role: "Estilista", avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80" },
    { tenant_id: tenantId, name: "Carlos Ruiz", role: "Barbero", avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80" }
  ];

  for (const p of professionals) {
    await supabase.from('professionals').upsert(p, { onConflict: 'name,tenant_id' });
  }

  console.log("Seed completed!");
}

seed();
