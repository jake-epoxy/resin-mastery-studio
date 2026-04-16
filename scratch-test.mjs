import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envRaw = fs.readFileSync('.env', 'utf-8');
envRaw.split('\n').forEach(line => {
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

const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

sb.from('clients').select('*').limit(1).then(({data, error}) => {
    if (error) console.error("ERROR:", error);
    else console.log("KEYS:", data && data[0] ? Object.keys(data[0]) : "no data");
});
