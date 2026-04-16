import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://efgveagtdpqownyjspvf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZ3ZlYWd0ZHBxb3dueWpzcHZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY4Mjg1NSwiZXhwIjoyMDkxMjU4ODU1fQ.8B_S0z1K3tbxAVfZMHpleZgO8Hl6WlutEqk_yrfJpOg'
);

const { data, error } = await supabase
  .from('installer_profiles')
  .select('service_pricing')
  .limit(1);

if (error) {
  console.log('❌ Column NOT found:', error.message);
} else {
  console.log('✅ Column exists! Data:', JSON.stringify(data));
}
