import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const URL = process.env.VITE_SUPABASE_URL;
const KEY = process.env.VITE_SUPABASE_ANON_KEY;

const sb = createClient(URL, KEY);

async function testSignup() {
  console.log("Testing SignUp flow...");
  
  const testEmail = `test_${Date.now()}@gmail.com`;
  
  // 1. Sign up
  const { data: authData, error: authError } = await sb.auth.signUp({
    email: testEmail,
    password: "Password123!"
  });

  if (authError) {
    console.error("Auth Error:", authError);
    return;
  }
  
  console.log("Auth Success. Session exists?", !!authData.session);

  // 2. Insert Profile
  const { error: profileError } = await sb.from('installer_profiles').insert({
    user_id: authData.user.id,
    full_name: "Test User",
    company_name: "Test Co",
    company_phone: "1234567890",
    base_flake_price: 6.5,
    base_metallic_price: 8.5
  });

  if (profileError) {
    console.error("Profile Insert Error:", profileError);
  } else {
    console.log("Profile Insert Success!");
  }
}

testSignup();
