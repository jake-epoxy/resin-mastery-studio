import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  // CORS check
  if (req.method === "OPTIONS") return res.status(200).end();
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password, name, role, contractorId } = req.body;

  const URL = 'https://efgveagtdpqownyjspvf.supabase.co';
  const SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY; 

  if (!URL || !SERVICE_KEY) {
    return res.status(500).json({ error: "Fatal: Server is missing VITE_SUPABASE_SERVICE_ROLE_KEY. Add it to Vercel env variables." });
  }

  // We MUST use the service role key to bypass RLS and create users on behalf of the boss
  const sbAdmin = createClient(URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await sbAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-verify them so they don't have to click a link
    user_metadata: {
      role: 'worker',
      worker_role: role,
      contractor_id: contractorId,
      full_name: name
    }
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ success: true, user: data.user });
}
