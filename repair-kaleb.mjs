import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const URL = process.env.VITE_SUPABASE_URL;
const KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const sb = createClient(URL, KEY);

async function repairAccount() {
  console.log("Searching for broken accounts...");

  // If using service_role, we can list users. Otherwise, we can't easily query auth.users.
  const { data: usersData, error: usersError } = await sb.auth.admin.listUsers();
  
  if (usersError) {
    console.error("FATAL: Cannot list users (you might not have service_role_key in .env).", usersError.message);
    return;
  }

  const users = usersData.users;
  // Let's find any user who lacks an installer_profile.
  const { data: profiles, error: profileError } = await sb.from('installer_profiles').select('user_id');
  
  if (profileError) {
    console.error("Failed to fetch profiles:", profileError);
    return;
  }

  const profileIds = new Set(profiles.map(p => p.user_id));
  
  const brokenUsers = users.filter(u => !profileIds.has(u.id));
  console.log(`Found ${brokenUsers.length} broken users without a profile.`);

  for (const user of brokenUsers) {
    console.log(`Repairing profile for user: ${user.email} (ID: ${user.id})`);
    
    // We attempt to insert a generic "Bro Account" profile for them
    const { error: insertError } = await sb.from('installer_profiles').insert({
      user_id: user.id,
      full_name: "Kaleb Flores", // Forcing the name so he gets the Bro Account bypass!
      company_name: "Student Account",
      company_phone: "555-555-5555",
      base_flake_price: 6.00,
      base_metallic_price: 8.00,
      subscription_active: false
    });

    if (insertError) {
      console.error(`Failed to repair user ${user.email}:`, insertError.message);
    } else {
      console.log(`Successfully repaired! Kaleb can now log in at /admin using his existing email and password.`);
    }
  }
}

repairAccount();
