import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const URL = process.env.VITE_SUPABASE_URL;
const KEY = process.env.VITE_SUPABASE_ANON_KEY;
const sb = createClient(URL, KEY);

async function checkSchema() {
  const { data, error } = await sb.from('installer_profiles').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
  } else if (data && data.length > 0) {
    console.log("Columns found:", Object.keys(data[0]));
  } else {
    console.log("No data found to infer schema.");
  }
}
checkSchema();
