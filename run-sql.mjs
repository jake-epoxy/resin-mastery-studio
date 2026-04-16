import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load .env manually and fix \r
const envRaw = fs.readFileSync(".env", "utf-8");
envRaw.split("\n").forEach(line => {
    const cleanLine = line.replace(/\r/g, "");
    if (!cleanLine.startsWith("#")) {
        const idx = cleanLine.indexOf("=");
        if (idx !== -1) {
            const key = cleanLine.slice(0, idx).trim();
            const val = cleanLine.slice(idx + 1).replace(/^["']|["']$/g, "").trim();
            process.env[key] = val;
        }
    }
});

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url) {
    console.log("NO URL FOUND");
    process.exit(1);
}

const sb = createClient(url, key);

async function run() {
  console.log("Fetching profiles...");
  const { data: profiles, error: fetchErr } = await sb.from("installer_profiles").select("id, user_id, full_name, subscription_active");
  if (fetchErr) {
      console.log("Fetch Error:", fetchErr);
      return;
  }
  
  for (const p of profiles) {
      if (!p.subscription_active) {
          console.log(`Unlocking profile for ${p.full_name} (${p.user_id})...`);
          const { error: upErr } = await sb.from("installer_profiles").update({ subscription_active: true }).eq("id", p.id);
          if (upErr) console.log("Update Error:", upErr);
      }
  }
  console.log("Done unlocking all profiles for testing!");
}

run();
