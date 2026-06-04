import type { VercelRequest, VercelResponse } from './_types.js';
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
    // 1. Count every memory, then fetch only the latest nodes for the 3D graph.
    const { count: synapseCount, error: countErr } = await supabaseAdmin
      .from('brain_synapses')
      .select('*', { count: 'exact', head: true });

    if (countErr) throw countErr;

    const { data: synapses, error: sErr } = await supabaseAdmin
      .from('brain_synapses')
      .select('id, agent_source, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (sErr) throw sErr;

    // 2. Fetch Recent Swarm Activity (Email Drafts)
    const { data: drafts, error: dErr } = await supabaseAdmin
      .from('email_drafts')
      .select('agent_id, lead_email, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (dErr) {
      console.warn('email_drafts stats unavailable:', dErr.message);
    }

    const { data: swarmEvents, error: eErr } = await supabaseAdmin
      .from('swarm_events')
      .select('agent_id, event_type, message, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(30);

    if (eErr) {
      console.warn('swarm_events stats unavailable:', eErr.message);
    }

    const { data: commands, error: cErr } = await supabaseAdmin
      .from('agent_commands')
      .select('agent_id, command_text, status, result_text, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (cErr) {
      console.warn('agent_commands stats unavailable:', cErr.message);
    }

    return res.status(200).json({
      synapses: synapses || [],
      synapseCount: synapseCount || 0,
      drafts: dErr ? [] : drafts || [],
      swarmEvents: eErr ? [] : swarmEvents || [],
      commands: cErr ? [] : commands || []
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
