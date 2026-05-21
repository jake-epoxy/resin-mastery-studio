import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envRaw = fs.readFileSync('.env', 'utf-8');
const env = {};
envRaw.split("\n").forEach(line => {
    const cleanLine = line.replace(/\r/g, "");
    if (!cleanLine.startsWith("#")) {
        const idx = cleanLine.indexOf("=");
        if (idx !== -1) {
            const key = cleanLine.slice(0, idx).trim();
            const val = cleanLine.slice(idx + 1).replace(/^["']|["']$/g, "").trim();
            env[key] = val;
        }
    }
});

const supabase = createClient(
  env.VITE_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY
);

async function dumpSchema() {
  const { data: pData } = await supabase.from('installer_profiles').select('*').limit(1);
  if (pData && pData.length > 0) {
    console.log("installer_profiles columns:", Object.keys(pData[0]));
  }
  
  const { data: cData } = await supabase.from('clients').select('*').limit(1);
  if (cData && cData.length > 0) {
    console.log("clients columns:", Object.keys(cData[0]));
  }
}

dumpSchema();
