import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://efgveagtdpqownyjspvf.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZ3ZlYWd0ZHBxb3dueWpzcHZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY4Mjg1NSwiZXhwIjoyMDkxMjU4ODU1fQ.8B_S0z1K3tbxAVfZMHpleZgO8Hl6WlutEqk_yrfJpOg";
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from("official_partners").select("id, full_name, email, created_at");
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Records:", data);
  }
}

run();
