import type { VercelRequest, VercelResponse } from './_types.js';
import { createClient } from '@supabase/supabase-js';
import { requireApiSecret } from './_auth.js';

// Growth Agent - Analyzes metrics, churn, and financial health
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  if (!requireApiSecret(req, ['BRAIN_API_SECRET'])) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { content, metadata } = (req.body || {}) as { content?: string; metadata?: Record<string, unknown> };

  if (!content) {
    return res.status(400).json({ error: 'Missing content payload.' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const openAiKey = process.env.OPENAI_API_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey || !openAiKey) {
     return res.status(500).json({ error: 'API Keys Missing on Server' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const openAiResp = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ input: content, model: "text-embedding-3-small" })
    });

    if (!openAiResp.ok) throw new Error(`OpenAI API Error`);
    const aiData = await openAiResp.json();
    const embedding = aiData.data[0].embedding;

    const { data, error } = await supabaseAdmin.from('brain_synapses').insert([{
      agent_source: 'growth-agent',
      content: content,
      embedding: embedding,
      metadata: metadata || {}
    }]).select();

    if (error) throw error;
    return res.status(200).json({ success: true, synapse: data });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
