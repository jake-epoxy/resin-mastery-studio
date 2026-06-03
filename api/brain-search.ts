import type { VercelRequest, VercelResponse } from './_types.js';
import { createClient } from '@supabase/supabase-js';
import { requireApiSecret } from './_auth.js';

// ElevenLabs Webhook Tool - Allows the Voice AI to search the Brain
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  if (!requireApiSecret(req, ['BRAIN_API_SECRET', 'ELEVENLABS_WEBHOOK_SECRET'])) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ElevenLabs function calling passes parameters inside the body
  // e.g. { query: "Who is our newest lead?" }
  const query = req.body?.query;

  if (!query) {
    return res.status(400).json({ error: 'Missing search query.' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const openAiKey = process.env.OPENAI_API_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey || !openAiKey) {
     return res.status(500).json({ error: 'API Keys Missing on Server' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Embed the search query
    const openAiResp = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ input: query, model: "text-embedding-3-small" })
    });

    if (!openAiResp.ok) throw new Error(`OpenAI API Error`);
    const aiData = await openAiResp.json();
    const query_embedding = aiData.data[0].embedding;

    // 2. Search pgvector database via RPC
    const { data: searchResults, error } = await supabaseAdmin.rpc('match_brain_synapses', {
      query_embedding,
      match_threshold: 0.3, // Lower threshold to ensure we find related data
      match_count: 5 // Return top 5 most relevant memories
    });

    if (error) throw error;

    // 3. Format results for the Voice AI to read
    if (!searchResults || searchResults.length === 0) {
      return res.status(200).json({ result: "I searched my memory banks, but I couldn't find any relevant data on that, Boss." });
    }

    const formattedResults = searchResults.map((r: any) => `[Source: ${r.metadata?.source || 'Hive Mind'}] ${r.content}`).join('\n\n');

    return res.status(200).json({ 
      result: "Here is the relevant data from my memory bank. Read this back to the user naturally:\n\n" + formattedResults 
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
