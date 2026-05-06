require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('No keys found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Checking tenants table...');
  const { data, error } = await supabase.from('tenants').select('*');
  if (error) {
    console.error('Error fetching tenants:', error);
  } else {
    console.log('Tenants:', data);
  }
}

run();
