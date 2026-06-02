import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Lead Gen Agent - Scrapes/Receives data and embeds it into the Epoxy Brain
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { content, metadata } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Missing content payload.' });
  }

  const supabaseUrl = 'https://efgveagtdpqownyjspvf.supabase.co';
  const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const openAiKey = process.env.OPENAI_API_KEY || '';

  if (!supabaseServiceKey || !openAiKey) {
     return res.status(500).json({ error: 'API Keys Missing on Server' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Generate Vector Embedding via OpenAI
    const openAiResp = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: content,
        model: "text-embedding-3-small"
      })
    });

    if (!openAiResp.ok) {
      const err = await openAiResp.json();
      throw new Error(`OpenAI API Error: ${err.error?.message || 'Unknown'}`);
    }

    const aiData = await openAiResp.json();
    const embedding = aiData.data[0].embedding;

    // 2. Insert into the Epoxy Brain Synapses table
    const { data, error } = await supabaseAdmin.from('brain_synapses').insert([{
      agent_source: 'lead-gen-agent',
      content: content,
      embedding: embedding,
      metadata: metadata || {}
    }]).select();

    if (error) throw error;

    return res.status(200).json({ 
      success: true, 
      message: 'Synapse successfully embedded into the Brain',
      synapse: data 
    });

  } catch (error: any) {
    console.error("Lead Gen Agent Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
