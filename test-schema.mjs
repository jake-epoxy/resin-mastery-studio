import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8').split('\n').reduce((acc, line) => {
  const [key, ...value] = line.split('=');
  if (key && value) acc[key.trim()] = value.join('=').trim();
  return acc;
}, {});

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY
);

async function check() {
  console.log("Checking installer_profiles schema...");
  
  // Try to read just the new column
  const { data, error } = await supabase
    .from('installer_profiles')
    .select('booking_slug')
    .limit(1);
    
  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Success! Data:", data);
  }
}

check();
