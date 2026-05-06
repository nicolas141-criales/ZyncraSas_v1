require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  console.log('Creating test user criales66@gmail.com...');
  
  // 1. Crear el usuario
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: 'criales66@gmail.com',
    password: '123456'
  });

  if (authError) {
    console.error('Error al crear usuario:', authError.message);
    // Si ya existe, trataremos de loguearnos para obtener el ID
    if (authError.message.includes('already registered')) {
        const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
            email: 'criales66@gmail.com',
            password: '123456'
        });
        if (loginData?.user) {
            console.log('Usuario ya existía. Insertando tenant...');
            await insertTenant(loginData.user.id);
        }
    }
    return;
  }

  if (authData?.user) {
    console.log('Usuario creado! ID:', authData.user.id);
    await insertTenant(authData.user.id);
  }
}

async function insertTenant(userId) {
  const { error } = await supabase.from('tenants').insert([
    {
      owner_id: userId,
      name: 'Salón Criales',
      slug: 'salon-criales'
    }
  ]);
  
  if (error) {
    console.error('Error creando tenant:', error.message);
  } else {
    console.log('Tenant "Salón Criales" creado exitosamente para el usuario de test!');
  }
}

run();
