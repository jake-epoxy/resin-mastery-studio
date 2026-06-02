import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://efgveagtdpqownyjspvf.supabase.co';
  const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Missing backend credentials' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Fetch Synapses
    const { data: synapses, error: sErr } = await supabaseAdmin
      .from('brain_synapses')
      .select('id, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (sErr) throw sErr;

    // 2. Fetch Recent Swarm Activity (Email Drafts)
    const { data: drafts, error: dErr } = await supabaseAdmin
      .from('email_drafts')
      .select('agent_id, lead_email, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (dErr) throw dErr;

    return res.status(200).json({
      synapses: synapses || [],
      drafts: drafts || []
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
