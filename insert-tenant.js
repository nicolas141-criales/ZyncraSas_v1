require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Need service role key to insert tenant if RLS blocks anon, but let's try anon if there's no RLS or if RLS allows anon insert (unlikely).
// Actually, I can check if inserting with anon key works.
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Inserting demo-salon tenant...');
  const { data, error } = await supabase.from('tenants').insert([
    { name: 'Demo Salon', slug: 'demo-salon' }
  ]).select();

  if (error) {
    console.error('Error inserting tenant:', error);
  } else {
    console.log('Successfully inserted tenant:', data);
  }
}

run();
