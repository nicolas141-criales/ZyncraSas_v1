require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  console.log('Logging in as criales66@gmail.com...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'criales66@gmail.com',
    password: '123456'
  });

  if (authError) {
    console.error('Error logging in:', authError.message);
    return;
  }

  const userId = authData.user.id;
  console.log('Logged in successfully! User ID:', userId);

  console.log('Inserting tenant...');
  const { data, error } = await supabase.from('tenants').insert([
    {
      owner_id: userId,
      name: 'Salón Criales',
      slug: 'salon-criales'
    }
  ]).select();

  if (error) {
    console.error('Error inserting tenant:', error);
  } else {
    console.log('Tenant inserted successfully!', data);
  }
}

run();
